import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import {
  SFIA_FACADE_TOKEN,
  type ISfiaFacade,
} from '@modules/sfia/contracts';

export const UNIFIED_REPORT_TYPE = 'session_competency_evaluation';
export const UNIFIED_REPORT_PROMPT_VERSION = 'session-report-unified-v1.0';

export interface SkillBreakdownItem {
  skillCode: string;
  skillName: string;
  techContext: string[];
  targetLevel: number;
  demonstratedLevel: number;
  score: number;
  status: 'passed' | 'gap';
  strengths: string;
  areasForImprovement: string;
}

export interface CompetencyActionPlanItem {
  priority: 'high' | 'medium' | 'low';
  skillCode: string;
  title: string;
  topics: string[];
  estimatedWeeks: number;
}

export interface SessionCompetencyReportContent {
  summary: {
    overallScore: number;
    targetSfiaLevel: number;
    demonstratedSfiaLevel: number;
    recommendationStatus:
      | 'strongly_recommended'
      | 'recommended'
      | 'borderline'
      | 'not_recommended';
    executiveSummary: string;
  };
  skillsBreakdown: SkillBreakdownItem[];
  actionPlan: CompetencyActionPlanItem[];
}

@Injectable()
export class UnifiedReportGeneratorService {
  private readonly logger = new Logger(UnifiedReportGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(AI_GATEWAY_TOKEN)
    private readonly aiGateway?: IAIGateway,
    @Optional()
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade?: ISfiaFacade,
  ) {}

  /**
   * Tính toán recommendation status dựa trên overall score:
   * - >= 80: strongly_recommended
   * - 65 - 79: recommended
   * - 50 - 64: borderline
   * - < 50: not_recommended
   */
  resolveRecommendationStatus(
    overallScore: number,
  ): 'strongly_recommended' | 'recommended' | 'borderline' | 'not_recommended' {
    if (overallScore >= 80) return 'strongly_recommended';
    if (overallScore >= 65) return 'recommended';
    if (overallScore >= 50) return 'borderline';
    return 'not_recommended';
  }

  /**
   * Tạo báo cáo năng lực hợp nhất toàn phiên (session_competency_evaluation)
   * dựa trên danh sách session_skills, feedbacks của từng câu hỏi và đối soát chuẩn SFIA.
   */
  async generateReport(
    sessionId: string,
    language = 'vi',
  ): Promise<SessionCompetencyReportContent> {
    const isVietnamese = language !== 'en';

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        savedJobDescription: true,
        sessionSkills: true,
        sessionQuestions: {
          include: {
            userAnswers: {
              include: {
                aiFeedback: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const targetSfiaLevel = session.targetSfiaLevel ?? 3;
    const sessionSkills = session.sessionSkills || [];

    // 1. Nhóm câu hỏi & feedbacks theo sessionSkillId
    const questionsBySkillId = new Map<
      string,
      (typeof session.sessionQuestions)[0][]
    >();
    for (const q of session.sessionQuestions) {
      if (!q.sessionSkillId) continue;
      const list = questionsBySkillId.get(q.sessionSkillId) ?? [];
      list.push(q);
      questionsBySkillId.set(q.sessionSkillId, list);
    }

    // 2. Xây dựng skills breakdown
    const skillsBreakdown: SkillBreakdownItem[] = [];

    for (const skill of sessionSkills) {
      let skillName = skill.skillCode;
      if (this.sfiaFacade) {
        try {
          const sfiaSkill = await this.sfiaFacade.getSkillByCode(skill.skillCode);
          if (sfiaSkill?.name) {
            skillName = sfiaSkill.name;
          }
        } catch {
          // Bỏ qua lỗi tra cứu, giữ skillCode
        }
      }

      const questions = questionsBySkillId.get(skill.id) ?? [];
      const strengthsList: string[] = [];
      const improvementsList: string[] = [];

      for (const q of questions) {
        const fb = q.userAnswers?.[0]?.aiFeedback;
        if (fb) {
          if (Array.isArray(fb.strengths)) {
            strengthsList.push(...fb.strengths);
          }
          if (Array.isArray(fb.improvements)) {
            improvementsList.push(...fb.improvements);
          }
        }
      }

      const score = skill.score ?? 0;
      const demonstratedLevel = skill.actualLevel ?? 1;
      const status: 'passed' | 'gap' =
        demonstratedLevel >= skill.targetLevel && score >= 65
          ? 'passed'
          : 'gap';

      const strengths =
        strengthsList.length > 0
          ? strengthsList.slice(0, 2).join('; ')
          : isVietnamese
            ? 'Đã hoàn thành các câu hỏi thuộc kỹ năng này.'
            : 'Completed questions for this skill.';

      const areasForImprovement =
        improvementsList.length > 0
          ? improvementsList.slice(0, 2).join('; ')
          : isVietnamese
            ? 'Cần tiếp tục trau dồi và nâng cao độ sâu chuyên môn.'
            : 'Continue deepening technical depth and ownership.';

      skillsBreakdown.push({
        skillCode: skill.skillCode,
        skillName,
        techContext: skill.techContext || [],
        targetLevel: skill.targetLevel,
        demonstratedLevel,
        score,
        status,
        strengths,
        areasForImprovement,
      });
    }

    // 3. Tính toán các chỉ số tổng thể của phiên
    let overallScore = session.overallScore;
    if (overallScore === null || overallScore === undefined) {
      let totalWeight = 0;
      let weightedScoreSum = 0;
      for (const s of sessionSkills) {
        const weight = Number(s.weight ?? 1.0);
        totalWeight += weight;
        weightedScoreSum += (s.score ?? 0) * weight;
      }
      overallScore =
        totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;
    }

    const demonstratedLevels = skillsBreakdown.map((s) => s.demonstratedLevel);
    const demonstratedSfiaLevel =
      demonstratedLevels.length > 0
        ? Math.min(
            targetSfiaLevel,
            Math.max(
              1,
              Math.round(
                demonstratedLevels.reduce((a, b) => a + b, 0) /
                  demonstratedLevels.length,
              ),
            ),
          )
        : 1;

    const recommendationStatus = this.resolveRecommendationStatus(overallScore);

    // 4. Sinh executive summary và action plan (Cơ chế 2 tầng: AI + Deterministic Fallback)
    const gapSkills = skillsBreakdown.filter((s) => s.status === 'gap');
    let executiveSummary = '';
    let actionPlan: CompetencyActionPlanItem[] = [];

    if (this.aiGateway) {
      try {
        const promptResult = await this.synthesizeSummaryAndActionPlanWithAI({
          jobTitle: session.savedJobDescription?.jobTitle ?? 'Software Engineer',
          targetSfiaLevel,
          demonstratedSfiaLevel,
          overallScore,
          recommendationStatus,
          skillsBreakdown,
          gapSkills,
          language,
        });
        executiveSummary = promptResult.executiveSummary;
        actionPlan = promptResult.actionPlan;
      } catch (err: unknown) {
        this.logger.warn(
          `AI synthesis for competency report failed, using deterministic template: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    if (!executiveSummary) {
      executiveSummary = this.buildDeterministicExecutiveSummary(
        session.savedJobDescription?.jobTitle ?? 'Software Engineer',
        overallScore,
        targetSfiaLevel,
        demonstratedSfiaLevel,
        recommendationStatus,
        skillsBreakdown,
        isVietnamese,
      );
    }

    if (actionPlan.length === 0) {
      actionPlan = this.buildDeterministicActionPlan(
        gapSkills,
        targetSfiaLevel,
        isVietnamese,
      );
    }

    const reportContent: SessionCompetencyReportContent = {
      summary: {
        overallScore,
        targetSfiaLevel,
        demonstratedSfiaLevel,
        recommendationStatus,
        executiveSummary,
      },
      skillsBreakdown,
      actionPlan,
    };

    // 5. Lưu vào CSDL trong prisma transaction: lưu session_competency_evaluation và compatibility copies
    await this.prisma.$transaction(async (tx) => {
      // 5.1 Lưu báo cáo năng lực unified chuẩn mới
      await tx.sessionReport.upsert({
        where: {
          sessionId_reportType_version: {
            sessionId,
            reportType: UNIFIED_REPORT_TYPE,
            version: 1,
          },
        },
        create: {
          sessionId,
          reportType: UNIFIED_REPORT_TYPE,
          version: 1,
          contentJson: reportContent as unknown as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
        update: {
          contentJson: reportContent as unknown as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
      });

      // 5.2 Lưu executive_summary tương thích cho các client/tests cũ
      await tx.sessionReport.upsert({
        where: {
          sessionId_reportType_version: {
            sessionId,
            reportType: 'executive_summary',
            version: 1,
          },
        },
        create: {
          sessionId,
          reportType: 'executive_summary',
          version: 1,
          contentJson: {
            overallScore,
            summary: executiveSummary,
            recommendationStatus,
            targetSfiaLevel,
            demonstratedSfiaLevel,
          } as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
        update: {
          contentJson: {
            overallScore,
            summary: executiveSummary,
            recommendationStatus,
            targetSfiaLevel,
            demonstratedSfiaLevel,
          } as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
      });

      // 5.3 Lưu action_plan tương thích cho client
      await tx.sessionReport.upsert({
        where: {
          sessionId_reportType_version: {
            sessionId,
            reportType: 'action_plan',
            version: 1,
          },
        },
        create: {
          sessionId,
          reportType: 'action_plan',
          version: 1,
          contentJson: {
            actionPlan,
          } as unknown as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
        update: {
          contentJson: {
            actionPlan,
          } as unknown as Prisma.InputJsonValue,
          promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
        },
      });

      // 5.4 Lưu skipped_answers nếu có câu hỏi bị bỏ qua
      const skippedQuestions = session.sessionQuestions.filter(
        (q) => q.userAnswers?.[0]?.skipped,
      );
      if (skippedQuestions.length > 0) {
        const skippedAnswersList = skippedQuestions.map((q) => {
          const ans = q.userAnswers[0];
          const existingModelAnswer = ans.aiFeedback?.modelAnswer;
          const fallbackModelAnswer = isVietnamese
            ? `Định hướng câu trả lời chuẩn cho câu hỏi "${q.questionText}": Cần nêu rõ định nghĩa cốt lõi, kiến trúc triển khai, và các phân tích đánh đổi (trade-offs) theo tiêu chuẩn SFIA.`
            : `Model answer outline for "${q.questionText}": Clearly state core concept, architectural design, and trade-offs aligned with SFIA standards.`;
          return {
            answerId: ans.id,
            modelAnswer:
              existingModelAnswer && existingModelAnswer.trim().length > 0
                ? existingModelAnswer
                : fallbackModelAnswer,
          };
        });

        await tx.sessionReport.upsert({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: 'skipped_answers',
              version: 1,
            },
          },
          create: {
            sessionId,
            reportType: 'skipped_answers',
            version: 1,
            contentJson: { answers: skippedAnswersList } as Prisma.InputJsonValue,
            promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
          },
          update: {
            contentJson: { answers: skippedAnswersList } as Prisma.InputJsonValue,
            promptVersion: UNIFIED_REPORT_PROMPT_VERSION,
          },
        });
      }

      // 5.5 Cập nhật InterviewSession status = 'completed' và recommendationStatus
      await tx.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          overallScore,
          recommendationStatus,
        },
      });
    });

    this.logger.log(
      `Persisted unified competency report for session ${sessionId}: overallScore=${overallScore}, status=${recommendationStatus}`,
    );

    return reportContent;
  }

  private async synthesizeSummaryAndActionPlanWithAI(params: {
    jobTitle: string;
    targetSfiaLevel: number;
    demonstratedSfiaLevel: number;
    overallScore: number;
    recommendationStatus: string;
    skillsBreakdown: SkillBreakdownItem[];
    gapSkills: SkillBreakdownItem[];
    language: string;
  }): Promise<{
    executiveSummary: string;
    actionPlan: CompetencyActionPlanItem[];
  }> {
    if (!this.aiGateway) {
      throw new Error('AI Gateway is not available');
    }

    const isVietnamese = params.language !== 'en';
    const breakdownText = params.skillsBreakdown
      .map(
        (s) =>
          `- ${s.skillName} (${s.skillCode}): Điểm ${s.score}/100, Kỳ vọng Level ${s.targetLevel}, Thể hiện Level ${s.demonstratedLevel}, Trạng thái: ${s.status}. Điểm mạnh: ${s.strengths}. Điểm cần cải thiện: ${s.areasForImprovement}`,
      )
      .join('\n');

    const systemPrompt = isVietnamese
      ? `Bạn là Giám đốc Đánh giá Năng lực Nhân sự cao cấp.
Nhiệm vụ của bạn là tổng hợp Nhận xét Điều hành (executive_summary) và Lộ trình Hành động (action_plan) cho ứng viên sau phiên phỏng vấn.
Trả về định dạng JSON thuần túy khớp với:
{
  "executive_summary": "string (2-3 câu súc tích đánh giá toàn diện năng lực, điểm mạnh chính và hạn chế mấu chốt)",
  "action_plan": [
    {
      "priority": "high" | "medium" | "low",
      "skill_code": "string",
      "title": "string (tiêu đề hành động cải thiện cụ thể)",
      "topics": ["string (2-3 chủ đề trọng tâm cần trau dồi)"],
      "estimated_weeks": number (1-4)
    }
  ]
}`
      : `You are a Senior Competency Evaluation Director.
Summarize the executive_summary and actionable action_plan for the candidate.
Return pure JSON with executive_summary and action_plan.`;

    const userPrompt = `VỊ TRÍ ỨNG TUYỂN: ${params.jobTitle}
KỲ VỌNG SFIA: Level ${params.targetSfiaLevel}
KẾT QUẢ THỂ HIỆN: Level ${params.demonstratedSfiaLevel}
ĐIỂM TỔNG HỢP: ${params.overallScore}/100
KẾT LUẬN: ${params.recommendationStatus}

CHI TIẾT KỸ NĂNG:
${breakdownText}`;

    const raw = await this.aiGateway.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 2000,
      responseFormat: 'json_object',
      task: 'report',
    });

    const parsed = JSON.parse(raw);
    return {
      executiveSummary:
        typeof parsed.executive_summary === 'string'
          ? parsed.executive_summary
          : '',
      actionPlan: Array.isArray(parsed.action_plan)
        ? parsed.action_plan.map((item: any) => ({
            priority: ['high', 'medium', 'low'].includes(item.priority)
              ? item.priority
              : 'high',
            skillCode: item.skill_code ?? 'SKILL',
            title: item.title ?? 'Củng cố năng lực chuyên môn',
            topics: Array.isArray(item.topics) ? item.topics : [],
            estimatedWeeks: Number(item.estimated_weeks) || 2,
          }))
        : [],
    };
  }

  private buildDeterministicExecutiveSummary(
    jobTitle: string,
    overallScore: number,
    targetLevel: number,
    demonstratedLevel: number,
    recommendationStatus: string,
    skills: SkillBreakdownItem[],
    isVietnamese: boolean,
  ): string {
    const passedCount = skills.filter((s) => s.status === 'passed').length;
    const total = skills.length;

    if (isVietnamese) {
      const statusText =
        recommendationStatus === 'strongly_recommended'
          ? 'rất xuất sắc và được đề xuất tuyển dụng cao'
          : recommendationStatus === 'recommended'
            ? 'đạt yêu cầu chuyên môn của vị trí'
            : recommendationStatus === 'borderline'
              ? 'đạt mức cân nhắc (cần phỏng vấn bổ sung hoặc kèm cặp)'
              : 'chưa đáp ứng kỳ vọng của vị trí';

      return `Ứng viên tham gia phỏng vấn vị trí ${jobTitle} đạt điểm tổng thể ${overallScore}/100, thể hiện năng lực tương đương SFIA Level ${demonstratedLevel} so với kỳ vọng Level ${targetLevel}. Ứng viên đạt yêu cầu ở ${passedCount}/${total} kỹ năng chuyên môn. Kết quả tổng thể đánh giá ở mức: ${statusText}.`;
    }

    return `Candidate achieved an overall score of ${overallScore}/100 for the ${jobTitle} position, demonstrating competence at SFIA Level ${demonstratedLevel} against target Level ${targetLevel}. Passed ${passedCount}/${total} assessed skills. Overall recommendation status: ${recommendationStatus}.`;
  }

  private buildDeterministicActionPlan(
    gapSkills: SkillBreakdownItem[],
    targetLevel: number,
    isVietnamese: boolean,
  ): CompetencyActionPlanItem[] {
    if (gapSkills.length === 0) {
      return [
        {
          priority: 'low',
          skillCode: 'CONTINUOUS_LEARNING',
          title: isVietnamese
            ? 'Duy trì và nâng cao kiến thức công nghệ chuyên sâu'
            : 'Maintain and deepen advanced engineering practices',
          topics: isVietnamese
            ? [
                'Theo dõi các chuẩn mực kiến trúc mới',
                'Chia sẻ kinh nghiệm và tham gia mentoring nội bộ',
              ]
            : [
                'Follow emerging architectural patterns',
                'Engage in peer mentoring and knowledge sharing',
              ],
          estimatedWeeks: 2,
        },
      ];
    }

    return gapSkills.map((s) => ({
      priority: s.score < 50 ? 'high' : 'medium',
      skillCode: s.skillCode,
      title: isVietnamese
        ? `Nâng cao năng lực ${s.skillName} đạt chuẩn SFIA Level ${targetLevel}`
        : `Upskill ${s.skillName} to meet SFIA Level ${targetLevel}`,
      topics:
        s.techContext.length > 0
          ? s.techContext.map(
              (tech) =>
                `${isVietnamese ? 'Tối ưu hóa và làm chủ' : 'Master and optimize'} ${tech}`,
            )
          : [
              isVietnamese
                ? 'Nắm vững cơ chế vận hành và nguyên lý thiết kế'
                : 'Understand core mechanisms and design principles',
              isVietnamese
                ? 'Rèn luyện tư duy phân tích trade-off và làm chủ hệ thống'
                : 'Practice trade-off analysis and technical ownership',
            ],
      estimatedWeeks: s.score < 50 ? 4 : 2,
    }));
  }
}

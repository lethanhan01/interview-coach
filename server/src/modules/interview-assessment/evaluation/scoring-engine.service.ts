import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type {
  BinaryCriterionEvaluationResult,
  BinaryEvaluationCriterion,
} from './binary-criteria-evaluator.service';

export interface QuestionScoreCalculationResult {
  questionScore: number;
  criteriaPassRate: number;
  corePassRate: number;
  seniorityPassRate: number;
}

export interface SkippedFeedbackData {
  overallScore: number;
  criteriaPassRate: number;
  demonstratedLevel: number;
  criteriaEvaluations: BinaryCriterionEvaluationResult[];
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  keyTakeaway: string;
  isFallback: boolean;
}

@Injectable()
export class ScoringEngineService {
  private readonly logger = new Logger(ScoringEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán điểm câu hỏi (0-100) và tỷ lệ đạt tiêu chí theo 2 chiều (core, seniority).
   * Điểm số được tính bằng logic toán học tất định 100%, không bị ảnh hưởng bởi biến thiên từ AI.
   */
  calculateQuestionScore(
    evaluations: BinaryCriterionEvaluationResult[],
    rubricCriteria: BinaryEvaluationCriterion[],
  ): QuestionScoreCalculationResult {
    if (!rubricCriteria || rubricCriteria.length === 0) {
      return {
        questionScore: 0,
        criteriaPassRate: 0,
        corePassRate: 0,
        seniorityPassRate: 0,
      };
    }

    const evalMap = new Map(
      evaluations.map((ev) => [ev.criteriaId, Boolean(ev.passed)]),
    );

    let totalWeight = 0;
    let totalPassedWeight = 0;

    let coreWeight = 0;
    let corePassedWeight = 0;

    let seniorityWeight = 0;
    let seniorityPassedWeight = 0;

    for (const criterion of rubricCriteria) {
      const weight = Number(criterion.weight ?? 1.0);
      const isPassed = evalMap.get(criterion.id) ?? false;

      totalWeight += weight;
      if (isPassed) {
        totalPassedWeight += weight;
      }

      if (criterion.dimension === 'core') {
        coreWeight += weight;
        if (isPassed) {
          corePassedWeight += weight;
        }
      } else if (criterion.dimension === 'seniority') {
        seniorityWeight += weight;
        if (isPassed) {
          seniorityPassedWeight += weight;
        }
      }
    }

    const criteriaPassRate =
      totalWeight > 0 ? (totalPassedWeight / totalWeight) * 100 : 0;
    const questionScore = Math.min(
      100,
      Math.max(0, Math.round(criteriaPassRate)),
    );

    const corePassRate =
      coreWeight > 0 ? corePassedWeight / coreWeight : 1.0;
    const seniorityPassRate =
      seniorityWeight > 0 ? seniorityPassedWeight / seniorityWeight : 1.0;

    return {
      questionScore,
      criteriaPassRate: Math.round(criteriaPassRate * 100) / 100,
      corePassRate: Math.round(corePassRate * 100) / 100,
      seniorityPassRate: Math.round(seniorityPassRate * 100) / 100,
    };
  }

  /**
   * Suy luận cấp độ thực tế thể hiện (demonstrated_level) tất định từ 2 chiều chuẩn hóa:
   * - Trượt Core (corePassRate < 0.5): targetLevel - 2
   * - Đạt Core nhưng trượt Seniority (corePassRate >= 0.5 && seniorityPassRate < 0.5): targetLevel - 1
   * - Đạt cả 2 chiều: targetLevel
   * Cận trên & dưới: luôn chặn trong khoảng [1, targetLevel].
   */
  inferDemonstratedLevel(
    targetLevel: number,
    corePassRate: number,
    seniorityPassRate: number,
  ): number {
    const safeTargetLevel = Math.max(1, Math.min(7, Math.round(targetLevel || 3)));

    let rawDemonstratedLevel: number;
    if (corePassRate < 0.5) {
      rawDemonstratedLevel = safeTargetLevel - 2;
    } else if (seniorityPassRate < 0.5) {
      rawDemonstratedLevel = safeTargetLevel - 1;
    } else {
      rawDemonstratedLevel = safeTargetLevel;
    }

    // Quy tắc chặn: không vượt quá targetLevel và tối thiểu là Level 1
    return Math.min(safeTargetLevel, Math.max(1, rawDemonstratedLevel));
  }

  /**
   * Sinh cấu trúc dữ liệu feedback cho câu hỏi Bỏ qua (Skip) hoặc hết giờ.
   * Ghi nhận 0 điểm, Level 1, trượt toàn bộ tiêu chí để tính vào mẫu số đánh giá.
   */
  buildSkippedFeedbackData(
    rubricCriteria: BinaryEvaluationCriterion[],
    _targetLevel: number,
  ): SkippedFeedbackData {
    const criteriaEvaluations: BinaryCriterionEvaluationResult[] = (
      rubricCriteria || []
    ).map((c) => ({
      criteriaId: c.id,
      passed: false,
      evidence: 'Ứng viên bỏ qua câu hỏi hoặc hết thời gian trả lời.',
      deductionReason: 'Không có câu trả lời từ ứng viên.',
    }));

    return {
      overallScore: 0,
      criteriaPassRate: 0,
      demonstratedLevel: 1,
      criteriaEvaluations,
      strengths: [],
      improvements: [
        'Ứng viên đã bỏ qua câu hỏi này. Cần ôn tập bổ sung kiến thức và kỹ năng tương ứng.',
      ],
      modelAnswer: '',
      keyTakeaway: 'Hãy luôn cố gắng đưa ra phản hồi kể cả khi chưa nắm chắc giải pháp hoàn chỉnh.',
      isFallback: false,
    };
  }

  /**
   * Tổng hợp điểm số (score) và cấp độ thực tế (actualLevel) cho toàn bộ danh sách `session_skills` của phiên.
   * Đồng thời cập nhật `overallScore` cho bản ghi `interview_sessions`.
   */
  async aggregateSessionSkillScores(
    sessionId: string,
    client?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = client ?? this.prisma;

    const sessionSkills = await db.sessionSkill.findMany({
      where: { sessionId },
    });

    if (sessionSkills.length === 0) {
      return;
    }

    const sessionQuestions = await db.sessionQuestion.findMany({
      where: {
        sessionId,
        sessionSkillId: { not: null },
      },
      include: {
        userAnswers: {
          include: {
            aiFeedback: true,
          },
        },
      },
    });

    const questionsBySkillId = new Map<string, typeof sessionQuestions>();
    for (const q of sessionQuestions) {
      if (!q.sessionSkillId) continue;
      const list = questionsBySkillId.get(q.sessionSkillId) ?? [];
      list.push(q);
      questionsBySkillId.set(q.sessionSkillId, list);
    }

    for (const skill of sessionSkills) {
      const questions = questionsBySkillId.get(skill.id) ?? [];
      if (questions.length === 0) continue;

      let scoreSum = 0;
      let levelSum = 0;

      for (const q of questions) {
        const answer = q.userAnswers?.[0];
        if (!answer || answer.skipped || !answer.aiFeedback) {
          // Câu hỏi chưa trả lời hoặc bị skip: tính điểm 0, Level 1 vào mẫu số
          scoreSum += 0;
          levelSum += 1;
        } else {
          scoreSum += answer.aiFeedback.overallScore ?? 0;
          levelSum += answer.aiFeedback.demonstratedLevel ?? 1;
        }
      }

      const count = questions.length;
      const skillScore = Math.min(100, Math.max(0, Math.round(scoreSum / count)));
      const rawActualLevel = Math.round(levelSum / count);
      const actualLevel = Math.min(skill.targetLevel, Math.max(1, rawActualLevel));

      await db.sessionSkill.update({
        where: { id: skill.id },
        data: {
          score: skillScore,
          actualLevel,
        },
      });
    }

    // Tính overallScore có trọng số cho InterviewSession
    const updatedSkills = await db.sessionSkill.findMany({
      where: { sessionId },
      select: { score: true, weight: true },
    });

    let totalWeight = 0;
    let weightedScoreSum = 0;

    for (const s of updatedSkills) {
      const weight = Number(s.weight ?? 1.0);
      const score = s.score ?? 0;
      totalWeight += weight;
      weightedScoreSum += score * weight;
    }

    const overallScore =
      totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 0;

    await db.interviewSession.update({
      where: { id: sessionId },
      data: { overallScore },
    });

    this.logger.log(
      `Aggregated skill scores for session ${sessionId}: overallScore=${overallScore}, skillsCount=${updatedSkills.length}`,
    );
  }
}

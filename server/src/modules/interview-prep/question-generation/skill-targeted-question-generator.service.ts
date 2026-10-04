import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { SFIA_FACADE_TOKEN, type ISfiaFacade } from '@modules/sfia/contracts';
import { type RubricCriterionDto } from '../question-bank/question-bank.service';

export const SkillQuestionOutputSchema = z.object({
  questionText: z
    .string()
    .min(15)
    .describe('Nội dung câu hỏi tình huống thực tế bằng ngôn ngữ yêu cầu'),
  estimatedTimeMin: z
    .number()
    .int()
    .min(2)
    .max(10)
    .default(5)
    .describe('Thời gian ước tính trả lời (phút)'),
  rubricCriteria: z
    .array(
      z.object({
        id: z.string().describe('ID tiêu chí crit_core hoặc crit_seniority'),
        text: z
          .string()
          .min(10)
          .describe('Mô tả hành vi/kiến thức cụ thể để xác định Đạt/Không đạt'),
        dimension: z.enum(['core', 'seniority']),
        weight: z.number().default(1.0),
      }),
    )
    .length(2)
    .describe('Đúng 2 tiêu chí nhị phân: 1 core và 1 seniority'),
});

export type SkillQuestionOutput = z.infer<typeof SkillQuestionOutputSchema>;

export interface GenerateSkillQuestionParams {
  sessionType: 'technical' | 'hr';
  skillCode: string;
  targetLevel: number;
  techContext: string[];
  jobDescriptionText: string;
  language: string;
}

export interface GeneratedSkillQuestionResult {
  questionText: string;
  estimatedTimeMin: number;
  rubricCriteria: RubricCriterionDto[];
  source: 'ai_generated' | 'bank';
  difficulty: number;
  questionBankId?: string;
}

@Injectable()
export class SkillTargetedQuestionGeneratorService {
  private readonly logger = new Logger(
    SkillTargetedQuestionGeneratorService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_GATEWAY_TOKEN)
    private readonly aiGateway: IAIGateway,
    @Inject(SFIA_FACADE_TOKEN)
    private readonly sfiaFacade: ISfiaFacade,
  ) {}

  /**
   * Sinh động câu hỏi phỏng vấn thực tế và bộ 2 tiêu chí nhị phân (core, seniority)
   * dựa trên kỹ năng SFIA mục tiêu, thâm niên (targetLevel) và Tech Context của JD.
   */
  async generateQuestion(
    params: GenerateSkillQuestionParams,
  ): Promise<GeneratedSkillQuestionResult> {
    const isVietnamese = params.language === 'vi';

    try {
      const [skillInfo, levelInfo] = await Promise.all([
        this.sfiaFacade.getSkillByCode(params.skillCode),
        this.sfiaFacade.getLevel(params.targetLevel),
      ]);

      const techContextText =
        params.techContext.length > 0
          ? params.techContext.join(', ')
          : 'General domain knowledge';

      const systemPrompt = isVietnamese
        ? `Bạn là chuyên gia thiết kế câu hỏi phỏng vấn tuyển dụng cao cấp theo khung năng lực quốc tế SFIA 9.
Nhiệm vụ của bạn là sinh ra DUY NHẤT 1 câu hỏi tình huống thực tế sát với mô tả công việc (JD), nhắm thẳng vào kỹ năng SFIA được chỉ định và cấp độ thâm niên mục tiêu.
Kèm theo câu hỏi, bạn PHẢI sinh ra ĐÚNG 2 tiêu chí chấm điểm nhị phân (rubricCriteria) Đạt/Không đạt:
1. Tiêu chí 'core' (id: 'crit_core'): Đánh giá kiến thức chuyên môn, cơ chế hoạt động kỹ thuật hoặc hành vi ứng xử cốt lõi.
2. Tiêu chí 'seniority' (id: 'crit_seniority'): Đánh giá tư duy làm chủ, phân tích trade-off, độ tự chủ và trách nhiệm tương ứng với SFIA Level mục tiêu.
Câu hỏi và tiêu chí BẮT BUỘC viết bằng TIẾNG VIỆT tự nhiên, chuẩn văn phong chuyên nghiệp.`
        : `You are an elite interview designer specializing in the SFIA 9 competency framework.
Your task is to generate EXACTLY 1 realistic situational interview question tailored to the Job Description, targeting the specified SFIA skill and target seniority level.
Along with the question, you MUST produce EXACTLY 2 binary checklist criteria (rubricCriteria) (Pass/Fail):
1. 'core' criterion (id: 'crit_core'): Assesses core domain knowledge, technical implementation, or fundamental behavioral response.
2. 'seniority' criterion (id: 'crit_seniority'): Assesses ownership, architectural trade-offs, autonomy, and decision-making responsibility corresponding to the target SFIA Level.
The question and criteria MUST be written in professional ENGLISH.`;

      const userPrompt = `
Session Type: ${params.sessionType}
SFIA Skill: ${params.skillCode} - ${skillInfo?.name ?? params.skillCode}
Skill Description: ${skillInfo?.overallDescription ?? ''}
Target SFIA Level: Level ${params.targetLevel} (${levelInfo?.name ?? ''} - ${levelInfo?.essence ?? ''})
Technology Context: ${techContextText}
Job Description Context:
${params.jobDescriptionText.slice(0, 1000)}

Please produce the question and exactly 2 binary criteria (1 core, 1 seniority) complying strictly with the JSON schema.`;

      const result = await this.aiGateway.generateStructured({
        systemPrompt,
        userPrompt,
        schema: SkillQuestionOutputSchema,
        schemaName: 'SkillQuestionOutput',
        task: 'question-generation',
        temperature: 0.3,
      });

      return {
        questionText: result.questionText,
        estimatedTimeMin: result.estimatedTimeMin ?? 5,
        rubricCriteria: result.rubricCriteria.map((c, idx) => ({
          id: c.id || `crit_ai_${Date.now()}_${idx}`,
          text: c.text,
          dimension: c.dimension,
          weight: Number(c.weight ?? 1.0),
        })),
        source: 'ai_generated',
        difficulty: Math.min(5, Math.max(1, params.targetLevel)),
      };
    } catch (error) {
      this.logger.warn(
        `AI dynamic question generation failed for skill ${params.skillCode} Level ${params.targetLevel}: ${error instanceof Error ? error.message : String(error)}. Triggering resilience fallback.`,
      );
      return this.resilienceFallback(params, isVietnamese);
    }
  }

  /**
   * Multi-tiered Resilience Fallback: Lấy câu hỏi từ QuestionBank hoặc câu hỏi tình huống mặc định
   * đảm bảo 100% phiên phỏng vấn không bao giờ bị crash.
   */
  private async resilienceFallback(
    params: GenerateSkillQuestionParams,
    isVietnamese: boolean,
  ): Promise<GeneratedSkillQuestionResult> {
    try {
      const bankFallback = await this.prisma.questionBank.findFirst({
        where: {
          sessionType: params.sessionType,
          deletedAt: null,
          OR: [
            { sfiaSkillCode: params.skillCode },
            { targetSfiaLevel: params.targetLevel },
          ],
        },
        include: {
          questionCriteria: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (bankFallback) {
        let criteria: RubricCriterionDto[] = [];
        if (bankFallback.questionCriteria.length > 0) {
          criteria = bankFallback.questionCriteria.map((c) => ({
            id: c.id,
            text: c.criteriaText,
            dimension: c.dimension === 'seniority' ? 'seniority' : 'core',
            weight: Number(c.weight ?? 1.0),
          }));
        } else {
          criteria = this.createDefaultCriteria(params, isVietnamese);
        }

        const translations = bankFallback.translations as Record<
          string,
          string
        > | null;
        const text =
          (isVietnamese ? translations?.['vi'] : translations?.['en']) ||
          bankFallback.content;

        return {
          questionBankId: bankFallback.id,
          questionText: text,
          estimatedTimeMin: bankFallback.estimatedTimeMin ?? 5,
          rubricCriteria: criteria,
          source: 'bank',
          difficulty: bankFallback.difficulty ?? 3,
        };
      }
    } catch (dbError) {
      this.logger.error(
        `Database query failed during resilience fallback: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
      );
    }

    // Default safe fallback question if DB has no matches
    const techText =
      params.techContext.length > 0
        ? ` (${params.techContext.join(', ')})`
        : '';

    const defaultText = isVietnamese
      ? `Hãy chia sẻ một tình huống thực tế bạn đã áp dụng kỹ năng ${params.skillCode}${techText} để giải quyết một bài toán phức tạp trong công việc. Bạn đã tiếp cận vấn đề như thế nào và đâu là trade-off quan trọng nhất?`
      : `Describe a real-world scenario where you applied ${params.skillCode}${techText} to solve a challenging problem. How did you approach the design and what key trade-offs did you consider?`;

    return {
      questionText: defaultText,
      estimatedTimeMin: 5,
      rubricCriteria: this.createDefaultCriteria(params, isVietnamese),
      source: 'ai_generated',
      difficulty: Math.min(5, Math.max(1, params.targetLevel)),
    };
  }

  private createDefaultCriteria(
    params: GenerateSkillQuestionParams,
    isVietnamese: boolean,
  ): RubricCriterionDto[] {
    if (isVietnamese) {
      return [
        {
          id: `crit_fb_${params.skillCode}_core`,
          text: `Nắm vững giải pháp và cơ chế kỹ thuật cốt lõi liên quan đến ${params.skillCode}.`,
          dimension: 'core',
          weight: 1.0,
        },
        {
          id: `crit_fb_${params.skillCode}_seniority`,
          text: `Thể hiện tư duy làm chủ, phân tích trade-off và khả năng chịu trách nhiệm theo chuẩn SFIA Level ${params.targetLevel}.`,
          dimension: 'seniority',
          weight: 1.0,
        },
      ];
    }

    return [
      {
        id: `crit_fb_${params.skillCode}_core`,
        text: `Demonstrates solid technical understanding and sound methodology in ${params.skillCode}.`,
        dimension: 'core',
        weight: 1.0,
      },
      {
        id: `crit_fb_${params.skillCode}_seniority`,
        text: `Articulates clear ownership, trade-off analysis, and decision-making aligned with SFIA Level ${params.targetLevel}.`,
        dimension: 'seniority',
        weight: 1.0,
      },
    ];
  }
}

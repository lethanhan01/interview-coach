import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, QuestionSessionType } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';

type QuestionBankRow = {
  id: string;
  content: string;
  difficulty: number;
  contextPackId: string;
  estimatedTimeMin: number | null;
  translations: Prisma.JsonValue | null;
  questionCriteria?: Array<any>;
  questionBankSkillLevels?: any[];
};

export type FallbackQuestion = {
  questionBankId: string;
  text: string;
  questionCategory: string;
  competencyDomains: string[];
  estimatedTimeMin: number;
};

export interface RubricCriterionDto {
  id: string;
  text: string;
  dimension: 'core' | 'seniority';
  weight: number;
}

export interface SkillAllocationRequirement {
  sessionSkillId: string;
  skillCode: string;
  targetLevel: number;
  weight: number | Prisma.Decimal;
  techContext?: string[];
}

export interface AllocatedQuestionDto {
  id?: string;
  questionBankId?: string;
  sessionSkillId: string;
  sfiaSkillCode: string;
  targetLevel: number;
  questionText: string;
  questionCategory: 'technical' | 'behavioral';
  source: 'bank' | 'ai_generated';
  difficulty: number;
  estimatedTimeMin: number;
  rubricCriteria: RubricCriterionDto[];
}

export interface QuestionBankAllocationResult {
  allocatedQuestions: AllocatedQuestionDto[];
  uncoveredRequirements: Array<{
    requirement: SkillAllocationRequirement;
    neededCount: number;
  }>;
}

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionCriteria: QuestionCriteriaService,
  ) {}

  /**
   * Cấp phát câu hỏi từ QuestionBank theo danh sách session_skills
   * - Phân bổ câu hỏi theo trọng số (weight)
   * - Tầng 1: Khớp chính xác sfiaSkillCode và targetSfiaLevel
   * - Tầng 2: Fallback lân cận (+/- 1 Level) nếu thiếu
   * - Xáo trộn Fisher-Yates và chống trùng lặp câu hỏi trong phiên
   * - Trả về danh sách câu hỏi đã cấp phát và các yêu cầu chưa đủ để chuyển sang AI
   */
  async allocateQuestionsForSessionSkills(params: {
    sessionSkills: SkillAllocationRequirement[];
    totalQuestions: number;
    sessionType: 'technical' | 'hr';
    language: string;
  }): Promise<QuestionBankAllocationResult> {
    if (params.sessionSkills.length === 0 || params.totalQuestions <= 0) {
      return { allocatedQuestions: [], uncoveredRequirements: [] };
    }

    // 1. Phân bổ số lượng câu hỏi cho từng skill theo trọng số
    const skillCounts = this.calculateSkillQuestionCounts(
      params.sessionSkills,
      params.totalQuestions,
    );

    const allocatedQuestions: AllocatedQuestionDto[] = [];
    const uncoveredRequirements: Array<{
      requirement: SkillAllocationRequirement;
      neededCount: number;
    }> = [];
    const usedQuestionBankIds = new Set<string>();

    for (const { requirement, count } of skillCounts) {
      if (count <= 0) continue;

      // Tầng 1: Tìm câu hỏi chính xác Target Level
      const exactQuestions = await this.prisma.questionBank.findMany({
        where: {
          sfiaSkillCode: requirement.skillCode,
          targetSfiaLevel: requirement.targetLevel,
          sessionType: params.sessionType,
          deletedAt: null,
          id: { notIn: Array.from(usedQuestionBankIds) },
        },
        include: {
          questionCriteria: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      const candidatePool = [...exactQuestions];

      // Tầng 2: Nếu thiếu câu hỏi, fallback lân cận (+/- 1 level)
      if (candidatePool.length < count) {
        const adjacentLevels = [
          requirement.targetLevel - 1,
          requirement.targetLevel + 1,
        ].filter((l) => l >= 1 && l <= 7 && l !== requirement.targetLevel);

        if (adjacentLevels.length > 0) {
          const excludeIds = new Set([
            ...Array.from(usedQuestionBankIds),
            ...exactQuestions.map((q) => q.id),
          ]);

          const adjacentQuestions = await this.prisma.questionBank.findMany({
            where: {
              sfiaSkillCode: requirement.skillCode,
              targetSfiaLevel: { in: adjacentLevels },
              sessionType: params.sessionType,
              deletedAt: null,
              id: { notIn: Array.from(excludeIds) },
            },
            include: {
              questionCriteria: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          });

          candidatePool.push(...adjacentQuestions);
        }
      }

      // Xáo trộn ngẫu nhiên (Fisher-Yates) để các phiên không lặp câu hỏi giống hệt nhau
      this.shuffleArray(candidatePool);

      const picked = candidatePool.slice(0, count);
      for (const question of picked) {
        usedQuestionBankIds.add(question.id);

        let criteria: RubricCriterionDto[] = [];
        if (question.questionCriteria && question.questionCriteria.length > 0) {
          criteria = question.questionCriteria.map((c) => ({
            id: c.id,
            text: c.criteriaText,
            dimension: c.dimension === 'seniority' ? 'seniority' : 'core',
            weight: Number(c.weight ?? 1.0),
          }));
        } else {
          criteria = [
            {
              id: `crit_${question.id}_core`,
              text: `Nắm vững giải pháp và nguyên lý kỹ thuật cốt lõi liên quan đến ${requirement.skillCode}.`,
              dimension: 'core',
              weight: 1.0,
            },
            {
              id: `crit_${question.id}_seniority`,
              text: `Thể hiện tư duy làm chủ, phân tích trade-off và khả năng chịu trách nhiệm theo chuẩn SFIA Level ${requirement.targetLevel}.`,
              dimension: 'seniority',
              weight: 1.0,
            },
          ];
        }

        allocatedQuestions.push({
          questionBankId: question.id,
          sessionSkillId: requirement.sessionSkillId,
          sfiaSkillCode: requirement.skillCode,
          targetLevel: requirement.targetLevel,
          questionText: this.resolveText(question, params.language),
          questionCategory:
            params.sessionType === 'technical' ? 'technical' : 'behavioral',
          source: 'bank',
          difficulty: question.difficulty ?? 3,
          estimatedTimeMin: question.estimatedTimeMin ?? 5,
          rubricCriteria: criteria,
        });
      }

      if (picked.length < count) {
        uncoveredRequirements.push({
          requirement,
          neededCount: count - picked.length,
        });
      }
    }

    return {
      allocatedQuestions,
      uncoveredRequirements,
    };
  }

  private calculateSkillQuestionCounts(
    sessionSkills: SkillAllocationRequirement[],
    totalQuestions: number,
  ): Array<{ requirement: SkillAllocationRequirement; count: number }> {
    // Sắp xếp theo trọng số giảm dần
    const sorted = [...sessionSkills].sort((a, b) => {
      const wA = Number(a.weight ?? 1);
      const wB = Number(b.weight ?? 1);
      return wB - wA;
    });

    if (totalQuestions < sessionSkills.length) {
      // Nếu số câu hỏi ít hơn số kỹ năng, chọn top skills theo trọng số cao nhất
      return sorted.slice(0, totalQuestions).map((requirement) => ({
        requirement,
        count: 1,
      }));
    }

    // Mỗi kỹ năng được tối thiểu 1 câu
    const counts = new Map<string, number>();
    for (const skill of sorted) {
      counts.set(skill.sessionSkillId, 1);
    }

    let remaining = totalQuestions - sorted.length;
    let idx = 0;
    while (remaining > 0) {
      const skill = sorted[idx % sorted.length];
      counts.set(
        skill.sessionSkillId,
        (counts.get(skill.sessionSkillId) ?? 1) + 1,
      );
      remaining--;
      idx++;
    }

    return sorted.map((requirement) => ({
      requirement,
      count: counts.get(requirement.sessionSkillId) ?? 1,
    }));
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async selectFallbackQuestions(
    sessionType: string,
    contextPackId: string,
    count: number,
    language: string,
    rubricVersionId?: string,
  ): Promise<FallbackQuestion[]> {
    const candidates = await this.prisma.questionBank.findMany({
      where: {
        sessionType: sessionType as QuestionSessionType,
        contextPackId,
        deletedAt: null,
      },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: count * 3,
      include: { questionCriteria: true },
    });

    if (candidates.length === 0) {
      throw new InterviewAIException(
        ErrorCode.QUESTION_BANK_EMPTY,
        HttpStatus.NOT_FOUND,
        `No fallback questions available for ${sessionType}/${contextPackId}`,
      );
    }

    const selected = this.selectWithDifficultySpread(candidates, count);

    if (selected.length < count) {
      throw new InterviewAIException(
        ErrorCode.QUESTION_BANK_EMPTY,
        HttpStatus.NOT_FOUND,
        `Only ${selected.length}/${count} fallback questions available for ${sessionType}/${contextPackId}`,
      );
    }

    const mapped = selected
      .map((question) => {
        try {
          return this.mapFallbackQuestion(question, language, rubricVersionId);
        } catch {
          return null;
        }
      })
      .filter((q): q is FallbackQuestion => q !== null);

    if (mapped.length === 0) {
      throw new InterviewAIException(
        ErrorCode.QUESTION_BANK_EMPTY,
        HttpStatus.NOT_FOUND,
        `No fallback questions with valid criteria for ${sessionType}/${contextPackId}`,
      );
    }

    return mapped;
  }

  private resolveText(question: QuestionBankRow, language: string): string {
    const translations = question.translations;

    if (
      translations &&
      typeof translations === 'object' &&
      !Array.isArray(translations)
    ) {
      const value = translations[language];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return question.content;
  }

  private mapFallbackQuestion(
    question: QuestionBankRow,
    language: string,
    rubricVersionId?: string,
  ): FallbackQuestion {
    const competencyDomains = this.questionCriteria.codesFromQuestionBank(
      question,
      rubricVersionId,
    );

    return {
      questionBankId: question.id,
      text: this.resolveText(question, language),
      questionCategory: (competencyDomains[0] ?? '').startsWith('TD')
        ? 'technical'
        : 'behavioral',
      competencyDomains,
      estimatedTimeMin: question.estimatedTimeMin ?? 5,
    };
  }

  private selectWithDifficultySpread<T extends { difficulty: number }>(
    items: T[],
    count: number,
  ): T[] {
    const easy = items.filter((question) => question.difficulty <= 2);
    const medium = items.filter((question) => question.difficulty === 3);
    const hard = items.filter((question) => question.difficulty >= 4);

    const easyCount = Math.round(count * 0.3);
    const hardCount = Math.round(count * 0.2);
    const mediumCount = count - easyCount - hardCount;

    const pick = <U>(arr: U[], n: number): U[] =>
      arr.slice(0, Math.min(n, arr.length));

    const selected = [
      ...pick(easy, easyCount),
      ...pick(medium, mediumCount),
      ...pick(hard, hardCount),
    ];

    if (selected.length < count) {
      const selectedItems = new Set(selected);
      for (const item of items) {
        if (!selectedItems.has(item)) {
          selected.push(item);
          selectedItems.add(item);
        }
        if (selected.length === count) break;
      }
    }

    return selected.slice(0, count);
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma, QuestionSessionType } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';

type QuestionBankRow = {
  id: string;
  content: string;
  difficulty: number;
  contextPackId: string;
  estimatedTimeMin: number | null;
  translations: Prisma.JsonValue | null;
  criteria?: Array<{
    rubricCriterion?: {
      id: string;
      code: string;
      name: string;
      weight: number;
      displayOrder: number;
      rubricCategory: {
        categoryKey: string;
        displayOrder: number;
        rubricVersion: {
          id: string;
          contextPackId: string;
          status: string;
        };
      };
    } | null;
  }>;
};

export type FallbackQuestion = {
  questionBankId: string;
  text: string;
  questionCategory: string;
  competencyDomains: string[];
  estimatedTimeMin: number;
};

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionCriteria: QuestionCriteriaService,
  ) {}

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
      include: QUESTION_BANK_CRITERIA_INCLUDE,
    });

    if (candidates.length === 0) {
      throw new Error(
        `No fallback questions available for ${sessionType}/${contextPackId}`,
      );
    }

    const selected = this.selectWithDifficultySpread(candidates, count);

    if (selected.length < count) {
      throw new Error(
        `Only ${selected.length}/${count} fallback questions available for ${sessionType}/${contextPackId}`,
      );
    }

    const mapped = selected
      .map((question) => {
        try {
          return this.mapFallbackQuestion(question, language, rubricVersionId);
        } catch {
          // Question has no valid criteria relation for this context/rubric — skip it
          return null;
        }
      })
      .filter((q): q is FallbackQuestion => q !== null);

    if (mapped.length === 0) {
      throw new Error(
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
      questionCategory: competencyDomains[0].startsWith('TD')
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

const QUESTION_BANK_CRITERIA_INCLUDE = {
  criteria: {
    include: {
      rubricCriterion: {
        include: {
          rubricCategory: { include: { rubricVersion: true } },
        },
      },
    },
  },
} satisfies Prisma.QuestionBankInclude;

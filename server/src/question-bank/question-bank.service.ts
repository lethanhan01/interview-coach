import { Injectable } from '@nestjs/common';
import type { Prisma, QuestionSessionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type QuestionBankRow = {
  id: string;
  content: string;
  difficulty: number;
  competencyDomain: string;
  estimatedTimeMin: number | null;
  translations: Prisma.JsonValue | null;
};

export type FallbackQuestion = {
  questionBankId: string;
  text: string;
  questionCategory: string;
  competencyDomain: string;
  estimatedTimeMin: number;
};

@Injectable()
export class QuestionBankService {
  constructor(private readonly prisma: PrismaService) {}

  async selectFallbackQuestions(
    sessionType: string,
    contextPackId: string,
    count: number,
    language: string,
  ): Promise<FallbackQuestion[]> {
    if (sessionType === 'mixed') {
      return this.selectMixedFallbackQuestions(contextPackId, count, language);
    }

    const candidates = await this.prisma.questionBank.findMany({
      where: {
        sessionType: sessionType as QuestionSessionType,
        contextPackId,
        deletedAt: null,
      },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: count * 3,
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

    return selected.map((question) => ({
      questionBankId: question.id,
      text: this.resolveText(question, language),
      questionCategory: question.competencyDomain.startsWith('TD')
        ? 'technical'
        : 'behavioral',
      competencyDomain: question.competencyDomain,
      estimatedTimeMin: question.estimatedTimeMin ?? 5,
    }));
  }

  private async selectMixedFallbackQuestions(
    contextPackId: string,
    count: number,
    language: string,
  ): Promise<FallbackQuestion[]> {
    const hrCount = Math.ceil(count / 2);
    const techCount = Math.floor(count / 2);

    const [hrCandidates, techCandidates] = await Promise.all([
      this.prisma.questionBank.findMany({
        where: { sessionType: 'hr', contextPackId, deletedAt: null },
        orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
        take: hrCount * 3,
      }),
      this.prisma.questionBank.findMany({
        where: { sessionType: 'technical', contextPackId, deletedAt: null },
        orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
        take: techCount * 3,
      }),
    ]);

    if (hrCandidates.length === 0 || techCandidates.length === 0) {
      throw new Error(
        `Insufficient fallback questions for mixed/${contextPackId}: hr=${hrCandidates.length}, technical=${techCandidates.length}`,
      );
    }

    const hrSelected = this.selectWithDifficultySpread(hrCandidates, hrCount);
    const techSelected = this.selectWithDifficultySpread(
      techCandidates,
      techCount,
    );
    const allSelected = [...hrSelected, ...techSelected];

    if (allSelected.length < count) {
      throw new Error(
        `Only ${allSelected.length}/${count} mixed fallback questions available for ${contextPackId}`,
      );
    }

    return allSelected.map((question) => ({
      questionBankId: question.id,
      text: this.resolveText(question, language),
      questionCategory: question.competencyDomain.startsWith('TD')
        ? 'technical'
        : 'behavioral',
      competencyDomain: question.competencyDomain,
      estimatedTimeMin: question.estimatedTimeMin ?? 5,
    }));
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

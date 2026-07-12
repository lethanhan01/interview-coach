import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CategoryKey = 'behavioral' | 'technical';

type RubricCategoryRow = {
  contextPackId: string;
  categoryKey: string;
  displayOrder: number;
};

type RubricCriterionRow = {
  id: string;
  code: string;
  name: string;
  weight: number;
  displayOrder: number;
  active?: boolean;
  rubricCategory: RubricCategoryRow;
};

type CriterionLink = {
  rubricCriterion?: RubricCriterionRow | null;
};

type QuestionWithCriteria = {
  competencyDomains: string[];
  criteria?: CriterionLink[] | null;
};

type QuestionBankWithCriteria = QuestionWithCriteria & {
  contextPackId: string;
};

type SessionCriterionLink = CriterionLink & {
  criterionCode: string;
  categoryKeySnapshot: string;
  displayOrderSnapshot: number;
};

type SessionQuestionWithCriteria = {
  competencyDomains: string[];
  criteria?: SessionCriterionLink[] | null;
};

export type SessionQuestionCriterionCreateInput = {
  sessionQuestionId: string;
  rubricCriterionId?: string | null;
  contextPackIdSnapshot: string;
  criterionCode: string;
  criterionNameSnapshot: string;
  categoryKeySnapshot: string;
  weightSnapshot: number;
  displayOrderSnapshot: number;
};

@Injectable()
export class QuestionCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  hasQuestionBankCriteria(question: QuestionBankWithCriteria): boolean {
    return Boolean(question.criteria?.length);
  }

  codesFromQuestionBank(question: QuestionBankWithCriteria): string[] {
    const linked = (question.criteria ?? [])
      .map((link) => link.rubricCriterion)
      .filter(
        (criterion): criterion is RubricCriterionRow =>
          criterion !== null &&
          criterion !== undefined &&
          criterion.active !== false &&
          criterion.rubricCategory.contextPackId === question.contextPackId,
      )
      .sort(compareCriterionRows)
      .map((criterion) => criterion.code);

    return linked.length > 0
      ? unique(linked)
      : unique(question.competencyDomains);
  }

  hasSessionQuestionCriteria(question: SessionQuestionWithCriteria): boolean {
    return Boolean(question.criteria?.length);
  }

  codesFromSessionQuestion(question: SessionQuestionWithCriteria): string[] {
    const linked = (question.criteria ?? [])
      .slice()
      .sort((a, b) => {
        const categoryA =
          a.rubricCriterion?.rubricCategory.categoryKey ??
          a.categoryKeySnapshot;
        const categoryB =
          b.rubricCriterion?.rubricCategory.categoryKey ??
          b.categoryKeySnapshot;
        const categoryOrder =
          categorySortValue(categoryA) - categorySortValue(categoryB);
        if (categoryOrder !== 0) return categoryOrder;

        const displayOrder =
          (a.rubricCriterion?.displayOrder ?? a.displayOrderSnapshot) -
          (b.rubricCriterion?.displayOrder ?? b.displayOrderSnapshot);
        if (displayOrder !== 0) return displayOrder;

        return a.criterionCode.localeCompare(b.criterionCode);
      })
      .map((link) => link.criterionCode);

    return linked.length > 0
      ? unique(linked)
      : unique(question.competencyDomains);
  }

  async buildSessionQuestionCriteriaData(input: {
    sessionQuestionId: string;
    contextPackId: string;
    competencyDomains: string[];
    rubricJson: Prisma.JsonValue | Prisma.InputJsonValue | object;
  }): Promise<SessionQuestionCriterionCreateInput[]> {
    const codes = unique(input.competencyDomains);
    if (codes.length === 0) {
      throw new Error('Session question criteria must include at least one code');
    }

    const criteria = await this.findCurrentCriteria(input.contextPackId, codes);
    const byCode = new Map(criteria.map((criterion) => [criterion.code, criterion]));
    const missing = codes.filter((code) => !byCode.has(code));
    if (missing.length > 0) {
      throw new Error(
        `Unable to resolve rubric criteria for ${input.contextPackId}: ${missing.join(', ')}`,
      );
    }

    return codes.map((code) => {
      const criterion = byCode.get(code);
      if (!criterion) {
        throw new Error(`Unable to resolve rubric criterion ${code}`);
      }

      const snapshot = readRubricSnapshot(input.rubricJson, code);
      return {
        sessionQuestionId: input.sessionQuestionId,
        rubricCriterionId: criterion.id,
        contextPackIdSnapshot: input.contextPackId,
        criterionCode: code,
        criterionNameSnapshot: snapshot?.name ?? criterion.name,
        categoryKeySnapshot:
          snapshot?.categoryKey ?? criterion.rubricCategory.categoryKey,
        weightSnapshot: snapshot?.weight ?? criterion.weight,
        displayOrderSnapshot: criterion.displayOrder,
      };
    });
  }

  private async findCurrentCriteria(
    contextPackId: string,
    codes: string[],
  ): Promise<RubricCriterionRow[]> {
    return this.prisma.rubricCriterion.findMany({
      where: {
        code: { in: codes },
        active: true,
        rubricCategory: { contextPackId },
      },
      include: { rubricCategory: true },
    }) as Promise<RubricCriterionRow[]>;
  }
}

function compareCriterionRows(a: RubricCriterionRow, b: RubricCriterionRow) {
  const categoryOrder =
    categorySortValue(a.rubricCategory.categoryKey) -
    categorySortValue(b.rubricCategory.categoryKey);
  if (categoryOrder !== 0) return categoryOrder;

  const displayOrder = a.displayOrder - b.displayOrder;
  if (displayOrder !== 0) return displayOrder;

  return a.code.localeCompare(b.code);
}

function categorySortValue(value: string): number {
  if (value === 'behavioral') return 1;
  if (value === 'technical') return 2;
  return 99;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function readRubricSnapshot(
  value: Prisma.JsonValue | Prisma.InputJsonValue | object,
  code: string,
): { categoryKey: CategoryKey; name?: string; weight?: number } | null {
  const root = asRecord(value);
  if (!root) return null;
  for (const categoryKey of ['behavioral', 'technical'] as const) {
    const category = asRecord(root[categoryKey]);
    if (!category) continue;
    const criterion = asRecord(category[code]);
    if (!criterion) continue;

    const name = typeof criterion.name === 'string' ? criterion.name : undefined;
    const weight =
      typeof criterion.weight === 'number' && Number.isFinite(criterion.weight)
        ? criterion.weight
        : undefined;
    return { categoryKey, name, weight };
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

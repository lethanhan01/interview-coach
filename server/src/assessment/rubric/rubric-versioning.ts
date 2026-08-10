import type { Prisma } from '@prisma/client';
import type { ContextPackData } from './context-pack.data';

export type RubricCategoryKey = 'behavioral' | 'technical';

export interface RubricCategorySeed {
  key: RubricCategoryKey;
  label: string;
  weight: number;
  displayOrder: number;
  criteria: {
    code: string;
    name: string;
    weight: number;
    displayOrder: number;
  }[];
}

export function buildRubricCategoriesFromPack(
  pack: ContextPackData,
): RubricCategorySeed[] {
  const rubricJson = pack.defaultRubricJson as Record<
    RubricCategoryKey,
    Record<string, { name?: unknown; weight?: unknown }>
  >;
  const scoringWeights = pack.defaultScoringWeights as Record<string, unknown>;

  return [
    {
      key: 'behavioral',
      label: 'Tiêu chí hành vi',
      weight: numberOrZero(scoringWeights['behavioral_weight']),
      displayOrder: 1,
      criteria: buildCriteria(rubricJson.behavioral ?? {}),
    },
    {
      key: 'technical',
      label: 'Tiêu chí kỹ thuật',
      weight: numberOrZero(scoringWeights['technical_weight']),
      displayOrder: 2,
      criteria: buildCriteria(rubricJson.technical ?? {}),
    },
  ];
}

export function buildRubricSnapshot(
  categories: RubricCategorySeed[],
): Prisma.InputJsonObject {
  return Object.fromEntries(
    categories.map((category) => [
      category.key,
      Object.fromEntries(
        category.criteria.map((criterion) => [
          criterion.code,
          {
            name: criterion.name,
            weight: criterion.weight,
          },
        ]),
      ),
    ]),
  );
}

export function buildScoringWeights(
  categories: RubricCategorySeed[],
): Record<string, number> {
  return {
    behavioral_weight:
      categories.find((category) => category.key === 'behavioral')?.weight ?? 0,
    technical_weight:
      categories.find((category) => category.key === 'technical')?.weight ?? 0,
  };
}

function buildCriteria(
  criteria: Record<string, { name?: unknown; weight?: unknown }>,
): RubricCategorySeed['criteria'] {
  return Object.entries(criteria).map(([code, criterion], index) => ({
    code,
    name: typeof criterion.name === 'string' ? criterion.name : '',
    weight: numberOrZero(criterion.weight),
    displayOrder: index + 1,
  }));
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

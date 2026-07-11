import { Injectable, Logger, Optional } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CONTEXT_PACK_DATA, ContextPackId } from '../prisma/context-pack.data';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildRubricCategoriesFromPack,
  buildRubricSnapshot,
  buildScoringWeights,
  type RubricCategorySeed,
} from '../prisma/rubric-versioning';

export type ContextPackType = ContextPackId;
export type RubricDimension = string;

export interface RubricDimensionEntry {
  id: string;
  name: string;
  weight: number;
}

export interface ContextPackConfig {
  type: ContextPackType;
  rubricVersionId?: string;
  rubricDimensions: RubricDimension[];
  behavioralDimensions: RubricDimensionEntry[];
  technicalDimensions: RubricDimensionEntry[];
  culturalNotes: string;
  scoringWeights: Record<string, number>;
}

@Injectable()
export class ContextPackService {
  private readonly logger = new Logger(ContextPackService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async getContextPack(
    type: ContextPackType,
    rubricVersionId?: string | null,
  ): Promise<ContextPackConfig> {
    if (!this.prisma) return this.getLegacyContextPack(type);

    try {
      const version = await this.prisma.rubricVersion.findFirst({
        where: rubricVersionId
          ? { id: rubricVersionId, contextPackId: type }
          : { contextPackId: type, status: 'active' },
        include: {
          categories: {
            orderBy: { displayOrder: 'asc' },
            include: {
              criteria: {
                where: { active: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      });

      if (!version) {
        this.logger.warn(
          `No ${rubricVersionId ? 'requested' : 'active'} rubric version found for ${type}; falling back to legacy context-pack data.`,
        );
        return this.getLegacyContextPack(type);
      }

      return this.fromRubricCategories(
        type,
        version.id,
        version.categories.map((category) => ({
          key: category.categoryKey as 'behavioral' | 'technical',
          label: category.label,
          weight: category.weight,
          displayOrder: category.displayOrder,
          criteria: category.criteria.map((criterion) => ({
            code: criterion.code,
            name: criterion.name,
            weight: criterion.weight,
            displayOrder: criterion.displayOrder,
          })),
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Unable to read rubric version for ${type}; falling back to legacy context-pack data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.getLegacyContextPack(type);
    }
  }

  async getRubricSnapshot(
    type: ContextPackType,
    rubricVersionId?: string | null,
  ): Promise<Prisma.InputJsonObject> {
    const config = await this.getContextPack(type, rubricVersionId);
    return buildRubricSnapshot([
      {
        key: 'behavioral',
        label: 'Tiêu chí hành vi',
        weight: config.scoringWeights.behavioral_weight ?? 0,
        displayOrder: 1,
        criteria: config.behavioralDimensions.map((dimension, index) => ({
          code: dimension.id,
          name: dimension.name,
          weight: dimension.weight,
          displayOrder: index + 1,
        })),
      },
      {
        key: 'technical',
        label: 'Tiêu chí kỹ thuật',
        weight: config.scoringWeights.technical_weight ?? 0,
        displayOrder: 2,
        criteria: config.technicalDimensions.map((dimension, index) => ({
          code: dimension.id,
          name: dimension.name,
          weight: dimension.weight,
          displayOrder: index + 1,
        })),
      },
    ]);
  }

  private getLegacyContextPack(type: ContextPackType): ContextPackConfig {
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === type);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${type}`);
    }

    return this.fromRubricCategories(
      pack.id,
      undefined,
      buildRubricCategoriesFromPack(pack),
    );
  }

  private fromRubricCategories(
    type: ContextPackType,
    rubricVersionId: string | undefined,
    categories: RubricCategorySeed[],
  ): ContextPackConfig {
    const behavioral =
      categories.find((category) => category.key === 'behavioral')?.criteria ??
      [];
    const technical =
      categories.find((category) => category.key === 'technical')?.criteria ??
      [];
    const rubricDimensions = [...behavioral, ...technical].map(
      (criterion) => criterion.name,
    );
    const scoringWeights = buildScoringWeights(categories);
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === type);

    return {
      type,
      rubricVersionId,
      rubricDimensions,
      behavioralDimensions: behavioral.map((criterion) => ({
        id: criterion.code,
        name: criterion.name,
        weight: criterion.weight,
      })),
      technicalDimensions: technical.map((criterion) => ({
        id: criterion.code,
        name: criterion.name,
        weight: criterion.weight,
      })),
      culturalNotes: pack?.culturalNotes ?? '',
      scoringWeights,
    };
  }
}

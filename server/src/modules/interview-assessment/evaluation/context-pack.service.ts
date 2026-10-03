import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { CONTEXT_PACK_DATA, ContextPackId } from './rubric/context-pack.data';
import {
  buildRubricCategoriesFromPack,
  buildRubricSnapshot,
  buildScoringWeights,
  type RubricCategorySeed,
} from './rubric/rubric-versioning';

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

  getContextPack(type: ContextPackType): Promise<ContextPackConfig> {
    return Promise.resolve(this.getLegacyContextPack(type));
  }

  async getRubricSnapshot(
    type: ContextPackType,
  ): Promise<Prisma.InputJsonObject> {
    const config = await this.getContextPack(type);
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
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        `Unsupported context pack: ${type}`,
      );
    }

    return this.fromRubricCategories(
      pack.id,
      buildRubricCategoriesFromPack(pack),
      '9.0.0',
    );
  }

  private fromRubricCategories(
    type: ContextPackType,
    categories: RubricCategorySeed[],
    rubricVersionId?: string,
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
      rubricVersionId: rubricVersionId ?? '9.0.0',
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

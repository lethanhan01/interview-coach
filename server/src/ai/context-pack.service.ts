import { Injectable } from '@nestjs/common';
import { CONTEXT_PACK_DATA, ContextPackId } from '../prisma/context-pack.data';

export type ContextPackType = ContextPackId;
export type RubricDimension = string;

export interface ContextPackConfig {
  type: ContextPackType;
  rubricDimensions: RubricDimension[];
  culturalNotes: string;
  scoringWeights: Record<string, number>;
}

@Injectable()
export class ContextPackService {
  getContextPack(type: ContextPackType): ContextPackConfig {
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === type);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${type}`);
    }

    const rubricJson = pack.rubricJson as Record<
      string,
      Record<string, { name?: unknown }>
    >;
    const rubricDimensions = Object.values(rubricJson).flatMap((category) =>
      Object.values(category)
        .map((dimension) => dimension.name)
        .filter((name): name is string => typeof name === 'string'),
    );
    const scoringWeights = Object.fromEntries(
      Object.entries(pack.scoringWeights).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number',
      ),
    );

    return {
      type: pack.id,
      rubricDimensions,
      culturalNotes: pack.culturalNotes,
      scoringWeights,
    };
  }
}

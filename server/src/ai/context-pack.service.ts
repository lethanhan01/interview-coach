import { Injectable } from '@nestjs/common';

export type ContextPackType = 'VN' | 'Western';
export type RubricDimension = string;

export interface ContextPackConfig {
  type: ContextPackType;
  rubricDimensions: RubricDimension[];
  culturalNotes: string;
  scoringWeights: Record<string, number>;
}

const VN_PACK: ContextPackConfig = {
  type: 'VN',
  rubricDimensions: ['clarity', 'structure', 'communication', 'culture_fit'],
  culturalNotes:
    'Vietnamese workplace context: emphasize teamwork, respect for hierarchy, and practical problem-solving. Use Vietnamese cultural references when appropriate.',
  scoringWeights: {
    clarity: 0.25,
    structure: 0.25,
    communication: 0.25,
    culture_fit: 0.25,
  },
};

const WESTERN_PACK: ContextPackConfig = {
  type: 'Western',
  rubricDimensions: [
    'clarity',
    'structure',
    'communication',
    'impact',
    'leadership',
  ],
  culturalNotes:
    'Western workplace context: emphasize initiative, quantifiable impact, and leadership potential. STAR format preferred.',
  scoringWeights: {
    clarity: 0.2,
    structure: 0.2,
    communication: 0.2,
    impact: 0.2,
    leadership: 0.2,
  },
};

@Injectable()
export class ContextPackService {
  getContextPack(type: ContextPackType): ContextPackConfig {
    return type === 'VN' ? VN_PACK : WESTERN_PACK;
  }
}

import type { Prisma } from '@prisma/client';

export const CONTEXT_PACK_IDS = ['VN', 'Western'] as const;

export type ContextPackId = (typeof CONTEXT_PACK_IDS)[number];

export interface ContextPackData {
  id: ContextPackId;
  legacyIds: string[];
  name: string;
  culturalNotes: string;
  rubricJson: Prisma.InputJsonObject;
  scoringWeights: Prisma.InputJsonObject;
}

export const CONTEXT_PACK_DATA: ContextPackData[] = [
  {
    id: 'VN',
    legacyIds: ['vn'],
    name: 'Vietnam Context Pack',
    culturalNotes:
      'Vietnamese workplace context: emphasize teamwork, respect for hierarchy, and practical problem-solving. Use Vietnamese cultural references when appropriate.',
    rubricJson: {
      behavioral: {
        D1: { name: 'Giao tiếp & Trình bày', weight: 0.2 },
        D2: { name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
        D3: { name: 'Làm việc nhóm', weight: 0.15 },
        D4: { name: 'Thái độ & Động lực', weight: 0.2 },
        D5: { name: 'Phù hợp văn hóa', weight: 0.15 },
        D6: { name: 'Tự nhận thức', weight: 0.1 },
      },
      technical: {
        TD1: { name: 'Kiến thức nền tảng', weight: 0.25 },
        TD2: { name: 'Khả năng áp dụng thực tế', weight: 0.25 },
        TD3: { name: 'Tư duy hệ thống', weight: 0.2 },
        TD4: { name: 'Code quality & Best practices', weight: 0.2 },
        TD5: { name: 'Debug & Problem-solving', weight: 0.1 },
      },
    },
    scoringWeights: {
      behavioral_weight: 0.5,
      technical_weight: 0.5,
    },
  },
  {
    id: 'Western',
    legacyIds: ['western'],
    name: 'Western Context Pack',
    culturalNotes:
      'Western workplace context: emphasize initiative, quantifiable impact, and leadership potential. STAR format preferred.',
    rubricJson: {
      behavioral: {
        D1: { name: 'Communication & Presentation', weight: 0.2 },
        D2: { name: 'Critical Thinking', weight: 0.2 },
        D3: { name: 'Collaboration & Teamwork', weight: 0.15 },
        D4: { name: 'Leadership & Initiative', weight: 0.2 },
        D5: { name: 'Culture Fit & Values', weight: 0.15 },
        D6: { name: 'Self-Awareness & Growth', weight: 0.1 },
      },
      technical: {
        TD1: { name: 'Foundational Knowledge', weight: 0.2 },
        TD2: { name: 'Practical Application', weight: 0.25 },
        TD3: { name: 'Systems Thinking', weight: 0.2 },
        TD4: { name: 'Code Quality & Best Practices', weight: 0.2 },
        TD5: { name: 'Debug & Problem-solving', weight: 0.15 },
      },
    },
    scoringWeights: {
      behavioral_weight: 0.45,
      technical_weight: 0.55,
    },
  },
];

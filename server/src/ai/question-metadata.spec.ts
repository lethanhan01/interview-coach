import {
  calculateEstimatedTimeMin,
  normalizeGeneratedQuestionMetadata,
  normalizeQuestionMetadataForCleanup,
} from './question-metadata';
import type { ContextPackConfig } from './context-pack.service';

const contextPack = {
  behavioralDimensions: [
    { id: 'D1', name: 'Communication & Presentation', weight: 0.2 },
    { id: 'D2', name: 'Critical Thinking', weight: 0.2 },
    { id: 'D3', name: 'Collaboration & Teamwork', weight: 0.15 },
    { id: 'D4', name: 'Leadership & Initiative', weight: 0.2 },
    { id: 'D5', name: 'Culture Fit & Values', weight: 0.15 },
    { id: 'D6', name: 'Self-Awareness & Growth', weight: 0.1 },
  ],
  technicalDimensions: [
    { id: 'TD1', name: 'Foundational Knowledge', weight: 0.2 },
    { id: 'TD2', name: 'Practical Application', weight: 0.25 },
    { id: 'TD3', name: 'Systems Thinking', weight: 0.2 },
    { id: 'TD4', name: 'Code Quality & Best Practices', weight: 0.2 },
    { id: 'TD5', name: 'Debug & Problem-solving', weight: 0.15 },
  ],
} as ContextPackConfig;

describe('question metadata helpers', () => {
  it('giữ nguyên ID đúng và suy ra category behavioral', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'behavioral', competencyDomains: ['D1'] },
        contextPack,
        'hr',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['D1'],
      matchBranch: 'exact',
    });
  });

  it('map tên rubric Western về canonical ID', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'Self-Awareness & Growth',
          competencyDomains: ['Self-Awareness & Growth'],
        },
        contextPack,
        'hr',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['D6'],
      matchBranch: 'name',
    });
  });

  it('map tên technical rubric về TD ID', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'Debugging & Operations',
          competencyDomains: ['Debug & Problem-solving'],
        },
        contextPack,
        'technical',
      ),
    ).toEqual({
      questionCategory: 'technical',
      competencyDomains: ['TD5'],
      matchBranch: 'name',
    });
  });

  it('normalize mảng nhiều tiêu chí, bỏ trùng và giữ cả cross-category domains trong mixed', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'technical',
          competencyDomains: ['TD1', 'TD2', 'TD1', 'D1', 'unknown'],
        },
        contextPack,
        'mixed',
      ),
    ).toEqual({
      questionCategory: 'technical',
      competencyDomains: ['TD1', 'TD2', 'D1'],
      matchBranch: 'exact',
    });

    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'behavioral',
          competencyDomains: ['TD1', 'D2'],
        },
        contextPack,
        'mixed',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['TD1', 'D2'],
      matchBranch: 'exact',
    });
  });

  it('reject mảng rỗng sau normalize', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'technical',
          competencyDomains: ['D1', 'unknown'],
        },
        contextPack,
        'technical',
      ),
    ).toBeNull();
  });

  it('HR reject technical domain và Technical reject behavioral domain', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'technical', competencyDomains: ['TD1'] },
        contextPack,
        'hr',
      ),
    ).toBeNull();
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'behavioral', competencyDomains: ['D2'] },
        contextPack,
        'technical',
      ),
    ).toBeNull();
  });

  it('tính estimated_time_min theo duration, num_questions và difficulty', () => {
    expect(
      calculateEstimatedTimeMin({
        durationMin: 30,
        numQuestions: 5,
        difficulty: 1,
      }),
    ).toBe(4);
    expect(
      calculateEstimatedTimeMin({
        durationMin: 30,
        numQuestions: 5,
        difficulty: 3,
      }),
    ).toBe(6);
  });

  it('cleanup mixed map technical text rõ ràng về TD5', () => {
    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'behavioral',
          competencyDomains: ['unknown'],
          questionText:
            'Walk through how you debug a production reliability issue.',
        },
        contextPack,
        'mixed',
      ),
    ).toEqual({
      questionCategory: 'technical',
      competencyDomains: ['TD5'],
      matchBranch: 'heuristic',
    });
  });

  it('cleanup mixed map behavioral text rõ ràng về D4 hoặc D3', () => {
    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'technical',
          competencyDomains: ['unknown'],
          questionText: 'Describe a time you showed leadership and ownership.',
        },
        contextPack,
        'mixed',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['D4'],
      matchBranch: 'heuristic',
    });

    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'technical',
          competencyDomains: ['unknown'],
          questionText: 'Tell me about collaboration with a teammate.',
        },
        contextPack,
        'mixed',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['D3'],
      matchBranch: 'heuristic',
    });
  });

  it('cleanup mixed ambiguous hoặc conflict không strict-map thì trả null', () => {
    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'behavioral',
          competencyDomains: ['unknown'],
          questionText:
            'Tell me about a production incident you solved under pressure.',
        },
        contextPack,
        'mixed',
      ),
    ).toBeNull();

    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'behavioral',
          competencyDomains: ['unknown'],
          questionText: 'Tell me about yourself.',
        },
        contextPack,
        'mixed',
      ),
    ).toBeNull();
  });

  it('cleanup HR và Technical vẫn giữ fallback D1/TD1', () => {
    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'unknown',
          competencyDomains: ['unknown'],
          questionText: 'Tell me about yourself.',
        },
        contextPack,
        'hr',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomains: ['D1'],
      matchBranch: 'heuristic',
    });

    expect(
      normalizeQuestionMetadataForCleanup(
        {
          category: 'unknown',
          competencyDomains: ['unknown'],
          questionText: 'Explain a concept.',
        },
        contextPack,
        'technical',
      ),
    ).toEqual({
      questionCategory: 'technical',
      competencyDomains: ['TD1'],
      matchBranch: 'heuristic',
    });
  });
});

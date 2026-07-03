import {
  calculateEstimatedTimeMin,
  normalizeGeneratedQuestionMetadata,
} from './question-metadata';
import type { ContextPackConfig } from './context-pack.service';

const contextPack = {
  behavioralDimensions: [
    { id: 'D1', name: 'Communication & Presentation', weight: 0.2 },
    { id: 'D2', name: 'Critical Thinking', weight: 0.2 },
    { id: 'D6', name: 'Self-Awareness & Growth', weight: 0.1 },
  ],
  technicalDimensions: [
    { id: 'TD1', name: 'Foundational Knowledge', weight: 0.2 },
    { id: 'TD5', name: 'Debug & Problem-solving', weight: 0.15 },
  ],
} as ContextPackConfig;

describe('question metadata helpers', () => {
  it('giữ nguyên ID đúng và suy ra category behavioral', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'behavioral', competencyDomain: 'D1' },
        contextPack,
        'hr',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomain: 'D1',
      matchBranch: 'exact',
    });
  });

  it('map tên rubric Western về canonical ID', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'Self-Awareness & Growth',
          competencyDomain: 'Self-Awareness & Growth',
        },
        contextPack,
        'hr',
      ),
    ).toEqual({
      questionCategory: 'behavioral',
      competencyDomain: 'D6',
      matchBranch: 'name',
    });
  });

  it('map tên technical rubric về TD ID', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        {
          category: 'Debugging & Operations',
          competencyDomain: 'Debug & Problem-solving',
        },
        contextPack,
        'technical',
      ),
    ).toEqual({
      questionCategory: 'technical',
      competencyDomain: 'TD5',
      matchBranch: 'name',
    });
  });

  it('HR reject technical domain và Technical reject behavioral domain', () => {
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'technical', competencyDomain: 'TD1' },
        contextPack,
        'hr',
      ),
    ).toBeNull();
    expect(
      normalizeGeneratedQuestionMetadata(
        { category: 'behavioral', competencyDomain: 'D2' },
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
});

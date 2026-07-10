import {
  CleanupRow,
  planQuestionMetadataCleanup,
  summarizeQuestionMetadataCleanup,
} from './question-metadata-cleanup-planner';

const contextPackService = {
  getContextPack: jest.fn(() => ({
    type: 'Western',
    culturalNotes: 'Western',
    scoringWeights: {},
    rubricDimensions: [],
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
  })),
};

function row(overrides: Partial<CleanupRow>): CleanupRow {
  return {
    id: 'q1',
    session_id: 's1',
    question_text: 'Tell me about yourself.',
    order_index: 0,
    question_category: 'behavioral',
    competency_domains: ['unknown'],
    estimated_time_min: 3,
    session_type: 'mixed',
    context_pack_id: 'Western',
    duration_min: 30,
    num_questions: 5,
    ...overrides,
  };
}

describe('question metadata cleanup planner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('dry-run summary báo unmappedRows', () => {
    const rows = [row({ id: 'ambiguous' })];
    const { planned, unmappedRows } = planQuestionMetadataCleanup(
      rows,
      contextPackService,
    );

    expect(planned).toHaveLength(0);
    expect(unmappedRows).toHaveLength(1);
    expect(summarizeQuestionMetadataCleanup(rows, planned, unmappedRows, false)).toEqual(
      expect.objectContaining({
        mode: 'dry-run',
        plannedChanges: 0,
        unmappedRows: 1,
      }),
    );
  });

  it('apply summary vẫn báo unmappedRows để caller fail trước khi update', () => {
    const rows = [row({ id: 'ambiguous' })];
    const { planned, unmappedRows } = planQuestionMetadataCleanup(
      rows,
      contextPackService,
    );

    expect(summarizeQuestionMetadataCleanup(rows, planned, unmappedRows, true)).toEqual(
      expect.objectContaining({
        mode: 'apply',
        plannedChanges: 0,
        unmappedRows: 1,
      }),
    );
  });
});

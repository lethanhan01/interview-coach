import { FeedbackSchema } from './pipeline.schemas';

describe('FeedbackSchema', () => {
  const base = {
    model_answer:
      'A stronger answer would give a concise situation, action, and measurable result.',
    key_takeaway: 'The answer is understandable but needs sharper evidence.',
    applied_dimensions: [{ id: 'TD1', score: 80 }],
    annotated_segments: [
      {
        segment_text: 'I improved the system',
        start_index: 0,
        end_index: 21,
        highlight_level: 'improvement',
        annotation: 'This needs a clearer result.',
        suggestion: null,
        improved_version: null,
      },
    ],
  };

  it('parses applied_dimensions and normalizes null optional segment fields', () => {
    const parsed = FeedbackSchema.parse(base);
    expect(parsed.applied_dimensions[0]).toEqual({ id: 'TD1', score: 80 });
    expect(parsed.annotated_segments[0].suggestion).toBeUndefined();
    expect(parsed.annotated_segments[0].improved_version).toBeUndefined();
  });

  it('rejects empty applied_dimensions', () => {
    expect(() =>
      FeedbackSchema.parse({ ...base, applied_dimensions: [] }),
    ).toThrow();
  });

  it('rejects score out of range', () => {
    expect(() =>
      FeedbackSchema.parse({
        ...base,
        applied_dimensions: [{ id: 'TD1', score: 101 }],
      }),
    ).toThrow();
  });
});

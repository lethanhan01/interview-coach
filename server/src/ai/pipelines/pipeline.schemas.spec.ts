import { FeedbackSchema } from './pipeline.schemas';

describe('FeedbackSchema', () => {
  it('normalizes null optional annotated segment text fields to undefined', () => {
    const parsed = FeedbackSchema.parse({
      overall_score: 82,
      model_answer: 'A stronger answer would give a concise situation, action, and measurable result.',
      key_takeaway: 'The answer is understandable but needs sharper evidence.',
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
    });

    expect(parsed.annotated_segments[0].suggestion).toBeUndefined();
    expect(parsed.annotated_segments[0].improved_version).toBeUndefined();
  });

  it('still rejects invalid feedback structure', () => {
    expect(() =>
      FeedbackSchema.parse({
        overall_score: 101,
        model_answer: 'Invalid score.',
        key_takeaway: 'Invalid enum should still fail.',
        annotated_segments: [
          {
            segment_text: 'system',
            start_index: 0,
            end_index: 6,
            highlight_level: 'neutral',
            annotation: 'Invalid highlight level.',
          },
        ],
      }),
    ).toThrow();
  });
});

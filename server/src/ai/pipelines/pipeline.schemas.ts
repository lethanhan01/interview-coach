import { z } from 'zod';

export const PROMPT_VERSION = 'surgical-feedback-v1.4';

export const QuestionsSchema = z.object({
  questions: z.array(
    z
      .object({
        text: z.string(),
        category: z.string(),
        competency_domain: z.string().optional(),
        competency_domains: z.array(z.string()).min(1).optional(),
        difficulty: z.number().int().min(1).max(3),
      })
      .refine(
        (question) =>
          question.competency_domains !== undefined ||
          question.competency_domain !== undefined,
        { message: 'competency_domains or competency_domain is required' },
      ),
  ),
});

const OptionalFeedbackTextSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
);

export const FeedbackSchema = z.object({
  applied_dimensions: z
    .array(
      z.object({
        id: z.string(),
        score: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
  model_answer: z.string(),
  key_takeaway: z.string(),
  annotated_segments: z.array(
    z.object({
      segment_text: z.string(),
      start_index: z.number().int(),
      end_index: z.number().int(),
      highlight_level: z.enum(['strength', 'improvement']),
      annotation: z.string(),
      suggestion: OptionalFeedbackTextSchema,
      improved_version: OptionalFeedbackTextSchema,
    }),
  ),
});

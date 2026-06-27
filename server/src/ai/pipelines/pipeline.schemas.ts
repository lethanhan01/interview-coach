import { z } from 'zod';

export const PROMPT_VERSION = 'surgical-feedback-v1.1';

export const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string(),
      category: z.string(),
      competency_domain: z.string(),
      difficulty: z.number().int().min(1).max(3),
    }),
  ),
});

export const FeedbackSchema = z.object({
  overall_score: z.number().int().min(1).max(100),
  model_answer: z.string(),
  key_takeaway: z.string(),
  annotated_segments: z.array(
    z.object({
      segment_text: z.string(),
      start_index: z.number().int(),
      end_index: z.number().int(),
      highlight_level: z.enum(['strength', 'improvement']),
      annotation: z.string(),
      suggestion: z.string().optional(),
      improved_version: z.string().optional(),
    }),
  ),
});

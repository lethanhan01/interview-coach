import type { PrismaClient } from '@prisma/client';

interface SegmentData {
  segmentText: string;
  startIndex: number;
  endIndex: number;
  highlightLevel: 'good' | 'warning' | 'critical';
  annotation: string;
  suggestion?: string;
  improvedVersion?: string;
}

interface FeedbackData {
  overallScore: number;
  modelAnswer: string;
  keyTakeaway: string;
  promptVersion?: string;
  isFallback?: boolean;
  segments?: SegmentData[];
}

interface AnswerOpts {
  sessionId: string;
  questionId: string;
  answerText: string;
  answerMode?: 'text' | 'audio';
  skipped?: boolean;
  audioFileUrl?: string;
  audioDurationSeconds?: number;
  audioSizeBytes?: number;
  voiceMetricsJson?: Record<string, unknown>;
  feedbackGenerated?: boolean;
  feedback?: FeedbackData;
}

/** Compute startIndex/endIndex by locating segmentText inside answerText.
 *  Throws at seed time if the segment is not found — prevents silent bad data. */
export function segAt(
  answerText: string,
  segmentText: string,
  rest: Omit<SegmentData, 'segmentText' | 'startIndex' | 'endIndex'>,
): SegmentData {
  const startIndex = answerText.indexOf(segmentText);
  if (startIndex === -1) {
    throw new Error(`Seed error: segment "${segmentText}" not found in answer`);
  }
  return {
    segmentText,
    startIndex,
    endIndex: startIndex + segmentText.length,
    ...rest,
  };
}

export async function createAnswerWithFeedback(
  prisma: PrismaClient,
  opts: AnswerOpts,
): Promise<string> {
  const answer = await prisma.userAnswer.create({
    data: {
      sessionId: opts.sessionId,
      questionId: opts.questionId,
      answerText: opts.answerText,
      answerMode: opts.answerMode ?? 'text',
      skipped: opts.skipped ?? false,
      audioFileUrl: opts.audioFileUrl,
      audioDurationSeconds: opts.audioDurationSeconds,
      audioSizeBytes: opts.audioSizeBytes,
      voiceMetricsJson: opts.voiceMetricsJson as Record<
        string,
        string | number | boolean | null | object
      >,
      feedbackGenerated: opts.feedbackGenerated ?? opts.feedback !== undefined,
    },
  });

  if (opts.feedback) {
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: answer.id,
        overallScore: opts.feedback.overallScore,
        modelAnswer: opts.feedback.modelAnswer,
        keyTakeaway: opts.feedback.keyTakeaway,
        promptVersion: opts.feedback.promptVersion ?? 'v1.0-seed',
        isFallback: opts.feedback.isFallback ?? false,
        annotatedSegments: {
          create: (opts.feedback.segments ?? []).map((s) => ({
            segmentText: s.segmentText,
            startIndex: s.startIndex,
            endIndex: s.endIndex,
            highlightLevel: s.highlightLevel,
            annotation: s.annotation,
            suggestion: s.suggestion ?? null,
            improvedVersion: s.improvedVersion ?? null,
          })),
        },
      },
    });
  }

  return answer.id;
}

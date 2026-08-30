export const QUESTION_GEN_QUEUE = 'question-generation';
export const FEEDBACK_QUEUE = 'feedback';
export const REPORT_QUEUE = 'comprehensive-report';
export const TRANSCRIPTION_QUEUE = 'transcription';

export const FEEDBACK_JOB_ATTEMPTS = 2; // retry 1 = 2 total attempts (ADR-007)
export const QUESTION_GEN_JOB_ATTEMPTS = 2; // retry 1 = 2 total attempts (ADR-007)
export const TRANSCRIPTION_JOB_ATTEMPTS = 2;
export const REPORT_JOB_ATTEMPTS = 3;
export const REPORT_JOB_RETRY_DELAY_MS = 3_000;

const COMPLETED_JOB_RETENTION = { age: 86_400, count: 1_000 };
const FAILED_JOB_RETENTION = { age: 2_592_000, count: 10_000 };

export const QUEUE_DEFAULT_JOB_OPTIONS = {
  [QUESTION_GEN_QUEUE]: {
    attempts: QUESTION_GEN_JOB_ATTEMPTS,
    backoff: { type: 'fixed' as const, delay: 2_000 },
    removeOnComplete: COMPLETED_JOB_RETENTION,
    removeOnFail: FAILED_JOB_RETENTION,
  },
  [FEEDBACK_QUEUE]: {
    attempts: FEEDBACK_JOB_ATTEMPTS,
    backoff: { type: 'fixed' as const, delay: 2_000 },
    removeOnComplete: COMPLETED_JOB_RETENTION,
    removeOnFail: FAILED_JOB_RETENTION,
  },
  [REPORT_QUEUE]: {
    attempts: REPORT_JOB_ATTEMPTS,
    backoff: { type: 'fixed' as const, delay: REPORT_JOB_RETRY_DELAY_MS },
    removeOnComplete: COMPLETED_JOB_RETENTION,
    removeOnFail: FAILED_JOB_RETENTION,
  },
  [TRANSCRIPTION_QUEUE]: {
    attempts: TRANSCRIPTION_JOB_ATTEMPTS,
    backoff: { type: 'fixed' as const, delay: 3_000 },
    removeOnComplete: COMPLETED_JOB_RETENTION,
    removeOnFail: FAILED_JOB_RETENTION,
  },
} as const;

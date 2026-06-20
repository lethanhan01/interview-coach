export const QUESTION_GEN_QUEUE = 'question-generation';
export const FOLLOW_UP_QUEUE = 'follow-up';
export const FEEDBACK_QUEUE = 'feedback';
export const REPORT_QUEUE = 'comprehensive-report';
export const TRANSCRIPTION_QUEUE = 'transcription';

export const FEEDBACK_JOB_ATTEMPTS = 2; // retry 1 = 2 total attempts (ADR-007)
export const QUESTION_GEN_JOB_ATTEMPTS = 2; // retry 1 = 2 total attempts (ADR-007)
export const FOLLOW_UP_JOB_ATTEMPTS = 2;
export const TRANSCRIPTION_JOB_ATTEMPTS = 2;
export const REPORT_JOB_ATTEMPTS = 3;
export const REPORT_JOB_RETRY_DELAY_MS = 3_000;

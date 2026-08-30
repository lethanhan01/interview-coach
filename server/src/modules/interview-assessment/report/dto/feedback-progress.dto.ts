export interface FeedbackProgressDto {
  sessionId: string;
  status: string;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  feedbackRequired: number;
  feedbackCompleted: number;
  feedbackPending: number;
  reportReady: boolean;
}

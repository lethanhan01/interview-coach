import { InterviewSession } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';

export interface IInterviewModeStrategy {
  readonly mode: string;

  /**
   * Validates whether the incoming session creation DTO satisfies mode requirements.
   */
  validateSessionConfig?(dto: CreateSessionDto): void;

  /**
   * Builds the workflow payload for the question-generation background task.
   */
  buildQuestionGenerationPayload(
    session: InterviewSession,
    dto: CreateSessionDto,
    sfiaVersion?: string,
  ): Record<string, any>;

  /**
   * Validates whether the session satisfies completion criteria for this mode.
   */
  isSessionCompletable(
    session: InterviewSession,
    answeredCount: number,
    totalQuestions: number,
  ): boolean;

  /**
   * Builds the workflow payload for the report-generation background task.
   */
  buildReportGenerationPayload(session: InterviewSession): Record<string, any>;
}

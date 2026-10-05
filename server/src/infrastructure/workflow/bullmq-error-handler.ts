import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { RequestContext } from '@core/common/context/request-context';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

const NON_RETRYABLE_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.SESSION_NOT_FOUND,
  ErrorCode.USER_NOT_FOUND,
  ErrorCode.ANSWER_NOT_FOUND,
  ErrorCode.RUBRIC_NOT_FOUND,
  ErrorCode.INVALID_SESSION_TRANSITION,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.BAD_REQUEST,
  ErrorCode.FORBIDDEN,
  ErrorCode.FORBIDDEN_RESOURCE,
  ErrorCode.UNAUTHORIZED,
  ErrorCode.INVALID_SESSION_TYPE,
  ErrorCode.AUDIO_TOO_LARGE,
  ErrorCode.INVALID_AUDIO_URL,
]);

export class BullMqJobErrorHandler {
  private static readonly logger = new Logger(BullMqJobErrorHandler.name);

  static isFatal(error: unknown): boolean {
    if (error instanceof InterviewAIException) {
      if (NON_RETRYABLE_ERROR_CODES.has(error.errorCode)) {
        return true;
      }
      if (
        error.errorCode === ErrorCode.AI_RATE_LIMIT ||
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        return false;
      }
      const status = error.getStatus();
      if (status >= 400 && status < 500) {
        return true;
      }
    } else if (error instanceof HttpException) {
      const status = error.getStatus();
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        return false;
      }
      if (status >= 400 && status < 500) {
        return true;
      }
    }
    return false;
  }

  static async handleJobExecution<TData, TResult>(
    processorName: string,
    job: Job<TData>,
    executor: () => Promise<TResult>,
  ): Promise<TResult> {
    const data = job.data as Record<string, unknown> | undefined;
    const correlationId =
      (data?.correlationId as string) ||
      (job.opts?.parent
        ? `parent-${job.opts.parent.id}`
        : `job-${job.id ?? 'unknown'}`);

    return RequestContext.run(
      {
        requestId: `job-${job.id ?? 'unknown'}`,
        correlationId,
        startTime: Date.now(),
      },
      async () => {
        try {
          return await executor();
        } catch (error: unknown) {
          const attemptsMade = (job.attemptsMade ?? 0) + 1;
          const maxAttempts = job.opts?.attempts ?? 1;
          const fatal = this.isFatal(error);

          const errorMsg =
            error instanceof Error ? error.message : String(error);
          const errorStack =
            error instanceof Error ? error.stack : undefined;

          if (fatal || attemptsMade >= maxAttempts) {
            this.logger.error(
              `[${processorName}] Job ${job.id ?? 'unknown'} FAILED permanently (fatal=${fatal}, attempt ${attemptsMade}/${maxAttempts}): ${errorMsg}`,
              errorStack,
            );

            if (fatal) {
              throw new UnrecoverableError(errorMsg);
            }
            throw error;
          }

          this.logger.warn(
            `[${processorName}] Job ${job.id ?? 'unknown'} failed transiently (attempt ${attemptsMade}/${maxAttempts}), scheduling retry: ${errorMsg}`,
          );
          throw error;
        }
      },
    );
  }
}

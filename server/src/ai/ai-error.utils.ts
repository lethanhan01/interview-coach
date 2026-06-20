import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';

export function isAIQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof InterviewAIException &&
    error.errorCode === ErrorCode.AI_QUOTA_EXCEEDED
  );
}

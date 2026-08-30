import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

const FALLBACK_ELIGIBLE_AI_ERRORS = new Set<ErrorCode>([
  ErrorCode.AI_QUOTA_EXCEEDED,
  ErrorCode.AI_RATE_LIMIT,
  ErrorCode.AI_TIMEOUT,
  ErrorCode.AI_EMPTY_RESPONSE,
  ErrorCode.AI_INVALID_JSON,
  ErrorCode.SCHEMA_VALIDATION_ERROR,
]);

export function isAIQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof InterviewAIException &&
    error.errorCode === ErrorCode.AI_QUOTA_EXCEEDED
  );
}

export function isAIFallbackEligible(error: unknown): boolean {
  return (
    error instanceof InterviewAIException &&
    FALLBACK_ELIGIBLE_AI_ERRORS.has(error.errorCode)
  );
}

export function describeAIError(error: unknown): string {
  if (!(error instanceof InterviewAIException)) {
    return error instanceof Error ? error.message : String(error);
  }

  const response = error.getResponse();
  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof response.message === 'string'
  ) {
    return response.message;
  }

  return error.message;
}

import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { SessionStatusUpdate } from './dto/update-session-status.dto';

export class SessionLifecyclePolicy {
  assertTransition(current: string, next: SessionStatusUpdate): void {
    if (current === next) return;

    const allowed =
      (next === 'active' &&
        ['generating', 'ready', 'paused'].includes(current)) ||
      (next === 'paused' && ['active', 'ready'].includes(current)) ||
      (next === 'canceled' && !['completed', 'completing'].includes(current)) ||
      (next === 'completed' && current === 'active');

    if (!allowed) throw this.invalidTransition(current, next);
  }

  invalidTransition(
    currentStatus: string,
    nextStatus: string,
  ): InterviewAIException {
    return new InterviewAIException(
      ErrorCode.INVALID_SESSION_TRANSITION,
      HttpStatus.CONFLICT,
      `Không thể chuyển trạng thái phỏng vấn từ ${currentStatus} sang ${nextStatus}.`,
    );
  }
}

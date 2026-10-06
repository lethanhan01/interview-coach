import { HttpException, HttpStatus } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';
import { BullMqJobErrorHandler } from './bullmq-error-handler';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { RequestContext } from '@core/common/context/request-context';

describe('BullMqJobErrorHandler', () => {
  describe('isFatal', () => {
    it('nhận diện đúng các lỗi Fatal không thể retry', () => {
      const notFoundEx = new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
      const validationEx = new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
      const invalidTransitionEx = new InterviewAIException(
        ErrorCode.INVALID_SESSION_TRANSITION,
        HttpStatus.CONFLICT,
      );

      expect(BullMqJobErrorHandler.isFatal(notFoundEx)).toBe(true);
      expect(BullMqJobErrorHandler.isFatal(validationEx)).toBe(true);
      expect(BullMqJobErrorHandler.isFatal(invalidTransitionEx)).toBe(true);
    });

    it('coi các lỗi transient / 5xx là có thể retry (không fatal)', () => {
      const timeoutEx = new InterviewAIException(
        ErrorCode.AI_TIMEOUT,
        HttpStatus.GATEWAY_TIMEOUT,
      );
      const serviceUnavailableEx = new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      const networkError = new Error('ECONNRESET');

      expect(BullMqJobErrorHandler.isFatal(timeoutEx)).toBe(false);
      expect(BullMqJobErrorHandler.isFatal(serviceUnavailableEx)).toBe(false);
      expect(BullMqJobErrorHandler.isFatal(networkError)).toBe(false);
    });

    it('coi mã lỗi AI_RATE_LIMIT (429) là transient và cho phép retry', () => {
      const rateLimitEx = new InterviewAIException(
        ErrorCode.AI_RATE_LIMIT,
        HttpStatus.TOO_MANY_REQUESTS,
        'AI rate limit reached, backoff requested',
      );
      const http429Ex = new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      expect(BullMqJobErrorHandler.isFatal(rateLimitEx)).toBe(false);
      expect(BullMqJobErrorHandler.isFatal(http429Ex)).toBe(false);
    });

    it('coi các lỗi HttpException 4xx thông thường là fatal', () => {
      const badReqEx = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
      const unauthEx = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      expect(BullMqJobErrorHandler.isFatal(badReqEx)).toBe(true);
      expect(BullMqJobErrorHandler.isFatal(unauthEx)).toBe(true);
    });
  });

  describe('handleJobExecution', () => {
    it('chạy thành công và khôi phục correlationId vào RequestContext', async () => {
      const job = {
        id: 'job-123',
        data: { correlationId: 'corr-from-http-123' },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as any;

      let capturedCorrelationId = '';
      const result = await BullMqJobErrorHandler.handleJobExecution(
        'TestProcessor',
        job,
        async () => {
          capturedCorrelationId = RequestContext.getCorrelationId();
          return { success: true };
        },
      );

      expect(result).toEqual({ success: true });
      expect(capturedCorrelationId).toBe('corr-from-http-123');
    });

    it('ném UnrecoverableError khi gặp lỗi Fatal để ngắt retry ngay', async () => {
      const job = {
        id: 'job-456',
        data: {},
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as any;

      const fatalError = new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Session missing',
      );

      await expect(
        BullMqJobErrorHandler.handleJobExecution(
          'TestProcessor',
          job,
          async () => {
            throw fatalError;
          },
        ),
      ).rejects.toThrow(UnrecoverableError);
    });

    it('ném lỗi gốc khi gặp transient error để BullMQ kích hoạt backoff retry', async () => {
      const job = {
        id: 'job-789',
        data: {},
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as any;

      const transientError = new InterviewAIException(
        ErrorCode.AI_TIMEOUT,
        HttpStatus.GATEWAY_TIMEOUT,
        'AI timeout',
      );

      await expect(
        BullMqJobErrorHandler.handleJobExecution(
          'TestProcessor',
          job,
          async () => {
            throw transientError;
          },
        ),
      ).rejects.toThrow(transientError);
    });
  });
});

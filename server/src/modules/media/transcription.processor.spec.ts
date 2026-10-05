import { Test, TestingModule } from '@nestjs/testing';
import { Job, UnrecoverableError } from 'bullmq';
import { TranscriptionProcessor } from './transcription.processor';
import { TranscribeAnswer } from './transcribe-answer.service';
import type { TranscriptionJobDto } from './transcription-job.dto';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { HttpStatus } from '@nestjs/common';
import { RequestContext } from '@core/common/context/request-context';

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let transcribeAnswer: jest.Mocked<TranscribeAnswer>;

  beforeEach(async () => {
    transcribeAnswer = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<TranscribeAnswer>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: TranscribeAnswer, useValue: transcribeAnswer },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
  });

  it('thực thi thành công job qua BullMqJobErrorHandler và propagate correlationId', async () => {
    const job = {
      id: 'transcription-job-1',
      data: {
        sessionId: 'session-1',
        answerId: 'answer-1',
        correlationId: 'corr-transcribe-1',
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<TranscriptionJobDto>;

    transcribeAnswer.execute.mockImplementation(async () => {
      expect(RequestContext.getCorrelationId()).toBe('corr-transcribe-1');
      expect(RequestContext.getRequestId()).toBe('job-transcription-job-1');
    });

    await processor.process(job);

    expect(transcribeAnswer.execute).toHaveBeenCalledWith(job);
  });

  it('ném UnrecoverableError khi gặp lỗi Fatal để ngắt retry', async () => {
    const job = {
      id: 'transcription-job-2',
      data: {
        sessionId: 'session-2',
        answerId: 'answer-2',
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<TranscriptionJobDto>;

    transcribeAnswer.execute.mockRejectedValue(
      new InterviewAIException(
        ErrorCode.ANSWER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'Answer not found',
      ),
    );

    await expect(processor.process(job)).rejects.toThrow(UnrecoverableError);
  });

  it('ném lỗi thông thường khi gặp transient error để BullMQ retry', async () => {
    const job = {
      id: 'transcription-job-3',
      data: {
        sessionId: 'session-3',
        answerId: 'answer-3',
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<TranscriptionJobDto>;

    const transientError = new InterviewAIException(
      ErrorCode.AI_SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      'Whisper service down',
    );
    transcribeAnswer.execute.mockRejectedValue(transientError);

    await expect(processor.process(job)).rejects.toThrow(transientError);
  });
});

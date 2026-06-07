import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { RewriteEvalProcessor } from './rewrite-eval.processor';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

describe('RewriteEvalProcessor', () => {
  let processor: RewriteEvalProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RewriteEvalProcessor],
    }).compile();

    processor = module.get<RewriteEvalProcessor>(RewriteEvalProcessor);
  });

  it('ném InterviewAIException SERVICE_UNAVAILABLE vì RewriteEval chưa khả dụng trong MVP', async () => {
    await expect(processor.process()).rejects.toThrow(InterviewAIException);

    try {
      await processor.process();
    } catch (e) {
      expect((e as InterviewAIException).errorCode).toBe(
        ErrorCode.SERVICE_UNAVAILABLE,
      );
      expect((e as InterviewAIException).getStatus()).toBe(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  });
});

import { HttpStatus } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { REWRITE_EVAL_QUEUE } from '../../common/constants/queue.constants';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

@Processor(REWRITE_EVAL_QUEUE)
export class RewriteEvalProcessor extends WorkerHost {
  // eslint-disable-next-line @typescript-eslint/require-await
  async process(): Promise<void> {
    throw new InterviewAIException(
      ErrorCode.SERVICE_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      'RewriteEval is not available in MVP (v1.1)',
    );
  }
}

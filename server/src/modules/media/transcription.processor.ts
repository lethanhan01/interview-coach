import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { TRANSCRIPTION_QUEUE } from '@core/common/constants/queue.constants';
import { BullMqJobErrorHandler } from '@infra/workflow/bullmq-error-handler';
import { TranscribeAnswer } from './transcribe-answer.service';
import type { TranscriptionJobDto } from './transcription-job.dto';

@Processor(TRANSCRIPTION_QUEUE, { concurrency: 1 })
export class TranscriptionProcessor extends WorkerHost {
  constructor(private readonly transcribeAnswer: TranscribeAnswer) {
    super();
  }

  process(job: Job<TranscriptionJobDto>): Promise<void> {
    return BullMqJobErrorHandler.handleJobExecution(
      TranscriptionProcessor.name,
      job,
      () => this.transcribeAnswer.execute(job),
    );
  }
}

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { TRANSCRIPTION_QUEUE } from '../common/constants/queue.constants';
import { TranscribeAnswer } from './transcribe-answer.service';
import type { TranscriptionJobDto } from './transcription-job.dto';

@Processor(TRANSCRIPTION_QUEUE)
export class TranscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(private readonly transcribeAnswer: TranscribeAnswer) {
    super();
  }

  async process(job: Job<TranscriptionJobDto>): Promise<void> {
    try {
      await this.transcribeAnswer.execute(job);
    } catch (error) {
      this.logger.warn(
        `Transcription job ${job.id ?? 'unknown'} failed; BullMQ will apply its retry policy`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      throw error;
    }
  }
}

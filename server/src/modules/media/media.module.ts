import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '@infra/ai/ai.module';
import { StorageModule } from '@infra/storage/storage.module';
import { QuestionCriteriaModule } from '@modules/interview-prep/question-criteria/question-criteria.module';
import { EvaluationModule } from '@modules/interview-assessment/evaluation/evaluation.module';
import {
  FEEDBACK_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
  TRANSCRIPTION_QUEUE,
} from '@core/common/constants/queue.constants';
import { AudioObjectStorage } from './audio-object-storage.service';
import { SpeechToText } from './speech-to-text.service';
import { TranscribeAnswer } from './transcribe-answer.service';
import { TranscriptionProcessor } from './transcription.processor';
import { UploadAndTranscribeAnswerAudio } from './upload-and-transcribe-answer-audio.service';
import { VoiceMetricsService } from './voice-metrics.service';
import { workersEnabled } from '@core/runtime/runtime-role';

import { MediaFacade } from './contracts/media-facade.service';

const workerProviders = workersEnabled() ? [TranscriptionProcessor] : [];

@Module({
  imports: [
    AiModule,
    StorageModule,
    QuestionCriteriaModule,
    EvaluationModule,
    BullModule.registerQueue(
      {
        name: FEEDBACK_QUEUE,
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[FEEDBACK_QUEUE],
      },
      {
        name: TRANSCRIPTION_QUEUE,
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[TRANSCRIPTION_QUEUE],
      },
    ),
  ],
  providers: [
    AudioObjectStorage,
    SpeechToText,
    UploadAndTranscribeAnswerAudio,
    VoiceMetricsService,
    TranscribeAnswer,
    MediaFacade,
    ...workerProviders,
  ],
  exports: [
    StorageModule,
    AudioObjectStorage,
    UploadAndTranscribeAnswerAudio,
    VoiceMetricsService,
    MediaFacade,
  ],
})
export class MediaModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '@infra/ai/ai.module';
import { AssessmentModule } from '../assessment/assessment.module';
import {
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '@core/common/constants/queue.constants';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import { GenerateSessionQuestions } from './generate-session-questions.service';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { workersEnabled } from '@core/runtime/runtime-role';

const workerProviders = workersEnabled() ? [QuestionGenerationProcessor] : [];

@Module({
  imports: [
    AiModule,
    AssessmentModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    BullModule.registerQueue({
      name: QUESTION_GEN_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[QUESTION_GEN_QUEUE],
    }),
  ],
  providers: [GenerateSessionQuestions, ...workerProviders],
})
export class QuestionModule {}

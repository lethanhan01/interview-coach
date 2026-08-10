import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { AssessmentModule } from '../assessment/assessment.module';
import { QUESTION_GEN_QUEUE } from '../common/constants/queue.constants';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import { GenerateSessionQuestions } from './generate-session-questions.service';
import { QuestionGenerationProcessor } from './question-generation.processor';

const workerProviders =
  process.env.WORKERS_ENABLED === 'false' ? [] : [QuestionGenerationProcessor];

@Module({
  imports: [
    AiModule,
    AssessmentModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    BullModule.registerQueue({ name: QUESTION_GEN_QUEUE }),
  ],
  providers: [GenerateSessionQuestions, ...workerProviders],
})
export class QuestionModule {}

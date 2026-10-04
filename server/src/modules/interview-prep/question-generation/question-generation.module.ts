import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '@infra/ai/ai.module';
import { EvaluationModule } from '@modules/interview-assessment/evaluation/evaluation.module';
import {
  QUESTION_GEN_QUEUE,
  QUEUE_DEFAULT_JOB_OPTIONS,
} from '@core/common/constants/queue.constants';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { SfiaModule } from '@modules/sfia/sfia.module';
import { GenerateSessionQuestions } from './generate-session-questions.service';
import { QuestionGenerationProcessor } from './question-generation.processor';
import { SkillTargetedQuestionGeneratorService } from './skill-targeted-question-generator.service';
import { workersEnabled } from '@core/runtime/runtime-role';

const workerProviders = workersEnabled() ? [QuestionGenerationProcessor] : [];

@Module({
  imports: [
    AiModule,
    EvaluationModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    TaxonomyModule,
    SfiaModule,
    BullModule.registerQueue({
      name: QUESTION_GEN_QUEUE,
      defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS[QUESTION_GEN_QUEUE],
    }),
  ],
  providers: [
    GenerateSessionQuestions,
    SkillTargetedQuestionGeneratorService,
    ...workerProviders,
  ],
  exports: [GenerateSessionQuestions, SkillTargetedQuestionGeneratorService],
})
export class QuestionGenerationModule {}
export { QuestionGenerationModule as QuestionModule };

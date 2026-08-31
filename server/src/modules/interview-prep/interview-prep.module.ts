import { Module } from '@nestjs/common';
import { QuestionGenerationModule } from './question-generation/question-generation.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { QuestionCriteriaModule } from './question-criteria/question-criteria.module';
import { JobDescriptionModule } from './job-description/job-description.module';
import { SfiaModule } from './sfia/sfia.module';

@Module({
  imports: [
    QuestionGenerationModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    JobDescriptionModule,
    SfiaModule,
  ],
  exports: [
    QuestionGenerationModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    JobDescriptionModule,
    SfiaModule,
  ],
})
export class InterviewPrepModule {}


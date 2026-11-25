import { Module } from '@nestjs/common';
import { QuestionGenerationModule } from './question-generation/question-generation.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { QuestionCriteriaModule } from './question-criteria/question-criteria.module';
import { JobDescriptionModule } from './job-description/job-description.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    QuestionGenerationModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    JobDescriptionModule,
    TaxonomyModule,
    CatalogModule,
  ],
  exports: [
    QuestionGenerationModule,
    QuestionBankModule,
    QuestionCriteriaModule,
    JobDescriptionModule,
    TaxonomyModule,
    CatalogModule,
  ],
})
export class InterviewPrepModule {}

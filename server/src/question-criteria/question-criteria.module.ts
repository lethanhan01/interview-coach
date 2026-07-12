import { Module } from '@nestjs/common';
import { QuestionCriteriaService } from './question-criteria.service';

@Module({
  providers: [QuestionCriteriaService],
  exports: [QuestionCriteriaService],
})
export class QuestionCriteriaModule {}

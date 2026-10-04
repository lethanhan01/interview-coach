import { Module } from '@nestjs/common';
import { QuestionCriteriaService } from './question-criteria.service';
import { PrepFacade } from '../contracts/prep-facade.service';

@Module({
  providers: [QuestionCriteriaService, PrepFacade],
  exports: [QuestionCriteriaService, PrepFacade],
})
export class QuestionCriteriaModule {}

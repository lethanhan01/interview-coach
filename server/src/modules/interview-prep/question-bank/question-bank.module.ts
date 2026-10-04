import { Module } from '@nestjs/common';
import { QuestionCriteriaModule } from '../question-criteria/question-criteria.module';
import { QuestionBankService } from './question-bank.service';

@Module({
  imports: [QuestionCriteriaModule],
  providers: [QuestionBankService],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}

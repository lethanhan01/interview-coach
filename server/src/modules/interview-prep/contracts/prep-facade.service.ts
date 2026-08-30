import { Injectable } from '@nestjs/common';
import {
  QuestionCriteriaService,
  type SessionQuestionWithCriteria,
  type SessionQuestionCriterionCreateInput,
} from '../question-criteria/question-criteria.service';

type CriterionLink = {
  rubricCriterion?: {
    id: string;
    code: string;
    name: string;
    weight: number;
    displayOrder: number;
    rubricCategory: {
      categoryKey: string;
      displayOrder: number;
      rubricVersion: {
        id: string;
        contextPackId: string;
        status: string;
      };
    };
  } | null;
};

export type QuestionBankWithCriteria = {
  id: string;
  contextPackId: string;
  criteria?: CriterionLink[] | null;
};

@Injectable()
export class PrepFacade {
  constructor(
    private readonly questionCriteriaService: QuestionCriteriaService,
  ) {}

  codesFromQuestionBank(
    question: QuestionBankWithCriteria,
    rubricVersionId?: string,
  ): string[] {
    return this.questionCriteriaService.codesFromQuestionBank(
      question,
      rubricVersionId,
    );
  }

  codesFromSessionQuestion(question: SessionQuestionWithCriteria): string[] {
    return this.questionCriteriaService.codesFromSessionQuestion(question);
  }

  buildSessionQuestionCriteriaData(input: {
    sessionQuestionId: string;
    rubricVersionId: string;
    criterionCodes: string[];
  }): Promise<SessionQuestionCriterionCreateInput[]> {
    return this.questionCriteriaService.buildSessionQuestionCriteriaData(input);
  }
}

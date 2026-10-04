import { Injectable } from '@nestjs/common';
import {
  QuestionCriteriaService,
  type SessionQuestionWithCriteria,
  type SessionQuestionCriterionCreateInput,
} from '../question-criteria/question-criteria.service';

type CriterionLink = {
  criteria?: {
    id: string;
    code: string;
    name: string;
    weight?: any;
    displayOrder: number;
    competency?: {
      code: string;
      name: string;
    };
    skill?: {
      code: string;
      name: string;
    };
  } | null;
  skillLevel?: {
    id: string;
    code: string;
    name: string;
    weight?: any;
    displayOrder: number;
    skill?: {
      code: string;
      name: string;
    };
  } | null;
};

export type QuestionBankWithCriteria = {
  id: string;
  contextPackId: string;
  questionBankSkillLevels?: CriterionLink[] | null;
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
    rubricVersionId?: string;
    criterionCodes: string[];
  }): Promise<SessionQuestionCriterionCreateInput[]> {
    return this.questionCriteriaService.buildSessionQuestionCriteriaData(input);
  }
}

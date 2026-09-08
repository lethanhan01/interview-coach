import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

type SkillLevelRow = {
  id: string;
  code: string;
  name: string;
  weight?: any;
  displayOrder: number;
  skill?: {
    code: string;
    name: string;
  };
};

type SkillLevelLink = {
  skillLevel?: SkillLevelRow | null;
};

type QuestionWithSkillLevels = {
  questionBankSkillLevels?: SkillLevelLink[] | null;
  criteria?: any[] | null; // Compatibility
};

type QuestionBankWithSkillLevels = QuestionWithSkillLevels & {
  id: string;
  contextPackId: string;
};

export type SessionQuestionWithSkillLevels = {
  id: string;
  questionText: string;
  questionCategory: string;
  sessionQuestionSkillLevels?: SkillLevelLink[] | null;
  criteria?: any[] | null; // Compatibility
};

export type SessionQuestionWithCriteria = SessionQuestionWithSkillLevels;

export type SessionQuestionSkillLevelCreateInput = {
  sessionQuestionId: string;
  skillLevelId: string;
  criteriaId?: string;
};

// Backwards compatibility alias
export type SessionQuestionCriterionCreateInput = {
  sessionQuestionId: string;
  skillLevelId?: string;
  criteriaId?: string;
};

@Injectable()
export class QuestionCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  codesFromQuestionBank(question: any, _versionId?: string): string[] {
    if (
      Array.isArray(question.rubricCriteria) &&
      question.rubricCriteria.length > 0
    ) {
      return question.rubricCriteria.map((c: any) => c.id || c.code || 'core');
    }
    const rawLinks =
      question.questionBankSkillLevels ?? question.criteria ?? [];
    const linked = rawLinks
      .map((link: any) => link.skillLevel ?? link.criteria)
      .filter((sl: any): sl is SkillLevelRow => sl !== null && sl !== undefined)
      .sort(compareSkillLevelRows)
      .map((sl: any) => sl.code);

    const codes = unique(linked);
    return codes.length > 0 ? codes : ['core', 'seniority'];
  }

  codesFromSessionQuestion(question: any): string[] {
    if (
      Array.isArray(question.rubricCriteria) &&
      question.rubricCriteria.length > 0
    ) {
      return question.rubricCriteria.map((c: any) => c.id || c.code || 'core');
    }
    const rawLinks =
      question.sessionQuestionSkillLevels ?? question.criteria ?? [];
    const linked = rawLinks
      .map((link: any) => link.skillLevel ?? link.criteria)
      .filter((sl: any): sl is SkillLevelRow => sl !== null && sl !== undefined)
      .slice()
      .sort(compareSkillLevelRows)
      .map((sl: any) => sl.code);

    const codes = unique(linked);
    return codes.length > 0 ? codes : ['core', 'seniority'];
  }

  async buildSessionQuestionCriteriaData(input: {
    sessionQuestionId: string;
    criterionCodes: string[];
    rubricVersionId?: string;
  }): Promise<SessionQuestionSkillLevelCreateInput[]> {
    const codes = unique(input.criterionCodes);
    if (codes.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Session question criteria must include at least one code',
      );
    }

    return codes.map((code) => ({
      sessionQuestionId: input.sessionQuestionId,
      skillLevelId: code,
    }));
  }
}

function compareSkillLevelRows(a: SkillLevelRow, b: SkillLevelRow) {
  const displayOrder = a.displayOrder - b.displayOrder;
  if (displayOrder !== 0) return displayOrder;

  return a.code.localeCompare(b.code);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

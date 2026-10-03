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

export type SessionQuestionWithSkillLevels = {
  id: string;
  questionText: string;
  questionCategory: string;
  sessionQuestionSkillLevels?: SkillLevelLink[] | null;
  criteria?: unknown[] | null; // Compatibility
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

  codesFromQuestionBank(
    question: Record<string, unknown>,
    _versionId?: string,
  ): string[] {
    void _versionId;
    if (
      Array.isArray(question.rubricCriteria) &&
      question.rubricCriteria.length > 0
    ) {
      return (question.rubricCriteria as Record<string, unknown>[]).map(
        (c) =>
          (typeof c.id === 'string' ? c.id : undefined) ||
          (typeof c.code === 'string' ? c.code : undefined) ||
          'core',
      );
    }
    const rawLinks = Array.isArray(question.questionBankSkillLevels)
      ? (question.questionBankSkillLevels as Record<string, unknown>[])
      : Array.isArray(question.criteria)
        ? (question.criteria as Record<string, unknown>[])
        : [];
    const linked = rawLinks
      .map(
        (link) =>
          (link.skillLevel ?? link.criteria) as SkillLevelRow | undefined,
      )
      .filter((sl): sl is SkillLevelRow => sl !== null && sl !== undefined)
      .sort(compareSkillLevelRows)
      .map((sl) => sl.code);

    const codes = unique(linked);
    return codes.length > 0 ? codes : ['core', 'seniority'];
  }

  codesFromSessionQuestion(question: Record<string, unknown>): string[] {
    if (
      Array.isArray(question.rubricCriteria) &&
      question.rubricCriteria.length > 0
    ) {
      return (question.rubricCriteria as Record<string, unknown>[]).map(
        (c) =>
          (typeof c.id === 'string' ? c.id : undefined) ||
          (typeof c.code === 'string' ? c.code : undefined) ||
          'core',
      );
    }
    const rawLinks = Array.isArray(question.sessionQuestionSkillLevels)
      ? (question.sessionQuestionSkillLevels as Record<string, unknown>[])
      : Array.isArray(question.criteria)
        ? (question.criteria as Record<string, unknown>[])
        : [];
    const linked = rawLinks
      .map(
        (link) =>
          (link.skillLevel ?? link.criteria) as SkillLevelRow | undefined,
      )
      .filter((sl): sl is SkillLevelRow => sl !== null && sl !== undefined)
      .slice()
      .sort(compareSkillLevelRows)
      .map((sl) => sl.code);

    const codes = unique(linked);
    return codes.length > 0 ? codes : ['core', 'seniority'];
  }

  buildSessionQuestionCriteriaData(input: {
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

    return Promise.resolve(
      codes.map((code) => ({
        sessionQuestionId: input.sessionQuestionId,
        skillLevelId: code,
      })),
    );
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

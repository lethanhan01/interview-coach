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

  codesFromQuestionBank(
    question: QuestionBankWithSkillLevels,
    _versionId?: string,
  ): string[] {
    const rawLinks = question.questionBankSkillLevels ?? question.criteria ?? [];
    const linked = rawLinks
      .map((link: any) => link.skillLevel ?? link.criteria)
      .filter(
        (sl): sl is SkillLevelRow =>
          sl !== null && sl !== undefined,
      )
      .sort(compareSkillLevelRows)
      .map((sl) => sl.code);

    return unique(linked);
  }

  codesFromSessionQuestion(question: SessionQuestionWithSkillLevels): string[] {
    const rawLinks = question.sessionQuestionSkillLevels ?? question.criteria ?? [];
    const linked = rawLinks
      .map((link: any) => link.skillLevel ?? link.criteria)
      .filter(
        (sl): sl is SkillLevelRow =>
          sl !== null && sl !== undefined,
      )
      .slice()
      .sort(compareSkillLevelRows)
      .map((sl) => sl.code);

    const codes = unique(linked);
    if (codes.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Session question has no skill level / criteria relation',
      );
    }
    return codes;
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

    const skillLevels = await this.findVersionSkillLevels(codes);
    const byCode = new Map(
      skillLevels.map((sl) => [sl.code, sl]),
    );
    const missing = codes.filter((code) => !byCode.has(code));
    if (missing.length > 0) {
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Unable to resolve skill levels for codes: ${missing.join(', ')}`,
      );
    }

    return codes.map((code) => {
      const skillLevel = byCode.get(code);
      if (!skillLevel) {
        throw new InterviewAIException(
          ErrorCode.RUBRIC_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Unable to resolve skill level ${code}`,
        );
      }

      return {
        sessionQuestionId: input.sessionQuestionId,
        skillLevelId: skillLevel.id,
      };
    });
  }

  private async findVersionSkillLevels(
    codes: string[],
  ): Promise<SkillLevelRow[]> {
    return this.prisma.skillLevel.findMany({
      where: {
        code: { in: codes },
      },
      include: { skill: true },
    });
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

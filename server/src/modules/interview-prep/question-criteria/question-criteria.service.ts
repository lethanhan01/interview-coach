import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

type CriteriaRow = {
  id: string;
  code: string;
  name: string;
  weight?: any;
  displayOrder: number;
  competency?: {
    code: string;
    name: string;
  };
};

type CriterionLink = {
  criteria?: CriteriaRow | null;
};

type QuestionWithCriteria = {
  criteria?: CriterionLink[] | null;
};

type QuestionBankWithCriteria = QuestionWithCriteria & {
  id: string;
  contextPackId: string;
};

type SessionCriterionLink = CriterionLink;

export type SessionQuestionWithCriteria = {
  id: string;
  questionText: string;
  questionCategory: string;
  criteria?: SessionCriterionLink[] | null;
};

export type SessionQuestionCriterionCreateInput = {
  sessionQuestionId: string;
  criteriaId: string;
};

@Injectable()
export class QuestionCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  codesFromQuestionBank(
    question: QuestionBankWithCriteria,
    _versionId?: string,
  ): string[] {
    const linked = (question.criteria ?? [])
      .map((link) => link.criteria)
      .filter(
        (criterion): criterion is CriteriaRow =>
          criterion !== null && criterion !== undefined,
      )
      .sort(compareCriterionRows)
      .map((criterion) => criterion.code);

    return unique(linked);
  }

  codesFromSessionQuestion(question: SessionQuestionWithCriteria): string[] {
    const linked = (question.criteria ?? [])
      .map((link) => link.criteria)
      .filter(
        (criterion): criterion is CriteriaRow =>
          criterion !== null && criterion !== undefined,
      )
      .slice()
      .sort(compareCriterionRows)
      .map((criterion) => criterion.code);

    const codes = unique(linked);
    if (codes.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Session question has no criteria relation',
      );
    }
    return codes;
  }

  async buildSessionQuestionCriteriaData(input: {
    sessionQuestionId: string;
    criterionCodes: string[];
    rubricVersionId?: string;
  }): Promise<SessionQuestionCriterionCreateInput[]> {
    const codes = unique(input.criterionCodes);
    if (codes.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Session question criteria must include at least one code',
      );
    }

    const criteria = await this.findVersionCriteria(codes);
    const byCode = new Map(
      criteria.map((criterion) => [criterion.code, criterion]),
    );
    const missing = codes.filter((code) => !byCode.has(code));
    if (missing.length > 0) {
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Unable to resolve criteria for codes: ${missing.join(', ')}`,
      );
    }

    return codes.map((code) => {
      const criterion = byCode.get(code);
      if (!criterion) {
        throw new InterviewAIException(
          ErrorCode.RUBRIC_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Unable to resolve criterion ${code}`,
        );
      }

      return {
        sessionQuestionId: input.sessionQuestionId,
        criteriaId: criterion.id,
      };
    });
  }

  private async findVersionCriteria(
    codes: string[],
  ): Promise<CriteriaRow[]> {
    return this.prisma.criteria.findMany({
      where: {
        code: { in: codes },
      },
      include: { competency: true },
    });
  }
}

function compareCriterionRows(a: CriteriaRow, b: CriteriaRow) {
  const displayOrder = a.displayOrder - b.displayOrder;
  if (displayOrder !== 0) return displayOrder;

  return a.code.localeCompare(b.code);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

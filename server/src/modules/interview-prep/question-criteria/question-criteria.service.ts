import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

type RubricCategoryRow = {
  categoryKey: string;
  displayOrder: number;
  rubricVersion: {
    id: string;
    contextPackId: string;
    status: string;
  };
};

type RubricCriterionRow = {
  id: string;
  code: string;
  name: string;
  weight: number;
  displayOrder: number;
  rubricCategory: RubricCategoryRow;
};

type CriterionLink = {
  rubricCriterion?: RubricCriterionRow | null;
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
  rubricCriterionId: string;
};

@Injectable()
export class QuestionCriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  codesFromQuestionBank(
    question: QuestionBankWithCriteria,
    rubricVersionId?: string,
  ): string[] {
    const linked = (question.criteria ?? [])
      .map((link) => link.rubricCriterion)
      .filter(
        (criterion): criterion is RubricCriterionRow =>
          criterion !== null &&
          criterion !== undefined &&
          criterion.rubricCategory.rubricVersion.contextPackId ===
            question.contextPackId &&
          criterion.rubricCategory.rubricVersion.status === 'active' &&
          (!rubricVersionId ||
            criterion.rubricCategory.rubricVersion.id === rubricVersionId),
      )
      .sort(compareCriterionRows)
      .map((criterion) => criterion.code);

    return unique(linked);
  }

  codesFromSessionQuestion(question: SessionQuestionWithCriteria): string[] {
    const linked = (question.criteria ?? [])
      .map((link) => link.rubricCriterion)
      .filter(
        (criterion): criterion is RubricCriterionRow =>
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
    rubricVersionId: string;
    criterionCodes: string[];
  }): Promise<SessionQuestionCriterionCreateInput[]> {
    const codes = unique(input.criterionCodes);
    if (codes.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Session question criteria must include at least one code',
      );
    }

    const criteria = await this.findVersionCriteria(
      input.rubricVersionId,
      codes,
    );
    const byCode = new Map(
      criteria.map((criterion) => [criterion.code, criterion]),
    );
    const missing = codes.filter((code) => !byCode.has(code));
    if (missing.length > 0) {
      throw new InterviewAIException(
        ErrorCode.RUBRIC_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Unable to resolve rubric criteria for version ${input.rubricVersionId}: ${missing.join(', ')}`,
      );
    }

    return codes.map((code) => {
      const criterion = byCode.get(code);
      if (!criterion) {
        throw new InterviewAIException(
          ErrorCode.RUBRIC_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Unable to resolve rubric criterion ${code}`,
        );
      }

      return {
        sessionQuestionId: input.sessionQuestionId,
        rubricCriterionId: criterion.id,
      };
    });
  }

  private async findVersionCriteria(
    rubricVersionId: string,
    codes: string[],
  ): Promise<RubricCriterionRow[]> {
    return this.prisma.rubricCriterion.findMany({
      where: {
        rubricCategory: { rubricVersionId },
        code: { in: codes },
      },
      include: { rubricCategory: { include: { rubricVersion: true } } },
    });
  }
}

function compareCriterionRows(a: RubricCriterionRow, b: RubricCriterionRow) {
  const categoryOrder =
    categorySortValue(a.rubricCategory.categoryKey) -
    categorySortValue(b.rubricCategory.categoryKey);
  if (categoryOrder !== 0) return categoryOrder;

  const displayOrder = a.displayOrder - b.displayOrder;
  if (displayOrder !== 0) return displayOrder;

  return a.code.localeCompare(b.code);
}

function categorySortValue(value: string): number {
  if (value === 'behavioral') return 1;
  if (value === 'technical') return 2;
  return 99;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

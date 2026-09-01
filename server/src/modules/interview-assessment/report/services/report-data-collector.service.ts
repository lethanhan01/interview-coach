import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import type {
  ReportCollectedData,
  ReportFeedbackInput,
  ReportUserAnswerRecord,
} from '../types/report-generation.types';

@Injectable()
export class ReportDataCollector {
  constructor(private readonly prisma: PrismaService) {}

  async collectReportData(
    sessionId: string,
    turnIds: string[],
  ): Promise<ReportCollectedData> {
    const rawAnswers = await this.prisma.userAnswer.findMany({
      where: { id: { in: turnIds } },
      select: {
        id: true,
        skipped: true,
        question: {
          select: {
            questionText: true,
            orderIndex: true,
            criteria: {
              select: {
                criteria: {
                  select: {
                    code: true,
                    name: true,
                    weight: true,
                    displayOrder: true,
                    competency: {
                      select: {
                        code: true,
                        name: true,
                        categoryCode: true,
                        categoryName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const answers: ReportUserAnswerRecord[] = rawAnswers as unknown as ReportUserAnswerRecord[];
    const skippedAnswers = answers.filter((answer) => answer.skipped);
    const skippedAnswerIds = new Set(skippedAnswers.map((answer) => answer.id));
    const answeredTurnIds = turnIds.filter(
      (turnId) => !skippedAnswerIds.has(turnId),
    );

    const rawFeedbacks = await this.prisma.aiFeedback.findMany({
      where: { userAnswerId: { in: answeredTurnIds } },
    });

    const expectedFeedbackCount = new Set(answeredTurnIds).size;
    if (rawFeedbacks.length !== expectedFeedbackCount) {
      throw new InterviewAIException(
        ErrorCode.REPORT_NOT_READY,
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Report input is not ready for session ${sessionId}: ${rawFeedbacks.length}/${expectedFeedbackCount} feedbacks`,
      );
    }

    const feedbacks: ReportFeedbackInput[] = rawFeedbacks.map((f) => ({
      userAnswerId: f.userAnswerId,
      overallScore: f.overallScore,
      keyTakeaway: f.keyTakeaway,
      isFallback: f.isFallback,
      dimensionScores: f.dimensionScores,
    }));

    return {
      sessionId,
      answers,
      skippedAnswers,
      answeredTurnIds,
      feedbacks,
    };
  }
}

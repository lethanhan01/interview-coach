import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
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
                rubricCriterion: {
                  select: {
                    code: true,
                    name: true,
                    weight: true,
                    displayOrder: true,
                    rubricCategory: {
                      select: { categoryKey: true },
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

    const answers: ReportUserAnswerRecord[] = rawAnswers;
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
      throw new Error(
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

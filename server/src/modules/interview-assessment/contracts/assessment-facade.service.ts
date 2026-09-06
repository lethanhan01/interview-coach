import { Injectable, Optional } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { RubricCatalogService } from '../evaluation/rubric/rubric-catalog.service';
import {
  ContextPackService,
  type ContextPackConfig,
  type ContextPackType,
} from '../evaluation/context-pack.service';
import { ReportService } from '../report/report.service';
import { ScoringEngineService } from '../evaluation/scoring-engine.service';
import type { ContextPackId } from '../evaluation/rubric/context-pack.data';
import type { FeedbackProgressDto } from '../report/dto/feedback-progress.dto';
import type { ReportResponseDto } from '../report/dto/report-response.dto';

@Injectable()
export class AssessmentFacade {
  constructor(
    private readonly rubricCatalog: RubricCatalogService,
    private readonly contextPackService: ContextPackService,
    private readonly reportService: ReportService,
    private readonly prisma: PrismaService,
    @Optional()
    private readonly scoringEngine?: ScoringEngineService,
  ) {}

  ensureActiveRubricVersion(contextPack: ContextPackId): Promise<string> {
    return this.rubricCatalog.ensureActiveRubricVersion(contextPack);
  }

  getContextPack(type: ContextPackType): Promise<ContextPackConfig> {
    return this.contextPackService.getContextPack(type);
  }

  getRubricSnapshot(type: ContextPackType): Promise<Prisma.InputJsonObject> {
    return this.contextPackService.getRubricSnapshot(type);
  }

  getFeedbackProgress(
    sessionId: string,
    userId?: string,
  ): Promise<FeedbackProgressDto> {
    return this.reportService.getFeedbackProgress(sessionId, userId);
  }

  enqueueIfAllFeedbacksReady(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
    language?: string,
  ): Promise<void> {
    return this.reportService.enqueueIfAllFeedbacksReady(
      sessionId,
      sessionType,
      contextPack,
      language,
    );
  }

  getReport(
    sessionId: string,
    userId: string,
    canAccessHistory = true,
  ): Promise<ReportResponseDto> {
    return this.reportService.getReport(sessionId, userId, canAccessHistory);
  }

  async recordSkippedQuestion(params: {
    sessionId: string;
    questionId: string;
    sessionType?: string;
    contextPack?: 'VN' | 'Western';
    language?: string;
  }): Promise<{ answerId: string }> {
    const question = await this.prisma.sessionQuestion.findUnique({
      where: { id: params.questionId },
      select: {
        id: true,
        sessionId: true,
        rubricCriteria: true,
        targetLevel: true,
        sessionSkillId: true,
      },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const answer = await tx.userAnswer.upsert({
        where: { questionId: params.questionId },
        create: {
          questionId: params.questionId,
          answerMode: 'text',
          answerText: '',
          skipped: true,
          feedbackGenerated: true,
        },
        update: {
          skipped: true,
          feedbackGenerated: true,
        },
      });

      if (
        this.scoringEngine &&
        question &&
        Array.isArray(question.rubricCriteria) &&
        question.rubricCriteria.length > 0
      ) {
        const skippedFeedback = this.scoringEngine.buildSkippedFeedbackData(
          question.rubricCriteria as any,
          question.targetLevel ?? 3,
        );

        await tx.aiFeedback.upsert({
          where: { userAnswerId: answer.id },
          create: {
            userAnswerId: answer.id,
            overallScore: skippedFeedback.overallScore,
            demonstratedLevel: skippedFeedback.demonstratedLevel,
            criteriaPassRate: skippedFeedback.criteriaPassRate,
            criteriaEvaluations:
              skippedFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
            strengths: skippedFeedback.strengths,
            improvements: skippedFeedback.improvements,
            modelAnswer: skippedFeedback.modelAnswer,
            keyTakeaway: skippedFeedback.keyTakeaway,
            promptVersion: 'binary-criteria-v1.0',
            isFallback: false,
          },
          update: {
            overallScore: skippedFeedback.overallScore,
            demonstratedLevel: skippedFeedback.demonstratedLevel,
            criteriaPassRate: skippedFeedback.criteriaPassRate,
            criteriaEvaluations:
              skippedFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
            strengths: skippedFeedback.strengths,
            improvements: skippedFeedback.improvements,
            modelAnswer: skippedFeedback.modelAnswer,
            keyTakeaway: skippedFeedback.keyTakeaway,
            promptVersion: 'binary-criteria-v1.0',
            isFallback: false,
          },
        });

        await this.scoringEngine.aggregateSessionSkillScores(params.sessionId, tx);
      }

      return { answerId: answer.id };
    });

    if (params.sessionType && params.contextPack) {
      await Promise.resolve(
        this.reportService.enqueueIfAllFeedbacksReady(
          params.sessionId,
          params.sessionType,
          params.contextPack,
          params.language,
        ),
      ).catch(() => {});
    }

    return result;
  }

  async recordAutoSkippedQuestions(params: {
    sessionId: string;
    questionIds: string[];
    sessionType?: string;
    contextPack?: 'VN' | 'Western';
    language?: string;
  }): Promise<void> {
    if (!params.questionIds || params.questionIds.length === 0) return;

    const questions = await this.prisma.sessionQuestion.findMany({
      where: { id: { in: params.questionIds } },
      select: {
        id: true,
        sessionId: true,
        rubricCriteria: true,
        targetLevel: true,
        sessionSkillId: true,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const question of questions) {
        const answer = await tx.userAnswer.upsert({
          where: { questionId: question.id },
          create: {
            questionId: question.id,
            answerMode: 'text',
            answerText: '',
            skipped: true,
            feedbackGenerated: true,
          },
          update: {
            skipped: true,
            feedbackGenerated: true,
          },
        });

        if (
          this.scoringEngine &&
          Array.isArray(question.rubricCriteria) &&
          question.rubricCriteria.length > 0
        ) {
          const skippedFeedback = this.scoringEngine.buildSkippedFeedbackData(
            question.rubricCriteria as any,
            question.targetLevel ?? 3,
          );

          await tx.aiFeedback.upsert({
            where: { userAnswerId: answer.id },
            create: {
              userAnswerId: answer.id,
              overallScore: skippedFeedback.overallScore,
              demonstratedLevel: skippedFeedback.demonstratedLevel,
              criteriaPassRate: skippedFeedback.criteriaPassRate,
              criteriaEvaluations:
                skippedFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
              strengths: skippedFeedback.strengths,
              improvements: skippedFeedback.improvements,
              modelAnswer: skippedFeedback.modelAnswer,
              keyTakeaway: skippedFeedback.keyTakeaway,
              promptVersion: 'binary-criteria-v1.0',
              isFallback: false,
            },
            update: {
              overallScore: skippedFeedback.overallScore,
              demonstratedLevel: skippedFeedback.demonstratedLevel,
              criteriaPassRate: skippedFeedback.criteriaPassRate,
              criteriaEvaluations:
                skippedFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
              strengths: skippedFeedback.strengths,
              improvements: skippedFeedback.improvements,
              modelAnswer: skippedFeedback.modelAnswer,
              keyTakeaway: skippedFeedback.keyTakeaway,
              promptVersion: 'binary-criteria-v1.0',
              isFallback: false,
            },
          });
        }
      }

      if (this.scoringEngine) {
        await this.scoringEngine.aggregateSessionSkillScores(params.sessionId, tx);
      }
    });
  }
}

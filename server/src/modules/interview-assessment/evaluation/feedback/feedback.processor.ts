// BullMQ adapter for the Assessment feedback workflow.
import { Logger, Optional } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { ContextPackService } from '../context-pack.service';
import { ReportService } from '../../report/report.service';
import {
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '@core/common/constants/queue.constants';
import { SURGICAL_FEEDBACK_PROMPT_CONFIG } from '@infra/ai/prompts/surgical-feedback-v1.5';
import type { SessionType } from '@infra/ai/pipelines/interview-pipeline.interface';
import {
  describeAIError,
  isAIQuotaExceeded,
  isAIFallbackEligible,
} from '@infra/ai/ai-error.utils';
import { getFallbackFeedbackMessage } from '../feedback-fallback';
import type { OutputLanguage } from '@infra/ai/output-language';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { sanitizeFeedbackSegments } from '../feedback-segment-sanitizer';
import { PipelineStrategyFactory } from '@infra/ai/pipelines/pipeline-strategy.factory';

import { BinaryCriteriaEvaluatorService } from '../binary-criteria-evaluator.service';
import { ScoringEngineService } from '../scoring-engine.service';

interface FeedbackJobDto {
  sessionId: string;
  turnId: string;
  answerId: string;
  questionId?: string;
  questionText: string;
  questionCategory?: 'behavioral' | 'technical';
  competencyDomains: string[];
  answerText: string;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
  language?: OutputLanguage;
}

const REPORT_READINESS_LOCAL_ATTEMPTS = 2;
const DEFAULT_FEEDBACK_WORKER_CONCURRENCY = 2;

function parseFeedbackWorkerConcurrency(): number {
  const raw = process.env.FEEDBACK_WORKER_CONCURRENCY;
  const parsed = raw === undefined ? NaN : Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_FEEDBACK_WORKER_CONCURRENCY;
  }
  return parsed;
}

@Processor(FEEDBACK_QUEUE, { concurrency: parseFeedbackWorkerConcurrency() })
export class FeedbackProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedbackProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly pipelines: PipelineStrategyFactory,
    private readonly reportService: ReportService,
    @Optional()
    private readonly binaryCriteriaEvaluator?: BinaryCriteriaEvaluatorService,
    @Optional()
    private readonly scoringEngine?: ScoringEngineService,
  ) {
    super();
  }

  async process(job: Job<FeedbackJobDto>): Promise<void> {
    const {
      sessionId,
      answerId,
      questionId,
      questionText,
      questionCategory,
      competencyDomains,
      answerText,
      contextPack,
      sessionType,
    } = job.data;
    const language = resolveOutputLanguage(job.data.language);

    let hasAnnotations = false;

    try {
      // 1. Kiểm tra xem câu hỏi có rubricCriteria của Hybrid Engine (Phase 4 & 5) hay không
      const question =
        questionId && this.prisma.sessionQuestion?.findUnique
          ? await this.prisma.sessionQuestion.findUnique({
              where: { id: questionId },
              select: {
                id: true,
                rubricCriteria: true,
                sfiaSkillCode: true,
                targetLevel: true,
                sessionSkillId: true,
              },
            })
          : this.prisma.sessionQuestion?.findFirst
            ? await this.prisma.sessionQuestion.findFirst({
                where: { userAnswers: { some: { id: answerId } } },
                select: {
                  id: true,
                  rubricCriteria: true,
                  sfiaSkillCode: true,
                  targetLevel: true,
                  sessionSkillId: true,
                },
              })
            : null;

      const hasRubricCriteria =
        Boolean(this.binaryCriteriaEvaluator) &&
        Boolean(this.scoringEngine) &&
        Array.isArray(question?.rubricCriteria) &&
        (question.rubricCriteria as unknown[]).length > 0;

      if (hasRubricCriteria && this.binaryCriteriaEvaluator && this.scoringEngine) {
        // === NHÁNH MỚI: ĐÁNH GIÁ NHỊ PHÂN VÀ TÍNH ĐIỂM TẤT ĐỊNH (PHASE 5) ===
        const criteriaList = question.rubricCriteria as any[];
        const binaryFeedback = await this.binaryCriteriaEvaluator.evaluate({
          questionText,
          answerText,
          rubricCriteria: criteriaList,
          sessionType,
          language,
          sfiaSkillCode: question.sfiaSkillCode ?? undefined,
          targetLevel: question.targetLevel ?? undefined,
        });

        const scoring = this.scoringEngine.calculateQuestionScore(
          binaryFeedback.criteriaEvaluations,
          criteriaList,
        );

        const demonstratedLevel = this.scoringEngine.inferDemonstratedLevel(
          question.targetLevel ?? 3,
          scoring.corePassRate,
          scoring.seniorityPassRate,
        );

        const dimensionScoresFallback = [
          {
            id: 'core',
            name: 'Core Competency',
            score: Math.round(scoring.corePassRate * 100),
            weight: 0.5,
          },
          {
            id: 'seniority',
            name: 'Seniority & Ownership',
            score: Math.round(scoring.seniorityPassRate * 100),
            weight: 0.5,
          },
        ];

        await this.prisma.$transaction(async (tx) => {
          const aiFeedback = await tx.aiFeedback.upsert({
            where: { userAnswerId: answerId },
            create: {
              userAnswerId: answerId,
              overallScore: scoring.questionScore,
              demonstratedLevel,
              criteriaPassRate: scoring.criteriaPassRate,
              criteriaEvaluations:
                binaryFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
              strengths: binaryFeedback.strengths,
              improvements: binaryFeedback.improvements,
              modelAnswer: binaryFeedback.modelAnswer,
              keyTakeaway: binaryFeedback.keyTakeaway,
              promptVersion: binaryFeedback.promptVersion,
              isFallback: binaryFeedback.isFallback,
              dimensionScores:
                dimensionScoresFallback as unknown as Prisma.InputJsonValue,
            },
            update: {
              overallScore: scoring.questionScore,
              demonstratedLevel,
              criteriaPassRate: scoring.criteriaPassRate,
              criteriaEvaluations:
                binaryFeedback.criteriaEvaluations as unknown as Prisma.InputJsonValue,
              strengths: binaryFeedback.strengths,
              improvements: binaryFeedback.improvements,
              modelAnswer: binaryFeedback.modelAnswer,
              keyTakeaway: binaryFeedback.keyTakeaway,
              promptVersion: binaryFeedback.promptVersion,
              isFallback: binaryFeedback.isFallback,
              dimensionScores:
                dimensionScoresFallback as unknown as Prisma.InputJsonValue,
            },
          });

          await tx.annotatedSegment.deleteMany({
            where: { aiFeedbackId: aiFeedback.id },
          });

          if (binaryFeedback.annotatedSegments.length > 0) {
            await tx.annotatedSegment.createMany({
              data: binaryFeedback.annotatedSegments.map((seg) => ({
                aiFeedbackId: aiFeedback.id,
                segmentText: seg.segmentText,
                startIndex: seg.startIndex,
                endIndex: seg.endIndex,
                highlightLevel: seg.highlightLevel,
                annotation: seg.annotation,
                suggestion: seg.suggestion ?? null,
                improvedVersion: seg.improvedVersion ?? null,
              })),
            });
          }

          await tx.userAnswer.update({
            where: { id: answerId },
            data: { feedbackGenerated: true },
          });

          // Tự động tổng hợp điểm và level cho session_skills
          await this.scoringEngine!.aggregateSessionSkillScores(sessionId, tx);
        });

        hasAnnotations = binaryFeedback.annotatedSegments.length > 0;
      } else {
        // === NHÁNH LEGACY: ĐÁNH GIÁ PHIÊN CŨ KHÔNG CÓ RUBRIC CRITERIA ===
        const feedback = await this.pipelines
          .getStrategy(sessionType)
          .evaluateAnswer({
            sessionType,
            questionId,
            questionText,
            questionCategory,
            competencyDomains,
            answerText,
            contextPackConfig:
              await this.contextPackService.getContextPack(contextPack),
            language,
          });
        const sanitizedSegments = sanitizeFeedbackSegments(
          answerText,
          feedback.annotatedSegments,
        );
        if (sanitizedSegments.issues.length > 0) {
          this.logger.warn(
            `FeedbackProcessor removed invalid annotated segments for session ${sessionId} answer ${answerId}: ` +
              `removed=${sanitizedSegments.issues.length}`,
          );
        }

        await this.prisma.$transaction(async (tx) => {
          const aiFeedback = await tx.aiFeedback.upsert({
            where: { userAnswerId: answerId },
            create: {
              userAnswerId: answerId,
              overallScore: feedback.overallScore,
              modelAnswer: feedback.modelAnswer,
              keyTakeaway: feedback.keyTakeaway,
              promptVersion: feedback.promptVersion,
              isFallback: false,
              dimensionScores:
                feedback.appliedDimensions as unknown as Prisma.InputJsonValue,
            },
            update: {
              overallScore: feedback.overallScore,
              modelAnswer: feedback.modelAnswer,
              keyTakeaway: feedback.keyTakeaway,
              promptVersion: feedback.promptVersion,
              isFallback: false,
              dimensionScores:
                feedback.appliedDimensions as unknown as Prisma.InputJsonValue,
            },
          });

          await tx.annotatedSegment.deleteMany({
            where: { aiFeedbackId: aiFeedback.id },
          });
          if (sanitizedSegments.segments.length > 0) {
            await tx.annotatedSegment.createMany({
              data: sanitizedSegments.segments.map((seg) => ({
                aiFeedbackId: aiFeedback.id,
                segmentText: seg.segmentText,
                startIndex: seg.startIndex,
                endIndex: seg.endIndex,
                highlightLevel: seg.highlightLevel,
                annotation: seg.annotation,
                suggestion: seg.suggestion ?? null,
                improvedVersion: seg.improvedVersion ?? null,
              })),
            });
          }

          await tx.userAnswer.update({
            where: { id: answerId },
            data: { feedbackGenerated: true },
          });

          if (this.scoringEngine) {
            await this.scoringEngine.aggregateSessionSkillScores(sessionId, tx);
          }
        });

        hasAnnotations = sanitizedSegments.segments.length > 0;
      }
    } catch (error: unknown) {
      const isQuotaError = isAIQuotaExceeded(error);
      const totalAttempts = job.opts.attempts ?? FEEDBACK_JOB_ATTEMPTS;
      const isLastAttempt = job.attemptsMade >= totalAttempts - 1;

      if (!isLastAttempt && !isAIFallbackEligible(error)) {
        this.logger.warn(
          `FeedbackProcessor attempt ${job.attemptsMade + 1}/${totalAttempts} failed for answer ${answerId}, retrying`,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }

      if (isQuotaError) {
        this.logger.warn(
          `Using fallback feedback for session ${sessionId} answer ${answerId}: AI provider quota exhausted`,
        );
      } else if (isAIFallbackEligible(error)) {
        this.logger.warn(
          `Using fallback feedback for session ${sessionId} answer ${answerId}: ${describeAIError(error)}`,
        );
      } else {
        this.logger.error(
          `FeedbackProcessor failed after ${totalAttempts} attempts for session ${sessionId} answer ${answerId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      try {
        hasAnnotations = await this.prisma.$transaction(async (tx) => {
          const existingFeedback = await tx.aiFeedback.findUnique({
            where: { userAnswerId: answerId },
            include: { _count: { select: { annotatedSegments: true } } },
          });
          if (existingFeedback) {
            await tx.userAnswer.update({
              where: { id: answerId },
              data: { feedbackGenerated: true },
            });
            return existingFeedback._count.annotatedSegments > 0;
          }

          // If the UserAnswer row was deleted or never persisted, skip the
          // foreign-key-constrained upsert to avoid a Prisma constraint error.
          const answerExists = await tx.userAnswer.findUnique({
            where: { id: answerId },
            select: { id: true },
          });
          if (!answerExists) {
            this.logger.warn(
              `FeedbackProcessor fallback skipped for answer ${answerId}: UserAnswer not found`,
            );
            return false;
          }

          await tx.aiFeedback.upsert({
            where: { userAnswerId: answerId },
            create: {
              userAnswerId: answerId,
              overallScore: 0,
              modelAnswer: '',
              keyTakeaway: getFallbackFeedbackMessage(language),
              promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version,
              isFallback: true,
            },
            update: {},
          });
          await tx.userAnswer.update({
            where: { id: answerId },
            data: { feedbackGenerated: true },
          });
          return false;
        });
      } catch (fallbackError: unknown) {
        this.logger.error(
          `FeedbackProcessor fallback insert failed for answer ${answerId}`,
          fallbackError instanceof Error
            ? fallbackError.stack
            : String(fallbackError),
        );
        throw fallbackError;
      }
    }

    await this.emitFeedbackReady(sessionId, answerId, hasAnnotations);
    await this.emitFeedbackProgress(sessionId);
    await this.enqueueReportWhenReady(
      sessionId,
      sessionType,
      contextPack,
      language,
    );
  }

  private async emitFeedbackReady(
    sessionId: string,
    answerId: string,
    hasAnnotations: boolean,
  ): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'turn.feedback_ready', {
        answerId,
        hasAnnotations,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Unable to emit feedback_ready for answer ${answerId}`,
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  private async emitFeedbackProgress(sessionId: string): Promise<void> {
    try {
      const progress = await this.reportService.getFeedbackProgress(sessionId);
      await this.sseService.emit(
        `sse:session:${sessionId}`,
        'session.feedback_progress',
        progress,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Unable to emit feedback_progress for session ${sessionId}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async enqueueReportWhenReady(
    sessionId: string,
    sessionType: SessionType,
    contextPack: 'VN' | 'Western',
    language: OutputLanguage,
  ): Promise<void> {
    let lastError: unknown;
    for (
      let attempt = 1;
      attempt <= REPORT_READINESS_LOCAL_ATTEMPTS;
      attempt++
    ) {
      try {
        await this.reportService.enqueueIfAllFeedbacksReady(
          sessionId,
          sessionType,
          contextPack,
          language,
        );
        return;
      } catch (error: unknown) {
        lastError = error;
        this.logger.warn(
          `Failed to check report readiness for session ${sessionId} (attempt ${attempt}/${REPORT_READINESS_LOCAL_ATTEMPTS})`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    throw lastError;
  }
}

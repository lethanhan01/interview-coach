import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import {
  ReportResponseDto,
  TranscriptItemDto,
  AnnotatedSegmentDto,
  BinaryCriterionResultDto,
} from './dto/report-response.dto';
import { FeedbackProgressDto } from './dto/feedback-progress.dto';
import {
  getFallbackActionPlan,
  getFallbackReportSummary,
} from '@infra/ai/fallback-content';
import { sanitizeFeedbackSegments } from '../evaluation/feedback-segment-sanitizer';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function findLatestReport<T extends { reportType: string; version: number }>(
  reports: T[],
  reportType: string,
): T | undefined {
  return reports
    .filter((report) => report.reportType === reportType)
    .sort((a, b) => b.version - a.version)[0];
}

function toSkippedModelAnswerMap(value: unknown): Map<string, string> {
  const answers = toRecord(value).answers;
  if (!Array.isArray(answers)) return new Map();

  return new Map(
    answers.flatMap((answer) => {
      const item = toRecord(answer);
      return typeof item.answerId === 'string' &&
        typeof item.modelAnswer === 'string'
        ? [[item.answerId, item.modelAnswer] as const]
        : [];
    }),
  );
}

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: WorkflowDispatcher,
  ) {}

  async getReport(
    sessionId: string,
    userId: string,
    canAccessHistory = true,
  ): Promise<ReportResponseDto> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        sessionReports: true,
        savedJobDescription: { select: { userId: true } },
      },
    });

    if (!session) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (session.savedJobDescription.userId !== userId) {
      throw new InterviewAIException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
    if (!canAccessHistory) {
      throw new InterviewAIException(
        ErrorCode.EMAIL_NOT_VERIFIED,
        HttpStatus.FORBIDDEN,
        'Hãy xác thực email để xem lịch sử và báo cáo phỏng vấn.',
      );
    }

    const unifiedReport = findLatestReport(
      session.sessionReports,
      'session_competency_evaluation',
    );
    const executiveSummaryReport = findLatestReport(
      session.sessionReports,
      'executive_summary',
    );
    if (!executiveSummaryReport && !unifiedReport) {
      throw new InterviewAIException(
        ErrorCode.REPORT_NOT_READY,
        HttpStatus.ACCEPTED,
      );
    }

    const questions = await this.prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
      include: {
        userAnswers: {
          include: {
            aiFeedback: {
              include: { annotatedSegments: true },
            },
          },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const transcript: TranscriptItemDto[] = questions.map((q) => {
      const answer = q.userAnswers[0];
      const feedback = answer?.aiFeedback;
      const answerText = answer?.answerText ?? '';

      const rawSegments: AnnotatedSegmentDto[] =
        (feedback?.annotatedSegments ?? []).map((s) => ({
          id: s.id,
          segmentText: s.segmentText,
          startIndex: s.startIndex,
          endIndex: s.endIndex,
          highlightLevel: s.highlightLevel,
          annotation: s.annotation,
          suggestion: s.suggestion ?? undefined,
        }));
      const segments = sanitizeFeedbackSegments(
        answerText,
        rawSegments,
      ).segments;

      return {
        answerId: answer?.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        answerText,
        skipped: answer?.skipped ?? false,
        overallScore:
          !feedback || feedback.isFallback ? null : feedback.overallScore,
        modelAnswer: answer?.skipped
          ? (feedback?.modelAnswer ?? '')
          : (feedback?.modelAnswer ?? ''),
        keyTakeaway:
          feedback?.keyTakeaway ??
          (answer?.skipped
            ? 'Hãy luôn cố gắng đưa ra phản hồi kể cả khi chưa nắm chắc giải pháp hoàn chỉnh.'
            : ''),
        isFallback: feedback?.isFallback ?? false,
        segments: answer?.skipped ? [] : segments,
        criteriaEvaluations:
          (feedback?.criteriaEvaluations as unknown as BinaryCriterionResultDto[]) ??
          undefined,
        demonstratedLevel: feedback?.demonstratedLevel ?? null,
        criteriaPassRate: feedback?.criteriaPassRate
          ? Number(feedback.criteriaPassRate)
          : null,
        strengths: feedback?.strengths ?? [],
        improvements: feedback?.improvements ?? [],
      };
    });

    const unifiedContent = toRecord(unifiedReport?.contentJson);
    const unifiedSummary = toRecord(unifiedContent.summary);
    const rawBreakdown =
      unifiedContent.skillsBreakdown !== undefined
        ? unifiedContent.skillsBreakdown
        : unifiedContent.skills_breakdown;
    const rawActionPlan =
      unifiedContent.actionPlan !== undefined
        ? unifiedContent.actionPlan
        : unifiedContent.action_plan;

    const storedActionPlan =
      rawActionPlan !== undefined
        ? { actionPlan: rawActionPlan }
        : toRecord(findLatestReport(session.sessionReports, 'action_plan')?.contentJson);

    const storedExecutiveSummary = executiveSummaryReport
      ? toRecord(executiveSummaryReport.contentJson)
      : {
          ...unifiedSummary,
          summary:
            unifiedSummary.executiveSummary ?? unifiedSummary.executive_summary,
          skillsBreakdown: rawBreakdown,
        };

    const skippedModelAnswers = toSkippedModelAnswerMap(
      findLatestReport(session.sessionReports, 'skipped_answers')?.contentJson,
    );

    const transcriptWithSkippedAnswers = transcript.map((item) =>
      item.skipped
        ? {
            ...item,
            modelAnswer:
              (item.answerId
                ? skippedModelAnswers.get(item.answerId)
                : undefined) ?? item.modelAnswer,
          }
        : item,
    );
    const hasEvaluatedFeedback = transcriptWithSkippedAnswers.some(
      (item) => !item.isFallback && item.overallScore !== null,
    );
    const hasSomeFallback = transcriptWithSkippedAnswers.some(
      (item) => item.isFallback,
    );
    const allFeedbackIsFallback = hasSomeFallback && !hasEvaluatedFeedback;
    let reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable';
    if (
      transcriptWithSkippedAnswers.length > 0 &&
      !hasEvaluatedFeedback &&
      !hasSomeFallback
    ) {
      reportQuality = 'not_scorable';
    } else if (hasSomeFallback && hasEvaluatedFeedback) {
      reportQuality = 'partial';
    } else if (hasSomeFallback) {
      reportQuality = 'unavailable';
    } else {
      reportQuality = 'full';
    }

    return {
      sessionId,
      reportQuality,
      overallScore: allFeedbackIsFallback ? null : session.overallScore,
      recommendationStatus:
        session.recommendationStatus ??
        (unifiedSummary.recommendationStatus as string | undefined),
      skillsBreakdown:
        rawBreakdown !== undefined
          ? (rawBreakdown as any)
          : undefined,
      executiveSummary: allFeedbackIsFallback
        ? {
            ...storedExecutiveSummary,
            overallScore: null,
            evaluatedTurns: 0,
            fallbackTurns: transcriptWithSkippedAnswers.filter(
              (item) => item.isFallback,
            ).length,
            summary: getFallbackReportSummary(session.language),
          }
        : storedExecutiveSummary,
      competencyHeatmap:
        rawBreakdown !== undefined
          ? { skillsBreakdown: rawBreakdown }
          : toRecord(
              findLatestReport(session.sessionReports, 'competency_heatmap')
                ?.contentJson,
            ),
      actionPlan:
        allFeedbackIsFallback && Object.keys(storedActionPlan).length === 0
          ? getFallbackActionPlan(session.language)
          : storedActionPlan,
      transcript: transcriptWithSkippedAnswers,
    };
  }

  async getFeedbackProgress(
    sessionId: string,
    userId?: string,
  ): Promise<FeedbackProgressDto> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        savedJobDescription: {
          select: { userId: true },
        },
        sessionReports: {
          where: {
            reportType: {
              in: ['executive_summary', 'session_competency_evaluation'],
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!session) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (userId && session.savedJobDescription.userId !== userId) {
      throw new InterviewAIException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const [
      totalQuestions,
      answeredQuestions,
      skippedQuestions,
      feedbackCompleted,
    ] = await Promise.all([
      this.prisma.sessionQuestion.count({ where: { sessionId } }),
      this.prisma.userAnswer.count({ where: { question: { sessionId } } }),
      this.prisma.userAnswer.count({
        where: { question: { sessionId }, skipped: true },
      }),
      this.prisma.userAnswer.count({
        where: {
          question: { sessionId },
          skipped: false,
          feedbackGenerated: true,
        },
      }),
    ]);

    const feedbackRequired = Math.max(0, answeredQuestions - skippedQuestions);
    const feedbackPending = Math.max(0, feedbackRequired - feedbackCompleted);

    return {
      sessionId,
      status: session.status,
      totalQuestions,
      answeredQuestions,
      skippedQuestions,
      feedbackRequired,
      feedbackCompleted,
      feedbackPending,
      reportReady:
        session.status === 'completed' && session.sessionReports.length > 0,
    };
  }

  async enqueueReport(sessionId: string): Promise<void> {
    await this.dispatcher.dispatchFor('report-generation', sessionId);
  }

  async enqueueIfAllFeedbacksReady(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
    language?: string,
  ): Promise<void> {
    return this.evaluateReportReadiness(
      sessionId,
      sessionType,
      contextPack,
      language,
    );
  }

  private async evaluateReportReadiness(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
    language?: string,
  ): Promise<void> {
    void sessionType;
    void contextPack;
    void language;
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });

    if (session?.status !== 'completing') return;

    const [totalAnswers, pendingFeedbacks] = await Promise.all([
      this.prisma.userAnswer.count({ where: { question: { sessionId } } }),
      this.prisma.userAnswer.count({
        where: {
          question: { sessionId },
          skipped: false,
          feedbackGenerated: false,
        },
      }),
    ]);

    if (totalAnswers === 0 || pendingFeedbacks > 0) return;

    await this.enqueueReport(sessionId);
  }
}

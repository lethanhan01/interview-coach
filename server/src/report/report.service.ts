import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import {
  REPORT_JOB_ATTEMPTS,
  REPORT_JOB_RETRY_DELAY_MS,
} from '../common/constants/queue.constants';
import {
  ReportResponseDto,
  TranscriptItemDto,
  AnnotatedSegmentDto,
} from './dto/report-response.dto';
import { FALLBACK_ACTION_PLAN } from '../ai/fallback-content';

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue,
  ) {}

  async getReport(
    sessionId: string,
    userId: string,
  ): Promise<ReportResponseDto> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (session.userId !== userId) {
      throw new InterviewAIException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    if (!session.executiveSummaryJson) {
      throw new InterviewAIException(
        ErrorCode.REPORT_NOT_READY,
        HttpStatus.NOT_FOUND,
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

      const segments: AnnotatedSegmentDto[] =
        feedback?.annotatedSegments.map((s) => ({
          id: s.id,
          segmentText: s.segmentText,
          startIndex: s.startIndex,
          endIndex: s.endIndex,
          highlightLevel: s.highlightLevel,
          annotation: s.annotation,
          suggestion: s.suggestion ?? undefined,
        })) ?? [];

      return {
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        answerText: answer?.answerText ?? '',
        overallScore:
          feedback && !feedback.isFallback ? feedback.overallScore : null,
        modelAnswer: feedback?.modelAnswer ?? '',
        keyTakeaway: feedback?.keyTakeaway ?? '',
        isFallback: feedback?.isFallback ?? false,
        segments,
      };
    });

    const hasEvaluatedFeedback = transcript.some(
      (item) => !item.isFallback && item.overallScore !== null,
    );
    const allFeedbackIsFallback =
      transcript.some((item) => item.isFallback) && !hasEvaluatedFeedback;
    const storedActionPlan = toRecord(session.actionPlanJson);
    const storedExecutiveSummary = toRecord(session.executiveSummaryJson);

    const hasSomeFallback = transcript.some((item) => item.isFallback);
    let reportQuality: 'full' | 'partial' | 'unavailable';
    if (hasSomeFallback && hasEvaluatedFeedback) {
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
      executiveSummary: allFeedbackIsFallback
        ? {
            ...storedExecutiveSummary,
            overallScore: null,
            evaluatedTurns: 0,
            fallbackTurns: transcript.length,
            summary:
              'AI scoring was unavailable. Your answers were saved and can be evaluated again after the AI service is restored.',
          }
        : storedExecutiveSummary,
      competencyHeatmap: toRecord(session.competencyHeatmapJson),
      actionPlan:
        allFeedbackIsFallback && Object.keys(storedActionPlan).length === 0
          ? FALLBACK_ACTION_PLAN
          : storedActionPlan,
      transcript,
    };
  }

  async enqueueReport(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
  ): Promise<void> {
    const answers = await this.prisma.userAnswer.findMany({
      where: { sessionId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    const turnIds = answers.map((answer) => answer.id);
    if (turnIds.length === 0) {
      throw new InterviewAIException(
        ErrorCode.SESSION_INCOMPLETE,
        HttpStatus.CONFLICT,
        'Không thể tạo báo cáo khi chưa có câu trả lời.',
      );
    }

    const jobId = `report-${sessionId}`;
    const existingJob = await this.reportQueue.getJob(jobId);
    if (existingJob) {
      if ((await existingJob.getState()) === 'failed') {
        await existingJob.retry();
      }
      return;
    }

    await this.reportQueue.add(
      'comprehensive-report',
      { sessionId, sessionType, contextPack, turnIds },
      {
        jobId,
        attempts: REPORT_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: REPORT_JOB_RETRY_DELAY_MS },
      },
    );
  }

  async enqueueIfAllFeedbacksReady(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
  ): Promise<void> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });

    if (session?.status !== 'completing') return;

    const [totalAnswers, completedFeedbacks] = await Promise.all([
      this.prisma.userAnswer.count({ where: { sessionId } }),
      this.prisma.userAnswer.count({
        where: { sessionId, feedbackGenerated: true },
      }),
    ]);

    if (totalAnswers === 0 || completedFeedbacks < totalAnswers) return;

    await this.enqueueReport(sessionId, sessionType, contextPack);
  }
}

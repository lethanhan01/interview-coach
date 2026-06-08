import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import {
  ReportResponseDto,
  TranscriptItemDto,
  AnnotatedSegmentDto,
} from './dto/report-response.dto';

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
        overallScore: feedback?.overallScore ?? 0,
        modelAnswer: feedback?.modelAnswer ?? '',
        keyTakeaway: feedback?.keyTakeaway ?? '',
        segments,
      };
    });

    return {
      sessionId,
      overallScore: session.overallScore ?? 0,
      executiveSummary: toRecord(session.executiveSummaryJson),
      competencyHeatmap: toRecord(session.competencyHeatmapJson),
      actionPlan: toRecord(session.actionPlanJson),
      transcript,
    };
  }

  async enqueueReport(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
    turnIds: string[],
  ): Promise<void> {
    await this.reportQueue.add(
      'comprehensive-report',
      { sessionId, sessionType, contextPack, turnIds },
      { attempts: 2, backoff: { type: 'fixed', delay: 2000 } },
    );
  }
}

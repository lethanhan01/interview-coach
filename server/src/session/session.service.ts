import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InterviewSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceDataService } from '../prisma/reference-data.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import {
  QUESTION_GEN_QUEUE,
  QUESTION_GEN_JOB_ATTEMPTS,
  REPORT_QUEUE,
} from '../common/constants/queue.constants';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceData: ReferenceDataService,
    @InjectQueue(QUESTION_GEN_QUEUE) private readonly queue: Queue,
    @InjectQueue(REPORT_QUEUE) private readonly reportQueue: Queue,
  ) {}

  async create(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<InterviewSession> {
    const count = await this.prisma.interviewSession.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (count >= 10) {
      throw new InterviewAIException(
        ErrorCode.SESSION_LIMIT_EXCEEDED,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      await this.referenceData.ensureContextPack(dto.contextPack);
    } catch {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Không thể khởi tạo cấu hình phỏng vấn. Vui lòng thử lại sau.',
      );
    }

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        jobDescription: dto.jobDescription,
        jdSource: 'paste',
        sessionType: dto.sessionType,
        numQuestions: dto.numQuestions ?? 5,
        contextPackId: dto.contextPack,
        status: 'generating',
      },
    });

    try {
      await this.queue.add(
        'question-generation',
        {
          sessionId: session.id,
          sessionType: dto.sessionType,
          jobDescriptionText: dto.jobDescription,
          targetRoles: dto.targetRoles ?? [],
          contextPack: dto.contextPack,
          totalQuestions: session.numQuestions,
        },
        {
          attempts: QUESTION_GEN_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 2000 },
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Unable to enqueue question generation for session ${session.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.interviewSession
        .update({ where: { id: session.id }, data: { status: 'error' } })
        .catch(() => {});
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ tạo câu hỏi tạm thời không khả dụng. Vui lòng thử lại sau.',
      );
    }

    return session;
  }

  async findById(sessionId: string, userId: string): Promise<InterviewSession> {
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

    return session;
  }

  async findAll(userId: string): Promise<InterviewSession[]> {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findQuestions(
    sessionId: string,
    userId: string,
  ): Promise<{ id: string; content: string; orderIndex: number }[]> {
    const session = await this.findById(sessionId, userId);
    const questions = await this.prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
    });

    if (
      questions.length > 0 &&
      ['generating', 'ready'].includes(session.status)
    ) {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'active' },
      });
    }

    return questions.map((q) => ({
      id: q.id,
      content: q.questionText,
      orderIndex: q.orderIndex,
    }));
  }

  async updateStatus(
    sessionId: string,
    userId: string,
    status: 'active' | 'completed',
  ): Promise<InterviewSession> {
    const session = await this.findById(sessionId, userId);

    const updated = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });

    if (status === 'completed') {
      const answers = await this.prisma.userAnswer.findMany({
        where: { sessionId },
        select: { id: true },
      });
      const turnIds = answers.map((a) => a.id);

      await this.reportQueue.add(
        'comprehensive-report',
        {
          sessionId,
          sessionType: session.sessionType,
          contextPack: session.contextPackId as 'VN' | 'Western',
          turnIds,
        },
        { attempts: 2, backoff: { type: 'fixed', delay: 2000 } },
      );
    }

    return updated;
  }
}

import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InterviewSession } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(
    private readonly prisma: PrismaService,
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
      await this.prisma.interviewSession
        .update({ where: { id: session.id }, data: { status: 'error' } })
        .catch(() => {});
      throw error;
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
    await this.findById(sessionId, userId);
    const questions = await this.prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
    });
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

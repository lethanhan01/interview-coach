import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InterviewSession } from '@prisma/client';
import { RubricCatalogService } from '../assessment/rubric/rubric-catalog.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import {
  QUESTION_GEN_JOB_ATTEMPTS,
  QUESTION_GEN_QUEUE,
} from '../common/constants/queue.constants';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { resolveOutputLanguage } from '../ai/output-language';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class CreateInterviewSession {
  private readonly logger = new Logger(CreateInterviewSession.name);
  private readonly sessionCreationLimitPer24h: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rubricCatalog: RubricCatalogService,
    @InjectQueue(QUESTION_GEN_QUEUE) private readonly queue: Queue,
    config: ConfigService,
  ) {
    const configuredLimit = Number(
      config.get<number | string>('SESSION_CREATION_LIMIT_PER_24H') ?? 10,
    );
    this.sessionCreationLimitPer24h = Number.isFinite(configuredLimit)
      ? Math.max(0, Math.trunc(configuredLimit))
      : 10;
  }

  async execute(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<InterviewSession> {
    if (this.sessionCreationLimitPer24h > 0) {
      const count = await this.prisma.interviewSession.count({
        where: {
          savedJobDescription: { userId },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          status: { notIn: ['error', 'canceled'] },
        },
      });
      if (count >= this.sessionCreationLimitPer24h) {
        throw new InterviewAIException(
          ErrorCode.SESSION_LIMIT_EXCEEDED,
          HttpStatus.TOO_MANY_REQUESTS,
          `Bạn đã tạo ${this.sessionCreationLimitPer24h} phiên phỏng vấn trong 24 giờ qua. Hãy tiếp tục phiên cũ hoặc thử lại sau.`,
        );
      }
    }

    let rubricVersionId: string;
    try {
      rubricVersionId = await this.rubricCatalog.ensureActiveRubricVersion(
        dto.contextPack,
      );
    } catch {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Không thể khởi tạo cấu hình phỏng vấn. Vui lòng thử lại sau.',
      );
    }

    const savedJobDescriptionId = await this.resolveSavedJobDescriptionId(
      userId,
      dto.savedJobDescriptionId,
    );
    const session = await this.prisma.interviewSession.create({
      data: {
        savedJobDescriptionId,
        jobDescription: dto.jobDescription,
        sessionType: dto.sessionType,
        numQuestions: dto.numQuestions ?? 5,
        language: resolveOutputLanguage(dto.language),
        contextPackId: dto.contextPack,
        rubricVersionId,
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
          rubricVersionId,
          language: session.language,
          totalQuestions: session.numQuestions,
          durationMin: session.durationMin,
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

  private async resolveSavedJobDescriptionId(
    userId: string,
    savedJobDescriptionId: string,
  ): Promise<string> {
    const savedJobDescription = await this.prisma.savedJobDescription.findFirst(
      {
        where: { id: savedJobDescriptionId, userId, deletedAt: null },
      },
    );
    if (!savedJobDescription)
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    await this.prisma.savedJobDescription.update({
      where: { id: savedJobDescriptionId },
      data: { lastUsedAt: new Date() },
    });
    return savedJobDescriptionId;
  }
}

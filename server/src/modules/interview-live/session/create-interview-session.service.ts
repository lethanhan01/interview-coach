import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InterviewSession } from '@prisma/client';
import { AssessmentFacade } from '@modules/interview-assessment/contracts';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { CreateSessionDto } from './dto/create-session.dto';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import { SessionStrategyRegistry } from './session-strategy.registry';

@Injectable()
export class CreateInterviewSession {
  private readonly sessionCreationLimitPer24h: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly assessmentFacade: AssessmentFacade,
    private readonly workflow: WorkflowService,
    private readonly dispatcher: WorkflowDispatcher,
    private readonly strategyRegistry: SessionStrategyRegistry,
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

    const strategy = this.strategyRegistry.getStrategy(dto.sessionType);
    strategy.validateSessionConfig?.(dto);

    let rubricVersionId: string;
    try {
      rubricVersionId = await this.assessmentFacade.ensureActiveRubricVersion(
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
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.interviewSession.create({
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
      const payload = strategy.buildQuestionGenerationPayload(
        created,
        dto,
        rubricVersionId,
      );
      await this.workflow.enqueueInTransaction(tx, {
        commandType: 'question-generation',
        sessionId: created.id,
        payload,
      });
      return created;
    });

    await this.dispatcher.dispatchFor('question-generation', session.id);
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

import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InterviewSession, SavedJobDescription } from '@prisma/client';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import { CreateSessionDto } from './dto/create-session.dto';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import { SessionStrategyRegistry } from './session-strategy.registry';
import {
  type IOnetFacade,
  ONET_FACADE_TOKEN,
} from '@modules/onet/contracts';
import { inferTargetSfiaLevel } from '@modules/interview-prep/contracts';

@Injectable()
export class CreateInterviewSession {
  private readonly sessionCreationLimitPer24h: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflow: WorkflowService,
    private readonly dispatcher: WorkflowDispatcher,
    private readonly strategyRegistry: SessionStrategyRegistry,
    @Inject(ONET_FACADE_TOKEN)
    private readonly onetFacade: IOnetFacade,
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

    const savedJobDescription = await this.resolveAndEnrichSavedJobDescription(
      userId,
      dto.savedJobDescriptionId,
    );

    if (
      dto.targetSfiaLevel &&
      savedJobDescription.targetSfiaLevel !== dto.targetSfiaLevel
    ) {
      await this.prisma.savedJobDescription.update({
        where: { id: savedJobDescription.id },
        data: { targetSfiaLevel: dto.targetSfiaLevel },
      });
      savedJobDescription.targetSfiaLevel = dto.targetSfiaLevel;
    }

    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.interviewSession.create({
        data: {
          savedJobDescriptionId: savedJobDescription.id,
          jobDescription: dto.jobDescription,
          sessionType: dto.sessionType,
          numQuestions: dto.numQuestions ?? 5,
          language: resolveOutputLanguage(dto.language),
          contextPackId: dto.contextPack,
          sfiaVersion: '9.0.0',
          status: 'generating',
          onetSocCode: savedJobDescription.onetSocCode,
          targetSfiaLevel:
            dto.targetSfiaLevel ?? savedJobDescription.targetSfiaLevel,
        },
      });

      const payload = strategy.buildQuestionGenerationPayload(
        created,
        dto,
        '9.0.0',
      );

      payload.onetSocCode = created.onetSocCode;
      payload.targetSfiaLevel = created.targetSfiaLevel;
      payload.normalizedTechStack =
        (savedJobDescription.normalizedTechStack as string[]) ?? [];

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

  private async resolveAndEnrichSavedJobDescription(
    userId: string,
    savedJobDescriptionId: string,
  ): Promise<SavedJobDescription> {
    const savedJobDescription = await this.prisma.savedJobDescription.findFirst(
      {
        where: { id: savedJobDescriptionId, userId, deletedAt: null },
      },
    );
    if (!savedJobDescription) {
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (savedJobDescription.onetSocCode && savedJobDescription.targetSfiaLevel) {
      await this.prisma.savedJobDescription.update({
        where: { id: savedJobDescriptionId },
        data: { lastUsedAt: new Date() },
      });
      return savedJobDescription;
    }

    let onetSocCode = savedJobDescription.onetSocCode;
    let targetSfiaLevel = savedJobDescription.targetSfiaLevel;
    let normalizedTechStack = savedJobDescription.normalizedTechStack as
      | string[]
      | null;

    if (!onetSocCode) {
      try {
        const occupation = await this.onetFacade.findOccupationByTitle(
          savedJobDescription.jobTitle,
        );
        onetSocCode = occupation ? occupation.socCode : '15-1252.00';
      } catch {
        onetSocCode = '15-1252.00';
      }
    }

    if (!targetSfiaLevel) {
      targetSfiaLevel = inferTargetSfiaLevel(
        savedJobDescription.level,
        savedJobDescription.jobTitle,
        savedJobDescription.requirements,
      );
    }

    if (!normalizedTechStack || normalizedTechStack.length === 0) {
      const rawTech = savedJobDescription.techStack ?? [];
      try {
        const onetTools =
          await this.onetFacade.getToolsAndTechnology(onetSocCode);
        if (onetTools.length > 0) {
          const toolMap = new Map(
            onetTools.map((t) => [t.example.toLowerCase(), t.example]),
          );
          const matchedTech = new Set<string>();
          for (const item of rawTech) {
            const canonical = toolMap.get(item.toLowerCase());
            matchedTech.add(canonical || item);
          }
          if (matchedTech.size === 0) {
            onetTools
              .filter((t) => t.isHotTechnology)
              .slice(0, 5)
              .forEach((t) => matchedTech.add(t.example));
          }
          normalizedTechStack = Array.from(matchedTech);
        } else {
          normalizedTechStack = rawTech;
        }
      } catch {
        normalizedTechStack = rawTech;
      }
    }

    await this.prisma.savedJobDescription.update({
      where: { id: savedJobDescriptionId },
      data: {
        onetSocCode,
        targetSfiaLevel,
        normalizedTechStack,
        lastUsedAt: new Date(),
      },
    });

    return {
      ...savedJobDescription,
      onetSocCode,
      targetSfiaLevel,
      normalizedTechStack,
    };
  }
}

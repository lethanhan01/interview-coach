import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { PrepFacade } from '@modules/interview-prep/contracts';
import { MediaFacade } from '@modules/media/contracts';
import { WorkflowDispatcher } from '@infra/workflow/workflow-dispatcher.service';
import { WorkflowService } from '@infra/workflow/workflow.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import {
  AnswerIntakeContext,
  IAnswerIntakeHandler,
} from './answer-intake-handler.interface';

@Injectable()
export class VoiceAnswerIntakeHandler implements IAnswerIntakeHandler {
  readonly supportedMode = 'voice';

  constructor(
    private readonly prisma: PrismaService,
    private readonly prepFacade: PrepFacade,
    private readonly mediaFacade: MediaFacade,
    private readonly workflow: WorkflowService,
    private readonly dispatcher: WorkflowDispatcher,
  ) {}

  async handle(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ): Promise<TurnResponseDto> {
    const existing = await this.prisma.userAnswer.findUnique({
      where: { questionId: dto.questionId },
    });

    if (existing?.skipped) {
      return {
        answerId: existing.id,
        feedbackQueued: false,
      };
    }

    let answerId: string;

    if (existing) {
      answerId = existing.id;
      const feedbackPayload = this.buildFeedbackPayload(
        existing.id,
        existing.answerText,
        context,
      );
      await this.prisma.$transaction(async (tx) => {
        await this.workflow.enqueueInTransaction(tx, {
          commandType: 'feedback',
          aggregateId: existing.id,
          payload: feedbackPayload,
        });
      });
    } else {
      const metrics = this.mediaFacade.calculateVoiceMetrics(
        transcriptText(dto.answerText),
        dto.audioDurationSeconds ?? 0,
      );

      const created = await this.prisma.$transaction(async (tx) => {
        const answer = await tx.userAnswer.upsert({
          where: { questionId: dto.questionId },
          create: {
            questionId: dto.questionId,
            answerMode: 'voice',
            answerText: transcriptText(dto.answerText),
            skipped: false,
            audioDurationSeconds: dto.audioDurationSeconds,
            voiceMetricsJson: metrics
              ? (metrics as unknown as Prisma.InputJsonValue)
              : undefined,
          },
          update: {},
        });

        const feedbackPayload = this.buildFeedbackPayload(
          answer.id,
          answer.answerText,
          context,
        );

        await this.workflow.enqueueInTransaction(tx, {
          commandType: 'feedback',
          aggregateId: answer.id,
          payload: feedbackPayload,
        });

        return answer;
      });

      answerId = created.id;
    }

    await this.dispatcher.dispatchFor('feedback', answerId);

    return {
      answerId,
      feedbackQueued: true,
    };
  }

  private buildFeedbackPayload(
    answerId: string,
    answerText: string,
    context: AnswerIntakeContext,
  ) {
    return {
      sessionId: context.sessionId,
      turnId: answerId,
      answerId,
      questionId: context.question.id,
      questionText: context.question.questionText,
      questionCategory: context.question.questionCategory,
      competencyDomains: this.prepFacade.codesFromSessionQuestion(
        context.question,
      ),
      answerText,
      contextPack: context.session.contextPackId,
      sessionType: context.sessionType,
      language: context.session.language,
    };
  }
}

function transcriptText(raw?: string): string {
  return raw?.trim() ?? '';
}

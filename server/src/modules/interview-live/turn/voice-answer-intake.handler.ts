import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { PrepFacade } from '@modules/interview-prep/contracts';
import { MediaFacade, type TranscriptionJobDto } from '@modules/media/contracts';
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
    const transcript = dto.answerText?.trim();

    if (dto.audioFileUrl && !transcript) {
      return this.handleAudioOnly(dto, context);
    }

    return this.handleVoiceWithTranscript(dto, context);
  }

  private async handleAudioOnly(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ): Promise<TurnResponseDto> {
    const existing = await this.prisma.userAnswer.findUnique({
      where: { questionId: dto.questionId },
    });

    if (existing) {
      if (existing.transcriptionStatus === 'done') {
        return {
          answerId: existing.id,
          feedbackQueued: true,
          transcriptionPending: false,
        };
      }
      if (existing.transcriptionStatus === 'failed') {
        return {
          answerId: existing.id,
          feedbackQueued: false,
          transcriptionPending: false,
        };
      }
      await this.enqueueTranscription(existing.id, dto, context);
      return {
        answerId: existing.id,
        feedbackQueued: false,
        transcriptionPending: true,
      };
    }

    const payload = this.buildTranscriptionPayload('', dto, context);

    const created = await this.prisma.$transaction(async (tx) => {
      const answer = await tx.userAnswer.upsert({
        where: { questionId: dto.questionId },
        create: {
          questionId: dto.questionId,
          answerMode: 'voice',
          answerText: '',
          skipped: false,
          audioFileUrl: dto.audioFileUrl,
          audioDurationSeconds: dto.audioDurationSeconds,
          audioSizeBytes: dto.audioSizeBytes,
          transcriptionStatus: 'pending',
        },
        update: {},
      });

      payload.answerId = answer.id;

      await this.workflow.enqueueInTransaction(tx, {
        commandType: 'transcription',
        aggregateId: answer.id,
        payload: payload as unknown as Prisma.InputJsonValue,
      });

      return answer;
    });

    await this.dispatcher.dispatchFor('transcription', created.id);

    return {
      answerId: created.id,
      feedbackQueued: false,
      transcriptionPending: true,
    };
  }

  private async handleVoiceWithTranscript(
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
        transcriptionPending: false,
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
            audioFileUrl: dto.audioFileUrl,
            audioDurationSeconds: dto.audioDurationSeconds,
            audioSizeBytes: dto.audioSizeBytes,
            transcriptionStatus: 'done',
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
      transcriptionPending: false,
    };
  }

  private async enqueueTranscription(
    answerId: string,
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ) {
    const payload = this.buildTranscriptionPayload(answerId, dto, context);
    await this.prisma.$transaction(async (tx) => {
      await this.workflow.enqueueInTransaction(tx, {
        commandType: 'transcription',
        aggregateId: answerId,
        payload: payload as unknown as Prisma.InputJsonValue,
      });
    });
    await this.dispatcher.dispatchFor('transcription', answerId);
  }

  private buildTranscriptionPayload(
    answerId: string,
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ): TranscriptionJobDto {
    return {
      sessionId: context.sessionId,
      answerId,
      audioFileUrl: dto.audioFileUrl!,
      audioDurationSeconds: dto.audioDurationSeconds,
      audioSizeBytes: dto.audioSizeBytes,
      contextPack: context.session.contextPackId as 'VN' | 'Western',
      sessionType: context.sessionType,
      language: context.session.language as TranscriptionJobDto['language'],
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

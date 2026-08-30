import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  FEEDBACK_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
} from '../common/constants/queue.constants';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { VoiceMetricsService } from '../interview/voice-metrics.service';
import type { TranscriptionJobDto } from '../interview/transcription-job.dto';
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
    private readonly questionCriteria: QuestionCriteriaService,
    private readonly voiceMetrics: VoiceMetricsService,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(TRANSCRIPTION_QUEUE)
    private readonly transcriptionQueue: Queue,
  ) {}

  async handle(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ): Promise<TurnResponseDto> {
    const transcript = dto.answerText?.trim();

    if (dto.audioFileUrl && !transcript) {
      return this.handleAudioOnly(dto, context);
    }

    return this.handleVoiceWithTranscript(dto, context, transcript ?? '');
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

    const answer = await this.prisma.userAnswer.upsert({
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

    await this.enqueueTranscription(answer.id, dto, context);
    return {
      answerId: answer.id,
      feedbackQueued: false,
      transcriptionPending: true,
    };
  }

  private async handleVoiceWithTranscript(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
    transcript: string,
  ): Promise<TurnResponseDto> {
    let answer = await this.prisma.userAnswer.findUnique({
      where: { questionId: dto.questionId },
    });

    if (answer?.skipped) {
      return {
        answerId: answer.id,
        feedbackQueued: false,
        transcriptionPending: false,
      };
    }

    if (!answer) {
      const metrics = this.voiceMetrics.calculate(
        transcript,
        dto.audioDurationSeconds ?? 0,
      );

      answer = await this.prisma.userAnswer.upsert({
        where: { questionId: dto.questionId },
        create: {
          questionId: dto.questionId,
          answerMode: 'voice',
          answerText: transcript,
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
    }

    await this.feedbackQueue.add(
      'feedback',
      {
        sessionId: context.sessionId,
        turnId: answer.id,
        answerId: answer.id,
        questionId: context.question.id,
        questionText: context.question.questionText,
        questionCategory: context.question.questionCategory,
        competencyDomains: this.questionCriteria.codesFromSessionQuestion(
          context.question,
        ),
        answerText: answer.answerText,
        contextPack: context.session.contextPackId,
        sessionType: context.sessionType,
        language: context.session.language,
      },
      {
        jobId: `feedback-${answer.id}`,
        attempts: FEEDBACK_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      },
    );

    return {
      answerId: answer.id,
      feedbackQueued: true,
      transcriptionPending: false,
    };
  }

  private async enqueueTranscription(
    answerId: string,
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ) {
    const payload: TranscriptionJobDto = {
      sessionId: context.sessionId,
      answerId,
      audioFileUrl: dto.audioFileUrl!,
      audioDurationSeconds: dto.audioDurationSeconds,
      audioSizeBytes: dto.audioSizeBytes,
      contextPack: context.session.contextPackId as 'VN' | 'Western',
      sessionType: context.sessionType,
      language: context.session.language as TranscriptionJobDto['language'],
    };

    await this.transcriptionQueue.add('transcription', payload, {
      jobId: `transcription-${answerId}`,
      attempts: TRANSCRIPTION_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: 3000 },
    });
  }
}

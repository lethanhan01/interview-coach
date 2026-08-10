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
import { PrismaService } from '../prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { VoiceMetricsService } from '../interview/voice-metrics.service';
import type { TranscriptionJobDto } from '../interview/transcription-job.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import { TurnAnswerContext } from './turn-answer-context.service';

@Injectable()
export class SubmitTurnAnswer {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: TurnAnswerContext,
    private readonly questionCriteria: QuestionCriteriaService,
    private readonly voiceMetrics: VoiceMetricsService,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(TRANSCRIPTION_QUEUE) private readonly transcriptionQueue: Queue,
  ) {}

  async execute(sessionId: string, userId: string, dto: SubmitAnswerDto): Promise<TurnResponseDto> {
    const { session, question, sessionType } = await this.context.load(sessionId, userId, dto.questionId);
    if (dto.skipQuestion) return this.skip(dto.questionId);
    const transcript = dto.answerText?.trim();
    if (dto.answerMode === 'voice' && dto.audioFileUrl && !transcript) {
      return this.submitVoice(sessionId, dto, session, sessionType);
    }
    return this.submitText(sessionId, dto, session, question, sessionType);
  }

  private async skip(questionId: string): Promise<TurnResponseDto> {
    const existing = await this.prisma.userAnswer.findUnique({ where: { questionId } });
    if (existing) return { answerId: existing.id, feedbackQueued: !existing.skipped, transcriptionPending: existing.transcriptionStatus === 'pending' };
    const answer = await this.prisma.userAnswer.upsert({
      where: { questionId },
      create: { questionId, answerMode: 'text', answerText: '', skipped: true, feedbackGenerated: false },
      update: {},
    });
    return { answerId: answer.id, feedbackQueued: false, transcriptionPending: false };
  }

  private async submitVoice(sessionId: string, dto: SubmitAnswerDto, session: any, sessionType: any): Promise<TurnResponseDto> {
    const existing = await this.prisma.userAnswer.findUnique({ where: { questionId: dto.questionId } });
    if (existing) {
      if (existing.transcriptionStatus === 'done') return { answerId: existing.id, feedbackQueued: true, transcriptionPending: false };
      if (existing.transcriptionStatus === 'failed') return { answerId: existing.id, feedbackQueued: false, transcriptionPending: false };
      await this.enqueueTranscription(sessionId, existing.id, dto, session, sessionType);
      return { answerId: existing.id, feedbackQueued: false, transcriptionPending: true };
    }
    const answer = await this.prisma.userAnswer.upsert({
      where: { questionId: dto.questionId },
      create: {
        questionId: dto.questionId, answerMode: dto.answerMode, answerText: '', skipped: false,
        audioFileUrl: dto.audioFileUrl, audioDurationSeconds: dto.audioDurationSeconds,
        audioSizeBytes: dto.audioSizeBytes, transcriptionStatus: 'pending',
      }, update: {},
    });
    await this.enqueueTranscription(sessionId, answer.id, dto, session, sessionType);
    return { answerId: answer.id, feedbackQueued: false, transcriptionPending: true };
  }

  private async submitText(sessionId: string, dto: SubmitAnswerDto, session: any, question: any, sessionType: any): Promise<TurnResponseDto> {
    let answer = await this.prisma.userAnswer.findUnique({ where: { questionId: dto.questionId } });
    if (answer?.skipped) return { answerId: answer.id, feedbackQueued: false, transcriptionPending: false };
    if (!answer) {
      const answerText = dto.answerText?.trim() ?? '';
      const metrics = dto.answerMode === 'voice' ? this.voiceMetrics.calculate(answerText, dto.audioDurationSeconds ?? 0) : undefined;
      answer = await this.prisma.userAnswer.upsert({
        where: { questionId: dto.questionId },
        create: {
          questionId: dto.questionId, answerMode: dto.answerMode, answerText, skipped: false,
          audioFileUrl: dto.audioFileUrl, audioDurationSeconds: dto.audioDurationSeconds, audioSizeBytes: dto.audioSizeBytes,
          transcriptionStatus: dto.answerMode === 'voice' ? 'done' : undefined,
          voiceMetricsJson: metrics ? (metrics as unknown as Prisma.InputJsonValue) : undefined,
        }, update: {},
      });
    }
    await this.feedbackQueue.add('feedback', {
      sessionId, turnId: answer.id, answerId: answer.id, questionId: question.id,
      questionText: question.questionText, questionCategory: question.questionCategory,
      competencyDomains: this.questionCriteria.codesFromSessionQuestion(question), answerText: answer.answerText,
      contextPack: session.contextPackId, sessionType, language: session.language,
    }, { jobId: `feedback-${answer.id}`, attempts: FEEDBACK_JOB_ATTEMPTS, backoff: { type: 'fixed', delay: 2000 } });
    return { answerId: answer.id, feedbackQueued: true, transcriptionPending: false };
  }

  private async enqueueTranscription(sessionId: string, answerId: string, dto: SubmitAnswerDto, session: any, sessionType: any) {
    const payload: TranscriptionJobDto = {
      sessionId, answerId, audioFileUrl: dto.audioFileUrl!, audioDurationSeconds: dto.audioDurationSeconds,
      audioSizeBytes: dto.audioSizeBytes, contextPack: session.contextPackId, sessionType, language: session.language,
    };
    await this.transcriptionQueue.add('transcription', payload, {
      jobId: `transcription-${answerId}`, attempts: TRANSCRIPTION_JOB_ATTEMPTS, backoff: { type: 'fixed', delay: 3000 },
    });
  }
}

import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
import { FollowUpCoordinatorService } from './follow-up-coordinator.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import {
  AudioStorageService,
  type AudioUploadResult,
  type UploadedAudioFile,
} from './audio-storage.service';
import { VoiceMetricsService } from './voice-metrics.service';
import type { TranscriptionJobDto } from '../ai/processors/transcription.processor';
import { isSessionType } from '../ai/pipelines/interview-pipeline.interface';

@Injectable()
export class TurnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followUpCoordinatorService: FollowUpCoordinatorService,
    private readonly audioStorageService: AudioStorageService,
    private readonly voiceMetricsService: VoiceMetricsService,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly followUpQueue: Queue,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(TRANSCRIPTION_QUEUE) private readonly transcriptionQueue: Queue,
  ) {}

  async uploadAudio(
    sessionId: string,
    userId: string,
    file?: UploadedAudioFile,
  ): Promise<AudioUploadResult> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
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

    return this.audioStorageService.uploadInterviewAudio({
      sessionId,
      userId,
      file,
    });
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<TurnResponseDto> {
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

    if (!['active', 'ready'].includes(session.status)) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_ACTIVE,
        HttpStatus.FORBIDDEN,
      );
    }

    const sessionType = session.sessionType;
    if (!isSessionType(sessionType)) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Unsupported stored session type: ${sessionType}`,
      );
    }

    const question = await this.prisma.sessionQuestion.findFirst({
      where: { id: dto.questionId, sessionId },
    });

    if (!question) {
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (session.status !== 'active') {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'active' },
      });
    }

    const providedTranscript = dto.answerText?.trim();

    // Voice fallback path: legacy clients can still submit audio-only answers.
    if (dto.answerMode === 'voice' && dto.audioFileUrl && !providedTranscript) {
      const existingVoiceAnswer = await this.prisma.userAnswer.findUnique({
        where: {
          sessionId_questionId: { sessionId, questionId: dto.questionId },
        },
      });

      if (existingVoiceAnswer) {
        if (existingVoiceAnswer.transcriptionStatus === 'done') {
          return {
            answerId: existingVoiceAnswer.id,
            followUpQueued: false,
            feedbackQueued: true,
            transcriptionPending: false,
          };
        }
        if (existingVoiceAnswer.transcriptionStatus === 'failed') {
          return {
            answerId: existingVoiceAnswer.id,
            followUpQueued: false,
            feedbackQueued: false,
            transcriptionPending: false,
          };
        }
        // transcriptionStatus is 'pending' or null — re-enqueue for dedup
        const contextPackRetry = session.contextPackId as 'VN' | 'Western';
        const retryPayload: TranscriptionJobDto = {
          sessionId,
          answerId: existingVoiceAnswer.id,
          audioFileUrl: dto.audioFileUrl,
          audioDurationSeconds: dto.audioDurationSeconds,
          audioSizeBytes: dto.audioSizeBytes,
          contextPack: contextPackRetry,
          sessionType,
        };
        await this.transcriptionQueue.add(
          'transcription',
          retryPayload,
          {
            jobId: `transcription-${existingVoiceAnswer.id}`,
            attempts: TRANSCRIPTION_JOB_ATTEMPTS,
            backoff: { type: 'fixed', delay: 3000 },
          },
        );
        return {
          answerId: existingVoiceAnswer.id,
          followUpQueued: false,
          feedbackQueued: false,
          transcriptionPending: true,
        };
      }

      const answer = await this.prisma.userAnswer.upsert({
        where: {
          sessionId_questionId: { sessionId, questionId: dto.questionId },
        },
        create: {
          sessionId,
          questionId: dto.questionId,
          answerMode: dto.answerMode,
          answerText: '',
          audioFileUrl: dto.audioFileUrl,
          audioDurationSeconds: dto.audioDurationSeconds,
          audioSizeBytes: dto.audioSizeBytes,
          transcriptionStatus: 'pending',
        },
        update: {},
      });

      const contextPack = session.contextPackId as 'VN' | 'Western';
      const transcriptionPayload: TranscriptionJobDto = {
        sessionId,
        answerId: answer.id,
        audioFileUrl: dto.audioFileUrl,
        audioDurationSeconds: dto.audioDurationSeconds,
        audioSizeBytes: dto.audioSizeBytes,
        contextPack,
        sessionType,
      };

      await this.transcriptionQueue.add(
        'transcription',
        transcriptionPayload,
        {
          jobId: `transcription-${answer.id}`,
          attempts: TRANSCRIPTION_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: 3000 },
        },
      );

      return {
        answerId: answer.id,
        followUpQueued: false,
        feedbackQueued: false,
        transcriptionPending: true,
      };
    }

    // Text and edited voice-transcript path: process synchronously.
    const existingAnswer = await this.prisma.userAnswer.findUnique({
      where: {
        sessionId_questionId: { sessionId, questionId: dto.questionId },
      },
    });
    let answer = existingAnswer;

    if (!answer) {
      const answerText = dto.answerText?.trim() ?? '';
      const voiceMetrics =
        dto.answerMode === 'voice'
          ? this.voiceMetricsService.calculate(
              answerText,
              dto.audioDurationSeconds ?? 0,
            )
          : undefined;

      answer = await this.prisma.userAnswer.upsert({
        where: {
          sessionId_questionId: { sessionId, questionId: dto.questionId },
        },
        create: {
          sessionId,
          questionId: dto.questionId,
          answerMode: dto.answerMode,
          answerText,
          audioFileUrl: dto.audioFileUrl,
          audioDurationSeconds: dto.audioDurationSeconds,
          audioSizeBytes: dto.audioSizeBytes,
          transcriptionStatus:
            dto.answerMode === 'voice' ? 'done' : undefined,
          voiceMetricsJson: voiceMetrics
            ? (voiceMetrics as unknown as Prisma.InputJsonValue)
            : undefined,
        },
        update: {},
      });
    }

    const contextPack = session.contextPackId as 'VN' | 'Western';
    const jobBase = {
      sessionId,
      turnId: answer.id,
      answerId: answer.id,
      questionText: question.questionText,
      answerText: answer.answerText,
      contextPack,
      sessionType,
    };

    const followUpEnabled =
      this.followUpCoordinatorService.shouldGenerateFollowUp(
        answer.answerText,
        question.orderIndex,
        session.numQuestions,
      );

    if (followUpEnabled) {
      await this.followUpQueue.add('follow-up', jobBase, {
        jobId: `follow-up-${answer.id}`,
        attempts: FOLLOW_UP_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      });
    }

    await this.feedbackQueue.add('feedback', jobBase, {
      jobId: `feedback-${answer.id}`,
      attempts: FEEDBACK_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: 2000 },
    });

    return {
      answerId: answer.id,
      followUpQueued: followUpEnabled,
      feedbackQueued: true,
      transcriptionPending: false,
    };
  }
}

import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
import { WhisperService } from './whisper.service';
import { VoiceMetricsService } from './voice-metrics.service';
import { FollowUpCoordinatorService } from './follow-up-coordinator.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';

@Injectable()
export class TurnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whisperService: WhisperService,
    private readonly voiceMetricsService: VoiceMetricsService,
    private readonly followUpCoordinatorService: FollowUpCoordinatorService,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly followUpQueue: Queue,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
  ) {}

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

    const existingAnswer = await this.prisma.userAnswer.findUnique({
      where: {
        sessionId_questionId: { sessionId, questionId: dto.questionId },
      },
    });
    let answer = existingAnswer;

    if (!answer) {
      let answerText: string;
      let audioDurationSeconds: number | undefined;
      let voiceMetricsJson: object | undefined;

      if (dto.answerMode === 'voice' && dto.audioFileUrl) {
        const transcription = await this.whisperService.transcribe(
          dto.audioFileUrl,
        );
        answerText = transcription.text;
        audioDurationSeconds =
          dto.audioDurationSeconds ?? transcription.durationSeconds;
        voiceMetricsJson = this.voiceMetricsService.calculate(
          answerText,
          transcription.durationSeconds,
        );
      } else {
        answerText = dto.answerText ?? '';
      }

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
          audioDurationSeconds,
          audioSizeBytes: dto.audioSizeBytes,
          voiceMetricsJson,
        },
        update: {},
      });
    }

    const contextPack = session.contextPackId as 'VN' | 'Western';
    const sessionType = session.sessionType;
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
        attempts: 1,
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
    };
  }
}

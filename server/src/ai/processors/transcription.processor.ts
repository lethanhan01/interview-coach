import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { WhisperService } from '../../turn/whisper.service';
import { VoiceMetricsService } from '../../turn/voice-metrics.service';
import { FollowUpCoordinatorService } from '../../turn/follow-up-coordinator.service';
import {
  TRANSCRIPTION_QUEUE,
  FEEDBACK_QUEUE,
  FOLLOW_UP_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import type { SessionType } from '../pipelines/interview-pipeline.interface';

interface TranscriptionJobDto {
  sessionId: string;
  answerId: string;
  audioFileUrl: string;
  audioDurationSeconds?: number;
  audioSizeBytes?: number;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
}

@Processor(TRANSCRIPTION_QUEUE)
export class TranscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly whisperService: WhisperService,
    private readonly voiceMetricsService: VoiceMetricsService,
    private readonly followUpCoordinatorService: FollowUpCoordinatorService,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly followUpQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<TranscriptionJobDto>): Promise<void> {
    const {
      sessionId,
      answerId,
      audioFileUrl,
      audioDurationSeconds: hintDuration,
      contextPack,
      sessionType,
    } = job.data;

    const transcription = await this.whisperService.transcribe(audioFileUrl);
    const answerText = transcription.text;
    const durationSeconds = hintDuration ?? transcription.durationSeconds;
    const voiceMetricsJson = this.voiceMetricsService.calculate(
      answerText,
      durationSeconds,
    );

    const answer = await this.prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
        audioDurationSeconds: durationSeconds,
        voiceMetricsJson,
        transcriptionStatus: 'done',
      },
    });

    const question = await this.prisma.sessionQuestion.findFirst({
      where: { id: answer.questionId, sessionId },
    });

    if (!question) {
      this.logger.warn(
        `Question not found for answer ${answerId} in session ${sessionId}, enqueueing feedback with empty question text and skipping follow-up`,
      );
      await this.enqueueFeedback(answerId, sessionId, '', answerText, contextPack, sessionType);
      await this.emitTranscriptionReady(sessionId, answerId);
      return;
    }

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { numQuestions: true },
    });

    const jobBase = {
      sessionId,
      turnId: answerId,
      answerId,
      questionText: question.questionText,
      answerText,
      contextPack,
      sessionType,
    };

    const followUpEnabled = this.followUpCoordinatorService.shouldGenerateFollowUp(
      answerText,
      question.orderIndex,
      session?.numQuestions ?? 0,
    );

    if (followUpEnabled) {
      await this.followUpQueue.add('follow-up', jobBase, {
        jobId: `follow-up-${answerId}`,
        attempts: FOLLOW_UP_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      });
    }

    await this.feedbackQueue.add('feedback', jobBase, {
      jobId: `feedback-${answerId}`,
      attempts: FEEDBACK_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: 2000 },
    });

    await this.emitTranscriptionReady(sessionId, answerId);
  }

  private async enqueueFeedback(
    answerId: string,
    sessionId: string,
    questionText: string,
    answerText: string,
    contextPack: 'VN' | 'Western',
    sessionType: SessionType,
  ): Promise<void> {
    await this.feedbackQueue.add(
      'feedback',
      { sessionId, turnId: answerId, answerId, questionText, answerText, contextPack, sessionType },
      { jobId: `feedback-${answerId}`, attempts: FEEDBACK_JOB_ATTEMPTS, backoff: { type: 'fixed', delay: 2000 } },
    );
  }

  private async emitTranscriptionReady(sessionId: string, answerId: string): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'turn.transcription_ready', { answerId })
      .catch((err: unknown) => {
        this.logger.warn(
          `Unable to emit transcription_ready for answer ${answerId}`,
          err instanceof Error ? err.message : String(err),
        );
      });
  }
}

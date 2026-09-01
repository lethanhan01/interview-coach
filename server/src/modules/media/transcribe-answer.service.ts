import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { PrepFacade } from '@modules/interview-prep/contracts';
import { SpeechToText } from './speech-to-text.service';
import { VoiceMetricsService } from './voice-metrics.service';
import { AssessmentFacade } from '@modules/interview-assessment/contracts';
import {
  TRANSCRIPTION_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
} from '@core/common/constants/queue.constants';
import { getFallbackFeedbackMessage } from '@infra/ai/fallback-content';
import type { OutputLanguage } from '@infra/ai/output-language';
import { resolveOutputLanguage } from '@infra/ai/output-language';
import type { SessionType } from '@infra/ai/pipelines/interview-pipeline.interface';
import type { TranscriptionJobDto } from './transcription-job.dto';

@Injectable()
export class TranscribeAnswer {
  private readonly logger = new Logger(TranscribeAnswer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prepFacade: PrepFacade,
    private readonly sseService: SseService,
    private readonly speechToText: SpeechToText,
    private readonly voiceMetricsService: VoiceMetricsService,
    private readonly assessmentFacade: AssessmentFacade,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
  ) {}

  async execute(job: Job<TranscriptionJobDto>): Promise<void> {
    const {
      sessionId,
      answerId,
      audioFileUrl,
      audioDurationSeconds: hintDuration,
      contextPack,
      sessionType,
    } = job.data;
    const language = resolveOutputLanguage(job.data.language);

    try {
      const transcription = await this.speechToText.transcribe(audioFileUrl);
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
          voiceMetricsJson:
            voiceMetricsJson as unknown as Prisma.InputJsonValue,
          transcriptionStatus: 'done',
        },
      });

      const question = await this.prisma.sessionQuestion.findFirst({
        where: { id: answer.questionId, sessionId },
        include: SESSION_QUESTION_CRITERIA_INCLUDE,
      });

      if (!question) {
        this.logger.warn(
          `Question not found for answer ${answerId} in session ${sessionId}, enqueueing feedback with empty question text and skipping follow-up`,
        );
        await this.enqueueFeedback(
          answerId,
          sessionId,
          '',
          undefined,
          undefined,
          [],
          answerText,
          contextPack,
          sessionType,
          language,
        );
        await this.emitTranscriptionReady(sessionId, answerId);
        return;
      }

      const competencyDomains =
        this.prepFacade.codesFromSessionQuestion(question);
      const jobBase = {
        sessionId,
        turnId: answerId,
        answerId,
        questionId: question.id,
        questionText: question.questionText,
        questionCategory: question.questionCategory as
          | 'behavioral'
          | 'technical',
        competencyDomains,
        answerText,
        contextPack,
        sessionType,
        language,
      };

      await this.feedbackQueue.add('feedback', jobBase, {
        jobId: `feedback-${answerId}`,
        attempts: FEEDBACK_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      });

      await this.emitTranscriptionReady(sessionId, answerId);
    } catch (error: unknown) {
      const totalAttempts = job.opts.attempts ?? TRANSCRIPTION_JOB_ATTEMPTS;
      const isLastAttempt = job.attemptsMade >= totalAttempts - 1;

      if (!isLastAttempt) {
        this.logger.warn(
          `TranscriptionProcessor attempt ${job.attemptsMade + 1}/${totalAttempts} failed for answer ${answerId}, retrying`,
          error instanceof Error ? error.message : JSON.stringify(error),
        );
        throw error;
      }

      this.logger.error(
        `TranscriptionProcessor failed after ${totalAttempts} attempts for session ${sessionId} answer ${answerId}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.aiFeedback.upsert({
            where: { userAnswerId: answerId },
            create: {
              userAnswerId: answerId,
              overallScore: 0,
              modelAnswer: '',
              keyTakeaway: getFallbackFeedbackMessage(language),
              promptVersion: 'transcription-failed',
              isFallback: true,
            },
            update: {},
          });
          await tx.userAnswer.update({
            where: { id: answerId },
            data: { transcriptionStatus: 'failed', feedbackGenerated: true },
          });
        });

        await this.assessmentFacade
          .enqueueIfAllFeedbacksReady(
            sessionId,
            sessionType,
            contextPack,
            language,
          )
          .catch((err: unknown) => {
            this.logger.warn(
              `Failed to check report readiness after transcription failure for session ${sessionId}`,
              err instanceof Error ? err.message : JSON.stringify(err),
            );
          });

        await this.emitTranscriptionReady(sessionId, answerId);
      } catch (fallbackError: unknown) {
        this.logger.error(
          `TranscriptionProcessor fallback failed for answer ${answerId}`,
          fallbackError instanceof Error
            ? fallbackError.stack
            : JSON.stringify(fallbackError),
        );
      }
    }
  }

  private async enqueueFeedback(
    answerId: string,
    sessionId: string,
    questionText: string,
    questionId: string | undefined,
    questionCategory: 'behavioral' | 'technical' | undefined,
    competencyDomains: string[],
    answerText: string,
    contextPack: 'VN' | 'Western',
    sessionType: SessionType,
    language: OutputLanguage,
  ): Promise<void> {
    await this.feedbackQueue.add(
      'feedback',
      {
        sessionId,
        turnId: answerId,
        answerId,
        questionId,
        questionText,
        questionCategory,
        competencyDomains,
        answerText,
        contextPack,
        sessionType,
        language,
      },
      {
        jobId: `feedback-${answerId}`,
        attempts: FEEDBACK_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      },
    );
  }

  private async emitTranscriptionReady(
    sessionId: string,
    answerId: string,
  ): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'turn.transcription_ready', {
        answerId,
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Unable to emit transcription_ready for answer ${answerId}`,
          err instanceof Error ? err.message : JSON.stringify(err),
        );
      });
  }
}

const SESSION_QUESTION_CRITERIA_INCLUDE = {
  criteria: {
    include: {
      criteria: {
        include: {
          competency: true,
        },
      },
    },
  },
} satisfies Prisma.SessionQuestionInclude;

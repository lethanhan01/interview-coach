import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  FEEDBACK_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
} from '../common/constants/queue.constants';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import {
  AnswerIntakeContext,
  IAnswerIntakeHandler,
} from './answer-intake-handler.interface';

@Injectable()
export class TextAnswerIntakeHandler implements IAnswerIntakeHandler {
  readonly supportedMode = 'text';

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionCriteria: QuestionCriteriaService,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
  ) {}

  async handle(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
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
      const answerText = dto.answerText?.trim() ?? '';
      answer = await this.prisma.userAnswer.upsert({
        where: { questionId: dto.questionId },
        create: {
          questionId: dto.questionId,
          answerMode: 'text',
          answerText,
          skipped: false,
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
}

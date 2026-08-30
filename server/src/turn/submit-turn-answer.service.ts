import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { AnswerIntakeRegistry } from './answer-intake.registry';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import { TurnAnswerContext } from './turn-answer-context.service';

@Injectable()
export class SubmitTurnAnswer {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: TurnAnswerContext,
    private readonly intakeRegistry: AnswerIntakeRegistry,
  ) {}

  async execute(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<TurnResponseDto> {
    const { session, question, sessionType } = await this.context.load(
      sessionId,
      userId,
      dto.questionId,
    );

    if (dto.skipQuestion) {
      return this.skip(dto.questionId);
    }

    const handler = this.intakeRegistry.getHandler(dto.answerMode);
    return handler.handle(dto, {
      sessionId,
      userId,
      session,
      question,
      sessionType,
    });
  }

  private async skip(questionId: string): Promise<TurnResponseDto> {
    const existing = await this.prisma.userAnswer.findUnique({
      where: { questionId },
    });
    if (existing) {
      return {
        answerId: existing.id,
        feedbackQueued: !existing.skipped,
        transcriptionPending: existing.transcriptionStatus === 'pending',
      };
    }
    const answer = await this.prisma.userAnswer.upsert({
      where: { questionId },
      create: {
        questionId,
        answerMode: 'text',
        answerText: '',
        skipped: true,
        feedbackGenerated: false,
      },
      update: {},
    });
    return {
      answerId: answer.id,
      feedbackQueued: false,
      transcriptionPending: false,
    };
  }
}

import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { AssessmentFacade } from '@modules/interview-assessment/contracts';
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
    @Optional()
    private readonly assessmentFacade?: AssessmentFacade,
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
      return this.skip(
        sessionId,
        dto.questionId,
        session.sessionType,
        (session as any).contextPackId,
        (session as any).language,
      );
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

  private async skip(
    sessionId: string,
    questionId: string,
    sessionType?: string,
    contextPack?: string,
    language?: string,
  ): Promise<TurnResponseDto> {
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

    if (this.assessmentFacade) {
      const recorded = await this.assessmentFacade.recordSkippedQuestion({
        sessionId,
        questionId,
        sessionType,
        contextPack: (contextPack as 'VN' | 'Western') || 'VN',
        language,
      });
      return {
        answerId: recorded.answerId,
        feedbackQueued: false,
        transcriptionPending: false,
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
      update: {
        skipped: true,
      },
    });
    return {
      answerId: answer.id,
      feedbackQueued: false,
      transcriptionPending: false,
    };
  }
}

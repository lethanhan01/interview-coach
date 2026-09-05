import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isSessionType } from '@core/common/constants/session.constants';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { PrismaService } from '@infra/database/prisma/prisma.service';

export const SESSION_QUESTION_SKILL_LEVELS_INCLUDE = {} as any;

// Alias for backwards compatibility
export const SESSION_QUESTION_CRITERIA_INCLUDE = SESSION_QUESTION_SKILL_LEVELS_INCLUDE;

@Injectable()
export class TurnAnswerContext {
  constructor(private readonly prisma: PrismaService) {}

  async assertOwner(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { savedJobDescription: { select: { userId: true } } },
    });
    if (!session) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    if (session.savedJobDescription.userId !== userId) {
      throw new InterviewAIException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
    return session;
  }

  async load(sessionId: string, userId: string, questionId: string) {
    const session = await this.assertOwner(sessionId, userId);
    if (!['active', 'ready'].includes(session.status)) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_ACTIVE,
        HttpStatus.FORBIDDEN,
      );
    }
    if (!isSessionType(session.sessionType)) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Unsupported stored session type: ${session.sessionType}`,
      );
    }
    const question = await this.prisma.sessionQuestion.findFirst({
      where: { id: questionId, sessionId },
      include: SESSION_QUESTION_SKILL_LEVELS_INCLUDE,
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
    return { session, question, sessionType: session.sessionType };
  }
}

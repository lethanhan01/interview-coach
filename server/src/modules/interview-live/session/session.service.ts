import { Injectable, HttpStatus } from '@nestjs/common';
import { InterviewSession } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionStatusUpdate } from './dto/update-session-status.dto';
import { ChangeInterviewSessionStatus } from './change-interview-session-status.service';
import { CreateInterviewSession } from './create-interview-session.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createInterviewSession: CreateInterviewSession,
    private readonly changeInterviewSessionStatus: ChangeInterviewSessionStatus,
  ) {}

  create(userId: string, dto: CreateSessionDto): Promise<InterviewSession> {
    return this.createInterviewSession.execute(userId, dto);
  }

  async findById(
    sessionId: string,
    userId: string,
    canAccessHistory = true,
  ): Promise<InterviewSession> {
    if (!UUID_PATTERN.test(sessionId)) {
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { savedJobDescription: { select: { userId: true } } },
    });
    if (!session)
      throw new InterviewAIException(
        ErrorCode.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    if (session.savedJobDescription.userId !== userId) {
      throw new InterviewAIException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
    if (
      !canAccessHistory &&
      ['completed', 'completing'].includes(session.status)
    ) {
      throw new InterviewAIException(
        ErrorCode.EMAIL_NOT_VERIFIED,
        HttpStatus.FORBIDDEN,
        'Hãy xác thực email để xem lịch sử và báo cáo phỏng vấn.',
      );
    }
    return session;
  }

  findAll(
    userId: string,
    canAccessHistory = true,
  ): Promise<InterviewSession[]> {
    return this.prisma.interviewSession.findMany({
      where: {
        savedJobDescription: { userId },
        ...(canAccessHistory
          ? {}
          : { status: { notIn: ['completed', 'completing'] } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findQuestions(sessionId: string, userId: string) {
    const session = await this.findById(sessionId, userId);
    const [questions, answers] = await Promise.all([
      this.prisma.sessionQuestion.findMany({
        where: { sessionId },
        orderBy: { orderIndex: 'asc' },
      }),
      this.prisma.userAnswer.findMany({
        where: { question: { sessionId } },
        select: { id: true, questionId: true, skipped: true },
      }),
    ]);
    if (
      questions.length > 0 &&
      ['generating', 'ready'].includes(session.status)
    ) {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'active' },
      });
    }
    const answersByQuestionId = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    const mappedQuestions = questions.map((question) => {
      const answer = answersByQuestionId.get(question.id);
      return {
        id: question.id,
        content: question.questionText,
        orderIndex: question.orderIndex,
        answered: Boolean(answer),
        answerId: answer?.id,
        skipped: answer?.skipped,
      };
    });
    const firstUnansweredIndex = mappedQuestions.findIndex(
      (question) => !question.answered,
    );
    return {
      questions: mappedQuestions,
      currentIndex:
        firstUnansweredIndex >= 0
          ? firstUnansweredIndex
          : Math.max(0, mappedQuestions.length - 1),
    };
  }

  async updateStatus(
    sessionId: string,
    userId: string,
    status: SessionStatusUpdate,
    remainingSeconds?: number,
    autoSkipUnanswered = false,
  ): Promise<InterviewSession> {
    const session = await this.findById(sessionId, userId);
    return this.changeInterviewSessionStatus.execute(
      session,
      status,
      remainingSeconds,
      autoSkipUnanswered,
    );
  }
}

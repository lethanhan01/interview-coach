import { Injectable, HttpStatus } from '@nestjs/common';
import { InterviewSession } from '@prisma/client';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { ReportService } from '../report/report.service';
import { SessionStatusUpdate } from './dto/update-session-status.dto';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';

@Injectable()
export class ChangeInterviewSessionStatus {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
    private readonly policy: SessionLifecyclePolicy,
  ) {}

  async execute(
    session: InterviewSession,
    status: SessionStatusUpdate,
    remainingSeconds?: number,
    autoSkipUnanswered = false,
  ): Promise<InterviewSession> {
    if (status === 'active') return this.activate(session);
    if (status === 'paused') return this.pause(session, remainingSeconds);
    if (status === 'canceled') return this.cancel(session);
    return this.complete(session, autoSkipUnanswered);
  }

  private async activate(session: InterviewSession): Promise<InterviewSession> {
    this.policy.assertTransition(session.status, 'active');
    if (session.status === 'active') return session;
    const questionCount = await this.prisma.sessionQuestion.count({
      where: { sessionId: session.id },
    });
    if (questionCount === 0)
      throw this.policy.invalidTransition(session.status, 'active');
    return this.prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: 'active', completedAt: null },
    });
  }

  private async pause(
    session: InterviewSession,
    remainingSeconds?: number,
  ): Promise<InterviewSession> {
    this.policy.assertTransition(session.status, 'paused');
    if (session.status === 'paused') return session;
    return this.prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: 'paused',
        completedAt: null,
        ...(remainingSeconds === undefined
          ? {}
          : {
              remainingSeconds: Math.min(
                remainingSeconds,
                session.durationMin * 60,
              ),
            }),
      },
    });
  }

  private async cancel(session: InterviewSession): Promise<InterviewSession> {
    this.policy.assertTransition(session.status, 'canceled');
    if (session.status === 'canceled') return session;
    return this.prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: 'canceled', completedAt: null },
    });
  }

  private async complete(
    session: InterviewSession,
    autoSkipUnanswered: boolean,
  ): Promise<InterviewSession> {
    if (session.status === 'completed') return session;
    if (session.status === 'completing') {
      await this.enqueueReport(session);
      return session;
    }
    this.policy.assertTransition(session.status, 'completed');
    const updated = autoSkipUnanswered
      ? await this.completeWithAutoSkippedAnswers(session.id)
      : await this.completeAnsweredSession(session.id);
    try {
      await this.enqueueReport(session);
    } catch (error: unknown) {
      await this.prisma.interviewSession
        .updateMany({
          where: { id: session.id, status: 'completing' },
          data: { status: 'active' },
        })
        .catch(() => {});
      if (error instanceof InterviewAIException) throw error;
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Không thể xếp hàng tạo báo cáo. Vui lòng thử lại.',
      );
    }
    return updated;
  }

  private enqueueReport(session: InterviewSession) {
    return this.reportService.enqueueIfAllFeedbacksReady(
      session.id,
      session.sessionType,
      session.contextPackId as 'VN' | 'Western',
      session.language,
    );
  }

  private async completeAnsweredSession(
    sessionId: string,
  ): Promise<InterviewSession> {
    const [questionCount, answerCount] = await Promise.all([
      this.prisma.sessionQuestion.count({ where: { sessionId } }),
      this.prisma.userAnswer.count({ where: { question: { sessionId } } }),
    ]);
    if (questionCount === 0 || answerCount < questionCount) {
      throw new InterviewAIException(
        ErrorCode.SESSION_INCOMPLETE,
        HttpStatus.CONFLICT,
        'Hãy trả lời đầy đủ các câu hỏi trước khi hoàn thành phỏng vấn.',
      );
    }
    return this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'completing', completedAt: null },
    });
  }

  private async completeWithAutoSkippedAnswers(
    sessionId: string,
  ): Promise<InterviewSession> {
    return this.prisma.$transaction(async (tx) => {
      const [questions, answers] = await Promise.all([
        tx.sessionQuestion.findMany({
          where: { sessionId },
          select: { id: true },
          orderBy: { orderIndex: 'asc' },
        }),
        tx.userAnswer.findMany({
          where: { question: { sessionId } },
          select: { questionId: true },
        }),
      ]);
      if (questions.length === 0)
        throw new InterviewAIException(
          ErrorCode.SESSION_INCOMPLETE,
          HttpStatus.CONFLICT,
          'Không thể hoàn thành phỏng vấn khi chưa có câu hỏi.',
        );
      const answeredQuestionIds = new Set(
        answers.map((answer) => answer.questionId),
      );
      const unansweredQuestions = questions.filter(
        (question) => !answeredQuestionIds.has(question.id),
      );
      if (unansweredQuestions.length > 0) {
        await tx.userAnswer.createMany({
          data: unansweredQuestions.map((question) => ({
            questionId: question.id,
            answerMode: 'text',
            answerText: '',
            skipped: true,
            feedbackGenerated: false,
          })),
        });
      }
      return tx.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'completing', completedAt: null, remainingSeconds: 0 },
      });
    });
  }
}

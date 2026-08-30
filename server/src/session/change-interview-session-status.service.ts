import { Injectable, HttpStatus } from '@nestjs/common';
import { InterviewSession } from '@prisma/client';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { SessionStatusUpdate } from './dto/update-session-status.dto';
import { SessionLifecyclePolicy } from './session-lifecycle.policy';
import { WorkflowDispatcher } from '../workflow/workflow-dispatcher.service';
import { WorkflowService } from '../workflow/workflow.service';
import { SessionStrategyRegistry } from './session-strategy.registry';

@Injectable()
export class ChangeInterviewSessionStatus {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: SessionLifecyclePolicy,
    private readonly workflow: WorkflowService,
    private readonly dispatcher: WorkflowDispatcher,
    private readonly strategyRegistry: SessionStrategyRegistry,
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
      await this.dispatcher.dispatchFor('report-generation', session.id);
      return session;
    }
    this.policy.assertTransition(session.status, 'completed');
    const updated = autoSkipUnanswered
      ? await this.completeWithAutoSkippedAnswers(session.id, session)
      : await this.completeAnsweredSession(session.id, session);
    await this.dispatcher.dispatchFor('report-generation', session.id);
    return updated;
  }

  private async completeAnsweredSession(
    sessionId: string,
    session: InterviewSession,
  ): Promise<InterviewSession> {
    const [questionCount, answerCount] = await Promise.all([
      this.prisma.sessionQuestion.count({ where: { sessionId } }),
      this.prisma.userAnswer.count({ where: { question: { sessionId } } }),
    ]);
    const strategy = this.strategyRegistry.getStrategy(session.sessionType);
    if (!strategy.isSessionCompletable(session, answerCount, questionCount)) {
      throw new InterviewAIException(
        ErrorCode.SESSION_INCOMPLETE,
        HttpStatus.CONFLICT,
        'Hãy trả lời đầy đủ các câu hỏi trước khi hoàn thành phỏng vấn.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'completing', completedAt: null },
      });
      await this.enqueueReportCommand(tx, updated);
      return updated;
    });
  }

  private async completeWithAutoSkippedAnswers(
    sessionId: string,
    session: InterviewSession,
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
      const updated = await tx.interviewSession.update({
        where: { id: sessionId },
        data: { status: 'completing', completedAt: null, remainingSeconds: 0 },
      });
      await this.enqueueReportCommand(tx, updated);
      return updated;
    });
  }

  private enqueueReportCommand(
    tx: Parameters<WorkflowService['enqueueInTransaction']>[0],
    session: InterviewSession,
  ) {
    const strategy = this.strategyRegistry.getStrategy(session.sessionType);
    const payload = strategy.buildReportGenerationPayload(session);
    return this.workflow.enqueueInTransaction(tx, {
      commandType: 'report-generation',
      sessionId: session.id,
      payload,
    });
  }
}

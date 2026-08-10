import type { Job } from 'bullmq';
import { TurnService } from '../src/turn/turn.service';
import { FeedbackProcessor } from '../src/ai/processors/feedback.processor';
import { SessionService } from '../src/session/session.service';
import { ReportService } from '../src/report/report.service';
import { ComprehensiveReportProcessor } from '../src/ai/processors/comprehensive-report.processor';

describe('Session completion flow (integration)', () => {
  it('submit answer -> feedback queue -> completing -> report queue -> completed', async () => {
    const session = {
      id: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      status: 'active',
      sessionType: 'hr',
      contextPackId: 'VN',
      savedJobDescription: {
        userId: '22222222-2222-4222-8222-222222222222',
      },
      numQuestions: 1,
      completedAt: null as Date | null,
      overallScore: null as number | null,
    };
    const question = {
      id: '33333333-3333-4333-8333-333333333333',
      sessionId: session.id,
      questionText: 'Tell me about a difficult project.',
      orderIndex: 0,
    };
    const answers = new Map<string, Record<string, unknown>>();
    const feedbacks = new Map<string, Record<string, unknown>>();
    const annotations: Record<string, unknown>[] = [];

    const transaction = {
      aiFeedback: {
        findUnique: jest.fn(async ({ where }: any) => {
          return feedbacks.get(where.userAnswerId) ?? null;
        }),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const existing = feedbacks.get(where.userAnswerId);
          const feedback = existing
            ? { ...existing, ...update }
            : {
                id: 'feedback-1',
                userAnswerId: where.userAnswerId,
                createdAt: new Date(),
                ...create,
              };
          feedbacks.set(where.userAnswerId, feedback);
          return feedback;
        }),
      },
      annotatedSegment: {
        deleteMany: jest.fn(async ({ where }: any) => {
          const previousLength = annotations.length;
          for (let index = annotations.length - 1; index >= 0; index -= 1) {
            if (annotations[index].aiFeedbackId === where.aiFeedbackId) {
              annotations.splice(index, 1);
            }
          }
          return { count: previousLength - annotations.length };
        }),
        createMany: jest.fn(async ({ data }: any) => {
          annotations.push(...data);
          return { count: data.length };
        }),
      },
      userAnswer: {
        update: jest.fn(async ({ where, data }: any) => {
          const answer = answers.get(where.id);
          if (!answer) throw new Error('Answer not found');
          const updated = { ...answer, ...data };
          answers.set(where.id, updated);
          return updated;
        }),
      },
    };

    const prisma = {
      interviewSession: {
        findUnique: jest.fn(async ({ where }: any) => {
          return where.id === session.id ? { ...session } : null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          if (where.id !== session.id) throw new Error('Session not found');
          Object.assign(session, data);
          return { ...session };
        }),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (where.id === session.id && where.status === session.status) {
            Object.assign(session, data);
            return { count: 1 };
          }
          return { count: 0 };
        }),
      },
      sessionQuestion: {
        findFirst: jest.fn(async ({ where }: any) => {
          return where.id === question.id && where.sessionId === session.id
            ? question
            : null;
        }),
        count: jest.fn(async ({ where }: any) => {
          return where.sessionId === session.id ? 1 : 0;
        }),
      },
      userAnswer: {
        findUnique: jest.fn(async ({ where }: any) => {
          const key = where.sessionId_questionId;
          return (
            [...answers.values()].find(
              (answer) =>
                answer.sessionId === key.sessionId &&
                answer.questionId === key.questionId,
            ) ?? null
          );
        }),
        upsert: jest.fn(async ({ where, create }: any) => {
          const key = where.sessionId_questionId;
          const existing = [...answers.values()].find(
            (answer) =>
              answer.sessionId === key.sessionId &&
              answer.questionId === key.questionId,
          );
          if (existing) return existing;

          const answer = {
            id: 'answer-1',
            feedbackGenerated: false,
            createdAt: new Date(),
            ...create,
          };
          answers.set(answer.id, answer);
          return answer;
        }),
        update: transaction.userAnswer.update,
        count: jest.fn(async ({ where }: any) => {
          return [...answers.values()].filter((answer) => {
            if (answer.sessionId !== where.sessionId) return false;
            if (
              where.skipped !== undefined &&
              answer.skipped !== where.skipped
            ) {
              return false;
            }
            if (
              where.feedbackGenerated !== undefined &&
              answer.feedbackGenerated !== where.feedbackGenerated
            ) {
              return false;
            }
            return true;
          }).length;
        }),
        findMany: jest.fn(async ({ where }: any) => {
          return [...answers.values()]
            .filter((answer) => answer.sessionId === where.sessionId)
            .map((answer) => ({ id: answer.id }));
        }),
      },
      aiFeedback: {
        findMany: jest.fn(async ({ where }: any) => {
          const requestedIds = new Set(where.userAnswerId.in);
          return [...feedbacks.values()].filter((feedback) =>
            requestedIds.has(feedback.userAnswerId),
          );
        }),
      },
      sessionReport: {
        upsert: jest.fn(async ({ create, update }: any) => ({
          id: `report-${create.reportType}`,
          ...create,
          ...update,
        })),
      },
      $transaction: jest.fn(
        async (
          input: ((tx: any) => Promise<unknown>) | Array<Promise<unknown>>,
        ) => {
          return Array.isArray(input) ? Promise.all(input) : input(transaction);
        },
      ),
    };

    const feedbackJobs: Array<{
      name: string;
      data: Record<string, unknown>;
      opts: Record<string, unknown>;
    }> = [];
    const reportJobs: Array<{
      name: string;
      data: Record<string, unknown>;
      opts: Record<string, unknown>;
    }> = [];
    const feedbackQueue = {
      add: jest.fn(async (name: string, data: any, opts: any) => {
        feedbackJobs.push({ name, data, opts });
        return {};
      }),
    };
    const reportQueue = {
      getJob: jest.fn(async () => null),
      add: jest.fn(async (name: string, data: any, opts: any) => {
        reportJobs.push({ name, data, opts });
        return {};
      }),
    };
    const sseService = { emit: jest.fn(async () => undefined) };

    const reportService = new ReportService(prisma as any, reportQueue as any);
    const turnService = new TurnService(
      prisma as any,
      { codesFromSessionQuestion: jest.fn(() => ['D4']) } as any,
      { uploadInterviewAudio: jest.fn() } as any,
      { calculate: jest.fn() },
      feedbackQueue as any,
      { add: jest.fn() } as any,
    );
    const feedbackProcessor = new FeedbackProcessor(
      prisma as any,
      sseService as any,
      { getContextPack: jest.fn(() => ({})) } as any,
      {
        getStrategy: jest.fn(() => ({
          evaluateAnswer: jest.fn(async () => ({
            overallScore: 84,
            modelAnswer: 'A concise STAR response.',
            keyTakeaway: 'Quantify the result.',
            annotatedSegments: [
              {
                segmentText: 'difficult project',
                startIndex: 15,
                endIndex: 32,
                highlightLevel: 'strength',
                annotation: 'Relevant example',
              },
            ],
          })),
        })),
      } as any,
      reportService,
    );
    const sessionService = new SessionService(
      prisma as any,
      { ensureContextPack: jest.fn() } as any,
      { add: jest.fn() } as any,
      reportService,
      { get: jest.fn(() => 10) } as any,
    );
    const reportProcessor = new ComprehensiveReportProcessor(
      prisma as any,
      sseService as any,
      {
        getChatModel: jest.fn(() => 'test-report-model'),
        chatCompletion: jest.fn(async () =>
          JSON.stringify({ items: ['Practice concise STAR examples'] }),
        ),
      } as any,
    );

    const turn = await turnService.submitAnswer(session.id, session.userId, {
      questionId: question.id,
      answerMode: 'text',
      answerText: 'I led a difficult project and improved delivery time.',
    });

    expect(turn.feedbackQueued).toBe(true);
    expect(feedbackJobs).toHaveLength(1);

    await feedbackProcessor.process({
      data: feedbackJobs[0].data,
      attemptsMade: 0,
      opts: feedbackJobs[0].opts,
    } as unknown as Job<any>);

    expect(answers.get(turn.answerId)?.feedbackGenerated).toBe(true);
    expect(feedbacks.get(turn.answerId)?.overallScore).toBe(84);

    const completing = await sessionService.updateStatus(
      session.id,
      session.userId,
      'completed',
    );

    expect(completing.status).toBe('completing');
    expect(reportJobs).toHaveLength(1);
    expect(reportJobs[0].data.turnIds).toEqual([turn.answerId]);

    await reportProcessor.process({
      data: reportJobs[0].data,
      attemptsMade: 0,
      opts: reportJobs[0].opts,
    } as unknown as Job<any>);

    expect(session.status).toBe('completed');
    expect(session.overallScore).toBe(84);
    expect(session.completedAt).toBeInstanceOf(Date);
    expect(sseService.emit).toHaveBeenCalledWith(
      `sse:session:${session.id}`,
      'report.ready',
      { sessionId: session.id },
    );
  });
});

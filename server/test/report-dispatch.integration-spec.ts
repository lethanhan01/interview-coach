import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import { WorkflowDispatcher } from '../src/infrastructure/workflow/workflow-dispatcher.service';
import { WorkflowService } from '../src/infrastructure/workflow/workflow.service';
import { REPORT_QUEUE } from '../src/core/common/constants/queue.constants';
import { provisionDefaultRubricCatalog } from '../src/assessment/rubric/rubric-catalog-provision';
import { prisma } from '../prisma/seed/_client';

describe('Report dispatch (PostgreSQL + Redis)', () => {
  const email = `report-dispatch-${randomUUID()}@example.com`;
  let queue: Queue;
  let sessionId: string;
  let answerId: string;
  let commandId: string;

  beforeAll(async () => {
    await provisionDefaultRubricCatalog(prisma);
    const rubric = await prisma.rubricVersion.findFirstOrThrow({
      where: { contextPackId: 'VN', status: 'active' },
    });
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        passwordHash: 'test-only-hash',
        firstname: 'Report',
        lastname: 'Dispatch',
      },
    });
    const savedJob = await prisma.savedJobDescription.create({
      data: {
        userId: user.id,
        companyName: 'Contract Co',
        jobTitle: 'Backend Engineer',
        requirements: 'TypeScript',
        jobContent: 'Build reliable backend services.',
      },
    });
    const session = await prisma.interviewSession.create({
      data: {
        savedJobDescriptionId: savedJob.id,
        jobDescription: 'Backend role',
        sessionType: 'technical',
        contextPackId: 'VN',
        rubricVersionId: rubric.id,
        status: 'completing',
      },
    });
    sessionId = session.id;
    const question = await prisma.sessionQuestion.create({
      data: {
        sessionId,
        questionText: 'How do you recover a failed job?',
        orderIndex: 1,
        questionCategory: 'technical',
      },
    });
    const answer = await prisma.userAnswer.create({
      data: {
        questionId: question.id,
        answerMode: 'text',
        answerText: 'I use idempotent retries and a recovery procedure.',
        feedbackGenerated: true,
      },
    });
    answerId = answer.id;
    const command = await prisma.$transaction((tx) =>
      new WorkflowService().enqueueInTransaction(tx, {
        commandType: 'report-generation',
        sessionId,
        payload: {
          sessionId,
          sessionType: 'technical',
          contextPack: 'VN',
          language: 'vi',
        },
      }),
    );
    commandId = command.id;
    queue = new Queue(REPORT_QUEUE, {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    });
    await queue.remove(`workflow-${commandId}`).catch(() => undefined);
  });

  afterAll(async () => {
    await queue?.remove(`workflow-${commandId}`).catch(() => undefined);
    await queue?.close();
    await prisma.workflowOutbox
      .delete({ where: { id: commandId } })
      .catch(() => undefined);
    await prisma.user.delete({ where: { email } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('keeps one effective report job when dispatcher is requested twice', async () => {
    const dispatcher = new WorkflowDispatcher(
      prisma as any,
      { add: jest.fn() } as any,
      queue,
      { add: jest.fn() } as any,
      { add: jest.fn() } as any,
    );

    await Promise.all([
      dispatcher.dispatchFor('report-generation', sessionId),
      dispatcher.dispatchFor('report-generation', sessionId),
    ]);

    const jobs = await queue.getJobs([
      'waiting',
      'active',
      'delayed',
      'completed',
      'failed',
    ]);
    const matching = jobs.filter((job) => job.id === `workflow-${commandId}`);
    expect(matching).toHaveLength(1);
    expect(matching[0].data).toMatchObject({
      sessionId,
      turnIds: [answerId],
      language: 'vi',
    });
  });
});

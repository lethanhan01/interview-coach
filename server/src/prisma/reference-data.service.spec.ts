import { ReferenceDataService } from './reference-data.service';

describe('ReferenceDataService', () => {
  const createMocks = () => {
    const prisma = {
      $transaction: jest.fn(async (callback) =>
        callback({
          rubricVersion: {
            upsert: jest.fn().mockResolvedValue({ id: 'rubric-version-v1' }),
          },
          rubricCategory: {
            upsert: jest.fn().mockResolvedValue({ id: 'rubric-category-1' }),
          },
          rubricCriterion: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({ id: 'rubric-criterion-1' }),
            create: jest.fn().mockResolvedValue({ id: 'rubric-criterion-1' }),
          },
        }),
      ),
      isBootstrapDatabaseAvailable: jest.fn().mockReturnValue(true),
      interviewSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      questionBank: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    return { prisma };
  };

  it('validates canonical packs and migrates legacy context ids at startup', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'vn' },
      data: { contextPackId: 'VN' },
    });
    expect(prisma.questionBank.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'western' },
      data: { contextPackId: 'Western' },
    });
  });

  it('rejects unsupported context pack ids without touching reference tables', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await expect(service.ensureContextPack('APAC' as never)).rejects.toThrow(
      'Unsupported context pack: APAC',
    );
    expect(prisma.interviewSession.updateMany).not.toHaveBeenCalled();
    expect(prisma.questionBank.updateMany).not.toHaveBeenCalled();
  });
});

import { ReferenceDataService } from './reference-data.service';

describe('ReferenceDataService', () => {
  const createMocks = () => {
    const tx = {
      contextPack: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      interviewSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      questionBank: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      contextPack: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
      ),
    };

    return { prisma, tx };
  };

  it('upserts canonical packs and migrates legacy foreign keys at startup', async () => {
    const { prisma, tx } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await service.onApplicationBootstrap();

    expect(tx.contextPack.upsert).toHaveBeenCalledTimes(2);
    expect(tx.interviewSession.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'vn' },
      data: { contextPackId: 'VN' },
    });
    expect(tx.questionBank.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'western' },
      data: { contextPackId: 'Western' },
    });
    expect(tx.contextPack.deleteMany).toHaveBeenCalledTimes(2);
  });

  it('recreates a requested canonical pack if it is missing at runtime', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await service.ensureContextPack('VN');

    expect(prisma.contextPack.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'VN' },
        create: expect.objectContaining({ id: 'VN' }),
      }),
    );
  });
});

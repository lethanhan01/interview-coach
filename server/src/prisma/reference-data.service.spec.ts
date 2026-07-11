import { ReferenceDataService } from './reference-data.service';
import { CONTEXT_PACK_DATA } from './context-pack.data';

describe('ReferenceDataService', () => {
  const createMocks = () => {
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) =>
        callback(prisma),
      ),
      contextPack: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      rubricVersion: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'rubric-v1' }),
        create: jest.fn().mockResolvedValue({ id: 'rubric-v1' }),
        update: jest.fn().mockResolvedValue({ id: 'rubric-v1' }),
      },
      rubricCategory: {
        upsert: jest.fn((args) =>
          Promise.resolve({ id: `${args.create.categoryKey}-category` }),
        ),
      },
      rubricCriterion: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      interviewSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      questionBank: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    return { prisma };
  };

  it('upserts canonical packs and migrates legacy foreign keys at startup', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await service.onApplicationBootstrap();

    expect(prisma.contextPack.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.rubricVersion.findFirst).not.toHaveBeenCalled();
    expect(prisma.rubricVersion.create).not.toHaveBeenCalled();
    expect(prisma.rubricCategory.upsert).not.toHaveBeenCalled();
    expect(prisma.rubricCriterion.upsert).not.toHaveBeenCalled();
    expect(prisma.interviewSession.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'vn' },
      data: { contextPackId: 'VN' },
    });
    expect(prisma.questionBank.updateMany).toHaveBeenCalledWith({
      where: { contextPackId: 'western' },
      data: { contextPackId: 'Western' },
    });
    expect(prisma.contextPack.deleteMany).toHaveBeenCalledTimes(2);
  });

  it('recreates a requested canonical pack if it is missing at runtime', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === 'VN');

    await service.ensureContextPack('VN');

    expect(pack).toBeDefined();
    expect(prisma.contextPack.upsert).toHaveBeenCalledWith({
      where: { id: 'VN' },
      create: {
        id: 'VN',
        name: pack?.name,
      },
      update: {
        name: pack?.name,
      },
    });
  });

  it('đọc active rubric version riêng, không tạo mới trong bootstrap path', async () => {
    const { prisma } = createMocks();
    const service = new ReferenceDataService(prisma as never);

    await expect(service.getActiveRubricVersionId('VN')).resolves.toBe(
      'rubric-v1',
    );

    expect(prisma.rubricVersion.findFirst).toHaveBeenCalledWith({
      where: { contextPackId: 'VN', status: 'active' },
      select: { id: true },
    });
    expect(prisma.rubricVersion.create).not.toHaveBeenCalled();
  });

  it('backfill helper tạo default active rubric khi thiếu active version', async () => {
    const { prisma } = createMocks();
    prisma.rubricVersion.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const service = new ReferenceDataService(prisma as never);

    await expect(
      service.ensureDefaultActiveRubricVersion('VN'),
    ).resolves.toBe('rubric-v1');

    expect(prisma.rubricVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contextPackId: 'VN',
          version: 'v1',
          status: 'active',
        }),
      }),
    );
    expect(prisma.rubricCategory.upsert).toHaveBeenCalled();
    expect(prisma.rubricCriterion.upsert).toHaveBeenCalled();
  });
});

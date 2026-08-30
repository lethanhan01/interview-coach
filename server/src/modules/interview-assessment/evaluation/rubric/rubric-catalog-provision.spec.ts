import { provisionDefaultRubricCatalog } from './rubric-catalog-provision';

describe('provisionDefaultRubricCatalog', () => {
  it('provisions the versioned default catalog for a fresh environment', async () => {
    const tx = {
      rubricVersion: { upsert: jest.fn().mockResolvedValue({ id: 'v1' }) },
      rubricCategory: {
        upsert: jest.fn().mockResolvedValue({ id: 'category' }),
      },
      rubricCriterion: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'criterion' }),
      },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };

    await provisionDefaultRubricCatalog(prisma as never);

    expect(tx.rubricVersion.upsert).toHaveBeenCalledTimes(2);
    expect(tx.rubricCriterion.create).toHaveBeenCalled();
  });
});

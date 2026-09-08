import { provisionDefaultRubricCatalog } from './rubric-catalog-provision';

describe('provisionDefaultRubricCatalog', () => {
  it('is a no-op function for SFIA 9 catalog', async () => {
    const prisma = { $transaction: jest.fn() };

    await expect(
      provisionDefaultRubricCatalog(prisma as never),
    ).resolves.toBeUndefined();
  });
});

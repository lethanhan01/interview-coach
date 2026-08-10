import { RubricCatalogService } from './rubric-catalog.service';

describe('RubricCatalogService', () => {
  it('reads an existing active rubric without provisioning or mutating it', async () => {
    const prisma = {
      rubricVersion: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rubric-version-v1' }),
      },
      $transaction: jest.fn(),
    };
    const service = new RubricCatalogService(prisma as never);

    await expect(service.ensureActiveRubricVersion('VN')).resolves.toBe(
      'rubric-version-v1',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unsupported context pack ids without querying the catalog', async () => {
    const prisma = { rubricVersion: { findFirst: jest.fn() } };
    const service = new RubricCatalogService(prisma as never);

    await expect(service.ensureContextPack('APAC' as never)).rejects.toThrow(
      'Unsupported context pack: APAC',
    );
    expect(prisma.rubricVersion.findFirst).not.toHaveBeenCalled();
  });
});

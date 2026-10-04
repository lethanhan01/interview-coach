import { RubricCatalogService } from './rubric-catalog.service';

describe('RubricCatalogService', () => {
  it('reads an existing active rubric without provisioning or mutating it', async () => {
    const service = new RubricCatalogService();

    await expect(service.ensureActiveRubricVersion('VN')).resolves.toBe(
      '9.0.0',
    );
  });

  it('rejects unsupported context pack ids without querying the catalog', () => {
    const service = new RubricCatalogService();

    expect(() => service.ensureContextPack('APAC' as never)).toThrow(
      'Unsupported context pack: APAC',
    );
  });
});

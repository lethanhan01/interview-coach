import { Test, TestingModule } from '@nestjs/testing';
import { ContextPackService } from './context-pack.service';

describe('ContextPackService', () => {
  let service: ContextPackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextPackService],
    }).compile();

    service = module.get<ContextPackService>(ContextPackService);
  });

  describe('getContextPack', () => {
    it('trả về VN config với rubricDimensions và culturalNotes phù hợp văn hóa Việt Nam', () => {
      const pack = service.getContextPack('VN');

      expect(pack.rubricDimensions).toContain('clarity');
      expect(pack.rubricDimensions).toContain('communication');
      expect(pack.culturalNotes).toContain('Vietnamese');
    });

    it('trả về Western config với rubricDimensions bao gồm impact hoặc leadership', () => {
      const pack = service.getContextPack('Western');

      const hasWesternDimension =
        pack.rubricDimensions.includes('impact') ||
        pack.rubricDimensions.includes('leadership');
      expect(hasWesternDimension).toBe(true);
      expect(pack.culturalNotes).toContain('Western');
    });
  });
});

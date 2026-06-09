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

      expect(pack.rubricDimensions).toContain('Giao tiếp & Trình bày');
      expect(pack.scoringWeights).toEqual({
        behavioral_weight: 0.5,
        technical_weight: 0.5,
      });
      expect(pack.culturalNotes).toContain('Vietnamese');
    });

    it('trả về Western config với rubricDimensions bao gồm impact hoặc leadership', () => {
      const pack = service.getContextPack('Western');

      expect(pack.rubricDimensions).toContain('Leadership & Initiative');
      expect(pack.scoringWeights.technical_weight).toBe(0.55);
      expect(pack.culturalNotes).toContain('Western');
    });
  });
});

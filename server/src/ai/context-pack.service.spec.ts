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
    it('trả về VN config với rubricDimensions và culturalNotes phù hợp văn hóa Việt Nam', async () => {
      const pack = await service.getContextPack('VN');

      expect(pack.rubricDimensions).toContain('Giao tiếp & Trình bày');
      expect(pack.scoringWeights).toEqual({
        behavioral_weight: 0.5,
        technical_weight: 0.5,
      });
      expect(pack.culturalNotes).toContain('Vietnamese');

      expect(pack.behavioralDimensions).toHaveLength(6);
      expect(pack.behavioralDimensions[0]).toEqual({
        id: 'D1',
        name: 'Giao tiếp & Trình bày',
        weight: 0.2,
      });
      expect(pack.technicalDimensions).toHaveLength(5);
      expect(pack.technicalDimensions[0]).toEqual({
        id: 'TD1',
        name: 'Kiến thức nền tảng',
        weight: 0.25,
      });
    });

    it('trả về Western config với rubricDimensions bao gồm impact hoặc leadership', async () => {
      const pack = await service.getContextPack('Western');

      expect(pack.rubricDimensions).toContain('Leadership & Initiative');
      expect(pack.scoringWeights.technical_weight).toBe(0.55);
      expect(pack.culturalNotes).toContain('Western');

      expect(pack.behavioralDimensions).toHaveLength(6);
      expect(pack.behavioralDimensions[3]).toEqual({
        id: 'D4',
        name: 'Leadership & Initiative',
        weight: 0.2,
      });
      expect(pack.technicalDimensions).toHaveLength(5);
      expect(pack.technicalDimensions[0]).toEqual({
        id: 'TD1',
        name: 'Foundational Knowledge',
        weight: 0.2,
      });
    });
  });
});

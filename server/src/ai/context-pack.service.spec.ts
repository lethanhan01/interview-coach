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

  describe('normalized rubric read path', () => {
    it('map rubric_versions/categories/criteria từ DB về ContextPackConfig hiện tại', async () => {
      const prisma = {
        rubricVersion: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'rubric-v2',
            categories: [
              {
                categoryKey: 'behavioral',
                label: 'Behavioral',
                weight: 0.6,
                displayOrder: 1,
                criteria: [
                  {
                    code: 'D2',
                    name: 'Problem solving',
                    weight: 0.7,
                    displayOrder: 1,
                  },
                ],
              },
              {
                categoryKey: 'technical',
                label: 'Technical',
                weight: 0.4,
                displayOrder: 2,
                criteria: [
                  {
                    code: 'TD3',
                    name: 'Systems thinking',
                    weight: 1,
                    displayOrder: 1,
                  },
                ],
              },
            ],
          }),
        },
      };
      const dbBackedService = new ContextPackService(prisma as any);

      const pack = await dbBackedService.getContextPack('VN', 'rubric-v2');

      expect(prisma.rubricVersion.findFirst).toHaveBeenCalledWith({
        where: { id: 'rubric-v2', contextPackId: 'VN' },
        include: {
          categories: {
            orderBy: { displayOrder: 'asc' },
            include: {
              criteria: {
                where: { active: true },
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
        },
      });
      expect(pack).toEqual(
        expect.objectContaining({
          type: 'VN',
          rubricVersionId: 'rubric-v2',
          scoringWeights: {
            behavioral_weight: 0.6,
            technical_weight: 0.4,
          },
          behavioralDimensions: [
            { id: 'D2', name: 'Problem solving', weight: 0.7 },
          ],
          technicalDimensions: [
            { id: 'TD3', name: 'Systems thinking', weight: 1 },
          ],
        }),
      );
    });

    it('getRubricSnapshot dùng đúng rubricVersionId được yêu cầu', async () => {
      const prisma = {
        rubricVersion: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'rubric-v2',
            categories: [
              {
                categoryKey: 'behavioral',
                label: 'Behavioral',
                weight: 1,
                displayOrder: 1,
                criteria: [
                  {
                    code: 'D1',
                    name: 'Communication',
                    weight: 1,
                    displayOrder: 1,
                  },
                ],
              },
              {
                categoryKey: 'technical',
                label: 'Technical',
                weight: 0,
                displayOrder: 2,
                criteria: [],
              },
            ],
          }),
        },
      };
      const dbBackedService = new ContextPackService(prisma as any);

      await expect(
        dbBackedService.getRubricSnapshot('VN', 'rubric-v2'),
      ).resolves.toEqual({
        behavioral: { D1: { name: 'Communication', weight: 1 } },
        technical: {},
      });
      expect(prisma.rubricVersion.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rubric-v2', contextPackId: 'VN' },
        }),
      );
    });
  });
});

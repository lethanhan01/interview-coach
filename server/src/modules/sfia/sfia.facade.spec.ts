import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SFIA_FACADE_TOKEN, ISfiaFacade } from './contracts/sfia.facade.interface';
import { SfiaService } from './sfia.service';
import { SfiaFacade } from './sfia.facade';

describe('SfiaFacade & SfiaService', () => {
  let facade: ISfiaFacade;
  let service: SfiaService;

  const mockSkills = [
    {
      code: 'PROG',
      name: 'Software Development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'DEV',
      overallDescription: 'Designing and building software.',
      minLevel: 1,
      maxLevel: 6,
    },
    {
      code: 'DBDS',
      name: 'Database Design',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'DATA',
      overallDescription: 'Designing database architectures.',
      minLevel: 2,
      maxLevel: 5,
    },
  ];

  const mockLevels = [
    {
      levelId: 1,
      name: 'Follow',
      essence: 'Works under close direction.',
      description: 'Follows instructions.',
    },
    {
      levelId: 3,
      name: 'Apply',
      essence: 'Works under general direction.',
      description: 'Applies knowledge.',
    },
    {
      levelId: 4,
      name: 'Enable',
      essence: 'Works independently.',
      description: 'Enables others.',
    },
  ];

  const mockPrismaService = {
    $queryRaw: jest.fn().mockImplementation((query: any) => {
      const text = query?.strings ? query.strings.join(' ') : String(query);
      if (text.includes('sfia.skills')) {
        return Promise.resolve(mockSkills);
      }
      if (text.includes('sfia.levels')) {
        return Promise.resolve(mockLevels);
      }
      return Promise.resolve([]);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfiaService,
        SfiaFacade,
        {
          provide: SFIA_FACADE_TOKEN,
          useExisting: SfiaFacade,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    facade = module.get<ISfiaFacade>(SFIA_FACADE_TOKEN);
    service = module.get<SfiaService>(SfiaService);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(facade).toBeDefined();
    expect(service).toBeDefined();
    expect(service.isInitialized()).toBe(true);
  });

  describe('getSkillByCode', () => {
    it('should return skill by code with exact match', async () => {
      const start = performance.now();
      const skill = await facade.getSkillByCode('PROG');
      const elapsed = performance.now() - start;

      expect(skill).toBeDefined();
      expect(skill?.code).toBe('PROG');
      expect(skill?.name).toBe('Software Development');
      expect(skill?.categoryCode).toBe('DEV_IMPL');
      expect(skill?.minLevel).toBe(1);
      expect(skill?.maxLevel).toBe(6);
      expect(elapsed).toBeLessThan(10); // in-memory lookup < 10ms
    });

    it('should be case-insensitive (e.g. "prog" or "Prog")', async () => {
      const lower = await facade.getSkillByCode('prog');
      const mixed = await facade.getSkillByCode('PrOg');

      expect(lower).toBeDefined();
      expect(lower?.code).toBe('PROG');
      expect(mixed).toBeDefined();
      expect(mixed?.code).toBe('PROG');
    });

    it('should return null for non-existent skill code', async () => {
      const skill = await facade.getSkillByCode('UNKNOWN_CODE');
      expect(skill).toBeNull();
    });

    it('should return null for empty string or nullish', async () => {
      const empty = await facade.getSkillByCode('');
      expect(empty).toBeNull();
    });
  });

  describe('getLevel', () => {
    it('should return level by levelId', async () => {
      const level = await facade.getLevel(3);
      expect(level).toBeDefined();
      expect(level?.levelId).toBe(3);
      expect(level?.name).toBe('Apply');
      expect(level?.essence).toBe('Works under general direction.');
    });

    it('should return null for non-existent levelId', async () => {
      const level = await facade.getLevel(99);
      expect(level).toBeNull();
    });
  });

  describe('getAllSkills', () => {
    it('should return all cached skills', async () => {
      const all = await facade.getAllSkills();
      expect(all).toHaveLength(2);
      expect(all.map((s) => s.code)).toEqual(['PROG', 'DBDS']);
    });
  });

  describe('self-healing', () => {
    it('should trigger self-healing loadCache when service was not initialized', async () => {
      const uninitService = new SfiaService(mockPrismaService as any);
      expect(uninitService.isInitialized()).toBe(false);

      const skill = await uninitService.getSkillByCode('PROG');
      expect(skill?.code).toBe('PROG');
      expect(uninitService.isInitialized()).toBe(true);
    });
  });
});

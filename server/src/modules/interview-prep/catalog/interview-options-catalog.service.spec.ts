import { Test, TestingModule } from '@nestjs/testing';
import {
  type ISfiaFacade,
  SFIA_FACADE_TOKEN,
  SFIA_VI_TRANSLATIONS,
} from '@modules/sfia/contracts';
import { InterviewOptionsCatalogService } from './interview-options-catalog.service';

describe('InterviewOptionsCatalogService', () => {
  let service: InterviewOptionsCatalogService;
  let sfiaFacade: jest.Mocked<ISfiaFacade>;

  beforeEach(async () => {
    const mockSfiaFacade: jest.Mocked<ISfiaFacade> = {
      getSkillByCode: jest.fn(),
      getLevel: jest.fn(),
      getAllLevels: jest.fn().mockResolvedValue([
        {
          levelId: 1,
          name: 'Follow',
          nameVi: 'Theo dõi & Học việc',
          essence: 'Follows instructions',
          description: 'Works under close direction.',
        },
        {
          levelId: 2,
          name: 'Assist',
          essence: 'Assists with tasks',
          description: 'Works under routine direction.',
        },
      ]),
      getAllSkills: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewOptionsCatalogService,
        {
          provide: SFIA_FACADE_TOKEN,
          useValue: mockSfiaFacade,
        },
      ],
    }).compile();

    service = module.get(InterviewOptionsCatalogService);
    sfiaFacade = module.get(SFIA_FACADE_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns canonical interview options catalog with SFIA levels from facade', async () => {
    const result = await service.getInterviewOptions();

    expect(sfiaFacade.getAllLevels).toHaveBeenCalledTimes(1);

    // SFIA levels with nameVi fallback via SFIA_VI_TRANSLATIONS
    expect(result.sfiaLevels).toEqual([
      {
        levelId: 1,
        name: 'Follow',
        nameVi: 'Theo dõi & Học việc',
        essence: 'Follows instructions',
        description: 'Works under close direction.',
      },
      {
        levelId: 2,
        name: 'Assist',
        nameVi: SFIA_VI_TRANSLATIONS.levels[2],
        essence: 'Assists with tasks',
        description: 'Works under routine direction.',
      },
    ]);

    // JD levels: 6 items with fresher -> 2 and lead -> 5 (including manager alias)
    expect(result.jdLevels).toHaveLength(6);
    const fresher = result.jdLevels.find((l) => l.value === 'fresher');
    expect(fresher?.defaultSfiaLevel).toBe(2);
    const lead = result.jdLevels.find((l) => l.value === 'lead');
    expect(lead?.defaultSfiaLevel).toBe(5);
    expect(lead?.aliases).toContain('manager');

    // Durations, sessionTypes, contextPacks, bonusOptions, techCategories
    expect(result.durations).toEqual([
      { value: 30, label: '30 phút', numQuestions: 15 },
      { value: 60, label: '1 tiếng', numQuestions: 30 },
      { value: 90, label: '1 tiếng rưỡi', numQuestions: 45 },
    ]);
    expect(result.sessionTypes.map((s) => s.value)).toEqual([
      'hr',
      'technical',
    ]);
    expect(result.contextPacks.map((c) => c.value)).toEqual(['VN', 'Western']);

    // Education degrees without empty placeholders
    expect(result.educationDegrees).toHaveLength(7);
    expect(result.educationDegrees.every((o) => o.value !== '')).toBe(true);
  });
});

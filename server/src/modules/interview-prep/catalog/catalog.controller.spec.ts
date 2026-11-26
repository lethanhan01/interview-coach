import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@core/common/guards';
import { CatalogController } from './catalog.controller';
import { InterviewOptionsCatalogService } from './interview-options-catalog.service';
import type { InterviewOptionsCatalogResponse } from './dto/interview-options-response.dto';

describe('CatalogController', () => {
  let controller: CatalogController;
  let service: InterviewOptionsCatalogService;

  const mockCatalog: InterviewOptionsCatalogResponse = {
    jdLevels: [
      {
        value: 'fresher',
        label: 'Fresher',
        defaultSfiaLevel: 2,
        aliases: ['fresh', 'moi tot nghiep'],
      },
    ],
    sfiaLevels: [
      {
        levelId: 1,
        name: 'Follow',
        nameVi: 'Theo dõi & Học việc',
        essence: 'Follows instructions',
        description: 'Works under close direction.',
      },
    ],
    durations: [{ value: 30, label: '30 phút', numQuestions: 15 }],
    sessionTypes: [
      {
        value: 'technical',
        label: 'Technical',
        shortLabel: 'Kỹ thuật',
        description: 'Câu hỏi kỹ thuật chuyên sâu theo JD',
      },
    ],
    contextPacks: [
      {
        value: 'VN',
        label: 'Việt Nam',
        description:
          'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương',
      },
    ],
    educationDegrees: [{ value: 'bachelor', label: 'Đại học (Cử nhân)' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        {
          provide: InterviewOptionsCatalogService,
          useValue: {
            getInterviewOptions: jest.fn().mockResolvedValue(mockCatalog),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CatalogController);
    service = module.get(InterviewOptionsCatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /catalog/interview-options', () => {
    it('delegates to interviewOptionsCatalogService.getInterviewOptions', async () => {
      const spy = jest.spyOn(service, 'getInterviewOptions');
      const result = await controller.getInterviewOptions();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCatalog);
    });
  });
});

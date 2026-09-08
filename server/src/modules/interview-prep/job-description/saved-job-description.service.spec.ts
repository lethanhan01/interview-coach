import { Test, TestingModule } from '@nestjs/testing';
import {
  SavedJobDescriptionService,
  inferTargetSfiaLevel,
} from './saved-job-description.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { createMockPrismaService } from '@core/test-utils/mock-factories';
import { ONET_FACADE_TOKEN, IOnetFacade } from '@modules/onet/contracts';

const BASE_DTO = {
  companyName: 'FPT Software',
  companyWebsite: 'https://fptsoftware.com',
  jobTitle: 'Backend Developer',
  level: 'middle',
  headcount: '2 người',
  location: 'Hà Nội',
  requirements: 'Có kinh nghiệm Node.js, SQL và thiết kế API RESTful.',
  jobContent:
    'Xây dựng backend service, tích hợp database và tối ưu hiệu năng.',
  techStack: ['node.js', 'postgresql'],
  benefits: 'Bảo hiểm sức khỏe, đào tạo nội bộ',
  salary: '20-30 triệu',
  bonus: 'Tháng 13',
};

describe('inferTargetSfiaLevel', () => {
  it('should infer Level 5 for Lead / Principal / Architect in title or level', () => {
    expect(inferTargetSfiaLevel('Lead Developer', 'Tech Lead')).toBe(5);
    expect(inferTargetSfiaLevel('Middle', 'Solutions Architect')).toBe(5);
    expect(inferTargetSfiaLevel(null, 'Principal Engineer')).toBe(5);
    expect(inferTargetSfiaLevel('Team Lead', 'Backend Engineer')).toBe(5);
  });

  it('should infer Level 4 for Senior', () => {
    expect(inferTargetSfiaLevel('senior', 'Software Developer')).toBe(4);
    expect(inferTargetSfiaLevel(null, 'Senior Backend Developer')).toBe(4);
    expect(inferTargetSfiaLevel('Chuyên viên cao cấp', 'Kỹ sư phần mềm')).toBe(
      4,
    );
  });

  it('should infer Level 2 for Junior / Fresher', () => {
    expect(inferTargetSfiaLevel('junior', 'Developer')).toBe(2);
    expect(inferTargetSfiaLevel(null, 'Fresher ReactJS')).toBe(2);
    expect(inferTargetSfiaLevel('Associate', 'Backend Engineer')).toBe(2);
  });

  it('should infer Level 1 for Intern', () => {
    expect(inferTargetSfiaLevel('intern', 'Developer')).toBe(1);
    expect(inferTargetSfiaLevel(null, 'Thực tập sinh Java')).toBe(1);
  });

  it('should default to Level 3 for Middle or unspecified levels', () => {
    expect(inferTargetSfiaLevel('middle', 'Developer')).toBe(3);
    expect(inferTargetSfiaLevel(null, 'Developer')).toBe(3);
  });

  it('should NOT misclassify Junior as Level 5 when content has "leading" or "leadership"', () => {
    expect(
      inferTargetSfiaLevel(
        'junior',
        'Junior Node.js Developer',
        'We are a leading fintech company in Southeast Asia. Looking for someone with leadership potential.',
      ),
    ).toBe(2);

    expect(
      inferTargetSfiaLevel(
        'junior',
        'Developer',
        'We are leading the digital transformation market.',
      ),
    ).toBe(2);
  });

  it('should prioritize explicit level over job content references', () => {
    expect(
      inferTargetSfiaLevel(
        'junior',
        'Developer',
        'You will work closely and report to the Tech Lead of the department.',
      ),
    ).toBe(2);

    expect(
      inferTargetSfiaLevel(
        'senior',
        'Developer',
        'Direct report to Engineering Director.',
      ),
    ).toBe(4);
  });

  it('should infer Level 5 from job content only when explicit role phrase is present and level/title are generic', () => {
    expect(
      inferTargetSfiaLevel(
        null,
        'Software Engineer',
        'We are looking for a Tech Lead to manage 10 developers.',
      ),
    ).toBe(5);

    expect(
      inferTargetSfiaLevel(
        null,
        'Software Engineer',
        'Company is leading in retail industry.',
      ),
    ).toBe(3);
  });
});

describe('SavedJobDescriptionService', () => {
  let service: SavedJobDescriptionService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockOnetFacade: Partial<jest.Mocked<IOnetFacade>>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockOnetFacade = {
      findOccupationByTitle: jest.fn().mockResolvedValue({
        socCode: '15-1252.00',
        title: 'Software Developers',
        description: 'Develop software applications',
      }),
      getToolsAndTechnology: jest.fn().mockResolvedValue([
        {
          commodityCode: 43232408,
          commodityTitle: 'Development software',
          example: 'Node.js',
          isHotTechnology: true,
        },
        {
          commodityCode: 43232304,
          commodityTitle: 'Database management software',
          example: 'PostgreSQL',
          isHotTechnology: true,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedJobDescriptionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ONET_FACADE_TOKEN, useValue: mockOnetFacade },
      ],
    }).compile();

    service = module.get(SavedJobDescriptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('liệt kê JD đã lưu của user theo lần dùng gần nhất', async () => {
    mockPrisma.savedJobDescription.findMany.mockResolvedValue([
      { id: 'saved-1', userId: 'user-abc' },
    ]);

    const result = await service.findAll('user-abc');

    expect(result).toEqual([{ id: 'saved-1', userId: 'user-abc' }]);
    expect(mockPrisma.savedJobDescription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-abc', deletedAt: null },
      orderBy: [{ lastUsedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  });

  it('tạo JD mới khi chưa có company/title trùng kèm thông tin O*NET và SFIA', async () => {
    mockPrisma.savedJobDescription.findFirst.mockResolvedValue(null);
    mockPrisma.savedJobDescription.create.mockResolvedValue({
      id: 'saved-1',
      userId: 'user-abc',
      ...BASE_DTO,
      onetSocCode: '15-1252.00',
      onetOccupationTitle: 'Software Developers',
      targetSfiaLevel: 3,
      normalizedTechStack: ['Node.js', 'PostgreSQL'],
    });

    const result = await service.save('user-abc', BASE_DTO);

    expect(result.id).toBe('saved-1');
    expect(mockOnetFacade.findOccupationByTitle).toHaveBeenCalledWith(
      'Backend Developer',
    );
    expect(mockOnetFacade.getToolsAndTechnology).toHaveBeenCalledWith(
      '15-1252.00',
    );
    expect(mockPrisma.savedJobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-abc',
        companyName: 'FPT Software',
        jobTitle: 'Backend Developer',
        level: 'middle',
        onetSocCode: '15-1252.00',
        onetOccupationTitle: 'Software Developers',
        targetSfiaLevel: 3,
        normalizedTechStack: ['Node.js', 'PostgreSQL'],
        lastUsedAt: expect.any(Date),
      }),
    });
  });

  it('cập nhật JD cũ khi company/title đã tồn tại', async () => {
    mockPrisma.savedJobDescription.findFirst.mockResolvedValue({
      id: 'saved-1',
      userId: 'user-abc',
    });
    mockPrisma.savedJobDescription.update.mockResolvedValue({
      id: 'saved-1',
      userId: 'user-abc',
      ...BASE_DTO,
    });

    await service.save('user-abc', {
      ...BASE_DTO,
      level: 'Senior',
      salary: '25-35 triệu',
    });

    expect(mockPrisma.savedJobDescription.update).toHaveBeenCalledWith({
      where: { id: 'saved-1' },
      data: expect.objectContaining({
        level: 'Senior',
        targetSfiaLevel: 4,
        salary: '25-35 triệu',
        lastUsedAt: expect.any(Date),
      }),
    });
  });

  it('ưu tiên targetSfiaLevel và onetSocCode do người dùng truyền vào trong DTO', async () => {
    mockPrisma.savedJobDescription.findFirst.mockResolvedValue(null);
    mockPrisma.savedJobDescription.create.mockResolvedValue({
      id: 'saved-custom',
      userId: 'user-abc',
    });

    await service.save('user-abc', {
      ...BASE_DTO,
      onetSocCode: '15-1212.00',
      onetOccupationTitle: 'Information Security Analysts',
      targetSfiaLevel: 5,
    });

    expect(mockPrisma.savedJobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-abc',
        onetSocCode: '15-1212.00',
        onetOccupationTitle: 'Information Security Analysts',
        targetSfiaLevel: 5,
      }),
    });
  });
});

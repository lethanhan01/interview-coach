import { Test, TestingModule } from '@nestjs/testing';
import { SavedJobDescriptionService } from './saved-job-description.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../test-utils/mock-factories';

const BASE_DTO = {
  companyName: 'FPT Software',
  companyWebsite: 'https://fptsoftware.com',
  jobTitle: 'Backend Developer',
  headcount: '2 người',
  location: 'Hà Nội',
  requirements: 'Có kinh nghiệm Node.js, SQL và thiết kế API RESTful.',
  jobContent:
    'Xây dựng backend service, tích hợp database và tối ưu hiệu năng.',
  techStack: ['Node.js', 'PostgreSQL'],
  benefits: 'Bảo hiểm sức khỏe, đào tạo nội bộ',
  salary: '20-30 triệu',
  bonus: 'Tháng 13',
};

describe('SavedJobDescriptionService', () => {
  let service: SavedJobDescriptionService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedJobDescriptionService,
        { provide: PrismaService, useValue: mockPrisma },
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

  it('tạo JD mới khi chưa có company/title trùng', async () => {
    mockPrisma.savedJobDescription.findFirst.mockResolvedValue(null);
    mockPrisma.savedJobDescription.create.mockResolvedValue({
      id: 'saved-1',
      userId: 'user-abc',
      ...BASE_DTO,
    });

    const result = await service.save('user-abc', BASE_DTO);

    expect(result.id).toBe('saved-1');
    expect(mockPrisma.savedJobDescription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-abc',
        companyName: 'FPT Software',
        jobTitle: 'Backend Developer',
        techStack: ['Node.js', 'PostgreSQL'],
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
      salary: '25-35 triệu',
    });

    expect(mockPrisma.savedJobDescription.update).toHaveBeenCalledWith({
      where: { id: 'saved-1' },
      data: expect.objectContaining({
        salary: '25-35 triệu',
        lastUsedAt: expect.any(Date),
      }),
    });
  });
});

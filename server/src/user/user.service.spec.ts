import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { createMockPrismaService } from '../test-utils/mock-factories';
import { Prisma } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  const BASE_USER = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    profile: null,
    resumes: [],
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('trả về user với profile (không có resume) khi tìm thấy', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      const result = await service.getProfile('user-123');

      // resumes array bị bỏ khỏi response, profile null giữ nguyên
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        createdAt: BASE_USER.createdAt,
        profile: null,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          profile: true,
          resumes: {
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    });

    it('merge parsed_json của resume active vào profile (contract phẳng)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...BASE_USER,
        profile: { userId: 'user-123', fullName: 'Nguyen Van A' },
        resumes: [
          {
            id: 'resume-1',
            parsedJson: {
              education: [{ school: 'HUST' }],
              technicalSkills: [{ name: 'TypeScript' }],
            },
          },
        ],
      });

      const result = (await service.getProfile('user-123')) as {
        profile: Record<string, unknown>;
        resumes?: unknown;
      };

      expect(result.profile).toEqual({
        userId: 'user-123',
        fullName: 'Nguyen Van A',
        education: [{ school: 'HUST' }],
        technicalSkills: [{ name: 'TypeScript' }],
      });
      expect(result.resumes).toBeUndefined();
    });

    it('ném NOT_FOUND (404) khi user không tồn tại', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.user.findUnique.mockResolvedValue(null);
      try {
        await service.getProfile('nonexistent');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.NOT_FOUND);
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.NOT_FOUND,
        );
      }
    });
  });

  describe('upsertProfile', () => {
    it('tách field resume khỏi userProfile.upsert; chỉ field profile thuần đi vào user_profiles', async () => {
      const dto = {
        fullName: 'Nguyen Van A',
        targetPosition: 'Backend Dev',
        technicalSkills: [{ name: 'TypeScript' }],
        certifications: [],
        awards: [],
      };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.resume.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      const profileOnly = {
        fullName: 'Nguyen Van A',
        targetPosition: 'Backend Dev',
      };
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: { ...profileOnly, userId: 'user-123' },
        update: profileOnly,
      });
    });

    it('tạo resume thủ công mới khi chưa có resume active', async () => {
      const dto = {
        education: { school: 'HUST' },
        technicalSkills: [{ name: 'TypeScript' }],
      };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.resume.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.resume.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          parsedJson: dto,
          active: true,
        },
      });
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('merge patch vào parsed_json của resume active đã có (PATCH từng phần)', async () => {
      const dto = { technicalSkills: [{ name: 'Go' }] };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.resume.findFirst.mockResolvedValue({
        id: 'resume-1',
        parsedJson: { education: [{ school: 'HUST' }], technicalSkills: [] },
      });
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-1' },
        data: {
          parsedJson: {
            education: [{ school: 'HUST' }],
            technicalSkills: [{ name: 'Go' }],
          },
        },
      });
      expect(mockPrisma.resume.create).not.toHaveBeenCalled();
    });

    it('bắt race khi tạo resume active và merge vào row thắng unique constraint', async () => {
      const dto = { technicalSkills: [{ name: 'TypeScript' }] };
      const uniqueError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on active resume',
        {
          code: 'P2002',
          clientVersion: 'test',
        },
      );
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.resume.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'resume-winner',
          parsedJson: { education: [{ school: 'HUST' }] },
        });
      mockPrisma.resume.create.mockRejectedValue(uniqueError);
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-winner' },
        data: {
          parsedJson: {
            education: [{ school: 'HUST' }],
            technicalSkills: [{ name: 'TypeScript' }],
          },
        },
      });
    });

    it('không đụng tới resume khi dto chỉ chứa field profile thuần', async () => {
      const dto = { fullName: 'Nguyen Van A' };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.resume.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.resume.create).not.toHaveBeenCalled();
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });
  });
});

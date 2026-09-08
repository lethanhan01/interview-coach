import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SfiaRepository } from './sfia.repository';
import { ISfiaRepository, SFIA_REPOSITORY_TOKEN } from '../domain/sfia-repository.interface';

describe('SfiaRepository', () => {
  let repository: ISfiaRepository;
  let queryRawMock: jest.Mock;

  const mockRawSkills = [
    {
      code: 'PROG',
      name: 'Software Development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'DEV',
      overallDescription: 'Designing and building software.',
      minLevel: 1,
      maxLevel: 6,
    },
  ];

  const mockRawLevels = [
    {
      levelId: 1,
      name: 'Follow',
      essence: 'Works under close direction.',
      description: 'Follows instructions.',
    },
  ];

  beforeEach(async () => {
    queryRawMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfiaRepository,
        {
          provide: SFIA_REPOSITORY_TOKEN,
          useExisting: SfiaRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: queryRawMock,
          },
        },
      ],
    }).compile();

    repository = module.get<ISfiaRepository>(SFIA_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('loadAllRawSkills', () => {
    it('returns raw skills from database', async () => {
      queryRawMock.mockResolvedValueOnce(mockRawSkills);
      const skills = await repository.loadAllRawSkills();
      expect(skills).toEqual(mockRawSkills);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it('uses transaction client when provided', async () => {
      const txQueryRaw = jest.fn().mockResolvedValueOnce(mockRawSkills);
      const mockTx = { $queryRaw: txQueryRaw } as any;

      const skills = await repository.loadAllRawSkills(mockTx);
      expect(skills).toEqual(mockRawSkills);
      expect(txQueryRaw).toHaveBeenCalledTimes(1);
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it('throws error when database query fails', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('DB Error'));
      await expect(repository.loadAllRawSkills()).rejects.toThrow('DB Error');
    });
  });

  describe('loadAllRawLevels', () => {
    it('returns raw levels from database', async () => {
      queryRawMock.mockResolvedValueOnce(mockRawLevels);
      const levels = await repository.loadAllRawLevels();
      expect(levels).toEqual(mockRawLevels);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it('uses transaction client when provided', async () => {
      const txQueryRaw = jest.fn().mockResolvedValueOnce(mockRawLevels);
      const mockTx = { $queryRaw: txQueryRaw } as any;

      const levels = await repository.loadAllRawLevels(mockTx);
      expect(levels).toEqual(mockRawLevels);
      expect(txQueryRaw).toHaveBeenCalledTimes(1);
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it('throws error when database query fails', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('DB Error'));
      await expect(repository.loadAllRawLevels()).rejects.toThrow('DB Error');
    });
  });
});

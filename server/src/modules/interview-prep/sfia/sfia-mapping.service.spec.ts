import { SfiaMappingService } from './sfia-mapping.service';
import type { PrismaService } from '@infra/database/prisma/prisma.service';

describe('SfiaMappingService', () => {
  let service: SfiaMappingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      level: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'lvl-4-id',
          rank: 4,
          code: 'LEVEL_4',
          name: 'Level 4 - Enable',
        }),
      },
      role: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.code === 'BACKEND_DEV') {
            return Promise.resolve({
              id: 'role-backend-id',
              code: 'BACKEND_DEV',
              name: 'Backend Developer',
            });
          }
          return Promise.resolve(null);
        }),
      },
      roleLevelCompetency: {
        findMany: jest.fn().mockResolvedValue([
          {
            defaultWeight: 0.4,
            priority: 1,
            competency: {
              id: 'comp-prog-id',
              code: 'PROG',
              name: 'Programming/software development',
              criteria: [
                {
                  levelDescription: 'Designs, codes and tests complex software services.',
                },
              ],
            },
          },
          {
            defaultWeight: 0.3,
            priority: 2,
            competency: {
              id: 'comp-dbds-id',
              code: 'DBDS',
              name: 'Database design',
              criteria: [
                {
                  levelDescription: 'Designs relational and non-relational database structures.',
                },
              ],
            },
          },
        ]),
      },
      skillCompetencyMapping: {
        findMany: jest.fn().mockResolvedValue([
          {
            skillName: 'PostgreSQL',
            competency: {
              id: 'comp-dbds-id',
              code: 'DBDS',
              name: 'Database design',
              criteria: [
                {
                  levelDescription: 'Designs relational and non-relational database structures.',
                },
              ],
            },
          },
        ]),
      },
      competency: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new SfiaMappingService(mockPrisma as unknown as PrismaService);
  });

  it('should infer SFIA competencies for Backend Developer with PostgreSQL stack', async () => {
    const result = await service.inferCompetenciesForJob({
      jobTitle: 'Senior Backend Engineer',
      targetLevelRank: 4,
      techStack: ['PostgreSQL'],
    });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(2);

    const progComp = result.find((c) => c.competencyCode === 'PROG');
    const dbdsComp = result.find((c) => c.competencyCode === 'DBDS');

    expect(progComp).toBeDefined();
    expect(progComp?.source).toBe('role_matrix');
    expect(dbdsComp).toBeDefined();
    expect(dbdsComp?.matchedKeywords).toContain('PostgreSQL');

    // Total weight should be normalized to 1.0
    const totalWeight = result.reduce((acc, c) => acc + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 1);
  });
});

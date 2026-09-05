import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  ISfiaFacade,
  SFIA_FACADE_TOKEN,
  SfiaSkillDto,
} from '@modules/sfia/contracts';
import {
  AI_GATEWAY_TOKEN,
  IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { HybridMappingService } from './hybrid-mapping.service';

describe('HybridMappingService', () => {
  let service: HybridMappingService;
  let prismaMock: {
    onetSfiaMapping: {
      findMany: jest.Mock;
      createMany: jest.Mock;
    };
  };
  let sfiaFacadeMock: {
    getAllSkills: jest.Mock;
    getSkillByCode: jest.Mock;
  };
  let aiGatewayMock: {
    generateStructured: jest.Mock;
  };

  const sampleSfiaSkills: SfiaSkillDto[] = [
    {
      code: 'PROG',
      name: 'Software Development',
      categoryCode: 'DEV',
      subcategoryCode: 'DEV_ENG',
      overallDescription: 'Programming and software creation',
      minLevel: 1,
      maxLevel: 6,
    },
    {
      code: 'TEST',
      name: 'Testing',
      categoryCode: 'DEV',
      subcategoryCode: 'DEV_TEST',
      overallDescription: 'Software testing and quality validation',
      minLevel: 1,
      maxLevel: 6,
    },
    {
      code: 'DBDS',
      name: 'Database Design',
      categoryCode: 'DATA',
      subcategoryCode: 'DATA_ENG',
      overallDescription: 'Database structure and optimization',
      minLevel: 2,
      maxLevel: 6,
    },
    {
      code: 'ITOP',
      name: 'IT Infrastructure Operations',
      categoryCode: 'OPS',
      subcategoryCode: 'OPS_INFRA',
      overallDescription: 'Infrastructure and operations',
      minLevel: 2,
      maxLevel: 5,
    },
  ];

  beforeEach(async () => {
    prismaMock = {
      onetSfiaMapping: {
        findMany: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    sfiaFacadeMock = {
      getAllSkills: jest.fn().mockResolvedValue(sampleSfiaSkills),
      getSkillByCode: jest.fn(),
    };

    aiGatewayMock = {
      generateStructured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridMappingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SFIA_FACADE_TOKEN, useValue: sfiaFacadeMock },
        { provide: AI_GATEWAY_TOKEN, useValue: aiGatewayMock },
      ],
    }).compile();

    service = module.get<HybridMappingService>(HybridMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveSkillsForSession (HR)', () => {
    it('should return curated behavioral SFIA skills without techContext', async () => {
      const skills = await service.resolveSkillsForSession({
        sessionType: 'hr',
        targetLevel: 3,
        jdText: 'HR position requiring team collaboration',
        normalizedTechStack: ['JavaScript', 'PostgreSQL'],
      });

      expect(skills).toHaveLength(4);
      expect(skills.map((s) => s.skillCode)).toEqual([
        'ETMG',
        'RLMT',
        'PDSV',
        'OCDV',
      ]);
      expect(skills.every((s) => s.techContext.length === 0)).toBe(true);
      expect(skills.every((s) => s.targetLevel === 3)).toBe(true);
      expect(skills.every((s) => s.source === 'curated')).toBe(true);
    });
  });

  describe('resolveSkillsForSession (Technical - Curated Hit)', () => {
    it('should return curated skills from database when mapping exists', async () => {
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([
        {
          id: 'm1',
          onetSocCode: '15-1252.00',
          sfiaSkillCode: 'PROG',
          targetSfiaLevel: 3,
          defaultWeight: 1.5,
          isCore: true,
          source: 'curated',
        },
        {
          id: 'm2',
          onetSocCode: '15-1252.00',
          sfiaSkillCode: 'DBDS',
          targetSfiaLevel: 3,
          defaultWeight: 1.2,
          isCore: true,
          source: 'curated',
        },
      ]);

      const skills = await service.resolveSkillsForSession({
        sessionType: 'technical',
        socCode: '15-1252.00',
        targetLevel: 3,
        jdText: 'Backend Developer job with NestJS and PostgreSQL',
        normalizedTechStack: ['Node.js', 'PostgreSQL', 'Docker'],
      });

      expect(skills).toHaveLength(2);
      expect(skills[0].skillCode).toBe('PROG');
      expect(skills[0].weight).toBe(1.5);
      expect(skills[0].isCore).toBe(true);
      expect(skills[0].techContext).toContain('Node.js');

      expect(skills[1].skillCode).toBe('DBDS');
      expect(skills[1].weight).toBe(1.2);
      expect(skills[1].techContext).toContain('PostgreSQL');
      expect(skills[1].techContext).not.toContain('Node.js');

      expect(aiGatewayMock.generateStructured).not.toHaveBeenCalled();
    });
  });

  describe('resolveSkillsForSession (Technical - Cache Miss -> AI Inference)', () => {
    it('should infer skills via AI, save cache to database, and return resolved skills', async () => {
      // First findMany returns empty array
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([]);

      aiGatewayMock.generateStructured.mockResolvedValueOnce({
        skills: [
          { skillCode: 'PROG', isCore: true, weight: 1.5 },
          { skillCode: 'TEST', isCore: true, weight: 1.0 },
        ],
      });

      const skills = await service.resolveSkillsForSession({
        sessionType: 'technical',
        socCode: '15-1252.00',
        targetLevel: 4,
        jdText: 'Senior Software Engineer with strong programming and testing skills',
        normalizedTechStack: ['TypeScript', 'Jest'],
      });

      expect(skills).toHaveLength(2);
      expect(skills[0].skillCode).toBe('PROG');
      expect(skills[0].source).toBe('ai_inferred');
      expect(skills[1].skillCode).toBe('TEST');
      expect(skills[1].source).toBe('ai_inferred');

      // Verify AI Gateway call
      expect(aiGatewayMock.generateStructured).toHaveBeenCalledTimes(1);

      // Verify caching to DB
      expect(prismaMock.onetSfiaMapping.createMany).toHaveBeenCalledWith({
        data: [
          {
            onetSocCode: '15-1252.00',
            sfiaSkillCode: 'PROG',
            targetSfiaLevel: 4,
            defaultWeight: 1.5,
            isCore: true,
            source: 'ai_inferred',
          },
          {
            onetSocCode: '15-1252.00',
            sfiaSkillCode: 'TEST',
            targetSfiaLevel: 4,
            defaultWeight: 1.0,
            isCore: true,
            source: 'ai_inferred',
          },
        ],
        skipDuplicates: true,
      });
    });
  });

  describe('resolveSkillsForSession (Technical - Cache Miss + AI Error -> Safe Fallback)', () => {
    it('should gracefully fallback to existing SOC mappings or default skills without throwing', async () => {
      // First findMany returns empty array
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([]);

      // AI throws error (quota exceeded, network timeout, etc.)
      aiGatewayMock.generateStructured.mockRejectedValueOnce(
        new Error('AI Gateway rate limit exceeded'),
      );

      // Fallback query for same SOC at any other level returns a mapping
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([
        {
          id: 'fallback_1',
          onetSocCode: '15-1252.00',
          sfiaSkillCode: 'PROG',
          targetSfiaLevel: 3,
          defaultWeight: 1.5,
          isCore: true,
          source: 'curated',
        },
      ]);

      const skills = await service.resolveSkillsForSession({
        sessionType: 'technical',
        socCode: '15-1252.00',
        targetLevel: 4,
        jdText: 'Software Engineer',
        normalizedTechStack: ['Node.js'],
      });

      expect(skills).toHaveLength(1);
      expect(skills[0].skillCode).toBe('PROG');
      expect(skills[0].targetLevel).toBe(4);
      expect(skills[0].source).toBe('fallback');
    });

    it('should use default IT resilience skills if database has no mapping for this SOC at all', async () => {
      // Initial query empty
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([]);

      // AI throws error
      aiGatewayMock.generateStructured.mockRejectedValueOnce(
        new Error('Network error'),
      );

      // Fallback query for other levels also empty
      prismaMock.onetSfiaMapping.findMany.mockResolvedValueOnce([]);

      const skills = await service.resolveSkillsForSession({
        sessionType: 'technical',
        socCode: '99-9999.00',
        targetLevel: 4,
        jdText: 'Unknown Role',
        normalizedTechStack: ['Node.js'],
      });

      expect(skills.length).toBeGreaterThanOrEqual(2);
      expect(skills.map((s) => s.skillCode)).toContain('PROG');
      expect(skills.map((s) => s.skillCode)).toContain('TEST');
      expect(skills.every((s) => s.source === 'fallback')).toBe(true);
    });
  });

  describe('distributeTechContext', () => {
    it('should assign database tech to DBDS and dev tech to PROG and ops tech to ITOP', () => {
      const techStack = [
        'PostgreSQL',
        'Redis',
        'Node.js',
        'TypeScript',
        'Docker',
        'Kubernetes',
      ];

      const dbContext = service.distributeTechContext('DBDS', techStack);
      expect(dbContext).toContain('PostgreSQL');
      expect(dbContext).toContain('Redis');
      expect(dbContext).not.toContain('Node.js');
      expect(dbContext).not.toContain('Docker');

      const devContext = service.distributeTechContext('PROG', techStack);
      expect(devContext).toContain('Node.js');
      expect(devContext).toContain('TypeScript');
      expect(devContext).not.toContain('PostgreSQL');

      const opsContext = service.distributeTechContext('ITOP', techStack);
      expect(opsContext).toContain('Docker');
      expect(opsContext).toContain('Kubernetes');
      expect(opsContext).not.toContain('PostgreSQL');
    });
  });
});

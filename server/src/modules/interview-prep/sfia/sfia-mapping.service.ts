import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { InferredSessionCompetencyDto } from './dto/sfia-taxonomy-response.dto';

interface InferCompetenciesInput {
  jobTitle?: string;
  targetLevelRank?: number; // 1 to 7 (Default: 4 - Senior/Mid)
  techStack?: string[];
}

@Injectable()
export class SfiaMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Infers SFIA competencies with weights and criteria for an interview session
   * based on Job Title, target Level Rank and extracted Tech Stack keywords.
   */
  async inferCompetenciesForJob(
    input: InferCompetenciesInput,
  ): Promise<InferredSessionCompetencyDto[]> {
    const levelRank = input.targetLevelRank ?? 4;
    const techStack = input.techStack ?? [];
    const jobTitle = input.jobTitle?.toLowerCase() ?? '';

    // 1. Fetch matching level
    const targetLevel = await this.prisma.level.findFirst({
      where: { rank: levelRank },
    });

    const fallbackLevel =
      targetLevel ??
      (await this.prisma.level.findFirst({
        where: { rank: 4 },
      }));

    if (!fallbackLevel) {
      return [];
    }

    // 2. Try to match standard Role
    let roleCode: string | null = null;
    if (jobTitle.includes('backend') || jobTitle.includes('back-end') || jobTitle.includes('api') || jobTitle.includes('node') || jobTitle.includes('server')) {
      roleCode = 'BACKEND_DEV';
    } else if (jobTitle.includes('frontend') || jobTitle.includes('front-end') || jobTitle.includes('react') || jobTitle.includes('ui')) {
      roleCode = 'FRONTEND_DEV';
    } else if (jobTitle.includes('fullstack') || jobTitle.includes('full-stack')) {
      roleCode = 'FULLSTACK_DEV';
    }

    const matchedRole = roleCode
      ? await this.prisma.role.findFirst({ where: { code: roleCode } })
      : null;

    const competencyMap = new Map<
      string,
      {
        competencyId: string;
        competencyCode: string;
        competencyName: string;
        targetLevelRank: number;
        targetLevelName: string;
        levelDescription: string;
        weight: number;
        priority: number;
        source: 'role_matrix' | 'jd_tech_stack' | 'fallback_general';
        matchedKeywords: string[];
      }
    >();

    // 3. Add competencies from standard Role if found
    if (matchedRole) {
      const roleCompetencies = await this.prisma.roleLevelCompetency.findMany({
        where: { roleId: matchedRole.id },
        include: {
          competency: {
            include: {
              criteria: {
                where: { levelId: fallbackLevel.id },
                include: { level: true },
              },
            },
          },
          targetLevel: true,
        },
      });

      for (const rc of roleCompetencies) {
        const crit = rc.competency.criteria[0];
        competencyMap.set(rc.competency.id, {
          competencyId: rc.competency.id,
          competencyCode: rc.competency.code,
          competencyName: rc.competency.name,
          targetLevelRank: fallbackLevel.rank,
          targetLevelName: fallbackLevel.name,
          levelDescription: crit?.levelDescription ?? rc.competency.name,
          weight: Number(rc.defaultWeight),
          priority: rc.priority ?? 1,
          source: 'role_matrix',
          matchedKeywords: [],
        });
      }
    }

    // 4. Match competencies from Tech Stack keywords
    if (techStack.length > 0) {
      const mappings = await this.prisma.skillCompetencyMapping.findMany({
        where: {
          skillName: { in: techStack, mode: 'insensitive' },
        },
        include: {
          competency: {
            include: {
              criteria: {
                where: { levelId: fallbackLevel.id },
                include: { level: true },
              },
            },
          },
        },
      });

      for (const m of mappings) {
        const existing = competencyMap.get(m.competency.id);
        const crit = m.competency.criteria[0];

        if (existing) {
          existing.matchedKeywords.push(m.skillName);
          existing.weight = Math.min(1.0, existing.weight + 0.05);
        } else {
          competencyMap.set(m.competency.id, {
            competencyId: m.competency.id,
            competencyCode: m.competency.code,
            competencyName: m.competency.name,
            targetLevelRank: fallbackLevel.rank,
            targetLevelName: fallbackLevel.name,
            levelDescription: crit?.levelDescription ?? m.competency.name,
            weight: 0.25,
            priority: 2,
            source: 'jd_tech_stack',
            matchedKeywords: [m.skillName],
          });
        }
      }
    }

    // 5. Fallback: If no competencies matched, get default PROG and DBDS
    if (competencyMap.size === 0) {
      const defaultComps = await this.prisma.competency.findMany({
        where: { code: { in: ['PROG', 'DBDS', 'TEST'] } },
        include: {
          criteria: {
            where: { levelId: fallbackLevel.id },
            include: { level: true },
          },
        },
      });

      for (const dc of defaultComps) {
        const crit = dc.criteria[0];
        competencyMap.set(dc.id, {
          competencyId: dc.id,
          competencyCode: dc.code,
          competencyName: dc.name,
          targetLevelRank: fallbackLevel.rank,
          targetLevelName: fallbackLevel.name,
          levelDescription: crit?.levelDescription ?? dc.name,
          weight: 0.33,
          priority: 1,
          source: 'fallback_general',
          matchedKeywords: [],
        });
      }
    }

    // 6. Normalize weights so total weight = 1.0
    const rawList = Array.from(competencyMap.values());
    const totalWeight = rawList.reduce((acc, c) => acc + c.weight, 0);

    return rawList.map((c) => ({
      ...c,
      weight: totalWeight > 0 ? Number((c.weight / totalWeight).toFixed(2)) : 0.25,
    }));
  }
}

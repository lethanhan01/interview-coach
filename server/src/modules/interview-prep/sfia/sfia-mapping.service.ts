import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { InferredSessionSkillDto, InferredSessionCompetencyDto } from './dto/sfia-taxonomy-response.dto';
import { resolveTechStackToSfiaCode } from './constants/tech-stack-sfia.map';

interface InferSkillsInput {
  jobTitle?: string;
  targetLevelRank?: number; // 1 to 7 (Default: 4 - Senior/Mid)
  techStack?: string[];
}

@Injectable()
export class SfiaMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Infers SFIA skills with weights and skill levels for an interview session
   * based on Job Title, target Level Rank and extracted Tech Stack keywords.
   */
  async inferSkillsForJob(
    input: InferSkillsInput,
  ): Promise<InferredSessionSkillDto[]> {
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

    const skillMap = new Map<
      string,
      {
        skillId: string;
        skillCode: string;
        skillName: string;
        targetLevelRank: number;
        targetLevelName: string;
        levelDescription: string;
        weight: number;
        priority: number;
        source: 'role_matrix' | 'jd_tech_stack' | 'fallback_general';
        matchedKeywords: string[];
      }
    >();

    // 3. Add skills from standard Role if found
    if (matchedRole) {
      const roleSkills = await this.prisma.roleSkill.findMany({
        where: { roleId: matchedRole.id },
        include: {
          skill: {
            include: {
              skillLevels: {
                where: { levelId: fallbackLevel.id },
                include: { level: true },
              },
            },
          },
          targetLevel: true,
        },
      });

      for (const rs of roleSkills) {
        const crit = rs.skill.skillLevels[0];
        skillMap.set(rs.skill.id, {
          skillId: rs.skill.id,
          skillCode: rs.skill.code,
          skillName: rs.skill.name,
          targetLevelRank: fallbackLevel.rank,
          targetLevelName: fallbackLevel.name,
          levelDescription: crit?.levelDescription ?? rs.skill.name,
          weight: Number(rs.defaultWeight),
          priority: rs.priority ?? 1,
          source: 'role_matrix',
          matchedKeywords: [],
        });
      }
    }

    // 4. Match skills from Tech Stack keywords (In-Memory Dictionary)
    if (techStack.length > 0) {
      const matchedCodeToKeywords = new Map<string, string[]>();
      for (const keyword of techStack) {
        const sfiaCode = resolveTechStackToSfiaCode(keyword);
        if (sfiaCode) {
          const list = matchedCodeToKeywords.get(sfiaCode) ?? [];
          list.push(keyword);
          matchedCodeToKeywords.set(sfiaCode, list);
        }
      }

      if (matchedCodeToKeywords.size > 0) {
        const matchedCodes = Array.from(matchedCodeToKeywords.keys());
        const matchedSkills = await this.prisma.skill.findMany({
          where: { code: { in: matchedCodes } },
          include: {
            skillLevels: {
              where: { levelId: fallbackLevel.id },
              include: { level: true },
            },
          },
        });

        for (const skill of matchedSkills) {
          const keywords = matchedCodeToKeywords.get(skill.code) ?? [];
          const existing = skillMap.get(skill.id);
          const crit = skill.skillLevels[0];

          if (existing) {
            existing.matchedKeywords.push(...keywords);
            existing.weight = Math.min(1.0, existing.weight + 0.05 * keywords.length);
          } else {
            skillMap.set(skill.id, {
              skillId: skill.id,
              skillCode: skill.code,
              skillName: skill.name,
              targetLevelRank: fallbackLevel.rank,
              targetLevelName: fallbackLevel.name,
              levelDescription: crit?.levelDescription ?? skill.name,
              weight: 0.25,
              priority: 2,
              source: 'jd_tech_stack',
              matchedKeywords: keywords,
            });
          }
        }
      }
    }

    // 5. Fallback: If no skills matched, get default PROG and DBDS
    if (skillMap.size === 0) {
      const defaultSkills = await this.prisma.skill.findMany({
        where: { code: { in: ['PROG', 'DBDS', 'TEST'] } },
        include: {
          skillLevels: {
            where: { levelId: fallbackLevel.id },
            include: { level: true },
          },
        },
      });

      for (const ds of defaultSkills) {
        const crit = ds.skillLevels[0];
        skillMap.set(ds.id, {
          skillId: ds.id,
          skillCode: ds.code,
          skillName: ds.name,
          targetLevelRank: fallbackLevel.rank,
          targetLevelName: fallbackLevel.name,
          levelDescription: crit?.levelDescription ?? ds.name,
          weight: 0.33,
          priority: 1,
          source: 'fallback_general',
          matchedKeywords: [],
        });
      }
    }

    // 6. Normalize weights so total weight = 1.0
    const rawList = Array.from(skillMap.values());
    const totalWeight = rawList.reduce((acc, c) => acc + c.weight, 0);

    return rawList.map((c) => ({
      ...c,
      competencyId: c.skillId,
      competencyCode: c.skillCode,
      competencyName: c.skillName,
      weight: totalWeight > 0 ? Number((c.weight / totalWeight).toFixed(2)) : 0.25,
    }));
  }

  // Alias for backwards compatibility
  async inferCompetenciesForJob(
    input: InferSkillsInput,
  ): Promise<InferredSessionCompetencyDto[]> {
    return this.inferSkillsForJob(input);
  }
}

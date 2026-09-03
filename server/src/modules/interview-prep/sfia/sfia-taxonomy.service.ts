import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { SfiaSkillDto, SfiaCompetencyDto } from './dto/sfia-taxonomy-response.dto';

@Injectable()
export class SfiaTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    const skills = await this.prisma.skill.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        categoryCode: true,
        categoryName: true,
        subcategoryCode: true,
        subcategoryName: true,
      },
    });

    const categoryMap = new Map<
      string,
      {
        code: string;
        name: string;
        subcategories: Map<string, { code: string; name: string }>;
      }
    >();

    for (const skill of skills) {
      if (!categoryMap.has(skill.categoryCode)) {
        categoryMap.set(skill.categoryCode, {
          code: skill.categoryCode,
          name: skill.categoryName,
          subcategories: new Map(),
        });
      }
      const cat = categoryMap.get(skill.categoryCode)!;
      if (!cat.subcategories.has(skill.subcategoryCode)) {
        cat.subcategories.set(skill.subcategoryCode, {
          code: skill.subcategoryCode,
          name: skill.subcategoryName,
        });
      }
    }

    return Array.from(categoryMap.values()).map((cat) => ({
      code: cat.code,
      name: cat.name,
      subcategories: Array.from(cat.subcategories.values()),
    }));
  }

  async getAllLevels() {
    return this.prisma.level.findMany({
      orderBy: { rank: 'asc' },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        roleSkills: {
          include: {
            skill: true,
            targetLevel: true,
          },
        },
      },
    });
  }

  async getSkillsBySfiaVersion(sfiaVersion = '9.0.0'): Promise<SfiaSkillDto[]> {
    const skills = await this.prisma.skill.findMany({
      where: { sfiaVersion },
      orderBy: { displayOrder: 'asc' },
      include: {
        skillLevels: {
          include: {
            level: true,
          },
          orderBy: { level: { rank: 'asc' } },
        },
      },
    });

    return skills.map((skill) => ({
      id: skill.id,
      code: skill.code,
      name: skill.name,
      overallDescription: skill.overallDescription,
      guidanceNotes: skill.guidanceNotes,
      categoryName: skill.categoryName,
      subcategoryName: skill.subcategoryName,
      skillLevels: skill.skillLevels.map((sl) => ({
        id: sl.id,
        code: sl.code,
        name: sl.name,
        levelRank: sl.level.rank,
        levelCode: sl.level.code,
        levelName: sl.level.name,
        levelDescription: sl.levelDescription,
        behavioralIndicators: Array.isArray(sl.behavioralIndicators)
          ? (sl.behavioralIndicators as any)
          : [],
        genericAttributes: (sl.genericAttributes as any) ?? null,
        weight: sl.weight ? Number(sl.weight) : undefined,
      })),
    }));
  }

  // Alias for backward compatibility
  async getCompetenciesBySfiaVersion(sfiaVersion = '9.0.0'): Promise<SfiaCompetencyDto[]> {
    return this.getSkillsBySfiaVersion(sfiaVersion);
  }

  async getCompetenciesByRubricVersion(rubricVersionId: string): Promise<SfiaCompetencyDto[]> {
    return this.getSkillsBySfiaVersion('9.0.0');
  }
}

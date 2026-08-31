import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { SfiaCompetencyDto } from './dto/sfia-taxonomy-response.dto';

@Injectable()
export class SfiaTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.competencyCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        subcategories: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async getAllLevels() {
    return this.prisma.level.findMany({
      orderBy: { rank: 'asc' },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        roleCompetencies: {
          include: {
            competency: true,
            targetLevel: true,
          },
        },
      },
    });
  }

  async getCompetenciesByRubricVersion(rubricVersionId: string): Promise<SfiaCompetencyDto[]> {
    const competencies = await this.prisma.competency.findMany({
      where: { rubricVersionId },
      orderBy: { displayOrder: 'asc' },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        criteria: {
          include: {
            level: true,
          },
          orderBy: { level: { rank: 'asc' } },
        },
      },
    });

    return competencies.map((comp) => ({
      id: comp.id,
      code: comp.code,
      name: comp.name,
      overallDescription: comp.overallDescription,
      guidanceNotes: comp.guidanceNotes,
      categoryName: comp.subcategory?.category.name,
      subcategoryName: comp.subcategory?.name,
      criteria: comp.criteria.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        levelRank: c.level.rank,
        levelCode: c.level.code,
        levelName: c.level.name,
        levelDescription: c.levelDescription,
        behavioralIndicators: Array.isArray(c.behavioralIndicators)
          ? (c.behavioralIndicators as string[])
          : [],
        weight: c.weight ? Number(c.weight) : undefined,
      })),
    }));
  }
}

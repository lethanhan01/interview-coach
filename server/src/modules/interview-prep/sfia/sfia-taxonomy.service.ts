import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { SfiaCompetencyDto } from './dto/sfia-taxonomy-response.dto';

@Injectable()
export class SfiaTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    const competencies = await this.prisma.competency.findMany({
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

    for (const comp of competencies) {
      if (!categoryMap.has(comp.categoryCode)) {
        categoryMap.set(comp.categoryCode, {
          code: comp.categoryCode,
          name: comp.categoryName,
          subcategories: new Map(),
        });
      }
      const cat = categoryMap.get(comp.categoryCode)!;
      if (!cat.subcategories.has(comp.subcategoryCode)) {
        cat.subcategories.set(comp.subcategoryCode, {
          code: comp.subcategoryCode,
          name: comp.subcategoryName,
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
        roleCompetencies: {
          include: {
            competency: true,
            targetLevel: true,
          },
        },
      },
    });
  }

  async getCompetenciesBySfiaVersion(sfiaVersion = '9.0.0'): Promise<SfiaCompetencyDto[]> {
    const competencies = await this.prisma.competency.findMany({
      where: { sfiaVersion },
      orderBy: { displayOrder: 'asc' },
      include: {
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
      categoryName: comp.categoryName,
      subcategoryName: comp.subcategoryName,
      criteria: comp.criteria.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        levelRank: c.level.rank,
        levelCode: c.level.code,
        levelName: c.level.name,
        levelDescription: c.levelDescription,
        behavioralIndicators: Array.isArray(c.behavioralIndicators)
          ? (c.behavioralIndicators as any)
          : [],
        genericAttributes: (c.genericAttributes as any) ?? null,
        weight: c.weight ? Number(c.weight) : undefined,
      })),
    }));
  }

  async getCompetenciesByRubricVersion(rubricVersionId: string): Promise<SfiaCompetencyDto[]> {
    return this.getCompetenciesBySfiaVersion('9.0.0');
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { SfiaLevelDto, SfiaSkillDto } from './contracts/sfia.dto';

@Injectable()
export class SfiaService implements OnModuleInit {
  private readonly logger = new Logger(SfiaService.name);
  private readonly skillMap = new Map<string, SfiaSkillDto>();
  private readonly levelMap = new Map<number, SfiaLevelDto>();
  private initialized = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.loadCache();
  }

  async loadCache(): Promise<void> {
    try {
      const rawSkills = await this.prisma.$queryRaw<
        Array<{
          code: string;
          name: string;
          categoryCode: string;
          subcategoryCode: string;
          overallDescription: string;
          minLevel: number;
          maxLevel: number;
        }>
      >`
        SELECT 
          s.code,
          s.name,
          COALESCE(sc.category_code, '') AS "categoryCode",
          s.subcategory_code AS "subcategoryCode",
          COALESCE(s.overall_description, '') AS "overallDescription",
          s.min_level AS "minLevel",
          s.max_level AS "maxLevel"
        FROM sfia.skills s
        LEFT JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        ORDER BY s.code ASC;
      `;

      this.skillMap.clear();
      for (const item of rawSkills) {
        this.skillMap.set(item.code.toUpperCase(), {
          code: item.code,
          name: item.name,
          categoryCode: item.categoryCode,
          subcategoryCode: item.subcategoryCode,
          overallDescription: item.overallDescription,
          minLevel: Number(item.minLevel),
          maxLevel: Number(item.maxLevel),
        });
      }

      const rawLevels = await this.prisma.$queryRaw<
        Array<{
          levelId: number;
          name: string;
          essence: string;
          description: string;
        }>
      >`
        SELECT 
          level_id AS "levelId",
          name,
          COALESCE(essence, '') AS essence,
          COALESCE(description, '') AS description
        FROM sfia.levels
        ORDER BY level_id ASC;
      `;

      this.levelMap.clear();
      for (const item of rawLevels) {
        const lvlId = Number(item.levelId);
        this.levelMap.set(lvlId, {
          levelId: lvlId,
          name: item.name,
          essence: item.essence,
          description: item.description,
        });
      }

      this.initialized = true;
      this.logger.log(
        `SFIA In-Memory Cache loaded successfully: ${this.skillMap.size} skills, ${this.levelMap.size} levels.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to load SFIA cache from database: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getSkillByCode(code: string): Promise<SfiaSkillDto | null> {
    if (!code) return null;
    if (!this.initialized) {
      await this.loadCache();
    }
    const skill = this.skillMap.get(code.trim().toUpperCase());
    return skill ? { ...skill } : null;
  }

  async getLevel(levelId: number): Promise<SfiaLevelDto | null> {
    if (typeof levelId !== 'number') return null;
    if (!this.initialized) {
      await this.loadCache();
    }
    const level = this.levelMap.get(levelId);
    return level ? { ...level } : null;
  }

  async getAllSkills(): Promise<SfiaSkillDto[]> {
    if (!this.initialized) {
      await this.loadCache();
    }
    return Array.from(this.skillMap.values()).map((s) => ({ ...s }));
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

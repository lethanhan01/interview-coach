import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SfiaLevelDto, SfiaSkillDto } from './contracts/sfia.dto';
import { SFIA_VI_TRANSLATIONS } from './contracts/sfia-vi-translations';
import { SFIA_REPOSITORY_TOKEN } from './domain/sfia-repository.interface';
import type { ISfiaRepository } from './domain/sfia-repository.interface';

@Injectable()
export class SfiaService implements OnModuleInit {
  private readonly logger = new Logger(SfiaService.name);
  private readonly skillMap = new Map<string, SfiaSkillDto>();
  private readonly levelMap = new Map<number, SfiaLevelDto>();
  private initialized = false;
  private loadPromise: Promise<void> | null = null;

  constructor(
    @Inject(SFIA_REPOSITORY_TOKEN)
    private readonly sfiaRepository: ISfiaRepository,
  ) {}

  onModuleInit(): void {
    void this.loadCache();
  }

  async loadCache(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = this.executeLoadCache().finally(() => {
      this.loadPromise = null;
    });
    return this.loadPromise;
  }

  private async executeLoadCache(): Promise<void> {
    try {
      const [rawSkills, rawLevels, rawSkillLevels] = await Promise.all([
        this.sfiaRepository.loadAllRawSkills(),
        this.sfiaRepository.loadAllRawLevels(),
        this.sfiaRepository.loadAllRawSkillLevels
          ? this.sfiaRepository.loadAllRawSkillLevels()
          : Promise.resolve([]),
      ]);

      const skillLevelMap = new Map<string, Record<number, string>>();
      for (const row of rawSkillLevels) {
        const key = row.skillCode.toUpperCase();
        const existing = skillLevelMap.get(key) ?? {};
        existing[Number(row.levelId)] = row.description;
        skillLevelMap.set(key, existing);
      }

      this.skillMap.clear();
      for (const item of rawSkills) {
        const upperCode = item.code.toUpperCase();
        this.skillMap.set(upperCode, {
          code: item.code,
          name: item.name,
          categoryCode: item.categoryCode,
          categoryName:
            SFIA_VI_TRANSLATIONS.categories[item.categoryCode] ??
            item.categoryCode,
          subcategoryCode: item.subcategoryCode,
          overallDescription: item.overallDescription,
          minLevel: Number(item.minLevel),
          maxLevel: Number(item.maxLevel),
          levelDescriptions: skillLevelMap.get(upperCode) ?? {},
        });
      }

      this.levelMap.clear();
      for (const item of rawLevels) {
        const lvlId = Number(item.levelId);
        this.levelMap.set(lvlId, {
          levelId: lvlId,
          name: item.name,
          nameVi: SFIA_VI_TRANSLATIONS.levels[lvlId] ?? item.name,
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
        `Failed to load SFIA cache from repository: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getSkillByCode(code: string): Promise<SfiaSkillDto | null> {
    if (!code) return null;
    if (!this.initialized) {
      await this.loadCache();
    }
    const skill = this.skillMap.get(code.trim().toUpperCase());
    return skill
      ? {
          ...skill,
          levelDescriptions: skill.levelDescriptions
            ? { ...skill.levelDescriptions }
            : {},
        }
      : null;
  }

  async getLevel(levelId: number): Promise<SfiaLevelDto | null> {
    if (typeof levelId !== 'number') return null;
    if (!this.initialized) {
      await this.loadCache();
    }
    const level = this.levelMap.get(levelId);
    return level ? { ...level } : null;
  }

  async getAllLevels(): Promise<SfiaLevelDto[]> {
    if (!this.initialized) {
      await this.loadCache();
    }
    return Array.from(this.levelMap.values())
      .sort((a, b) => a.levelId - b.levelId)
      .map((l) => ({ ...l }));
  }

  async getAllSkills(): Promise<SfiaSkillDto[]> {
    if (!this.initialized) {
      await this.loadCache();
    }
    return Array.from(this.skillMap.values()).map((s) => ({
      ...s,
      levelDescriptions: s.levelDescriptions ? { ...s.levelDescriptions } : {},
    }));
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

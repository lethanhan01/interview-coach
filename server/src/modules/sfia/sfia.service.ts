import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SfiaLevelDto, SfiaSkillDto } from './contracts/sfia.dto';
import { SFIA_REPOSITORY_TOKEN } from './domain/sfia-repository.interface';
import type { ISfiaRepository } from './domain/sfia-repository.interface';

@Injectable()
export class SfiaService implements OnModuleInit {
  private readonly logger = new Logger(SfiaService.name);
  private readonly skillMap = new Map<string, SfiaSkillDto>();
  private readonly levelMap = new Map<number, SfiaLevelDto>();
  private initialized = false;

  constructor(
    @Inject(SFIA_REPOSITORY_TOKEN)
    private readonly sfiaRepository: ISfiaRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadCache();
  }

  async loadCache(): Promise<void> {
    try {
      const rawSkills = await this.sfiaRepository.loadAllRawSkills();

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

      const rawLevels = await this.sfiaRepository.loadAllRawLevels();

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

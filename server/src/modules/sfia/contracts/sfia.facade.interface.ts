import { SfiaLevelDto, SfiaSkillDto } from './sfia.dto';

export const SFIA_FACADE_TOKEN = Symbol('ISfiaFacade');

export interface ISfiaFacade {
  getSkillByCode(code: string): Promise<SfiaSkillDto | null>;
  getLevel(levelId: number): Promise<SfiaLevelDto | null>;
  getAllSkills(): Promise<SfiaSkillDto[]>;
}

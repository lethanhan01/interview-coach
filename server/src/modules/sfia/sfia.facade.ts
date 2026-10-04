import { Injectable } from '@nestjs/common';
import { ISfiaFacade } from './contracts/sfia.facade.interface';
import { SfiaLevelDto, SfiaSkillDto } from './contracts/sfia.dto';
import { SfiaService } from './sfia.service';

@Injectable()
export class SfiaFacade implements ISfiaFacade {
  constructor(private readonly sfiaService: SfiaService) {}

  async getSkillByCode(code: string): Promise<SfiaSkillDto | null> {
    return this.sfiaService.getSkillByCode(code);
  }

  async getLevel(levelId: number): Promise<SfiaLevelDto | null> {
    return this.sfiaService.getLevel(levelId);
  }

  async getAllSkills(): Promise<SfiaSkillDto[]> {
    return this.sfiaService.getAllSkills();
  }
}

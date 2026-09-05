import { Injectable } from '@nestjs/common';
import { IOnetFacade } from './contracts/onet.facade.interface';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';
import { OnetService } from './onet.service';

@Injectable()
export class OnetFacade implements IOnetFacade {
  constructor(private readonly onetService: OnetService) {}

  async findOccupationByTitle(title: string): Promise<OnetOccupationDto | null> {
    return this.onetService.findOccupationByTitle(title);
  }

  async getToolsAndTechnology(socCode: string): Promise<OnetTechDto[]> {
    return this.onetService.getToolsAndTechnology(socCode);
  }

  async getOccupationBySocCode(socCode: string): Promise<OnetOccupationDto | null> {
    return this.onetService.getOccupationBySocCode(socCode);
  }
}

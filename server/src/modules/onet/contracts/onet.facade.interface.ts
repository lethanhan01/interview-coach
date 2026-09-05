import { OnetOccupationDto, OnetTechDto } from './onet.dto';

export const ONET_FACADE_TOKEN = Symbol('IOnetFacade');

export interface IOnetFacade {
  findOccupationByTitle(title: string): Promise<OnetOccupationDto | null>;
  getToolsAndTechnology(socCode: string): Promise<OnetTechDto[]>;
  getOccupationBySocCode(socCode: string): Promise<OnetOccupationDto | null>;
}

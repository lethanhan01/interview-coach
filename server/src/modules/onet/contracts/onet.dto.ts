export interface OnetOccupationDto {
  socCode: string;
  title: string;
  description: string;
  matchedTitle?: string;
  similarityScore?: number;
}

export interface OnetTechDto {
  example: string;
  isHotTechnology: boolean;
  inDemand: boolean;
}

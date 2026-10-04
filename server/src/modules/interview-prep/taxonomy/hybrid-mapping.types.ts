export interface ResolvedSessionSkill {
  skillCode: string;
  targetLevel: number;
  weight: number;
  isCore: boolean;
  source: 'curated' | 'ai_inferred' | 'fallback';
  techContext: string[];
}

export interface ResolveSkillsParams {
  socCode?: string | null;
  targetLevel?: number | null;
  jdText: string;
  normalizedTechStack?: string[];
  sessionType: 'technical' | 'hr';
}

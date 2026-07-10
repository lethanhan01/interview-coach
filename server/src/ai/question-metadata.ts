import type {
  ContextPackConfig,
  RubricDimensionEntry,
} from './context-pack.service';
import type { SessionType } from './pipelines/interview-pipeline.interface';

export type QuestionCategory = 'behavioral' | 'technical';

export interface NormalizedQuestionMetadata {
  questionCategory: QuestionCategory;
  competencyDomains: string[];
  matchBranch: 'exact' | 'normId' | 'code' | 'name' | 'heuristic';
}

const CODE_REGEX = /\bT?D\s*\d+\b/i;

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function categoryFromDomain(domain: string): QuestionCategory {
  return domain.startsWith('TD') ? 'technical' : 'behavioral';
}

function normalizeQuestionCategory(value?: string): QuestionCategory | null {
  if (value === 'behavioral' || value === 'technical') return value;
  return null;
}

export function isDomainAllowedForSession(
  domain: string,
  sessionType: SessionType,
): boolean {
  if (sessionType === 'hr') return domain.startsWith('D');
  if (sessionType === 'technical') return domain.startsWith('TD');
  return domain.startsWith('D') || domain.startsWith('TD');
}

function allowedDimensionsForSession(
  contextPack: ContextPackConfig,
  sessionType: SessionType,
): RubricDimensionEntry[] {
  if (sessionType === 'hr') return contextPack.behavioralDimensions;
  if (sessionType === 'technical') return contextPack.technicalDimensions;
  return [
    ...contextPack.behavioralDimensions,
    ...contextPack.technicalDimensions,
  ];
}

function resolveDomain(
  rawDomain: string,
  allowedDims: RubricDimensionEntry[],
): { domain: string; matchBranch: NormalizedQuestionMetadata['matchBranch'] } | null {
  const exact = allowedDims.find((d) => d.id === rawDomain);
  if (exact) {
    return {
      domain: exact.id,
      matchBranch: 'exact',
    };
  }

  const normRaw = normalizeKey(rawDomain);
  const byNormId = allowedDims.find((d) => normalizeKey(d.id) === normRaw);
  if (byNormId) {
    return {
      domain: byNormId.id,
      matchBranch: 'normId',
    };
  }

  const codeMatch = CODE_REGEX.exec(rawDomain);
  if (codeMatch) {
    const token = normalizeKey(codeMatch[0]);
    const byCode = allowedDims.find((d) => normalizeKey(d.id) === token);
    if (byCode) {
      return {
        domain: byCode.id,
        matchBranch: 'code',
      };
    }
  }

  const byName = allowedDims.find((d) => normalizeKey(d.name) === normRaw);
  if (byName) {
    return {
      domain: byName.id,
      matchBranch: 'name',
    };
  }

  return null;
}

export function normalizeGeneratedQuestionMetadata(
  input: {
    category?: string;
    legacyDomain?: string;
    competencyDomains?: string[];
  },
  contextPack: ContextPackConfig,
  sessionType: SessionType,
): NormalizedQuestionMetadata | null {
  const allowedDims = allowedDimensionsForSession(contextPack, sessionType);
  const rawDomains =
    input.competencyDomains && input.competencyDomains.length > 0
      ? input.competencyDomains
      : input.legacyDomain
        ? [input.legacyDomain]
        : [];
  const resolvedDomains: string[] = [];
  let matchBranch: NormalizedQuestionMetadata['matchBranch'] | undefined;

  for (const rawDomain of rawDomains) {
    const resolved = resolveDomain(rawDomain, allowedDims);
    if (!resolved) continue;
    if (!isDomainAllowedForSession(resolved.domain, sessionType)) {
      continue;
    }
    if (!resolvedDomains.includes(resolved.domain)) {
      resolvedDomains.push(resolved.domain);
      matchBranch ??= resolved.matchBranch;
    }
  }

  if (resolvedDomains.length === 0 || !matchBranch) return null;

  const requestedCategory =
    sessionType === 'mixed' ? normalizeQuestionCategory(input.category) : null;
  const primaryCategory = requestedCategory ?? categoryFromDomain(resolvedDomains[0]);
  const categoryFilteredDomains = resolvedDomains.filter(
    (domain) => categoryFromDomain(domain) === primaryCategory,
  );
  if (categoryFilteredDomains.length === 0) {
    return null;
  }

  return {
    questionCategory: primaryCategory,
    competencyDomains: categoryFilteredDomains,
    matchBranch,
  };
}

interface HeuristicMatch {
  domain: string;
  /** true nếu ít nhất một keyword thực sự match; false nếu chỉ là fallback mặc định */
  isExplicit: boolean;
}

function heuristicTechnicalDomain(questionText: string): HeuristicMatch {
  const text = normalizeKey(questionText);

  if (
    /(debug|troubleshoot|incident|production|reliability|bug|loi|suco)/.test(
      text,
    )
  ) {
    return { domain: 'TD5', isExplicit: true };
  }
  if (
    /(codequality|bestpractice|clean|refactor|maintain|chatluongcode)/.test(
      text,
    )
  ) {
    return { domain: 'TD4', isExplicit: true };
  }
  if (
    /(systemdesign|scale|scalability|architecture|distributed|tuduyhethong)/.test(
      text,
    )
  ) {
    return { domain: 'TD3', isExplicit: true };
  }
  if (
    /(practical|application|fullstack|database|backend|frontend|implement|khanangapdungthucte)/.test(
      text,
    )
  ) {
    return { domain: 'TD2', isExplicit: true };
  }
  if (
    /(concept|explain|fundamental|basic|theory|knowledge|algorithm|datastructure|foundation|kienthuc|coban)/.test(
      text,
    )
  ) {
    return { domain: 'TD1', isExplicit: true };
  }

  return { domain: 'TD1', isExplicit: false };
}

function heuristicBehavioralDomain(questionText: string): HeuristicMatch {
  const text = normalizeKey(questionText);

  if (
    /(incident|oncall|problem|solve|resilience|pressure|suco|apluc|giaiquyetvande)/.test(
      text,
    )
  ) {
    return { domain: 'D2', isExplicit: true };
  }
  if (
    /(selfaware|growth|learn|feedback|weakness|tuhoc|hochoi|nhanthuc|tunhanthuc)/.test(
      text,
    )
  ) {
    return { domain: 'D6', isExplicit: true };
  }
  if (
    /(leadership|mentor|ownership|initiative|decision|trachnhiem|lanhdao)/.test(
      text,
    )
  ) {
    return { domain: 'D4', isExplicit: true };
  }
  if (
    /(collaboration|team|conflict|coworker|lamviecnhom|xungdot|hoptac)/.test(
      text,
    )
  ) {
    return { domain: 'D3', isExplicit: true };
  }
  if (
    /(culture|motivation|values|company|dongluc|phuhop|phuhopvanhoa)/.test(text)
  ) {
    return { domain: 'D5', isExplicit: true };
  }
  if (
    /(communicate|present|articulate|express|giaotiep|trinhbay|noichinh)/.test(
      text,
    )
  ) {
    return { domain: 'D1', isExplicit: true };
  }

  return { domain: 'D1', isExplicit: false };
}

function heuristicDomain(
  questionText: string,
  sessionType: SessionType,
): string | null {
  if (sessionType === 'technical') {
    return heuristicTechnicalDomain(questionText).domain;
  }

  if (sessionType === 'hr') {
    return heuristicBehavioralDomain(questionText).domain;
  }

  // mixed: dùng isExplicit để phân biệt keyword match thực sự vs fallback mặc định
  const technical = heuristicTechnicalDomain(questionText);
  const behavioral = heuristicBehavioralDomain(questionText);

  // Chỉ một bên explicit match rõ ràng → chọn bên đó
  if (technical.isExplicit && !behavioral.isExplicit) return technical.domain;
  if (behavioral.isExplicit && !technical.isExplicit) return behavioral.domain;
  // Cả hai explicit (conflict) hoặc cả hai chỉ là fallback (không đủ tín hiệu) → null
  return null;
}

export function normalizeQuestionMetadataForCleanup(
  input: {
    category?: string;
    competencyDomains?: string[];
    questionText: string;
  },
  contextPack: ContextPackConfig,
  sessionType: SessionType,
): NormalizedQuestionMetadata | null {
  const strict = normalizeGeneratedQuestionMetadata(
    input,
    contextPack,
    sessionType,
  );
  if (strict) return strict;

  const heuristicInput =
    sessionType === 'mixed'
      ? input.questionText
      : `${input.questionText} ${input.category ?? ''} ${input.competencyDomains?.join(' ') ?? ''}`;
  const heuristic = heuristicDomain(heuristicInput, sessionType);
  if (!heuristic) return null;

  return {
    questionCategory: categoryFromDomain(heuristic),
    competencyDomains: [heuristic],
    matchBranch: 'heuristic',
  };
}

export function calculateEstimatedTimeMin(input: {
  durationMin: number;
  numQuestions: number;
  difficulty: number;
}): number {
  const numQuestions = Math.max(1, Math.trunc(input.numQuestions));
  const durationMin = Number.isFinite(input.durationMin)
    ? Math.trunc(input.durationMin)
    : numQuestions + 7;
  const timeBudget = Math.max(durationMin - 7, numQuestions);
  const baseTime = timeBudget / numQuestions;
  const multiplier =
    input.difficulty <= 1 ? 0.8 : input.difficulty >= 3 ? 1.3 : 1;

  return Math.max(1, Math.round(baseTime * multiplier));
}

export function sanitizeDifficulty(value: number): 1 | 2 | 3 {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return 2;
}

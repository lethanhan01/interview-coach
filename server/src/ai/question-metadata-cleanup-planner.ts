import type { ContextPackService } from './context-pack.service';
import {
  calculateEstimatedTimeMin,
  normalizeQuestionMetadataForCleanup,
} from './question-metadata';
import type { SessionType } from './pipelines/interview-pipeline.interface';

export type CleanupRow = {
  id: string;
  session_id: string;
  question_text: string;
  order_index: number;
  question_category: string;
  competency_domain: string;
  estimated_time_min: number | null;
  session_type: string;
  context_pack_id: string;
  duration_min: number;
  num_questions: number;
};

export type PlannedMetadataUpdate = {
  row: CleanupRow;
  nextCategory: 'behavioral' | 'technical';
  nextDomain: string;
  nextTime: number;
  matchBranch: string;
  changed: boolean;
};

export type UnmappedMetadataRow = {
  row: CleanupRow;
  reason: 'ambiguous-mixed-metadata';
};

export const VALID_QUESTION_CATEGORIES = new Set(['behavioral', 'technical']);
export const VALID_COMPETENCY_DOMAINS = new Set([
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'TD1',
  'TD2',
  'TD3',
  'TD4',
  'TD5',
]);

function isSessionType(value: string): value is SessionType {
  return value === 'hr' || value === 'technical' || value === 'mixed';
}

export function planQuestionMetadataCleanup(
  rows: CleanupRow[],
  contextPackService: Pick<ContextPackService, 'getContextPack'>,
): {
  planned: PlannedMetadataUpdate[];
  unmappedRows: UnmappedMetadataRow[];
} {
  const planned: PlannedMetadataUpdate[] = [];
  const unmappedRows: UnmappedMetadataRow[] = [];

  for (const row of rows) {
    if (!isSessionType(row.session_type)) {
      throw new Error(`Unsupported session_type ${row.session_type} for ${row.id}`);
    }

    const contextPack = contextPackService.getContextPack(
      row.context_pack_id as 'VN' | 'Western',
    );
    const normalized = normalizeQuestionMetadataForCleanup(
      {
        category: row.question_category,
        competencyDomain: row.competency_domain,
        questionText: row.question_text,
      },
      contextPack,
      row.session_type,
    );

    if (!normalized) {
      unmappedRows.push({ row, reason: 'ambiguous-mixed-metadata' });
      continue;
    }

    const nextTime =
      row.estimated_time_min && row.estimated_time_min > 0
        ? row.estimated_time_min
        : calculateEstimatedTimeMin({
            durationMin: row.duration_min,
            numQuestions: row.num_questions,
            difficulty: 2,
          });

    planned.push({
      row,
      nextCategory: normalized.questionCategory,
      nextDomain: normalized.competencyDomain,
      nextTime,
      matchBranch: normalized.matchBranch,
      changed:
        row.question_category !== normalized.questionCategory ||
        row.competency_domain !== normalized.competencyDomain ||
        row.estimated_time_min !== nextTime,
    });
  }

  return { planned, unmappedRows };
}

export function summarizeQuestionMetadataCleanup(
  rows: CleanupRow[],
  planned: PlannedMetadataUpdate[],
  unmappedRows: UnmappedMetadataRow[],
  apply: boolean,
): Record<string, string | number> {
  return {
    mode: apply ? 'apply' : 'dry-run',
    aiRows: rows.length,
    nullTime: rows.filter((row) => row.estimated_time_min === null).length,
    badCategory: rows.filter(
      (row) => !VALID_QUESTION_CATEGORIES.has(row.question_category),
    ).length,
    badDomain: rows.filter(
      (row) => !VALID_COMPETENCY_DOMAINS.has(row.competency_domain),
    ).length,
    plannedChanges: planned.filter((item) => item.changed).length,
    heuristicMappings: planned.filter((item) => item.matchBranch === 'heuristic')
      .length,
    unmappedRows: unmappedRows.length,
  };
}

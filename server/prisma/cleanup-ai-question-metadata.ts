import 'dotenv/config';
import { Client } from 'pg';
import { ContextPackService } from '../src/ai/context-pack.service';
import {
  calculateEstimatedTimeMin,
  normalizeQuestionMetadataForCleanup,
} from '../src/ai/question-metadata';
import type { SessionType } from '../src/ai/pipelines/interview-pipeline.interface';

type Row = {
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

type PlannedUpdate = {
  row: Row;
  nextCategory: 'behavioral' | 'technical';
  nextDomain: string;
  nextTime: number;
  matchBranch: string;
  changed: boolean;
};

const VALID_CATEGORIES = new Set(['behavioral', 'technical']);
const VALID_DOMAINS = new Set([
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

function parseApply(): boolean {
  return process.argv.includes('--apply');
}

function isSessionType(value: string): value is SessionType {
  return value === 'hr' || value === 'technical' || value === 'mixed';
}

async function main(): Promise<void> {
  const apply = parseApply();
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required.');
  }

  const client = new Client({ connectionString });
  const contextPackService = new ContextPackService();
  await client.connect();

  try {
    const result = await client.query<Row>(`
      SELECT
        sq.id,
        sq.session_id,
        sq.question_text,
        sq.order_index,
        sq.question_category,
        sq.competency_domain,
        sq.estimated_time_min,
        s.session_type,
        s.context_pack_id,
        s.duration_min,
        s.num_questions
      FROM session_questions sq
      JOIN interview_sessions s ON s.id = sq.session_id
      WHERE sq.question_bank_id IS NULL
      ORDER BY s.created_at, sq.session_id, sq.order_index
    `);

    const planned = result.rows.map<PlannedUpdate>((row) => {
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
      const nextTime =
        row.estimated_time_min && row.estimated_time_min > 0
          ? row.estimated_time_min
          : calculateEstimatedTimeMin({
              durationMin: row.duration_min,
              numQuestions: row.num_questions,
              difficulty: 2,
            });

      return {
        row,
        nextCategory: normalized.questionCategory,
        nextDomain: normalized.competencyDomain,
        nextTime,
        matchBranch: normalized.matchBranch,
        changed:
          row.question_category !== normalized.questionCategory ||
          row.competency_domain !== normalized.competencyDomain ||
          row.estimated_time_min !== nextTime,
      };
    });

    const summary = {
      mode: apply ? 'apply' : 'dry-run',
      aiRows: result.rows.length,
      nullTime: result.rows.filter((row) => row.estimated_time_min === null).length,
      badCategory: result.rows.filter(
        (row) => !VALID_CATEGORIES.has(row.question_category),
      ).length,
      badDomain: result.rows.filter((row) => !VALID_DOMAINS.has(row.competency_domain))
        .length,
      plannedChanges: planned.filter((item) => item.changed).length,
      heuristicMappings: planned.filter((item) => item.matchBranch === 'heuristic')
        .length,
    };

    console.log(JSON.stringify(summary, null, 2));
    for (const item of planned.filter((entry) => entry.changed)) {
      console.log(
        JSON.stringify({
          sessionId: item.row.session_id,
          questionId: item.row.id,
          orderIndex: item.row.order_index,
          oldCategory: item.row.question_category,
          newCategory: item.nextCategory,
          oldDomain: item.row.competency_domain,
          newDomain: item.nextDomain,
          oldTime: item.row.estimated_time_min,
          newTime: item.nextTime,
          matchBranch: item.matchBranch,
        }),
      );
    }

    if (!apply) return;

    await client.query('BEGIN');
    try {
      for (const item of planned.filter((entry) => entry.changed)) {
        await client.query(
          `
          UPDATE session_questions
          SET question_category = $1,
              competency_domain = $2,
              estimated_time_min = $3
          WHERE id = $4
            AND question_bank_id IS NULL
        `,
          [item.nextCategory, item.nextDomain, item.nextTime, item.row.id],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

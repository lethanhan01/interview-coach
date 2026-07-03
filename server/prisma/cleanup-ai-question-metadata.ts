import 'dotenv/config';
import { Client } from 'pg';
import { ContextPackService } from '../src/ai/context-pack.service';
import type { CleanupRow } from '../src/ai/question-metadata-cleanup-planner';
import {
  planQuestionMetadataCleanup,
  summarizeQuestionMetadataCleanup,
} from '../src/ai/question-metadata-cleanup-planner';

function parseApply(): boolean {
  return process.argv.includes('--apply');
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
    const result = await client.query<CleanupRow>(`
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

    const { planned, unmappedRows } = planQuestionMetadataCleanup(
      result.rows,
      contextPackService,
    );
    const summary = summarizeQuestionMetadataCleanup(
      result.rows,
      planned,
      unmappedRows,
      apply,
    );

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
    for (const item of unmappedRows) {
      console.log(
        JSON.stringify({
          sessionId: item.row.session_id,
          questionId: item.row.id,
          orderIndex: item.row.order_index,
          category: item.row.question_category,
          domain: item.row.competency_domain,
          reason: item.reason,
        }),
      );
    }

    if (!apply) return;
    if (unmappedRows.length > 0) {
      throw new Error(
        `Refusing to apply cleanup with ${unmappedRows.length} unmapped rows.`,
      );
    }

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

import 'dotenv/config';
import { Queue } from 'bullmq';
import { Client } from 'pg';
import { sanitizeFeedbackSegments } from '../src/ai/feedback-segment-sanitizer';
import {
  FEEDBACK_JOB_ATTEMPTS,
  FEEDBACK_QUEUE,
} from '../src/common/constants/queue.constants';

interface SegmentRow {
  id: string;
  segment_text: string;
  start_index: number;
  end_index: number;
  highlight_level: string;
  annotation: string;
  suggestion: string | null;
  improved_version: string | null;
}

interface FeedbackAuditRow {
  answer_id: string;
  session_id: string;
  question_id: string;
  question_text: string;
  question_category: string;
  competency_domains: string[];
  answer_text: string;
  context_pack_id: 'VN' | 'Western';
  session_type: 'hr' | 'technical' | 'mixed';
  language: string | null;
  segments: SegmentRow[];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function preview(value: string, max = 120): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

async function main() {
  const apply = hasFlag('--apply');
  const requeue = apply && !hasFlag('--no-requeue');
  const answerId = getArgValue('--answer-id');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const { rows } = await client.query<FeedbackAuditRow>(
    `
    SELECT
      ua.id AS answer_id,
      ua.session_id,
      ua.question_id,
      sq.question_text,
      sq.question_category,
      COALESCE(array_agg(rc.code ORDER BY rc.display_order) FILTER (WHERE rc.code IS NOT NULL), ARRAY[]::text[]) AS competency_domains,
      ua.answer_text,
      s.context_pack_id,
      s.session_type,
      s.language,
      COALESCE(
        json_agg(
          json_build_object(
            'id', seg.id,
            'segment_text', seg.segment_text,
            'start_index', seg.start_index,
            'end_index', seg.end_index,
            'highlight_level', seg.highlight_level,
            'annotation', seg.annotation,
            'suggestion', seg.suggestion,
            'improved_version', seg.improved_version
          )
          ORDER BY seg.created_at
        ) FILTER (WHERE seg.id IS NOT NULL),
        '[]'
      ) AS segments
    FROM user_answers ua
    JOIN interview_sessions s ON s.id = ua.session_id
    JOIN session_questions sq ON sq.id = ua.question_id
    JOIN ai_feedbacks af ON af.user_answer_id = ua.id
    LEFT JOIN annotated_segments seg ON seg.ai_feedback_id = af.id
    LEFT JOIN session_question_criteria sqc ON sqc.session_question_id = sq.id
    LEFT JOIN rubric_criteria rc ON rc.id = sqc.rubric_criterion_id
    WHERE ua.skipped = false
      AND ($1::uuid IS NULL OR ua.id = $1::uuid)
    GROUP BY
      ua.id,
      ua.session_id,
      ua.question_id,
      sq.question_text,
      sq.question_category,
      ua.answer_text,
      s.context_pack_id,
      s.session_type,
      s.language
    ORDER BY ua.created_at ASC
  `,
    [answerId ?? null],
  );

  const invalid = rows
    .map((row) => {
      const result = sanitizeFeedbackSegments(
        row.answer_text,
        row.segments.map((segment) => ({
          id: segment.id,
          segmentText: segment.segment_text,
          startIndex: segment.start_index,
          endIndex: segment.end_index,
          highlightLevel: segment.highlight_level,
          annotation: segment.annotation,
          suggestion: segment.suggestion,
          improvedVersion: segment.improved_version,
        })),
      );

      return {
        row,
        invalidSegmentCount: result.issues.length,
        validSegmentCount: result.segments.length,
        reasons: result.issues.map((issue) => issue.reason),
      };
    })
    .filter((item) => item.invalidSegmentCount > 0);

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        requeue,
        answerId: answerId ?? null,
        scannedAnswers: rows.length,
        invalidAnswers: invalid.length,
        invalidSegments: invalid.reduce(
          (sum, item) => sum + item.invalidSegmentCount,
          0,
        ),
        examples: invalid.slice(0, 10).map((item) => ({
          answerId: item.row.answer_id,
          sessionId: item.row.session_id,
          questionId: item.row.question_id,
          invalidSegmentCount: item.invalidSegmentCount,
          validSegmentCount: item.validSegmentCount,
          reasons: item.reasons,
          answerPreview: preview(item.row.answer_text),
          firstSegmentPreview: preview(item.row.segments[0]?.segment_text ?? ''),
        })),
      },
      null,
      2,
    ),
  );

  if (!apply || invalid.length === 0) {
    await client.end();
    return;
  }

  await client.query('BEGIN');
  try {
    const answerIds = invalid.map((item) => item.row.answer_id);
    await client.query(
      `
        DELETE FROM annotated_segments seg
        USING ai_feedbacks af
        WHERE seg.ai_feedback_id = af.id
          AND af.user_answer_id = ANY($1::uuid[])
      `,
      [answerIds],
    );
    if (requeue) {
      await client.query(
        `
          UPDATE user_answers
          SET feedback_generated = false
          WHERE id = ANY($1::uuid[])
        `,
        [answerIds],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  if (!requeue) {
    return;
  }

  const queue = new Queue(FEEDBACK_QUEUE, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });

  try {
    for (const item of invalid) {
      const row = item.row;
      await queue.add(
        'feedback',
        {
          sessionId: row.session_id,
          turnId: row.answer_id,
          answerId: row.answer_id,
          questionId: row.question_id,
          questionText: row.question_text,
          questionCategory: row.question_category,
          competencyDomains: row.competency_domains,
          answerText: row.answer_text,
          contextPack: row.context_pack_id,
          sessionType: row.session_type,
          language: row.language ?? 'vi',
        },
        {
          jobId: `feedback-repair-${row.answer_id}`,
          attempts: FEEDBACK_JOB_ATTEMPTS,
        },
      );
    }
  } finally {
    await queue.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

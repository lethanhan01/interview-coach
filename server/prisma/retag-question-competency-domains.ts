import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

type SessionType = 'hr' | 'technical';

type QuestionLike = {
  content?: string;
  enContent?: string;
  viContent?: string;
  sessionType: SessionType;
  subcategory?: string;
  competencyDomains?: string[];
  tags?: string[];
  translations?: Record<string, unknown> | null;
  contentJson?: Record<string, unknown> | null;
};

type QuestionBankRow = {
  id: string;
  content: string;
  session_type: SessionType;
  context_pack_id: string;
  competency_domains: string[];
  translations: Record<string, unknown> | null;
  content_json: Record<string, unknown> | null;
};

const ROOT = join(__dirname, '..');
const QUESTION_BANK_TS = join(ROOT, 'prisma', 'seed', '02-question-bank.ts');
const KAGGLE_JSON = join(
  ROOT,
  'prisma',
  'seed',
  'data',
  'kaggle-questions.json',
);
const VALID_BEHAVIORAL = new Set(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
const VALID_TECHNICAL = new Set(['TD1', 'TD2', 'TD3', 'TD4', 'TD5']);

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

function words(question: QuestionLike): string {
  const values = [
    question.content,
    question.enContent,
    question.viContent,
    question.subcategory,
    ...(question.tags ?? []),
    stringValue(question.translations?.en),
    stringValue(question.translations?.vi),
    stringValue(question.contentJson?.en),
    stringValue(question.contentJson?.vi),
    stringValue(question.contentJson?.modelAnswer),
  ];
  return normalize(values.filter(Boolean).join(' '));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function pushUnique(domains: string[], domain: string): void {
  if (!domains.includes(domain)) {
    domains.push(domain);
  }
}

function addCurrentDomains(question: QuestionLike, domains: string[]): void {
  const allowed =
    question.sessionType === 'technical' ? VALID_TECHNICAL : VALID_BEHAVIORAL;
  for (const domain of question.competencyDomains ?? []) {
    if (allowed.has(domain)) {
      pushUnique(domains, domain);
    }
  }
}

export function retagCompetencyDomains(question: QuestionLike): string[] {
  const text = words(question);
  const domains: string[] = [];
  addCurrentDomains(question, domains);

  if (question.sessionType === 'technical') {
    addTechnicalDomains(text, domains);
  } else {
    addBehavioralDomains(text, domains);
  }

  if (domains.length === 0) {
    domains.push(question.sessionType === 'technical' ? 'TD1' : 'D1');
  }

  const complex =
    includesAny(text, [
      'system design',
      'architecture',
      'distributed',
      'incident',
      'production',
      'postmortem',
      'project failed',
      'project nhom that bai',
      'gap kho khan lon',
      'that bai',
    ]) && domains.length > 2;
  return domains.slice(0, complex ? 3 : 2);
}

function addBehavioralDomains(text: string, domains: string[]): void {
  if (
    includesAny(text, [
      'communicat',
      'present',
      'explain',
      'articulate',
      'stakeholder',
      'persuad',
      'feedback',
      'giao tiep',
      'trinh bay',
      'thuyet phuc',
      'phan hoi',
      'giai thich',
    ])
  ) {
    pushUnique(domains, 'D1');
  }
  if (
    includesAny(text, [
      'problem',
      'solve',
      'priorit',
      'deadline',
      'ambiguous',
      'incomplete',
      'pressure',
      'approach',
      'method',
      'quy trinh',
      'giai quyet',
      'uu tien',
      'ap luc',
      'mo ho',
      'yeu cau khong day du',
    ])
  ) {
    pushUnique(domains, 'D2');
  }
  if (
    includesAny(text, [
      'team',
      'collaborat',
      'conflict',
      'coworker',
      'teammate',
      'remote',
      'different time zones',
      'lam viec nhom',
      'dong doi',
      'xung dot',
      'hop tac',
    ])
  ) {
    pushUnique(domains, 'D3');
  }
  if (
    includesAny(text, [
      'motivat',
      'initiative',
      'leadership',
      'ownership',
      'responsib',
      'career',
      'why',
      'contribute',
      'dong luc',
      'chu dong',
      'trach nhiem',
      'lanh dao',
      'su nghiep',
      'dong gop',
    ])
  ) {
    pushUnique(domains, 'D4');
  }
  if (
    includesAny(text, [
      'culture',
      'values',
      'company',
      'environment',
      'overtime',
      'working hours',
      'remote',
      'moi truong',
      'van hoa',
      'cong ty',
      'lam them gio',
      'gio lam',
    ])
  ) {
    pushUnique(domains, 'D5');
  }
  if (
    includesAny(text, [
      'self-aware',
      'weakness',
      'growth',
      'learn',
      'failure',
      'failed',
      'reflection',
      'improve',
      'critical feedback',
      'tu nhan thuc',
      'diem yeu',
      'hoc',
      'that bai',
      'cai thien',
      'nhin lai',
    ])
  ) {
    pushUnique(domains, 'D6');
  }
}

function addTechnicalDomains(text: string, domains: string[]): void {
  if (
    includesAny(text, [
      'define',
      'explain',
      'difference',
      'concept',
      'fundamental',
      'basic',
      'what is',
      'algorithm',
      'data structure',
      'kien thuc',
      'khai niem',
      'su khac biet',
      'giai thich',
      'co ban',
    ])
  ) {
    pushUnique(domains, 'TD1');
  }
  if (
    includesAny(text, [
      'implement',
      'example',
      'use each',
      'when would',
      'choose',
      'design a',
      'api',
      'database',
      'query',
      'endpoint',
      'data model',
      'ap dung',
      'vi du',
      'khi nao',
      'thiet ke',
      'su dung',
    ])
  ) {
    pushUnique(domains, 'TD2');
  }
  if (
    includesAny(text, [
      'system',
      'architecture',
      'scale',
      'scalability',
      'distributed',
      'ci/cd',
      'devops',
      'server state',
      'dashboard',
      'tuduyhethong',
      'he thong',
      'kien truc',
      'mo rong',
    ])
  ) {
    pushUnique(domains, 'TD3');
  }
  if (
    includesAny(text, [
      'solid',
      'clean',
      'maintain',
      'quality',
      'best practice',
      'testing',
      'test',
      'refactor',
      'code review',
      'specificity',
      'style rule',
      'chat luong code',
      'de bao tri',
      'kiem thu',
    ])
  ) {
    pushUnique(domains, 'TD4');
  }
  if (
    includesAny(text, [
      'debug',
      'bug',
      'troubleshoot',
      'incident',
      'production',
      'performance',
      'optimiz',
      'n+1',
      'stale',
      'unnecessary re-render',
      'not being applied',
      'loi',
      'su co',
      'toi uu',
      'khong duoc ap dung',
    ])
  ) {
    pushUnique(domains, 'TD5');
  }
}

function extractString(block: string, field: string): string | undefined {
  const match = new RegExp(`${field}:\\s*'([^']*)'`).exec(block);
  return match?.[1];
}

function extractDomains(block: string): string[] {
  const match = /competencyDomains:\s*\[([^\]]*)\]/.exec(block);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'/g)).map((item) => item[1]);
}

function rewriteQuestionBankTs(): void {
  const text = readFileSync(QUESTION_BANK_TS, 'utf-8');
  const objectPattern =
    /\{\s*(?:content|enContent):[\s\S]*?competencyDomains:\s*\[[^\]]*\][\s\S]*?\n\s*\},/g;
  const next = text.replace(objectPattern, (block) => {
    const question: QuestionLike = {
      content: extractString(block, 'content'),
      enContent: extractString(block, 'enContent'),
      viContent: extractString(block, 'viContent'),
      sessionType: extractString(block, 'sessionType') as SessionType,
      subcategory: extractString(block, 'subcategory'),
      competencyDomains: extractDomains(block),
    };
    const domains = retagCompetencyDomains(question);
    return block.replace(
      /competencyDomains:\s*\[[^\]]*\]/,
      `competencyDomains: [${domains.map((domain) => `'${domain}'`).join(', ')}]`,
    );
  });
  writeFileSync(QUESTION_BANK_TS, next, 'utf-8');
}

function rewriteKaggleJson(): void {
  const questions = JSON.parse(readFileSync(KAGGLE_JSON, 'utf-8')) as QuestionLike[];
  for (const question of questions) {
    question.competencyDomains = retagCompetencyDomains(question);
  }
  writeFileSync(KAGGLE_JSON, `${JSON.stringify(questions, null, 2)}\n`, 'utf-8');
}

function collectTsQuestions(): QuestionLike[] {
  const text = readFileSync(QUESTION_BANK_TS, 'utf-8');
  const objectPattern =
    /\{\s*(?:content|enContent):[\s\S]*?competencyDomains:\s*\[[^\]]*\][\s\S]*?\n\s*\},/g;
  return Array.from(text.matchAll(objectPattern)).map((match) => ({
    content: extractString(match[0], 'content'),
    enContent: extractString(match[0], 'enContent'),
    viContent: extractString(match[0], 'viContent'),
    sessionType: extractString(match[0], 'sessionType') as SessionType,
    subcategory: extractString(match[0], 'subcategory'),
    competencyDomains: extractDomains(match[0]),
  }));
}

function printAudit(label: string, questions: QuestionLike[]): void {
  const invalid: QuestionLike[] = [];
  let multi = 0;
  const dist = new Map<string, number>();
  const lengthDist = new Map<number, number>();
  for (const question of questions) {
    const allowed =
      question.sessionType === 'technical' ? VALID_TECHNICAL : VALID_BEHAVIORAL;
    const domains = question.competencyDomains ?? [];
    lengthDist.set(domains.length, (lengthDist.get(domains.length) ?? 0) + 1);
    if (
      domains.length === 0 ||
      domains.some((domain) => !allowed.has(domain))
    ) {
      invalid.push(question);
    }
    if (domains.length > 1) multi += 1;
    for (const domain of domains) {
      dist.set(domain, (dist.get(domain) ?? 0) + 1);
    }
  }
  console.log(
    JSON.stringify(
      {
        label,
        total: questions.length,
        multi,
        invalid: invalid.length,
        domainCountDistribution: Object.fromEntries(
          Array.from(lengthDist.entries()).sort(([a], [b]) => a - b),
        ),
        distribution: Object.fromEntries(
          Array.from(dist.entries()).sort(([a], [b]) => a.localeCompare(b)),
        ),
      },
      null,
      2,
    ),
  );
}

async function backfillQuestionBank(apply: boolean): Promise<void> {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required.');
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query<QuestionBankRow>(`
      SELECT id, content, session_type, context_pack_id, competency_domains, translations, content_json
      FROM question_bank
      WHERE deleted_at IS NULL
        AND content_json->>'source' IN ('seed', 'kaggle')
      ORDER BY created_at, id
    `);
    const changes = result.rows
      .map((row) => {
        const nextDomains = retagCompetencyDomains({
          content: row.content,
          sessionType: row.session_type,
          competencyDomains: row.competency_domains,
          translations: row.translations,
          contentJson: row.content_json,
        });
        return { row, nextDomains };
      })
      .filter(
        (item) =>
          JSON.stringify(item.row.competency_domains) !==
          JSON.stringify(item.nextDomains),
      );

    console.log(
      JSON.stringify(
        {
          mode: apply ? 'apply' : 'dry-run',
          scanned: result.rows.length,
          changed: changes.length,
          examples: changes.slice(0, 20).map((item) => ({
            id: item.row.id,
            content: item.row.content,
            oldDomains: item.row.competency_domains,
            newDomains: item.nextDomains,
          })),
        },
        null,
        2,
      ),
    );

    if (!apply || changes.length === 0) return;
    await client.query('BEGIN');
    try {
      for (const item of changes) {
        await client.query(
          `
          UPDATE question_bank
          SET competency_domains = $1,
              updated_at = NOW()
          WHERE id = $2
            AND deleted_at IS NULL
        `,
          [item.nextDomains, item.row.id],
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

async function main(): Promise<void> {
  if (hasFlag('--write-files')) {
    rewriteQuestionBankTs();
    rewriteKaggleJson();
  }

  if (hasFlag('--audit-files') || hasFlag('--write-files')) {
    printAudit('02-question-bank.ts', collectTsQuestions());
    printAudit(
      'kaggle-questions.json',
      JSON.parse(readFileSync(KAGGLE_JSON, 'utf-8')) as QuestionLike[],
    );
  }

  if (!hasFlag('--files-only') && !hasFlag('--audit-files')) {
    await backfillQuestionBank(hasFlag('--apply'));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

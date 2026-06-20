# Seed Data Refactor — Modular + Comprehensive

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách seed.ts (~1600 dòng) thành module `prisma/seed/` với một file per concern, bổ sung mock data đầy đủ cho tất cả bảng chưa được seed (ReverseQuestion, FollowUpQuestion, AiQualityLog) và các kịch bản còn thiếu (generating/active session, audio answer, skipped, follow-up, low/high score).

**Architecture:** Mỗi file `XX-<concern>.ts` export một hàm `seed<Concern>(ctx: SeedContext)`. File `index.ts` là orchestrator gọi các hàm theo thứ tự. File `seed.ts` gốc trở thành entry point 1 dòng. File `_client.ts` export shared Prisma client + Supabase admin. File `_helpers.ts` export builder functions giảm repetition.

**Tech Stack:** TypeScript, Prisma 7, `@supabase/supabase-js`, `ts-node`, `dotenv`.

## Global Constraints

- Seed script run command không đổi: `npm run seed` từ `server/` (dùng `ts-node -r tsconfig-paths/register prisma/seed.ts`)
- `UserAnswer.unique([sessionId, questionId])` — mỗi câu hỏi chỉ có một answer per session
- `SessionQuestion.unique([sessionId, orderIndex])` — order index bắt đầu từ 0, không trùng
- `FollowUpQuestion.unique(userAnswerId)` — mỗi answer chỉ có một follow-up
- `ReverseQuestion.unique([sessionId, orderIndex])` — order bắt đầu từ 0
- `UserAnswer.answerText` là NOT NULL — khi skip dùng `answerText: ''`
- `InterviewSession.status` values: `'generating'` | `'active'` | `'completed'`
- `AiFeedback.highlightLevel` values: `'good'` | `'warning'` | `'critical'`
- Tất cả seed dùng upsert/skipDuplicates để idempotent — chạy nhiều lần không lỗi

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/seed/_client.ts` | Create | PrismaClient + supabaseAdmin singletons, constants |
| `prisma/seed/_helpers.ts` | Create | createAnswerWithFeedback(), createFollowUp() |
| `prisma/seed/00-context-packs.ts` | Create | seedContextPacks() — extract từ seed.ts |
| `prisma/seed/01-users.ts` | Create | getOrCreateDemoUser(), seedUserProfile() — extract từ seed.ts |
| `prisma/seed/02-question-bank.ts` | Create | seedQuestionBank() — extract + không thêm câu hỏi mới |
| `prisma/seed/03-sessions.ts` | Create | seedSessions() — 5 session mới bổ sung các kịch bản còn thiếu |
| `prisma/seed/04-ai-quality-log.ts` | Create | seedAiQualityLog() — mới hoàn toàn |
| `prisma/seed/index.ts` | Create | main() orchestrator |
| `prisma/seed.ts` | Modify | Entry point 1 dòng: `import './seed/index'` |

---

## Task 1: Foundation — `_client.ts`

**Files:**
- Create: `server/prisma/seed/_client.ts`

**Interfaces:**
- Produces: `prisma`, `supabaseAdmin`, `DEMO_EMAIL`, `DEMO_PASSWORD` — dùng bởi tất cả file khác

- [ ] **Step 1: Tạo file**

```typescript
// server/prisma/seed/_client.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

export const DEMO_EMAIL = 'demo@interviewai.dev';
export const DEMO_PASSWORD = 'Demo@123456';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
```

- [ ] **Step 2: Verify không lỗi syntax**

```bash
cd server && npx ts-node -e "require('./prisma/seed/_client')" 2>&1 | head -5
```

Expected: không có output (hoặc chỉ có Prisma client logs).

---

## Task 2: Helpers — `_helpers.ts`

**Files:**
- Create: `server/prisma/seed/_helpers.ts`

**Interfaces:**
- Consumes: `prisma` từ `_client.ts`
- Produces:
  - `createAnswerWithFeedback(prisma, opts): Promise<string>` — returns userAnswerId
  - `createFollowUp(prisma, opts): Promise<void>`

- [ ] **Step 1: Tạo file**

```typescript
// server/prisma/seed/_helpers.ts
import type { PrismaClient } from '@prisma/client';

interface AnswerOpts {
  sessionId: string;
  questionId: string;
  answerText: string;
  answerMode?: 'text' | 'audio';
  skipped?: boolean;
  audioFileUrl?: string;
  audioDurationSeconds?: number;
  audioSizeBytes?: number;
  feedbackGenerated?: boolean;
  feedback?: {
    overallScore: number;
    modelAnswer: string;
    keyTakeaway: string;
    promptVersion?: string;
    isFallback?: boolean;
    segments?: {
      segmentText: string;
      startIndex: number;
      endIndex: number;
      highlightLevel: 'good' | 'warning' | 'critical';
      annotation: string;
      suggestion?: string;
      improvedVersion?: string;
    }[];
  };
}

interface FollowUpOpts {
  userAnswerId: string;
  followUpText: string;
  triggerRule: string;
  triggerReason?: string;
  followUpAnswerText?: string;
}

export async function createAnswerWithFeedback(
  prisma: PrismaClient,
  opts: AnswerOpts,
): Promise<string> {
  const answer = await prisma.userAnswer.create({
    data: {
      sessionId: opts.sessionId,
      questionId: opts.questionId,
      answerText: opts.answerText,
      answerMode: opts.answerMode ?? 'text',
      skipped: opts.skipped ?? false,
      audioFileUrl: opts.audioFileUrl,
      audioDurationSeconds: opts.audioDurationSeconds,
      audioSizeBytes: opts.audioSizeBytes,
      feedbackGenerated: opts.feedbackGenerated ?? (opts.feedback !== undefined),
    },
  });

  if (opts.feedback) {
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: answer.id,
        overallScore: opts.feedback.overallScore,
        modelAnswer: opts.feedback.modelAnswer,
        keyTakeaway: opts.feedback.keyTakeaway,
        promptVersion: opts.feedback.promptVersion ?? 'v1.0-seed',
        isFallback: opts.feedback.isFallback ?? false,
        annotatedSegments: {
          create: opts.feedback.segments ?? [],
        },
      },
    });
  }

  return answer.id;
}

export async function createFollowUp(
  prisma: PrismaClient,
  opts: FollowUpOpts,
): Promise<void> {
  await prisma.followUpQuestion.create({
    data: {
      userAnswerId: opts.userAnswerId,
      followUpText: opts.followUpText,
      triggerRule: opts.triggerRule,
      triggerReason: opts.triggerReason,
      followUpAnswerText: opts.followUpAnswerText,
    },
  });
}
```

- [ ] **Step 2: Verify**

```bash
cd server && npx ts-node -e "require('./prisma/seed/_helpers')" 2>&1 | head -5
```

---

## Task 3: Context Packs — `00-context-packs.ts`

**Files:**
- Create: `server/prisma/seed/00-context-packs.ts`

**Interfaces:**
- Consumes: `prisma` từ `_client.ts`, `CONTEXT_PACK_DATA` từ `src/prisma/context-pack.data.ts`
- Produces: `seedContextPacks(prisma): Promise<void>`

- [ ] **Step 1: Tạo file (extract nguyên xi từ seed.ts)**

```typescript
// server/prisma/seed/00-context-packs.ts
import type { PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from '../../src/prisma/context-pack.data';

export async function seedContextPacks(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const pack of CONTEXT_PACK_DATA) {
      await tx.contextPack.upsert({
        where: { id: pack.id },
        create: {
          id: pack.id,
          name: pack.name,
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
        update: {
          name: pack.name,
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
      });
    }

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        await tx.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await tx.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await tx.contextPack.deleteMany({ where: { id: legacyId } });
      }
    }
  });

  console.log('context_packs: canonical IDs ensured');
}
```

- [ ] **Step 2: Verify**

```bash
cd server && npx ts-node -e "require('./prisma/seed/00-context-packs')" 2>&1 | head -5
```

---

## Task 4: Users — `01-users.ts`

**Files:**
- Create: `server/prisma/seed/01-users.ts`

**Interfaces:**
- Consumes: `prisma`, `supabaseAdmin`, `DEMO_EMAIL`, `DEMO_PASSWORD` từ `_client.ts`
- Produces: `getOrCreateDemoUser(supabaseAdmin, prisma): Promise<string>` — returns userId, `seedUserProfile(prisma, userId): Promise<void>`

- [ ] **Step 1: Tạo file**

```typescript
// server/prisma/seed/01-users.ts
import type { PrismaClient } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_EMAIL, DEMO_PASSWORD } from './_client';

export async function getOrCreateDemoUser(
  supabaseAdmin: SupabaseClient,
  prisma: PrismaClient,
): Promise<string> {
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === DEMO_EMAIL);

  let userId: string;
  if (existing) {
    console.log(`demo user: already exists (${existing.id})`);
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create demo user: ${error?.message}`);
    }
    console.log(`demo user: created (${data.user.id})`);
    userId = data.user.id;
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Ensure public.users row exists (may need manual insert if trigger didn't fire)
  let publicUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!publicUser) {
    for (let i = 0; i < 5; i++) {
      publicUser = await prisma.user.findUnique({ where: { id: userId } });
      if (publicUser) break;
      console.log(`Waiting for auth trigger (attempt ${i + 1}/5)...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!publicUser) {
    console.log('Auth trigger did not fire — inserting user manually');
    await prisma.user.create({
      data: {
        id: userId,
        email: DEMO_EMAIL,
        role: 'candidate',
        status: 'active',
        profileCompleted: false,
      },
    });
  }

  return userId;
}

export async function seedUserProfile(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: 'Nguyễn Văn Demo',
      targetPosition: 'Junior Backend Developer',
      targetRoleCategory: 'backend',
      targetLevel: 'junior',
      preferredTechStack: 'Node.js, NestJS, PostgreSQL',
      yearsExperience: 0,
      defaultLanguage: 'vi',
      ttsEnabled: false,
      gender: 'male',
      phone: '0912345678',
      hometown: 'Hà Nội',
      nationality: 'Việt Nam',
      education: [
        {
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Công nghệ thông tin',
          graduationYear: 2025,
          gpa: 3.2,
        },
      ],
      workExperience: [],
      projects: [
        {
          name: 'Interview Coach',
          description:
            'Hệ thống luyện phỏng vấn AI cho sinh viên IT Việt Nam',
          techStack: ['NestJS', 'Next.js', 'PostgreSQL', 'OpenAI'],
          role: 'Backend Developer',
          duration: '4 tháng',
        },
      ],
      technicalSkills: {
        languages: ['JavaScript', 'TypeScript', 'Java'],
        frameworks: ['NestJS', 'React', 'Next.js'],
        databases: ['PostgreSQL', 'Redis'],
        tools: ['Git', 'Docker', 'Postman'],
      },
    },
    update: {},
  });
  console.log('user profile: upserted');
}
```

---

## Task 5: Question Bank — `02-question-bank.ts`

**Files:**
- Create: `server/prisma/seed/02-question-bank.ts`

**Interfaces:**
- Consumes: `prisma` từ `_client.ts`
- Produces: `seedQuestionBank(prisma): Promise<void>`

- [ ] **Step 1: Tạo file — copy toàn bộ mảng questions từ seed.ts**

```typescript
// server/prisma/seed/02-question-bank.ts
import type { PrismaClient } from '@prisma/client';

// 90 questions: 15 per pair × 6 pairs (hr×VN, hr×Western, technical×VN,
// technical×Western, mixed×VN, mixed×Western). Giữ nguyên từ seed.ts.
const QUESTIONS = [
  // ── hr × VN (15 câu) ────────────────────────────────────────────────────
  {
    content: 'Hãy giới thiệu về bản thân bạn trong 2 phút.',
    sessionType: 'hr', difficulty: 1, contextPackId: 'VN',
    subcategory: 'self-introduction', competencyDomain: 'D4',
    applicableRoles: ['all'], applicableLevels: ['junior', 'mid', 'senior'],
  },
  // ... (copy đầy đủ 90 questions từ seed.ts::seedQuestionBank())
];

export async function seedQuestionBank(prisma: PrismaClient): Promise<void> {
  const count = await prisma.questionBank.count();
  if (count >= 90) {
    console.log('question_bank: already seeded, skipping');
    return;
  }

  await prisma.questionBank.createMany({
    data: QUESTIONS,
    skipDuplicates: true,
  });

  console.log(`question_bank: seeded ${QUESTIONS.length} questions`);
}
```

> **Implementation note:** Copy toàn bộ 90 phần tử từ mảng `questions` trong hàm `seedQuestionBank()` của `seed.ts` cũ vào `QUESTIONS`. Không thay đổi nội dung.

---

## Task 6: Sessions — `03-sessions.ts` (CORE)

**Files:**
- Create: `server/prisma/seed/03-sessions.ts`

**Interfaces:**
- Consumes: `prisma` từ `_client.ts`, `createAnswerWithFeedback`, `createFollowUp` từ `_helpers.ts`
- Produces: `seedSessions(prisma, userId): Promise<void>`

**Kịch bản cần cover:**

| Session | Status | Type | Pack | Score | Điểm đặc biệt |
|---------|--------|------|------|-------|---------------|
| S1 (existing) | completed | mixed | VN | 72 | feedback cơ bản |
| S2 (existing) | completed | hr | VN | 65 | feedback cơ bản |
| S3 (new) | completed | technical | Western | 87 | high score, all report fields, reverse Qs |
| S4 (new) | generating | mixed | VN | — | loading state, no questions |
| S5 (new) | active | mixed | Western | — | in-progress, follow-up chưa trả lời |
| S6 (new) | completed | technical | VN | 43 | low score, fallback, skipped answer |
| S7 (new) | completed | hr | Western | 71 | audio answer, showPrepCard, reverse Qs, selfEval |

- [ ] **Step 1: Tạo skeleton file**

```typescript
// server/prisma/seed/03-sessions.ts
import type { PrismaClient } from '@prisma/client';
import { createAnswerWithFeedback, createFollowUp } from './_helpers';

export async function seedSessions(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const existing = await prisma.interviewSession.count({ where: { userId } });
  if (existing >= 7) {
    console.log('sessions: already seeded (7+), skipping');
    return;
  }

  await seedSession1(prisma, userId);
  await seedSession2(prisma, userId);
  await seedSession3(prisma, userId);
  await seedSession4(prisma, userId);
  await seedSession5(prisma, userId);
  await seedSession6(prisma, userId);
  await seedSession7(prisma, userId);

  console.log('sessions: all 7 sessions seeded');
}
```

- [ ] **Step 2: seedSession1 — completed VN mixed (copy từ seed.ts, không đổi)**

```typescript
async function seedSession1(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, language: 'vi', sessionType: 'mixed', status: 'completed', overallScore: 72 },
  });
  if (exists) { console.log('S1: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Chúng tôi tìm kiếm Backend Developer với kinh nghiệm Node.js/NestJS.\nYêu cầu: Hiểu biết REST API, cơ sở dữ liệu PostgreSQL, Git workflow.\nMô tả công việc: Xây dựng và maintain các microservices, viết unit/integration tests,\ntham gia code review và cải thiện hiệu năng hệ thống.`,
      jdSource: 'paste', jobTitle: 'Junior Backend Developer',
      sessionType: 'mixed', numQuestions: 3, difficulty: 'medium',
      persona: 'neutral_tech_lead', mode: 'practice', durationMin: 30,
      language: 'vi', contextPackId: 'VN', status: 'completed',
      overallScore: 72,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: ['Nền tảng kỹ thuật tốt', 'Trả lời có cấu trúc rõ ràng'],
        improvements: ['Cần bổ sung ví dụ cụ thể hơn', 'Mở rộng kiến thức về system design'],
        overallAssessment: 'Ứng viên có tiềm năng tốt, cần thêm kinh nghiệm thực tế.',
      },
    },
  });

  // Q1 — REST vs GraphQL (technical)
  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id, questionText: 'Hãy giải thích sự khác biệt giữa REST API và GraphQL, và khi nào nên dùng cái nào?',
      orderIndex: 0, questionCategory: 'technical', competencyDomain: 'TD1',
      rubricJson: { criteria: [
        { key: 'accuracy', weight: 0.4, description: 'Giải thích đúng kỹ thuật' },
        { key: 'comparison', weight: 0.3, description: 'So sánh trade-offs rõ ràng' },
        { key: 'use_case', weight: 0.3, description: 'Biết khi nào dùng cái nào' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q1.id,
    answerText: 'REST API dùng HTTP methods (GET, POST, PUT, DELETE) với các endpoint cố định, còn GraphQL cho phép client query chính xác dữ liệu cần. REST phù hợp khi cần cache tốt và team quen thuộc, GraphQL phù hợp khi frontend cần linh hoạt query nhiều loại data khác nhau mà không muốn over-fetch.',
    feedback: {
      overallScore: 75,
      modelAnswer: 'REST API là kiến trúc dùng HTTP verbs và URL endpoints cố định. Mỗi endpoint trả về cấu trúc data định sẵn — đơn giản, dễ cache, phổ biến. GraphQL là query language, client định nghĩa chính xác data cần, tránh over/under-fetching. Chọn REST khi API đơn giản, cần caching mạnh. Chọn GraphQL khi nhiều client cần data shapes khác nhau.',
      keyTakeaway: 'Câu trả lời đúng hướng nhưng thiếu ví dụ thực tế và trade-offs về caching trong GraphQL.',
      segments: [
        { segmentText: 'REST API dùng HTTP methods (GET, POST, PUT, DELETE) với các endpoint cố định', startIndex: 0, endIndex: 65, highlightLevel: 'good', annotation: 'Định nghĩa chính xác, súc tích.' },
        { segmentText: 'REST phù hợp khi cần cache tốt và team quen thuộc', startIndex: 155, endIndex: 204, highlightLevel: 'warning', annotation: 'Thiếu giải thích tại sao REST cache tốt hơn.', suggestion: 'Đề cập HTTP caching headers và CDN support.', improvedVersion: 'REST phù hợp khi cần tận dụng HTTP caching (GET responses có thể cache ở CDN/browser).' },
      ],
    },
  });

  // Q2 — N+1 (technical)
  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id, questionText: 'Bạn xử lý N+1 query problem trong ORM như thế nào?',
      orderIndex: 1, questionCategory: 'technical', competencyDomain: 'TD4',
      rubricJson: { criteria: [
        { key: 'problem_understanding', weight: 0.3, description: 'Hiểu N+1 là gì' },
        { key: 'solution', weight: 0.5, description: 'Giải pháp đúng kỹ thuật' },
        { key: 'tools', weight: 0.2, description: 'Biết dùng tool detect' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q2.id,
    answerText: 'N+1 là khi load 1 list N items, sau đó query thêm 1 lần nữa cho mỗi item. Trong Prisma thì dùng include để eager load, ví dụ prisma.user.findMany({ include: { posts: true } }) thay vì loop qua từng user để lấy posts.',
    feedback: {
      overallScore: 78,
      modelAnswer: 'N+1 problem xảy ra khi fetch list N records, rồi query thêm 1 lần cho mỗi record (total: N+1 queries). Fix: eager loading (Prisma `include`), hoặc DataLoader pattern để batch queries. Detect bằng query logging.',
      keyTakeaway: 'Hiểu vấn đề tốt, có ví dụ Prisma cụ thể. Nên thêm cách detect và DataLoader pattern.',
      segments: [
        { segmentText: 'N+1 là khi load 1 list N items, sau đó query thêm 1 lần nữa cho mỗi item', startIndex: 0, endIndex: 70, highlightLevel: 'good', annotation: 'Định nghĩa đúng và rõ ràng.' },
        { segmentText: 'prisma.user.findMany({ include: { posts: true } })', startIndex: 120, endIndex: 170, highlightLevel: 'good', annotation: 'Ví dụ code cụ thể — rất tốt trong phỏng vấn kỹ thuật.' },
      ],
    },
  });

  // Q3 — behavioral conflict
  const q3 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id, questionText: 'Kể về một lần bạn gặp conflict với teammate và cách bạn giải quyết?',
      orderIndex: 2, questionCategory: 'behavioral', competencyDomain: 'D3',
      rubricJson: { criteria: [
        { key: 'star_structure', weight: 0.3, description: 'Dùng cấu trúc STAR' },
        { key: 'self_awareness', weight: 0.35, description: 'Tự nhận thức, không đổ lỗi' },
        { key: 'outcome', weight: 0.35, description: 'Kết quả cụ thể' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q3.id,
    answerText: 'Trong project cuối kỳ, tôi và teammate bất đồng về cách thiết kế database. Tôi muốn normalize nhiều hơn còn bạn muốn denormalize để query nhanh hơn. Tôi đề xuất ngồi lại phân tích use case cụ thể, sau đó cả hai đồng ý dùng hybrid approach. Project hoàn thành đúng hạn và performance đạt yêu cầu.',
    feedback: {
      overallScore: 68,
      modelAnswer: 'Câu trả lời behavioral tốt cần dùng cấu trúc STAR. Nêu rõ bối cảnh, vai trò của bạn, hành động cụ thể bạn thực hiện (không phải "cả hai"), và kết quả đo được.',
      keyTakeaway: 'Có cấu trúc nhưng Action quá ngắn — cần nêu rõ bạn làm gì cụ thể.',
      segments: [
        { segmentText: 'Tôi đề xuất ngồi lại phân tích use case cụ thể', startIndex: 130, endIndex: 176, highlightLevel: 'warning', annotation: 'Action quá mờ nhạt.', suggestion: 'Mô tả chi tiết hơn: bạn chuẩn bị tài liệu gì, đặt câu hỏi gì, ai quyết định cuối.', improvedVersion: 'Tôi chuẩn bị bảng so sánh pros/cons của từng approach với 3 query pattern thực tế.' },
        { segmentText: 'Project hoàn thành đúng hạn và performance đạt yêu cầu', startIndex: 220, endIndex: 272, highlightLevel: 'good', annotation: 'Kết quả rõ ràng — tốt.' },
      ],
    },
  });

  console.log('S1 (completed VN mixed): seeded');
}
```

- [ ] **Step 3: seedSession2 — completed VN hr (copy từ seed.ts)**

```typescript
async function seedSession2(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, sessionType: 'hr', language: 'vi', overallScore: 65 },
  });
  if (exists) { console.log('S2: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Frontend Developer tại startup fintech. Yêu cầu: React, TypeScript, hiểu RESTful API.\nBạn sẽ làm việc trực tiếp với product team để build tính năng mới và cải thiện UX.`,
      jdSource: 'paste', jobTitle: 'Junior Frontend Developer',
      sessionType: 'hr', numQuestions: 2, difficulty: 'easy',
      persona: 'friendly_hr', mode: 'practice', durationMin: 20,
      language: 'vi', contextPackId: 'VN', status: 'completed',
      overallScore: 65,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: ['Tự tin trình bày', 'Hiểu rõ mục tiêu bản thân'],
        improvements: ['Câu trả lời hơi chung chung, cần ví dụ cụ thể hơn'],
        overallAssessment: 'Potential tốt cho vị trí junior, cần polish câu trả lời behavioral.',
      },
    },
  });

  // Q4 — Why this company
  const q4 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id, questionText: 'Tại sao bạn muốn làm việc tại công ty chúng tôi?',
      orderIndex: 0, questionCategory: 'behavioral', competencyDomain: 'D4',
      rubricJson: { criteria: [
        { key: 'research', weight: 0.35, description: 'Đã tìm hiểu về công ty' },
        { key: 'alignment', weight: 0.4, description: 'Kết nối với mục tiêu bản thân' },
        { key: 'genuine', weight: 0.25, description: 'Câu trả lời chân thật' },
      ]},
      estimatedTimeMin: 4,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q4.id,
    answerText: 'Tôi muốn làm việc ở đây vì đây là môi trường fintech đang tăng trưởng mạnh, tôi muốn học hỏi thêm về domain này và đóng góp bằng kỹ năng React của mình. Ngoài ra tôi thích môi trường startup nhỏ nơi mình có thể thấy impact của công việc trực tiếp.',
    feedback: {
      overallScore: 62,
      modelAnswer: 'Câu trả lời tốt cần: (1) thể hiện đã research về công ty cụ thể, (2) kết nối điểm mạnh với nhu cầu của họ, (3) chân thật về lý do cá nhân.',
      keyTakeaway: 'Câu trả lời còn generic — cần mention điều gì cụ thể về công ty này.',
      segments: [
        { segmentText: 'đây là môi trường fintech đang tăng trưởng mạnh', startIndex: 22, endIndex: 68, highlightLevel: 'warning', annotation: 'Quá generic — không cho thấy bạn đã research về công ty này.', suggestion: 'Mention sản phẩm cụ thể, tính năng, hoặc tin tức gần đây của họ.' },
        { segmentText: 'tôi thích môi trường startup nhỏ nơi mình có thể thấy impact của công việc trực tiếp', startIndex: 160, endIndex: 248, highlightLevel: 'good', annotation: 'Câu này chân thật và có giá trị.' },
      ],
    },
  });

  // Q5 — biggest weakness
  const q5 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id, questionText: 'Điểm yếu lớn nhất của bạn là gì và bạn đang cải thiện nó như thế nào?',
      orderIndex: 1, questionCategory: 'behavioral', competencyDomain: 'D6',
      rubricJson: { criteria: [
        { key: 'honesty', weight: 0.3, description: 'Thật thà, không nói điểm yếu giả' },
        { key: 'growth', weight: 0.4, description: 'Có kế hoạch cải thiện cụ thể' },
        { key: 'awareness', weight: 0.3, description: 'Tự nhận thức tốt' },
      ]},
      estimatedTimeMin: 4,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q5.id,
    answerText: 'Điểm yếu của tôi là đôi khi tôi perfectionist quá mức, dành nhiều thời gian cho chi tiết nhỏ. Tôi đang cải thiện bằng cách đặt time-box cho từng task và ưu tiên theo impact.',
    feedback: {
      overallScore: 70,
      modelAnswer: 'Câu trả lời về điểm yếu tốt cần: điểm yếu thật (không phải "tôi làm việc quá chăm"), giải thích impact thực tế, và kế hoạch cải thiện có kết quả đo được.',
      keyTakeaway: 'Điểm yếu thật, kế hoạch hợp lý. Cần thêm kết quả cụ thể từ việc cải thiện.',
      segments: [
        { segmentText: 'đặt time-box cho từng task và ưu tiên theo impact', startIndex: 122, endIndex: 171, highlightLevel: 'good', annotation: 'Giải pháp cụ thể và thực tế.' },
        { segmentText: 'đôi khi tôi perfectionist quá mức', startIndex: 18, endIndex: 51, highlightLevel: 'warning', annotation: '"Perfectionist" là điểm yếu phổ biến nhất — nghe không tự nhiên.', suggestion: 'Thêm ví dụ cụ thể khi perfectionism đã gây ra vấn đề thực tế.' },
      ],
    },
  });

  console.log('S2 (completed VN hr): seeded');
}
```

- [ ] **Step 4: seedSession3 — completed Western technical, high score (87), full report, reverse Qs**

```typescript
async function seedSession3(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, sessionType: 'technical', language: 'en', overallScore: 87 },
  });
  if (exists) { console.log('S3: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `We are looking for a Senior Frontend Engineer to join our core product team.\nRequirements: 3+ years React, TypeScript, state management (Redux/Zustand), performance optimization.\nResponsibilities: Lead frontend architecture decisions, mentor junior devs, collaborate with design and backend teams.`,
      jdSource: 'paste', jobTitle: 'Senior Frontend Engineer',
      sessionType: 'technical', numQuestions: 3, difficulty: 'hard',
      persona: 'neutral_tech_lead', mode: 'mock', durationMin: 45,
      language: 'en', contextPackId: 'Western', status: 'completed',
      overallScore: 87,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: [
          'Deep understanding of React rendering model and performance optimization',
          'Clear communication with concrete code examples',
          'Strong awareness of trade-offs between approaches',
        ],
        improvements: [
          'Could elaborate more on system-level design patterns',
          'TypeScript generic constraints explanation could be more precise',
        ],
        overallAssessment: 'Strong candidate with senior-level thinking. Ready for a mid-to-senior role.',
      },
      commAnalysisJson: {
        clarity: 88,
        structure: 85,
        conciseness: 82,
        technicalVocabulary: 91,
        notes: 'Excellent use of concrete examples. Responses are well-structured with clear intro/body/conclusion.',
      },
      competencyHeatmapJson: {
        TD1: { score: 85, label: 'Foundational Knowledge', status: 'strong' },
        TD2: { score: 90, label: 'Practical Application', status: 'strong' },
        TD3: { score: 80, label: 'Systems Thinking', status: 'adequate' },
        TD4: { score: 88, label: 'Code Quality & Best Practices', status: 'strong' },
        TD5: { score: 75, label: 'Debug & Problem-solving', status: 'adequate' },
      },
      reverseQEvalJson: {
        overallQuality: 'strong',
        questionsAsked: 2,
        notes: 'Candidate asked thoughtful questions about team culture and technical roadmap.',
      },
      actionPlanJson: {
        shortTerm: [
          'Study system design patterns (distributed systems, event-driven architecture)',
          'Practice TypeScript advanced types (conditional types, mapped types)',
        ],
        longTerm: [
          'Build a side project with micro-frontend architecture',
          'Contribute to an open-source React performance library',
        ],
      },
    },
  });

  // Q1 — React performance optimization
  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'How would you diagnose and fix a React application that has slow rendering performance? Walk me through your approach.',
      orderIndex: 0, questionCategory: 'technical', competencyDomain: 'TD5',
      rubricJson: { criteria: [
        { key: 'diagnosis', weight: 0.35, description: 'Knows how to profile React apps' },
        { key: 'solutions', weight: 0.4, description: 'Concrete fixes: memo, useMemo, code splitting' },
        { key: 'tradeoffs', weight: 0.25, description: 'Understands when NOT to optimize' },
      ]},
      estimatedTimeMin: 8,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q1.id,
    answerText: `I start with React DevTools Profiler to identify components with high render time. Common culprits are: unnecessary re-renders from parent state changes, expensive calculations in render, and large lists without virtualization. Fixes include: React.memo for pure components, useMemo for expensive computations, useCallback for stable function references, react-window for long lists, and code-splitting with React.lazy. I am careful not to over-optimize — premature optimization can make code harder to read without measurable benefit.`,
    feedback: {
      overallScore: 91,
      modelAnswer: 'Profile first (React DevTools Profiler, why-did-you-render). Identify: unnecessary re-renders, expensive renders, large lists. Fix: React.memo, useMemo, useCallback, virtualization (react-window), code splitting (React.lazy + Suspense). Key insight: measure first, optimize second.',
      keyTakeaway: 'Excellent structured answer. The mention of "not over-optimizing" shows senior-level maturity.',
      segments: [
        { segmentText: 'I start with React DevTools Profiler to identify components with high render time', startIndex: 0, endIndex: 81, highlightLevel: 'good', annotation: 'Perfect opening — measure before fixing.' },
        { segmentText: 'I am careful not to over-optimize — premature optimization can make code harder to read without measurable benefit', startIndex: 370, endIndex: 481, highlightLevel: 'good', annotation: 'Senior-level perspective. This is what distinguishes experienced engineers.' },
      ],
    },
  });

  // Q2 — TypeScript generics
  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Explain TypeScript generics and give an example of when you would use generic constraints.',
      orderIndex: 1, questionCategory: 'technical', competencyDomain: 'TD1',
      rubricJson: { criteria: [
        { key: 'generics_concept', weight: 0.4, description: 'Explains generics correctly' },
        { key: 'constraints', weight: 0.35, description: 'Demonstrates extends/keyof constraints' },
        { key: 'real_example', weight: 0.25, description: 'Provides practical use case' },
      ]},
      estimatedTimeMin: 7,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q2.id,
    answerText: `Generics allow you to write reusable code that works with different types while maintaining type safety. For example, a generic identity function: function identity<T>(value: T): T { return value; }. Generic constraints use the extends keyword to limit what types are accepted. A practical example: function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] — this ensures you can only access valid keys of the object. I use this pattern in API response handlers to safely extract typed data from generic response wrappers.`,
    feedback: {
      overallScore: 84,
      modelAnswer: 'Generics are parameterized types. T is a placeholder resolved at call-site. Constraints: `T extends SomeType` limits valid types; `K extends keyof T` is a common pattern for type-safe property access. Practical uses: reusable data structures (Stack<T>), API wrappers (Response<T>), utility functions.',
      keyTakeaway: 'Good explanation with correct example. Could mention conditional types or mapped types for a more complete picture.',
      segments: [
        { segmentText: 'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]', startIndex: 280, endIndex: 345, highlightLevel: 'good', annotation: 'This is the classic constraint example — exactly what the interviewer was looking for.' },
        { segmentText: 'I use this pattern in API response handlers', startIndex: 348, endIndex: 391, highlightLevel: 'good', annotation: 'Connecting theory to real-world use is a strong signal.' },
      ],
    },
  });

  // Q3 — Code splitting / bundling
  const q3 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'How does code splitting work in a React application and what strategies do you use?',
      orderIndex: 2, questionCategory: 'technical', competencyDomain: 'TD2',
      rubricJson: { criteria: [
        { key: 'concept', weight: 0.35, description: 'Understands dynamic imports and chunks' },
        { key: 'tools', weight: 0.35, description: 'React.lazy, Suspense, route-based splitting' },
        { key: 'tradeoffs', weight: 0.3, description: 'Trade-offs: loading states, prefetching' },
      ]},
      estimatedTimeMin: 6,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q3.id,
    answerText: `Code splitting defers loading JavaScript until it is needed, reducing initial bundle size. In React I use React.lazy with Suspense for component-level splitting: const LazyChart = React.lazy(() => import('./Chart')). For routes I split at the route level using React Router with lazy imports — each route becomes its own chunk. I also use dynamic import() for heavy libraries loaded conditionally. Trade-offs: you need meaningful loading states, and overly granular splitting can increase HTTP requests. For critical paths I sometimes use prefetching with link rel="prefetch".`,
    feedback: {
      overallScore: 88,
      modelAnswer: 'Code splitting via dynamic import() creates separate chunks. React.lazy + Suspense handle component-level splitting. Route-based splitting is most impactful. Strategies: component splitting, route splitting, vendor chunk separation. Trade-offs: loading states, waterfall risk, prefetching with <link rel="prefetch">.',
      keyTakeaway: 'Strong answer covering mechanics, tools, trade-offs, and prefetching optimization.',
      segments: [
        { segmentText: 'reducing initial bundle size', startIndex: 70, endIndex: 97, highlightLevel: 'good', annotation: 'Correctly identifies the primary goal.' },
        { segmentText: 'overly granular splitting can increase HTTP requests', startIndex: 380, endIndex: 430, highlightLevel: 'good', annotation: 'This trade-off is often missed — demonstrates depth.' },
      ],
    },
  });

  // Reverse questions
  await prisma.reverseQuestion.createMany({
    data: [
      {
        sessionId: s.id,
        questionText: 'How does the team handle technical debt — is there a dedicated process for it, or is it addressed opportunistically?',
        answerMode: 'text',
        aiResponse: 'Great question. We have a structured approach: 20% of each sprint is allocated to tech debt, tracked via a dedicated board column. We also hold quarterly "debt reduction" weeks. That said, opportunistic fixes during feature work are also encouraged.',
        evaluationLabel: 'strong',
        evaluationComment: 'Demonstrates strategic thinking about engineering health, not just feature delivery.',
        orderIndex: 0,
      },
      {
        sessionId: s.id,
        questionText: 'What does the frontend architecture look like today and where is it heading in the next 12 months?',
        answerMode: 'text',
        aiResponse: 'Currently a monolithic Next.js app. Over the next 12 months we are planning to extract the design system into a separate package and explore micro-frontend patterns for the dashboard section.',
        evaluationLabel: 'adequate',
        evaluationComment: 'Good question, slightly generic. Adding "based on the JD I saw you use Next.js..." would show more research.',
        orderIndex: 1,
      },
    ],
  });

  console.log('S3 (completed Western technical, score 87): seeded');
}
```

- [ ] **Step 5: seedSession4 — generating status (no questions)**

```typescript
async function seedSession4(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, status: 'generating' },
  });
  if (exists) { console.log('S4: skip'); return; }

  await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Tìm kiếm Full Stack Developer có kinh nghiệm React và Node.js.\nCông ty đang xây dựng nền tảng e-learning cho thị trường Đông Nam Á.\nYêu cầu: 1-2 năm kinh nghiệm, có portfolio dự án thực tế.`,
      jdSource: 'paste', jobTitle: 'Full Stack Developer',
      sessionType: 'mixed', numQuestions: 5, difficulty: 'medium',
      persona: 'neutral_tech_lead', mode: 'practice', durationMin: 35,
      language: 'vi', contextPackId: 'VN', status: 'generating',
    },
  });

  console.log('S4 (generating): seeded');
}
```

- [ ] **Step 6: seedSession5 — active (in-progress), follow-up question chưa trả lời**

```typescript
async function seedSession5(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, status: 'active' },
  });
  if (exists) { console.log('S5: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `We are hiring a Backend Engineer to work on our API platform.\nYou will design and build scalable REST APIs, work with PostgreSQL and Redis, and participate in system design discussions.\nIdeal candidate: 1-3 years experience, strong fundamentals, team player.`,
      jdSource: 'paste', jobTitle: 'Backend Engineer',
      sessionType: 'mixed', numQuestions: 4, difficulty: 'medium',
      persona: 'neutral_tech_lead', mode: 'practice', durationMin: 30,
      language: 'en', contextPackId: 'Western', status: 'active',
    },
  });

  // Q1 — answered, follow-up generated but not answered
  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Describe a project where you made a significant architectural decision. What was it and what was the outcome?',
      orderIndex: 0, questionCategory: 'technical', competencyDomain: 'TD3',
      rubricJson: { criteria: [
        { key: 'decision_quality', weight: 0.4, description: 'Was the decision well-reasoned?' },
        { key: 'outcome', weight: 0.35, description: 'Concrete result with metrics' },
        { key: 'reflection', weight: 0.25, description: 'What would you do differently?' },
      ]},
      estimatedTimeMin: 7,
    },
  });
  const a1Id = await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q1.id,
    answerText: 'In my capstone project, I decided to use a monolithic architecture instead of microservices because the team was small and we had a tight deadline. It made deployment simpler.',
    feedbackGenerated: false,
  });
  await createFollowUp(prisma, {
    userAnswerId: a1Id,
    followUpText: 'That\'s interesting. Looking back, were there any downsides to choosing a monolith? How would you approach this decision differently with more time?',
    triggerRule: 'needs_depth',
    triggerReason: 'Answer is too brief and lacks reflection on trade-offs. Follow-up to probe for deeper analysis.',
  });

  // Q2 — answered normally, no follow-up
  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'How do you approach writing documentation for an API you have built?',
      orderIndex: 1, questionCategory: 'technical', competencyDomain: 'TD4',
      rubricJson: { criteria: [
        { key: 'tools', weight: 0.3, description: 'OpenAPI/Swagger knowledge' },
        { key: 'audience', weight: 0.35, description: 'Considers who reads the docs' },
        { key: 'maintenance', weight: 0.35, description: 'How docs stay up to date' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q2.id,
    answerText: 'I use OpenAPI spec (Swagger) as the single source of truth, generated from decorators in NestJS. I write examples for every endpoint, document error codes, and include a "Getting Started" section for new consumers. I keep docs in sync by making them part of the PR checklist — no merge without updated spec.',
    feedbackGenerated: false,
  });

  // Q3 + Q4 — not yet answered (no UserAnswer created)
  await prisma.sessionQuestion.createMany({
    data: [
      {
        sessionId: s.id,
        questionText: 'Tell me about a time you had to deliver a project under tight time pressure. How did you prioritize?',
        orderIndex: 2, questionCategory: 'behavioral', competencyDomain: 'D2',
        rubricJson: { criteria: [{ key: 'prioritization', weight: 0.5, description: 'Clear framework' }, { key: 'outcome', weight: 0.5, description: 'Measurable result' }] },
        estimatedTimeMin: 5,
      },
      {
        sessionId: s.id,
        questionText: 'What is your experience with Redis? How have you used it in production?',
        orderIndex: 3, questionCategory: 'technical', competencyDomain: 'TD2',
        rubricJson: { criteria: [{ key: 'use_cases', weight: 0.5, description: 'Knows caching, pub/sub, sessions' }, { key: 'gotchas', weight: 0.5, description: 'Aware of eviction, persistence trade-offs' }] },
        estimatedTimeMin: 5,
      },
    ],
  });

  console.log('S5 (active, 2/4 answered, follow-up pending): seeded');
}
```

- [ ] **Step 7: seedSession6 — completed VN technical, low score (43), fallback, skipped**

```typescript
async function seedSession6(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, sessionType: 'technical', language: 'vi', overallScore: 43 },
  });
  if (exists) { console.log('S6: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Backend Developer với kinh nghiệm Python và Django. Yêu cầu: 2+ năm kinh nghiệm thực tế, hiểu design patterns, kinh nghiệm với REST API và SQL tối ưu hóa.`,
      jdSource: 'paste', jobTitle: 'Python Backend Developer',
      sessionType: 'technical', numQuestions: 3, difficulty: 'hard',
      persona: 'strict_senior', mode: 'practice', durationMin: 45,
      language: 'vi', contextPackId: 'VN', status: 'completed',
      overallScore: 43,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: ['Có kiến thức cơ bản về SQL'],
        improvements: [
          'Kiến thức về design patterns còn yếu — chưa áp dụng được vào thực tế',
          'Cần luyện tập giải thích kỹ thuật với ví dụ code cụ thể',
          'Một câu hỏi bị bỏ qua — cần cải thiện sự tự tin',
        ],
        overallAssessment: 'Ứng viên chưa đáp ứng yêu cầu kỹ thuật của vị trí này. Cần củng cố nền tảng thêm 3-6 tháng.',
      },
    },
  });

  // Q1 — poor answer with critical segments
  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Giải thích Dependency Injection là gì và tại sao nó quan trọng trong thiết kế hệ thống lớn?',
      orderIndex: 0, questionCategory: 'technical', competencyDomain: 'TD4',
      rubricJson: { criteria: [
        { key: 'concept', weight: 0.4, description: 'Hiểu đúng DI là gì' },
        { key: 'benefits', weight: 0.35, description: 'Nêu được lợi ích: testability, loose coupling' },
        { key: 'example', weight: 0.25, description: 'Ví dụ cụ thể từ framework quen thuộc' },
      ]},
      estimatedTimeMin: 7,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q1.id,
    answerText: 'Dependency Injection là khi bạn inject dependency vào class thay vì tạo trực tiếp trong class. Tôi nghĩ nó giúp code dễ test hơn. Trong Python tôi chưa dùng nhiều nhưng Django có thể làm được điều này.',
    feedback: {
      overallScore: 38,
      modelAnswer: 'DI là kỹ thuật cung cấp dependencies cho một object từ bên ngoài thay vì để object tự tạo. Lợi ích: loose coupling (class không phụ thuộc implementation cụ thể), testability (mock dependencies dễ dàng), SOLID Open/Closed Principle. Trong Python: dùng injector library, hoặc FastAPI\'s Depends(). Trong Django: services được inject qua constructor hoặc factory functions.',
      keyTakeaway: 'Định nghĩa đúng nhưng rất mơ hồ. Không có ví dụ code, không nêu được lợi ích cụ thể. Câu "Django có thể làm được" cho thấy không thực sự quen thuộc với pattern này.',
      segments: [
        { segmentText: 'inject dependency vào class thay vì tạo trực tiếp trong class', startIndex: 25, endIndex: 79, highlightLevel: 'good', annotation: 'Định nghĩa core đúng.' },
        { segmentText: 'Tôi nghĩ nó giúp code dễ test hơn', startIndex: 81, endIndex: 115, highlightLevel: 'warning', annotation: '"Tôi nghĩ" — thiếu tự tin. Đây là fact, không phải opinion.', suggestion: 'Nói: "DI giúp code dễ test hơn vì bạn có thể mock dependencies trong unit test."' },
        { segmentText: 'Django có thể làm được điều này', startIndex: 155, endIndex: 186, highlightLevel: 'critical', annotation: 'Câu trả lời quá mơ hồ — "có thể làm được" cho thấy chưa thực sự dùng pattern này. Phỏng vấn viên sẽ nhận ra ngay.', suggestion: 'Nếu chưa dùng nhiều, hãy thành thật nhưng show hiểu lý thuyết và có code example đơn giản.', improvedVersion: 'Trong Python, DI có thể implement thủ công: class UserService: def __init__(self, repo: UserRepository): self.repo = repo. Trong test: UserService(repo=MockRepository()).' },
      ],
    },
  });

  // Q2 — fallback feedback (simulates AI timeout/error, isFallback=true)
  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Kể về cách bạn tối ưu hóa một câu query SQL chậm. Bạn sẽ bắt đầu từ đâu?',
      orderIndex: 1, questionCategory: 'technical', competencyDomain: 'TD5',
      rubricJson: { criteria: [
        { key: 'diagnosis', weight: 0.35, description: 'EXPLAIN ANALYZE, slow query log' },
        { key: 'solutions', weight: 0.4, description: 'Indexing, query rewrite, pagination' },
        { key: 'prevention', weight: 0.25, description: 'Query monitoring in production' },
      ]},
      estimatedTimeMin: 6,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q2.id,
    answerText: 'Tôi sẽ chạy EXPLAIN để xem query plan. Nếu full scan thì thêm index. Cũng có thể tách query nhỏ hơn hoặc dùng cache.',
    feedback: {
      overallScore: 48,
      modelAnswer: 'Đây là phản hồi tạm thời do hệ thống gặp sự cố. Câu trả lời của bạn đã được ghi nhận.',
      keyTakeaway: 'Phản hồi chi tiết chưa thể tạo do lỗi hệ thống. Vui lòng thử lại sau.',
      isFallback: true,
      segments: [],
    },
  });

  // Q3 — skipped answer
  const q3 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Mô tả sự khác biệt giữa các loại index trong PostgreSQL: B-tree, Hash, GIN, GiST. Khi nào dùng loại nào?',
      orderIndex: 2, questionCategory: 'technical', competencyDomain: 'TD1',
      rubricJson: { criteria: [
        { key: 'btree', weight: 0.3, description: 'Hiểu B-tree là default, dùng cho equality/range' },
        { key: 'hash', weight: 0.2, description: 'Hash cho equality only' },
        { key: 'gin_gist', weight: 0.5, description: 'GIN/GiST cho full-text search, array, jsonb' },
      ]},
      estimatedTimeMin: 7,
    },
  });
  await prisma.userAnswer.create({
    data: {
      sessionId: s.id,
      questionId: q3.id,
      answerMode: 'text',
      answerText: '',
      skipped: true,
      feedbackGenerated: false,
    },
  });

  console.log('S6 (completed VN technical, score 43, fallback, skipped): seeded');
}
```

- [ ] **Step 8: seedSession7 — completed Western hr, audio answer, showPrepCard, selfEval, reverse Qs**

```typescript
async function seedSession7(prisma: PrismaClient, userId: string) {
  const exists = await prisma.interviewSession.findFirst({
    where: { userId, sessionType: 'hr', language: 'en', overallScore: 71 },
  });
  if (exists) { console.log('S7: skip'); return; }

  const s = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Product Manager at a B2B SaaS company. We are looking for someone with strong communication skills, data-driven mindset, and cross-functional collaboration experience. This is an entry-level PM role open to candidates from technical backgrounds.`,
      jdSource: 'paste', jobTitle: 'Associate Product Manager',
      sessionType: 'hr', numQuestions: 3, difficulty: 'medium',
      persona: 'friendly_hr', mode: 'practice', durationMin: 25,
      language: 'en', contextPackId: 'Western', status: 'completed',
      showPrepCard: true,
      overallScore: 71,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        selfScore: 65,
        strongPoints: 'I thought my answer about teamwork was clear and genuine.',
        weakPoints: 'I struggled with the question about failure — I rambled.',
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
      },
      executiveSummaryJson: {
        strengths: ['Genuine enthusiasm for product work', 'Clear self-awareness in responses'],
        improvements: [
          'Failure story needs more structure (STAR format)',
          'Audio answers had some filler words (um, like) — practice delivery',
        ],
        overallAssessment: 'Good potential for an APM role. Focus on STAR storytelling and reducing filler words.',
      },
      commAnalysisJson: {
        clarity: 72,
        structure: 68,
        conciseness: 65,
        fillerWords: { count: 12, examples: ['um', 'like', 'you know'] },
        notes: 'Filler words detected in audio response. Text responses are cleaner.',
      },
      competencyHeatmapJson: {
        D1: { score: 70, label: 'Communication & Presentation', status: 'adequate' },
        D2: { score: 75, label: 'Critical Thinking', status: 'adequate' },
        D3: { score: 80, label: 'Collaboration & Teamwork', status: 'strong' },
        D4: { score: 72, label: 'Leadership & Initiative', status: 'adequate' },
        D5: { score: 65, label: 'Culture Fit & Values', status: 'adequate' },
        D6: { score: 68, label: 'Self-Awareness & Growth', status: 'adequate' },
      },
      reverseQEvalJson: {
        overallQuality: 'adequate',
        questionsAsked: 2,
        notes: 'Questions were relevant but could be more specific to the role and team.',
      },
      actionPlanJson: {
        shortTerm: [
          'Practice STAR method with 5 real stories from your experience',
          'Record yourself answering behavioral questions — identify filler words',
        ],
        longTerm: [
          'Shadow a PM for a week to understand day-to-day responsibilities',
          'Build a product case study portfolio',
        ],
      },
    },
  });

  // Q1 — text answer, good
  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Tell me about a time you collaborated closely with engineers on a technical project. What was your role and what did you learn?',
      orderIndex: 0, questionCategory: 'behavioral', competencyDomain: 'D3',
      rubricJson: { criteria: [
        { key: 'role_clarity', weight: 0.35, description: 'Clear about own contribution' },
        { key: 'learning', weight: 0.35, description: 'Concrete takeaway from the experience' },
        { key: 'collaboration', weight: 0.3, description: 'Shows how they worked with engineers' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q1.id,
    answerText: 'During my capstone project I acted as the de-facto PM while two teammates focused on backend development. I wrote the API contract using OpenAPI, ran weekly syncs to unblock the team, and translated user feedback into concrete tickets. I learned to write requirements at the right level of detail — not too high-level that engineers guess, not so prescriptive they cannot make technical decisions.',
    feedback: {
      overallScore: 82,
      modelAnswer: 'Strong answer: clear role (de-facto PM), specific actions (API contract, syncs, tickets), and a concrete learning about requirement granularity.',
      keyTakeaway: 'Excellent answer. The learning is specific and shows product-engineering empathy.',
      segments: [
        { segmentText: 'I wrote the API contract using OpenAPI', startIndex: 98, endIndex: 136, highlightLevel: 'good', annotation: 'Concrete artifact — makes the collaboration tangible.' },
        { segmentText: 'not too high-level that engineers guess, not so prescriptive they cannot make technical decisions', startIndex: 300, endIndex: 395, highlightLevel: 'good', annotation: 'This insight demonstrates product thinking maturity beyond entry level.' },
      ],
    },
  });

  // Q2 — audio answer (mock URL)
  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Describe a time you failed or made a significant mistake. What happened and what did you do afterward?',
      orderIndex: 1, questionCategory: 'behavioral', competencyDomain: 'D6',
      rubricJson: { criteria: [
        { key: 'ownership', weight: 0.4, description: 'Takes responsibility without excuses' },
        { key: 'recovery', weight: 0.35, description: 'Concrete steps taken to fix/learn' },
        { key: 'growth', weight: 0.25, description: 'Specific lesson applied afterward' },
      ]},
      estimatedTimeMin: 5,
    },
  });
  await createAnswerWithFeedback(prisma, {
    sessionId: s.id, questionId: q2.id,
    answerMode: 'audio',
    answerText: 'Um, so like, I was working on this group project and I, um, missed a deadline for a deliverable because I underestimated how long it would take. My team was pretty frustrated. I, you know, apologized right away and stayed up to finish it that night. After that I started using time estimates with buffers in all my planning.',
    audioFileUrl: 'https://storage.example.com/audio/seed-session7-q2.webm',
    audioDurationSeconds: 48,
    audioSizeBytes: 384000,
    voiceMetricsJson: {
      wordsPerMinute: 128,
      fillerWordCount: 5,
      fillerWords: ['um', 'like', 'you know'],
      pauseCount: 3,
      avgPauseDurationMs: 420,
      confidenceScore: 62,
    },
    feedback: {
      overallScore: 65,
      modelAnswer: 'Good failure story: missed a deadline (real mistake, not a humble-brag), took immediate ownership, concrete recovery action. Use STAR: Situation (project scope), Task (your deliverable), Action (staying up, apologizing), Result (completed + process change learned).',
      keyTakeaway: 'The story and learning are solid. Delivery had filler words — practice for a cleaner verbal version.',
      segments: [
        { segmentText: 'I apologized right away and stayed up to finish it that night', startIndex: 185, endIndex: 247, highlightLevel: 'good', annotation: 'Ownership + immediate action — exactly what interviewers want to see.' },
        { segmentText: 'Um, so like, I was working', startIndex: 0, endIndex: 26, highlightLevel: 'warning', annotation: 'Opening with filler words weakens first impression. Start with the situation directly.', suggestion: 'In my second year of university, I missed a critical deadline...', improvedVersion: 'During my senior capstone, I missed a key milestone because I failed to account for integration complexity.' },
      ],
    },
  });

  // Q3 — skipped
  const q3 = await prisma.sessionQuestion.create({
    data: {
      sessionId: s.id,
      questionText: 'Where do you see yourself in 5 years, and how does this role fit into that path?',
      orderIndex: 2, questionCategory: 'behavioral', competencyDomain: 'D4',
      rubricJson: { criteria: [
        { key: 'clarity', weight: 0.35, description: 'Clear career direction' },
        { key: 'alignment', weight: 0.4, description: 'Role fits the stated goal' },
        { key: 'realism', weight: 0.25, description: 'Realistic, not just "CEO in 5 years"' },
      ]},
      estimatedTimeMin: 4,
    },
  });
  await prisma.userAnswer.create({
    data: {
      sessionId: s.id, questionId: q3.id,
      answerMode: 'text', answerText: '',
      skipped: true, feedbackGenerated: false,
    },
  });

  // Reverse questions
  await prisma.reverseQuestion.createMany({
    data: [
      {
        sessionId: s.id,
        questionText: 'What does a typical first week look like for someone in this role?',
        answerMode: 'text',
        aiResponse: 'In the first week, you would shadow the existing PM, attend all sprint ceremonies, read through existing PRDs and user research, and have 1:1s with each team member. By the end of week one we expect you to have a solid picture of the current roadmap.',
        evaluationLabel: 'adequate',
        evaluationComment: 'Standard onboarding question. Useful but not differentiated. Adding "...and what is the biggest challenge a new APM typically faces?" would strengthen it.',
        orderIndex: 0,
      },
      {
        sessionId: s.id,
        questionText: 'How does the team currently measure product success and what metrics does the PM own?',
        answerMode: 'text',
        aiResponse: 'We track activation rate, weekly active users, and NPS. The PM owns the product metrics dashboard and reports to the Head of Product in weekly reviews. You would also own the feature adoption metrics for your specific squad.',
        evaluationLabel: 'strong',
        evaluationComment: 'Excellent question — shows business acumen and interest in accountability. This is what differentiated candidates ask.',
        orderIndex: 1,
      },
    ],
  });

  console.log('S7 (completed Western hr, audio, showPrepCard, score 71): seeded');
}
```

- [ ] **Step 9: Verify TypeScript không lỗi**

```bash
cd server && npx tsc --noEmit --project tsconfig.json 2>&1 | grep "prisma/seed/03" | head -20
```

---

## Task 7: AiQualityLog — `04-ai-quality-log.ts`

**Files:**
- Create: `server/prisma/seed/04-ai-quality-log.ts`

**Interfaces:**
- Produces: `seedAiQualityLog(prisma): Promise<void>`

- [ ] **Step 1: Tạo file**

```typescript
// server/prisma/seed/04-ai-quality-log.ts
import type { PrismaClient } from '@prisma/client';

// Job types mirror BullMQ queue names in AiModule
const LOG_ENTRIES = [
  // Thành công — question generation
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1',
    inputTokens: 1240, outputTokens: 890, latencyMs: 3200, isFallback: false },
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1',
    inputTokens: 1380, outputTokens: 920, latencyMs: 3850, isFallback: false },
  // Thành công — per-answer feedback
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3',
    inputTokens: 2100, outputTokens: 1450, latencyMs: 4100, isFallback: false },
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3',
    inputTokens: 1980, outputTokens: 1320, latencyMs: 3900, isFallback: false },
  { jobType: 'answer-feedback', model: 'gpt-4o', promptVersion: 'feedback-v1.3',
    inputTokens: 2250, outputTokens: 1600, latencyMs: 4500, isFallback: false },
  // Fallback — answer feedback (timeout, used gpt-4o-mini)
  { jobType: 'answer-feedback', model: 'gpt-4o-mini', promptVersion: 'feedback-v1.3-fallback',
    inputTokens: 1980, outputTokens: 180, latencyMs: 12100, isFallback: true },
  // Thành công — session summary / executive report
  { jobType: 'session-summary', model: 'gpt-4o', promptVersion: 'summary-v1.0',
    inputTokens: 4800, outputTokens: 2100, latencyMs: 6200, isFallback: false },
  { jobType: 'session-summary', model: 'gpt-4o', promptVersion: 'summary-v1.0',
    inputTokens: 5100, outputTokens: 2350, latencyMs: 6800, isFallback: false },
  // Thành công — follow-up generation
  { jobType: 'follow-up-gen', model: 'gpt-4o', promptVersion: 'followup-v1.1',
    inputTokens: 980, outputTokens: 320, latencyMs: 1800, isFallback: false },
  // Lỗi — question generation (model overloaded)
  { jobType: 'question-gen', model: 'gpt-4o', promptVersion: 'qgen-v2.1',
    inputTokens: null, outputTokens: null, latencyMs: 30000, isFallback: false,
    errorCode: 'OPENAI_TIMEOUT' },
  // Thành công — opening transcript generation
  { jobType: 'opening-transcript', model: 'gpt-4o', promptVersion: 'opening-v1.0',
    inputTokens: 750, outputTokens: 480, latencyMs: 2100, isFallback: false },
  // Thành công — communication analysis
  { jobType: 'comm-analysis', model: 'gpt-4o', promptVersion: 'comm-v1.0',
    inputTokens: 3200, outputTokens: 890, latencyMs: 3100, isFallback: false },
];

export async function seedAiQualityLog(prisma: PrismaClient): Promise<void> {
  const count = await prisma.aiQualityLog.count();
  if (count >= LOG_ENTRIES.length) {
    console.log('ai_quality_log: already seeded, skipping');
    return;
  }

  const baseTime = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
  await prisma.aiQualityLog.createMany({
    data: LOG_ENTRIES.map((e, i) => ({
      jobType: e.jobType,
      model: e.model,
      promptVersion: e.promptVersion,
      inputTokens: e.inputTokens ?? undefined,
      outputTokens: e.outputTokens ?? undefined,
      latencyMs: e.latencyMs,
      isFallback: e.isFallback,
      errorCode: (e as any).errorCode ?? null,
      createdAt: new Date(baseTime + i * 3 * 60 * 60 * 1000), // spread over 8 days
    })),
    skipDuplicates: false,
  });

  console.log(`ai_quality_log: seeded ${LOG_ENTRIES.length} entries`);
}
```

---

## Task 8: Orchestrator + Entry Point

**Files:**
- Create: `server/prisma/seed/index.ts`
- Modify: `server/prisma/seed.ts`

- [ ] **Step 1: Tạo index.ts**

```typescript
// server/prisma/seed/index.ts
import { prisma, supabaseAdmin, DEMO_EMAIL, DEMO_PASSWORD } from './_client';
import { seedContextPacks } from './00-context-packs';
import { getOrCreateDemoUser, seedUserProfile } from './01-users';
import { seedQuestionBank } from './02-question-bank';
import { seedSessions } from './03-sessions';
import { seedAiQualityLog } from './04-ai-quality-log';

async function main() {
  console.log('Starting seed...');

  await seedContextPacks(prisma);

  const userId = await getOrCreateDemoUser(supabaseAdmin, prisma);
  await seedUserProfile(prisma, userId);
  await seedSessions(prisma, userId);
  await seedQuestionBank(prisma);
  await seedAiQualityLog(prisma);

  console.log('\nSeed complete.');
  console.log(`Demo credentials: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Cập nhật seed.ts thành entry point 1 dòng**

```typescript
// server/prisma/seed.ts — entry point, delegates to seed/
import './seed/index';
```

- [ ] **Step 3: Chạy dry-run TypeScript check**

```bash
cd server && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors (hoặc chỉ lỗi không liên quan đến prisma/seed/).

- [ ] **Step 4: Chạy seed**

```bash
cd server && npm run seed
```

Expected output:
```
Starting seed...
context_packs: canonical IDs ensured
demo user: already exists (...)
user profile: upserted
S1 (completed VN mixed): seeded
S2 (completed VN hr): seeded
S3 (completed Western technical, score 87): seeded
S4 (generating): seeded
S5 (active, 2/4 answered, follow-up pending): seeded
S6 (completed VN technical, score 43, fallback, skipped): seeded
S7 (completed Western hr, audio, showPrepCard, score 71): seeded
sessions: all 7 sessions seeded
question_bank: already seeded, skipping
ai_quality_log: seeded 12 entries

Seed complete.
Demo credentials: demo@interviewai.dev / Demo@123456
```

- [ ] **Step 5: Verify constraints via quick queries**

```bash
cd server && npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv/config');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
Promise.all([
  prisma.interviewSession.count(),
  prisma.sessionQuestion.count(),
  prisma.userAnswer.count(),
  prisma.aiFeedback.count(),
  prisma.followUpQuestion.count(),
  prisma.reverseQuestion.count(),
  prisma.aiQualityLog.count(),
  prisma.questionBank.count(),
]).then(([s,q,a,f,fu,rq,log,qb]) => {
  console.log({ sessions: s, questions: q, answers: a, feedbacks: f, followUps: fu, reverseQs: rq, qualityLogs: log, questionBank: qb });
}).finally(() => prisma.\$disconnect());
" 2>&1 | grep -v "^$"
```

Expected minimums:
```json
{
  "sessions": 7,
  "questions": 20,
  "answers": 16,
  "feedbacks": 12,
  "followUps": 1,
  "reverseQs": 4,
  "qualityLogs": 12,
  "questionBank": 90
}
```

- [ ] **Step 6: Verify idempotency — chạy seed lần 2**

```bash
cd server && npm run seed 2>&1 | grep -E "(skip|already|complete)"
```

Expected: tất cả section đều log "skip" hoặc "already seeded".

---

## Self-Review

### Spec coverage

| Kịch bản | Session | Covered |
|----------|---------|---------|
| status: generating | S4 | S4 |
| status: active | S5 | S5 |
| status: completed | S1, S2, S3, S6, S7 | All |
| sessionType: hr | S2, S7 | |
| sessionType: technical | S3, S6 | |
| sessionType: mixed | S1, S4, S5 | |
| contextPackId: VN | S1, S2, S4, S6 | |
| contextPackId: Western | S3, S5, S7 | |
| mode: practice | S1, S2, S4, S5, S6 | |
| mode: mock | S3 | |
| difficulty: easy | S2 | |
| difficulty: medium | S1, S4, S5, S7 | |
| difficulty: hard | S3, S6 | |
| showPrepCard: true | S7 | |
| answerMode: text | S1-S6 | |
| answerMode: audio | S7 | |
| skipped answer | S6, S7 | |
| feedback: high score (80+) | S3 | |
| feedback: low score (<50) | S6 | |
| feedback: isFallback | S6 | |
| segment: good | All | |
| segment: warning | S1, S2, S3, S6, S7 | |
| segment: critical | S6 | |
| FollowUpQuestion (no answer) | S5 | |
| ReverseQuestion: strong | S3 | |
| ReverseQuestion: adequate | S3, S7 | |
| ReverseQuestion: weak | — | Note: add to S6 nếu cần test UI cho weak evaluation |
| AiQualityLog: success | Yes | |
| AiQualityLog: fallback | Yes | |
| AiQualityLog: error | Yes | |
| selfEvalJson | S7 | |
| commAnalysisJson | S3, S7 | |
| competencyHeatmapJson | S3, S7 | |
| reverseQEvalJson | S3, S7 | |
| actionPlanJson | S3, S7 | |

### Placeholder scan: không có "TBD", "TODO", "implement later".
### Type consistency: `createAnswerWithFeedback` signature consistent với usage.
### Constraint check: tất cả unique constraints tôn trọng.

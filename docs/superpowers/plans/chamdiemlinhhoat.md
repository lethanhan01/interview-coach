# Chấm điểm linh hoạt theo tiêu chí áp dụng được (per-question) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans để thực thi plan task-by-task. Các step dùng checkbox (`- [ ]`) để theo dõi.

**Goal:** Mỗi câu trả lời chỉ được chấm trên tập tiêu chí mà câu hỏi đó thực sự đánh giá được (không phải toàn bộ rubric của loại phiên), và hiển thị minh bạch tiêu chí + điểm + trọng số trong report.

**Architecture:** LLM chỉ chọn tập tiêu chí áp dụng được và chấm điểm từng tiêu chí — trả về `applied_dimensions: [{ id, score }]`. **Code** (không phải LLM) tra `name` + base weight từ rubric của context pack theo `id`, loại bỏ id lạ, chuẩn hóa weight về tổng 1.0, và tính `overallScore = clamp(round(Σ score×weight), 1, 100)`. Per-criterion breakdown được persist vào cột JSON nullable `AiFeedback.dimension_scores` (tương thích ngược feedback cũ + fallback), expose qua report API, render ở client.

**Tech Stack:** NestJS 11, Prisma + Supabase Postgres (JSONB), Zod, OpenAI GPT-4o, Jest 30 (server). Client: Next.js 16 + React 19 + Tailwind v4 (không có test runner — verify bằng build + manual).

## Global Constraints

- Giao tiếp tiếng Việt; code/identifier/path/error message giữ tiếng Anh. Không emoji/icon ở bất kỳ đâu.
- Prompt versioning: tạo **file version mới**, KHÔNG sửa file prompt cũ (`prompts/<purpose>-v<major>.<minor>.ts`). Processors reference version bằng import trực tiếp.
- Surgical changes: chỉ động vào phần task yêu cầu; mỗi dòng diff phải truy về được task.
- DB: `prisma migrate dev` chỉ thêm cột nullable (additive, an toàn). Trước khi chạy, xác nhận `DATABASE_URL` trỏ DB dev. Nếu Prisma báo schema drift và đề nghị `reset` (xóa data) → **DỪNG, hỏi user**. Không drop/truncate/reset.
- CLAUDE.md sync (rule `.claude/rules/claude-md-sync.md`): commit code + CLAUDE.md + CHANGELOG.md cùng nhau khi public interface đổi.
- Mỗi commit phải giữ `npm run build` (server) xanh — không commit trạng thái tsc lỗi.
- Backward-compat: feedback cũ và fallback có `dimension_scores = null` → mọi nhánh đọc phải xử lý null.

## Thay đổi so với bản plan trước (đã chốt với user qua AskUserQuestion)

1. **Nguồn weight = code suy từ rubric.** LLM KHÔNG trả `name`/`weight`, chỉ trả `{ id, score }`. Code resolve `name` + base weight từ `input.contextPackConfig` theo `id`. Lý do: weight là chính sách hệ thống, không nên để LLM tự bịa; loại bỏ rủi ro LLM trả weight không nhất quán.
2. **Plan dạng bite-sized TDD** thực thi được: mỗi task có file path chính xác, code đầy đủ, lệnh + output kỳ vọng, commit.

## Bối cảnh gốc lỗi (đã verify)

[prompt-builder.service.ts:79-139](server/src/ai/prompt-builder.service.ts#L79) hàm `applyContextPackForEvaluation` ép cứng cả 3 nhánh: `hr` (92-102) ép D1–D6, `technical` (103-113) ép TD1–TD5, `mixed` (114-136) công thức category-weight — kèm chỉ thị *"overall_score = weighted average ... weights sum to 1.0"*. Không có dữ liệu pattern câu hỏi ở runtime (`SessionQuestion` chỉ có `category`, `competency_domain`, `difficulty`) nên không map cứng pattern→trọng số được; giải pháp là để LLM chọn tập con động.

Aggregation mức session là trung bình cộng đơn giản, KHÔNG dùng bWeight/tWeight ([comprehensive-report.processor.ts:101-106](server/src/ai/processors/comprehensive-report.processor.ts#L101)) → bỏ công thức category-weight per-question ở `mixed` là an toàn.

## Shape thống nhất xuyên suốt

```ts
// LLM trả về (Zod thô)
{ id: string; score: number }       // score: integer 1-100

// Code suy ra, persist + return + render
interface AppliedDimension {
  id: string;
  name: string;     // tra từ rubric
  score: number;    // 1-100, từ LLM
  weight: number;   // base weight chuẩn hóa, tổng ≈ 1.0
}
```

Tập id hợp lệ theo sessionType: `hr` → `contextPackConfig.behavioralDimensions`; `technical` → `contextPackConfig.technicalDimensions`; `mixed` → hợp cả hai. Id ngoài tập → loại bỏ. Nếu sau lọc còn 0 phần tử → throw `SCHEMA_VALIDATION_ERROR` (xử lý như AI output sai → đi nhánh retry/fallback của processor).

---

## Task 0: Đăng ký plan vào docs index (non-TDD)

**Files:**
- Modify: `docs/README.md` (§"Cây thư mục", §"Trạng thái tài liệu")

Plan đã nằm trong repo tại `docs/superpowers/plans/chamdiemlinhhoat.md` (đã track qua git). KHÔNG copy nội dung sang `docs/implementation/` (rule doc-generation: dùng cross-reference, không duplicate).

- [ ] **Step 1:** Thêm 1 dòng vào `docs/README.md` §"Cây thư mục": `docs/superpowers/plans/chamdiemlinhhoat.md` — size M, status Planning — "Plan chấm điểm linh hoạt per-question".
- [ ] **Step 2:** Thêm row tương ứng vào §"Trạng thái tài liệu".
- [ ] **Step 3:** Commit.

```bash
git add docs/README.md docs/superpowers/plans/chamdiemlinhhoat.md
git commit -m "docs: register flexible per-question scoring plan"
```

---

## Task 1: Prompt version v1.4 + vá version drift (build-verified)

Hiện tại có 3 nguồn version lệch nhau: `feedback.processor.ts` import `v1.1`, `base-pipeline.service.ts` import `v1.2`, `pipeline.schemas.ts` khai báo string `v1.3`. Gom hết về `v1.4`.

**Files:**
- Create: `server/src/ai/prompts/surgical-feedback-v1.4.ts`
- Modify: `server/src/ai/pipelines/base-pipeline.service.ts:21` (import)
- Modify: `server/src/ai/processors/feedback.processor.ts:13` (import)
- Modify: `server/src/ai/pipelines/pipeline.schemas.ts:3` (PROMPT_VERSION)

**Interfaces:**
- Produces: `SURGICAL_FEEDBACK_PROMPT_CONFIG = { version: 'surgical-feedback-v1.4', temperature: 0.3, maxTokens: 3000 }`; `PROMPT_VERSION = 'surgical-feedback-v1.4'`.

- [ ] **Step 1: Tạo file version mới**

`server/src/ai/prompts/surgical-feedback-v1.4.ts`:
```ts
export const SURGICAL_FEEDBACK_PROMPT_CONFIG = {
  version: 'surgical-feedback-v1.4',
  temperature: 0.3,
  maxTokens: 3000,
} as const;
```

- [ ] **Step 2: Sửa 2 import + PROMPT_VERSION**

`base-pipeline.service.ts:21` — đổi `'../prompts/surgical-feedback-v1.2'` → `'../prompts/surgical-feedback-v1.4'`.
`feedback.processor.ts:13` — đổi `'../prompts/surgical-feedback-v1.1'` → `'../prompts/surgical-feedback-v1.4'`.
`pipeline.schemas.ts:3` — `export const PROMPT_VERSION = 'surgical-feedback-v1.4';`.

- [ ] **Step 3: Verify không còn import version cũ + build**

Run: `cd server && npx eslint --version >/dev/null; grep -rn "surgical-feedback-v1\.[123]'" src` (PowerShell: `Select-String "surgical-feedback-v1\.[123]'" -Path src -Recurse`)
Expected: 0 dòng import version cũ (file v1.1/v1.2 vẫn tồn tại nhưng không ai import).

Run: `cd server && npm run build`
Expected: build pass, 0 lỗi.

- [ ] **Step 4: Commit**

```bash
git add server/src/ai/prompts/surgical-feedback-v1.4.ts server/src/ai/pipelines/base-pipeline.service.ts server/src/ai/processors/feedback.processor.ts server/src/ai/pipelines/pipeline.schemas.ts
git commit -m "chore(ai): unify surgical-feedback prompt version to v1.4"
```

---

## Task 2: AI core — schema + interface + tính điểm trong code

Ba thay đổi này phải ở CÙNG một commit: bỏ `overall_score` khỏi schema sẽ làm `base-pipeline.service.ts:120` (`validated.overall_score`) lỗi tsc; thêm `appliedDimensions` vào interface buộc `base-pipeline` phải return nó. Tách ra sẽ commit trạng thái build đỏ.

**Files:**
- Modify: `server/src/ai/pipelines/pipeline.schemas.ts` (FeedbackSchema, lines ~21-36)
- Modify: `server/src/ai/pipelines/interview-pipeline.interface.ts:47-53`
- Modify: `server/src/ai/pipelines/base-pipeline.service.ts:117-133`
- Test: `server/src/ai/pipelines/pipeline.schemas.spec.ts`, `server/src/ai/pipelines/base-pipeline.service.spec.ts`

**Interfaces:**
- Consumes: `input.contextPackConfig.behavioralDimensions` / `.technicalDimensions` (mỗi entry `{ id, name, weight }`), `input.sessionType`, `PROMPT_VERSION` (Task 1).
- Produces: `FeedbackSchema.applied_dimensions: { id: string; score: number }[]` (≥1); `AppliedDimension = { id, name, score, weight }`; `SurgicalFeedback.appliedDimensions: AppliedDimension[]`; `evaluateAnswer` trả `overallScore` do code tính.

- [ ] **Step 1: Viết test schema (đỏ)**

Thay toàn bộ `pipeline.schemas.spec.ts` bằng:
```ts
import { FeedbackSchema } from './pipeline.schemas';

describe('FeedbackSchema', () => {
  const base = {
    model_answer:
      'A stronger answer would give a concise situation, action, and measurable result.',
    key_takeaway: 'The answer is understandable but needs sharper evidence.',
    applied_dimensions: [{ id: 'TD1', score: 80 }],
    annotated_segments: [
      {
        segment_text: 'I improved the system',
        start_index: 0,
        end_index: 21,
        highlight_level: 'improvement',
        annotation: 'This needs a clearer result.',
        suggestion: null,
        improved_version: null,
      },
    ],
  };

  it('parses applied_dimensions and normalizes null optional segment fields', () => {
    const parsed = FeedbackSchema.parse(base);
    expect(parsed.applied_dimensions[0]).toEqual({ id: 'TD1', score: 80 });
    expect(parsed.annotated_segments[0].suggestion).toBeUndefined();
    expect(parsed.annotated_segments[0].improved_version).toBeUndefined();
  });

  it('rejects empty applied_dimensions', () => {
    expect(() =>
      FeedbackSchema.parse({ ...base, applied_dimensions: [] }),
    ).toThrow();
  });

  it('rejects score out of range', () => {
    expect(() =>
      FeedbackSchema.parse({
        ...base,
        applied_dimensions: [{ id: 'TD1', score: 101 }],
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Chạy test → đỏ**

Run: `cd server && npm run test -- pipeline.schemas.spec`
Expected: FAIL (schema còn `overall_score`, chưa có `applied_dimensions`).

- [ ] **Step 3: Sửa FeedbackSchema**

Trong `pipeline.schemas.ts`, trong `FeedbackSchema`: **xóa** dòng `overall_score: z.number().int().min(1).max(100),`. **Thêm** (cùng cấp với `model_answer`):
```ts
    applied_dimensions: z
      .array(
        z.object({
          id: z.string(),
          score: z.number().int().min(1).max(100),
        }),
      )
      .min(1),
```
Giữ nguyên `model_answer`, `key_takeaway`, `annotated_segments`.

- [ ] **Step 4: Sửa interface**

`interview-pipeline.interface.ts` — thêm trước `SurgicalFeedback`:
```ts
export interface AppliedDimension {
  id: string;
  name: string;
  score: number; // 1-100
  weight: number; // base weight đã chuẩn hóa, tổng ≈ 1.0
}
```
Trong `SurgicalFeedback`, thêm sau `promptVersion`:
```ts
  appliedDimensions: AppliedDimension[];
```

- [ ] **Step 5: Viết test compute (đỏ)**

Trong `base-pipeline.service.spec.ts`:

(a) Thay `const mockContextPack = {} as any;` bằng:
```ts
  const mockContextPack = {
    behavioralDimensions: [
      { id: 'D1', name: 'Communication', weight: 0.2 },
      { id: 'D2', name: 'Teamwork', weight: 0.2 },
    ],
    technicalDimensions: [
      { id: 'TD1', name: 'Fundamentals', weight: 0.25 },
      { id: 'TD2', name: 'Application', weight: 0.25 },
    ],
  } as any;
```

(b) Trong `describe('evaluateAnswer')`, thay test thành công (hiện assert `overall_score: 82` → `result.overallScore` 82) bằng:
```ts
    it('tính overallScore từ score×weight chuẩn hóa và trả appliedDimensions', async () => {
      const rawFeedback = {
        model_answer: 'Câu trả lời tốt hơn...',
        key_takeaway: 'Cần thêm ví dụ cụ thể',
        applied_dimensions: [
          { id: 'D1', score: 80 },
          { id: 'D2', score: 60 },
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      // base weight D1=0.2, D2=0.2 → chuẩn hóa 0.5/0.5 → 80*0.5 + 60*0.5 = 70
      expect(result.overallScore).toBe(70);
      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
        { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
      ]);
      expect(result.promptVersion).toBe(PROMPT_VERSION);
    });

    it('loại id không thuộc rubric của sessionType rồi chuẩn hóa lại', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [
          { id: 'D1', score: 90 },
          { id: 'TD1', score: 10 }, // không hợp lệ với sessionType 'hr' → bị loại
        ],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 90, weight: 1 },
      ]);
      expect(result.overallScore).toBe(90);
    });

    it('throw SCHEMA_VALIDATION_ERROR khi không còn dimension hợp lệ', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'ZZ', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await expect(service.evaluateAnswer(feedbackInput)).rejects.toMatchObject(
        { errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR },
      );
    });
```

(c) Các test `evaluateAnswer` còn lại (temperature/maxTokens, chain prompt, language=en, debug log) hiện set `overall_score` trong `rawFeedback` → đổi field đó thành `applied_dimensions: [{ id: 'D1', score: 75 }]` (giữ nguyên phần assert còn lại — chúng kiểm tra hành vi khác). Test "logger.warn khi zodValidator throw" và "JSON.parse fail" không cần đổi (compute không chạy tới).

- [ ] **Step 6: Chạy test → đỏ**

Run: `cd server && npm run test -- base-pipeline.service.spec`
Expected: FAIL (`result.overallScore` undefined / `appliedDimensions` chưa tồn tại).

- [ ] **Step 7: Sửa compute trong base-pipeline**

`base-pipeline.service.ts`, thay block return trong `try` (117-133) bằng:
```ts
      const validated = this.zodValidator.validate(FeedbackSchema, parsed);

      const allowedDims =
        input.sessionType === 'hr'
          ? input.contextPackConfig.behavioralDimensions
          : input.sessionType === 'technical'
            ? input.contextPackConfig.technicalDimensions
            : [
                ...input.contextPackConfig.behavioralDimensions,
                ...input.contextPackConfig.technicalDimensions,
              ];
      const allowedById = new Map(allowedDims.map((d) => [d.id, d]));

      const selected = validated.applied_dimensions
        .map((d) => {
          const dim = allowedById.get(d.id);
          return dim
            ? { id: dim.id, name: dim.name, baseWeight: dim.weight, score: d.score }
            : null;
        })
        .filter((d): d is NonNullable<typeof d> => d !== null);

      if (selected.length === 0) {
        throw new InterviewAIException(
          ErrorCode.SCHEMA_VALIDATION_ERROR,
          HttpStatus.UNPROCESSABLE_ENTITY,
          'AI returned no valid scoring dimensions',
        );
      }

      const baseSum = selected.reduce((s, d) => s + d.baseWeight, 0);
      const appliedDimensions = selected.map((d) => ({
        id: d.id,
        name: d.name,
        score: d.score,
        weight: baseSum > 0 ? d.baseWeight / baseSum : 1 / selected.length,
      }));
      const weighted = appliedDimensions.reduce(
        (s, d) => s + d.score * d.weight,
        0,
      );
      const overallScore = Math.min(100, Math.max(1, Math.round(weighted)));

      return {
        overallScore,
        modelAnswer: validated.model_answer,
        keyTakeaway: validated.key_takeaway,
        promptVersion: PROMPT_VERSION,
        appliedDimensions,
        annotatedSegments: validated.annotated_segments.map((s) => ({
          segmentText: s.segment_text,
          startIndex: s.start_index,
          endIndex: s.end_index,
          highlightLevel: s.highlight_level,
          annotation: s.annotation,
          suggestion: s.suggestion,
          improvedVersion: s.improved_version,
        })),
      };
```
Lưu ý: `InterviewAIException`, `ErrorCode`, `HttpStatus` đã được import sẵn trong file (dùng ở nhánh JSON.parse). Throw nằm trong `try` nên catch sẽ log `[feedback] Zod validation failed` rồi re-throw — acceptable (message hơi rộng nhưng propagate đúng).

- [ ] **Step 8: Chạy test → xanh + build**

Run: `cd server && npm run test -- base-pipeline.service.spec pipeline.schemas.spec`
Expected: PASS.
Run: `cd server && npm run build`
Expected: PASS (xác nhận interface + compute khớp tsc).

- [ ] **Step 9: Commit**

```bash
git add server/src/ai/pipelines/pipeline.schemas.ts server/src/ai/pipelines/interview-pipeline.interface.ts server/src/ai/pipelines/base-pipeline.service.ts server/src/ai/pipelines/pipeline.schemas.spec.ts server/src/ai/pipelines/base-pipeline.service.spec.ts
git commit -m "feat(ai): code-derived per-question scoring from applied dimensions"
```

---

## Task 3: Prompt text — LLM chỉ chọn tập con + trả {id, score}

**Files:**
- Modify: `server/src/ai/prompt-builder.service.ts` (`BASE_PROMPTS['surgical-feedback']` lines 38-65; `applyContextPackForEvaluation` lines 79-139)
- Test: `server/src/ai/prompt-builder.service.spec.ts`

**Interfaces:**
- Produces: system prompt liệt kê "tiêu chí tối đa có thể áp dụng" theo sessionType + chỉ thị chọn tập con + chấm 1-100; JSON template chứa `applied_dimensions: [{ id, score }]` thay cho `overall_score`. Không còn `scoringWeights` / "weights sum to 1.0" / "session weight".

- [ ] **Step 1: Sửa test (đỏ)**

`prompt-builder.service.spec.ts`:

(a) Line 37: `expect(result).toContain('overall_score');` → `expect(result).toContain('applied_dimensions');`

(b) Test `'Mixed: ...'` (127-140): thay assertion `session weight: 0.45` / `session weight: 0.55` / `Scoring formula:` bằng:
```ts
      expect(result).toContain('Mixed (behavioral + technical)');
      expect(result).toContain('D1 Communication');
      expect(result).toContain('TD1 Fundamentals');
      expect(result).toContain('applied_dimensions');
      expect(result).not.toContain('session weight');
```

(c) Thêm test mới trong `describe('applyContextPackForEvaluation')`:
```ts
    it('mọi session type chỉ thị chọn tập con tiêu chí, không tính sẵn overall', () => {
      (['hr', 'technical', 'mixed'] as const).forEach((sessionType) => {
        const result = service.applyContextPackForEvaluation(
          'base',
          contextPack,
          sessionType,
        );
        expect(result).toContain('select ONLY');
        expect(result).not.toContain('weights sum to 1.0');
      });
    });
```

- [ ] **Step 2: Chạy → đỏ**

Run: `cd server && npm run test -- prompt-builder.service.spec`
Expected: FAIL.

- [ ] **Step 3: Sửa BASE_PROMPTS['surgical-feedback']**

Trong JSON template (38-65), thay dòng `"overall_score": <integer 1-100>,` bằng:
```
  "applied_dimensions": [
    { "id": "<dimension id exactly as listed in the system instructions>", "score": <integer 1-100> }
  ],
```
Bỏ mọi nhắc tới `overall_score`. Giữ nguyên `model_answer`, `key_takeaway`, `annotated_segments`.

- [ ] **Step 4: Viết lại applyContextPackForEvaluation**

Thay toàn bộ hàm (79-139) bằng:
```ts
  applyContextPackForEvaluation(
    baseSystem: string,
    contextPack: ContextPackConfig,
    sessionType: SessionType,
  ): string {
    const { culturalNotes, behavioralDimensions, technicalDimensions } =
      contextPack;
    const lines = (dims: { id: string; name: string }[]) =>
      dims.map((d) => `  - ${d.id} ${d.name}`).join('\n');

    const selectionRules = [
      `From the candidate dimensions below, select ONLY the ones THIS question actually evaluates and ignore the rest.`,
      `Score each selected dimension from 1 to 100.`,
      `Return them in "applied_dimensions" as objects { "id", "score" } using the ids exactly as listed.`,
      `Do NOT invent ids outside the list. Do NOT output any weight or overall score — the system computes those.`,
    ];

    let scoringSection: string;
    if (sessionType === 'hr') {
      scoringSection = [
        `Session type: HR (behavioral only).`,
        `Candidate dimensions (maximum set that could apply):`,
        lines(behavioralDimensions),
        ...selectionRules,
        `Do NOT apply any technical criteria.`,
        `Example: a self-introduction question usually evaluates communication and self-awareness, not teamwork under pressure.`,
      ].join('\n');
    } else if (sessionType === 'technical') {
      scoringSection = [
        `Session type: Technical (technical only).`,
        `Candidate dimensions (maximum set that could apply):`,
        lines(technicalDimensions),
        ...selectionRules,
        `Do NOT apply any behavioral criteria.`,
        `Example: a pure definition question ("What is a closure?") usually evaluates only foundational knowledge and practical application, not debugging or systems thinking.`,
      ].join('\n');
    } else {
      scoringSection = [
        `Session type: Mixed (behavioral + technical).`,
        `Candidate behavioral dimensions:`,
        lines(behavioralDimensions),
        `Candidate technical dimensions:`,
        lines(technicalDimensions),
        ...selectionRules,
        `A question may evaluate behavioral dimensions, technical dimensions, or both — include only those it truly tests.`,
        `Example: "Tell me about a bug you fixed" may evaluate debugging plus communication, but not coding-style depth.`,
      ].join('\n');
    }

    return `${baseSystem}\n\nCultural context: ${culturalNotes}\n${scoringSection}`;
  }
```
Lưu ý: bỏ `scoringWeights` khỏi destructure (tránh lint unused-var). `weight` của rubric entry không còn dùng trong prompt (weight được code xử lý ở Task 2).

- [ ] **Step 5: Chạy → xanh + lint**

Run: `cd server && npm run test -- prompt-builder.service.spec`
Expected: PASS.
Run: `cd server && npm run lint`
Expected: 0 lỗi (xác nhận không còn unused `scoringWeights`).

- [ ] **Step 6: Commit**

```bash
git add server/src/ai/prompt-builder.service.ts server/src/ai/prompt-builder.service.spec.ts
git commit -m "feat(ai): prompt selects applicable dimensions per question"
```

---

## Task 4: Prisma — cột dimension_scores (migration)

**Files:**
- Modify: `server/prisma/schema.prisma:245-259` (model `AiFeedback`)
- Create: `server/prisma/migrations/<timestamp>_add_dimension_scores/migration.sql` (Prisma sinh)

**Interfaces:**
- Produces: `AiFeedback.dimensionScores: Json?` (DB column `dimension_scores` JSONB nullable); Prisma client có field này trong Create/Update input.

- [ ] **Step 1: Thêm field vào schema**

Trong model `AiFeedback`, thêm sau dòng `isFallback` (252):
```prisma
  dimensionScores   Json?              @map("dimension_scores")
```

- [ ] **Step 2: Chạy migration (xác nhận DATABASE_URL trỏ dev)**

Run: `cd server && npx prisma migrate dev --name add_dimension_scores`
Expected: sinh `migration.sql` chứa `ALTER TABLE "ai_feedbacks" ADD COLUMN "dimension_scores" JSONB;`; Prisma client regenerate.
**Nếu Prisma báo drift và đề nghị reset → DỪNG, hỏi user** (reset xóa data). Cột nullable là additive, không cần reset.

- [ ] **Step 3: Verify**

Run: `cd server && npx prisma migrate status`
Expected: "Database schema is up to date".
Run: `cd server && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat(db): add nullable dimension_scores to ai_feedbacks"
```

---

## Task 5: Processor persist dimensionScores

**Files:**
- Modify: `server/src/ai/processors/feedback.processor.ts:88-105` (upsert create+update)
- Test: `server/src/ai/processors/feedback.processor.spec.ts`; kiểm tra `feedback-flow.integration.spec.ts`

**Interfaces:**
- Consumes: `feedback.appliedDimensions` (Task 2), `AiFeedback.dimensionScores` (Task 4).
- Produces: feedback thật lưu `dimension_scores = appliedDimensions`; fallback giữ `null`.

- [ ] **Step 1: Sửa test (đỏ)**

Trong `feedback.processor.spec.ts`:

(a) Mock feedback trả từ pipeline phải có `appliedDimensions` — tìm chỗ mock `evaluateAnswer`/pipeline return và thêm:
```ts
        appliedDimensions: [
          { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
          { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
        ],
```

(b) Trong test happy-path, assert upsert nhận `dimensionScores`:
```ts
      expect(mockTx.aiFeedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            dimensionScores: [
              { id: 'D1', name: 'Communication', score: 80, weight: 0.5 },
              { id: 'D2', name: 'Teamwork', score: 60, weight: 0.5 },
            ],
          }),
        }),
      );
```
(Khớp tên mock transaction client thực tế trong file — đọc spec trước khi sửa.)

(c) Trong test fallback, assert KHÔNG có `dimensionScores`:
```ts
      const fallbackCall = mockTx.aiFeedback.upsert.mock.calls.at(-1)?.[0];
      expect(fallbackCall?.create).not.toHaveProperty('dimensionScores');
```

- [ ] **Step 2: Chạy → đỏ**

Run: `cd server && npm run test -- feedback.processor.spec`
Expected: FAIL.

- [ ] **Step 3: Sửa processor**

Trong upsert (88-105), thêm `dimensionScores: feedback.appliedDimensions,` vào CẢ `create` và `update`. Đồng thời (vá drift, dùng version do pipeline trả) đổi `promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version` → `promptVersion: feedback.promptVersion` trong cả create+update của nhánh thật:
```ts
          create: {
            userAnswerId: answerId,
            overallScore: feedback.overallScore,
            modelAnswer: feedback.modelAnswer,
            keyTakeaway: feedback.keyTakeaway,
            promptVersion: feedback.promptVersion,
            isFallback: false,
            dimensionScores: feedback.appliedDimensions,
          },
          update: {
            overallScore: feedback.overallScore,
            modelAnswer: feedback.modelAnswer,
            keyTakeaway: feedback.keyTakeaway,
            promptVersion: feedback.promptVersion,
            isFallback: false,
            dimensionScores: feedback.appliedDimensions,
          },
```
Nhánh fallback (174-185): KHÔNG thêm `dimensionScores` (để null); giữ `promptVersion: SURGICAL_FEEDBACK_PROMPT_CONFIG.version` (fallback không có feedback object). Import `SURGICAL_FEEDBACK_PROMPT_CONFIG` vẫn cần cho fallback → giữ nguyên.

Nếu tsc báo lỗi kiểu Json cho `dimensionScores: feedback.appliedDimensions`: cast `feedback.appliedDimensions as unknown as Prisma.InputJsonValue` (import `Prisma` từ `@prisma/client`).

- [ ] **Step 4: Chạy → xanh + build**

Run: `cd server && npm run test -- feedback.processor.spec`
Expected: PASS.
Run: `cd server && npm run test -- feedback-flow.integration.spec`
Expected: PASS — nếu FAIL do mock feedback thiếu `appliedDimensions`, thêm field như Step 1(a) vào mock của integration spec.
Run: `cd server && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/ai/processors/feedback.processor.ts server/src/ai/processors/feedback.processor.spec.ts server/src/ai/processors/feedback-flow.integration.spec.ts
git commit -m "feat(ai): persist per-question dimension scores in feedback"
```

---

## Task 6: Report API — DTO + service mapping

**Files:**
- Modify: `server/src/report/dto/report-response.dto.ts:11-22` (`TranscriptItemDto`)
- Modify: `server/src/report/report.service.ts:124-138` (transcript map)
- Test: `server/src/report/report.service.spec.ts`

**Interfaces:**
- Consumes: `feedback.dimensionScores` (Json | null).
- Produces: `TranscriptItemDto.appliedDimensions?: { id, name, score, weight }[]` — có giá trị cho câu đã chấm; `undefined` cho skip/fallback/feedback cũ (null).

- [ ] **Step 1: Sửa test (đỏ)**

Trong `report.service.spec.ts`, tìm test transcript map. Thêm `dimensionScores` vào mock feedback của câu thường:
```ts
        dimensionScores: [
          { id: 'TD1', name: 'Fundamentals', score: 90, weight: 0.6 },
          { id: 'TD2', name: 'Application', score: 70, weight: 0.4 },
        ],
```
Assert:
```ts
      expect(normalItem.appliedDimensions).toEqual([
        { id: 'TD1', name: 'Fundamentals', score: 90, weight: 0.6 },
        { id: 'TD2', name: 'Application', score: 70, weight: 0.4 },
      ]);
      expect(fallbackItem.appliedDimensions).toBeUndefined();
      expect(skippedItem.appliedDimensions).toBeUndefined();
```
(Khớp tên biến item thực tế trong spec.)

- [ ] **Step 2: Chạy → đỏ**

Run: `cd server && npm run test -- report.service.spec`
Expected: FAIL.

- [ ] **Step 3: Sửa DTO**

`report-response.dto.ts`, thêm vào `TranscriptItemDto` (sau `segments` hoặc trước, tùy thứ tự — append cuối class):
```ts
  appliedDimensions?: {
    id: string;
    name: string;
    score: number;
    weight: number;
  }[];
```

- [ ] **Step 4: Sửa service map**

Trong object return của transcript map (124-138), thêm field:
```ts
        appliedDimensions:
          answer?.skipped || !feedback || feedback.isFallback
            ? undefined
            : ((feedback.dimensionScores as
                | { id: string; name: string; score: number; weight: number }[]
                | null) ?? undefined),
```

- [ ] **Step 5: Chạy → xanh + build**

Run: `cd server && npm run test -- report.service.spec`
Expected: PASS.
Run: `cd server && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/report/dto/report-response.dto.ts server/src/report/report.service.ts server/src/report/report.service.spec.ts
git commit -m "feat(report): expose appliedDimensions in transcript"
```

---

## Task 7: Client — types + render breakdown (build + manual)

Client không có test runner (chỉ `dev`/`build`/`lint`) → verify bằng `npm run build` + kiểm tra thủ công report.

**Files:**
- Modify: `client/lib/types.ts:114-125` (`TranscriptItem`)
- Modify: `client/components/report/AnnotatedTranscript.tsx:109-113` (rubric hint block)
- Modify: `client/components/report/ScoringMethodCard.tsx:52-63` (copy)

**Interfaces:**
- Consumes: `TranscriptItem.appliedDimensions` (từ report API Task 6).

- [ ] **Step 1: Types**

`client/lib/types.ts`, thêm vào `TranscriptItem`:
```ts
  appliedDimensions?: {
    id: string
    name: string
    score: number
    weight: number
  }[]
```

- [ ] **Step 2: Render breakdown trong AnnotatedTranscript**

Thay block rubric hint tĩnh (109-113):
- Nếu `item.appliedDimensions?.length`: render danh sách, mỗi tiêu chí 1 dòng `{name} — {score}/100 ({Math.round(weight*100)}%)`, dùng style thanh bar nhỏ đồng nhất với [ScoringMethodCard.tsx:19-39](client/components/report/ScoringMethodCard.tsx#L19).
- Else nếu `contextPackId && sessionType`: giữ `getRubricHint(...)` (fallback cho câu cũ `dimension_scores=null`/skip/fallback).
- Props KHÔNG đổi.

Caveat hiển thị: `Math.round(weight*100)` từng dòng có thể khiến tổng % lệch 1-2% so với 100 do làm tròn — không ảnh hưởng `overallScore` (tính từ weight thực ở backend). Không cần ép tổng = 100.

- [ ] **Step 3: ScoringMethodCard copy**

Sửa chữ (52-63) phản ánh cơ chế mới: "Mỗi câu chỉ chấm trên các tiêu chí phù hợp với câu hỏi đó; trọng số được chuẩn hóa lại theo tập tiêu chí áp dụng. Bảng dưới là tập tiêu chí tối đa có thể áp dụng." Với `mixed`: bỏ/điều chỉnh câu công thức category-weight per-question cho khớp (aggregation mức session vẫn là trung bình cộng). Không đổi cấu trúc/visual.

- [ ] **Step 4: Verify**

Run: `cd client && npm run lint && npm run build`
Expected: 0 lỗi.
Manual: mở report 1 session đã chấm → câu mới hiện breakdown đúng tiêu chí + điểm + %; câu cũ/skip/fallback hiện rubric hint cũ, không vỡ layout.

- [ ] **Step 5: Commit**

```bash
git add client/lib/types.ts client/components/report/AnnotatedTranscript.tsx client/components/report/ScoringMethodCard.tsx
git commit -m "feat(report-ui): show per-question applied dimensions breakdown"
```

---

## Task 8: Docs sync (claude-md-sync rule)

**Files:**
- Modify: `server/CLAUDE.md` (§Prisma — models), `server/src/ai/CLAUDE.md` (SurgicalFeedback, FeedbackSchema, prompt version), `client/lib/CLAUDE.md`, `client/components/report/CLAUDE.md`, `CHANGELOG.md`

- [ ] **Step 1:** `server/CLAUDE.md` §Prisma — note `AiFeedback` có cột `dimension_scores` (JSONB nullable).
- [ ] **Step 2:** `server/src/ai/CLAUDE.md` — `SurgicalFeedback` thêm `appliedDimensions`; `FeedbackSchema` bỏ `overall_score`, thêm `applied_dimensions: { id, score }[]`; prompt version → `surgical-feedback-v1.4`; ghi rõ overallScore do code tính (LLM không trả).
- [ ] **Step 3:** `client/lib/CLAUDE.md` + `client/components/report/CLAUDE.md` — `TranscriptItem` thêm `appliedDimensions`; mô tả AnnotatedTranscript render breakdown thực tế (fallback rubric hint).
- [ ] **Step 4:** `CHANGELOG.md` — ghi thay đổi (kiểm tra giới hạn 200 dòng, compact session cũ nhất nếu vượt). Ghi chú: spec §2.7 pattern-weights được hiện thực ở runtime bằng LLM dynamic selection (gap đã biết: runtime chưa lưu pattern câu hỏi).
- [ ] **Step 5:** Commit.

```bash
git add server/CLAUDE.md server/src/ai/CLAUDE.md client/lib/CLAUDE.md client/components/report/CLAUDE.md CHANGELOG.md
git commit -m "docs: sync flexible per-question scoring changes"
```

---

## Skills & Subagents (per task)

- `andrej-karpathy-skills:karpathy-guidelines` — trước mọi sửa code (mọi task).
- `superpowers:test-driven-development` — Task 2, 3, 5, 6 (red → green → commit).
- `feature-dev:feature-dev` — backend (Task 2, 3, 5, 6).
- `supabase:supabase` — Task 4 (migration).
- `frontend-design:frontend-design` — Task 7 (.tsx, types).
- `superpowers:requesting-code-review` / `code-reviewer` (subagent) — review diff AI core (Task 2) trước commit.
- `superpowers:verification-before-completion` — trước khi báo done (chạy mục Verification cuối).

## Verification cuối (điều kiện "Done")

1. `cd server && npm run lint && npm run build` → 0 lỗi.
2. `cd server && npm run test` → toàn bộ spec pass (đặc biệt base-pipeline, pipeline.schemas, prompt-builder, feedback.processor, feedback-flow.integration, report.service).
3. `cd server && npx prisma migrate status` clean; cột `dimension_scores` JSONB nullable tồn tại.
4. Chạy thật: session Technical, trả lời 1 câu định nghĩa đơn giản → `ai_feedbacks.dimension_scores` chỉ chứa tập con (vd TD1+TD2), `Σ weight ≈ 1.0`, `overall_score == round(Σ score×weight)`.
5. `cd client && npm run lint && npm run build` → 0 lỗi; mở report: câu mới hiện breakdown đúng; câu cũ/skip/fallback hiện rubric hint, không vỡ layout.
6. Regression: report session cũ (dimension_scores null) vẫn load (backward-compat nhờ cột nullable + branch fallback).

## Self-review (đã chạy)

- Spec coverage: gốc lỗi (prompt ép cứng) → Task 3; điểm sai do chấm thừa tiêu chí → Task 2 (code-derived); persist → Task 4+5; hiển thị minh bạch → Task 6+7.
- Type consistency: `AppliedDimension { id, name, score, weight }` dùng nhất quán interface (Task 2) → persist (Task 5) → DTO (Task 6) → client type (Task 7). LLM-side chỉ `{ id, score }` (Task 2 schema + Task 3 prompt) — phân biệt rõ với shape code suy ra.
- No placeholder: mọi step có code/lệnh cụ thể.
- Build-green per commit: Task 2 gộp schema+interface+compute để không commit tsc đỏ; Task 4 (client regen) trước Task 5 (processor dùng field mới).

# Dimension Matcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giảm tỷ lệ feedback rơi fallback rỗng khi `google/gemma-4-e4b` trả `applied_dimensions` với ID sai format, bằng cách thêm normalize layer trước khi lọc — không đổi model, không đổi DB schema, không đổi frontend contract.

**Architecture:** Tách matching logic thành pure function `resolveAppliedDimensions` trong file riêng để dễ unit test (TDD). `BasePipelineService.evaluateAnswer` gọi hàm này thay cho inline `allowedById.get()`. Trước đó (Task 1) sửa log labeling sai độc lập — giá trị ngay cả khi matcher chưa có.

**Tech Stack:** NestJS 11 / TypeScript 5.7 / Jest 30. Files nằm trong `server/src/ai/pipelines/`.

## Global Constraints

- Không đổi `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL`, provider SDK, hoặc luồng LM Studio.
- Không đổi DB schema, không đổi `FeedbackSchema` Zod, không đổi frontend API contract.
- Matcher phải là **total function** — không bao giờ throw. Service quyết định throw.
- Score trong `applied_dimensions` phải là integer 1-100 đã pass Zod — không tự clamp.
- Session type filtering phải được giữ nguyên: HR chỉ behavioral dims, technical chỉ technical dims, mixed cả hai.
- Các test cũ tại `base-pipeline.service.spec.ts` dòng 214, 238, 259, 368 phải tiếp tục xanh.
- `npm run build` và `npm run test` phải pass trước khi báo done.

---

## Skills & Subagents

### Global (áp dụng mọi task)

| Khi nào | Skill |
|---------|-------|
| Trước khi viết hoặc sửa bất kỳ dòng code nào | `andrej-karpathy-skills:karpathy-guidelines` |
| Trước khi báo task done, trước mỗi commit | `superpowers:verification-before-completion` |
| Sau khi hoàn thành toàn bộ Tasks 1-4 | `superpowers:requesting-code-review` |

### Per-task

| Task | Skill | Lý do |
|------|-------|-------|
| Task 1 | `feature-dev:feature-dev` | Sửa logic NestJS service backend |
| Task 2 | `superpowers:test-driven-development` | Viết test đỏ trước khi có implementation |
| Task 3 | `superpowers:test-driven-development` | TDD: chạy test fail → implement → xanh |
| Task 4 | `feature-dev:feature-dev` | Tích hợp matcher vào service backend |
| Task 5 (optional) | `feature-dev:feature-dev` | Sửa prompt-builder service |

### Subagents (nếu dùng superpowers:subagent-driven-development)

Mỗi task chạy trong một subagent riêng. Task 2 và Task 3 **phải** chạy tuần tự (Task 3 phụ thuộc contract từ Task 2). Task 1 và cặp Task 2-3 có thể chạy song song vì Task 1 chỉ sửa service/spec, không ảnh hưởng file mới. Task 4 phải chờ cả Task 1 và Task 3 xong.

```
Task 1 ─────────────────────────────────────────────────────┐
                                                             ▼
Task 2 (red tests) ──► Task 3 (implement matcher) ──────► Task 4 (integrate)
```

---

## File Map

| Action | File | Mục đích |
|--------|------|----------|
| Modify | `server/src/ai/pipelines/base-pipeline.service.ts` | Tách try/catch + log + gọi matcher |
| Modify | `server/src/ai/pipelines/base-pipeline.service.spec.ts` | Thêm test log + test matcher integration |
| Create | `server/src/ai/pipelines/dimension-matcher.ts` | Pure function resolver, total |
| Create | `server/src/ai/pipelines/dimension-matcher.spec.ts` | Unit tests TDD cho matcher |

---

## Task 1: Sửa log labeling + thêm returnedIds logging

**Skills:** `andrej-karpathy-skills:karpathy-guidelines` → `feature-dev:feature-dev` → `superpowers:verification-before-completion` (trước commit)

**Vấn đề:** Khối `try/catch` bao trùm từ dòng 118 đến 189 catch luôn `InterviewAIException` do `selected.length === 0` và log nhầm thành "Zod validation failed". Thực tế Zod đã pass.

**Files:**
- Modify: `server/src/ai/pipelines/base-pipeline.service.ts:118-189`
- Modify: `server/src/ai/pipelines/base-pipeline.service.spec.ts`

**Interfaces:**
- Consumes: không có task trước
- Produces: log behavior mới — dùng bởi Task 4 spec

- [ ] **Step 1.1: Thêm import `z` từ zod**

Mở `server/src/ai/pipelines/base-pipeline.service.ts`. Thêm vào cuối block imports:

```typescript
import { z } from 'zod';
```

- [ ] **Step 1.2: Thay thế toàn bộ đoạn try/catch từ dòng 118-189**

Xóa từ dòng 118 (`try {`) đến dòng 189 (`}`) và thay bằng:

```typescript
    let validated: z.infer<typeof FeedbackSchema>;
    try {
      validated = this.zodValidator.validate(FeedbackSchema, parsed);
    } catch (err) {
      this.logger.warn(
        `[feedback] Zod validation failed. rawLength=${raw.length}`,
        err,
      );
      throw err;
    }

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
          ? {
              id: dim.id,
              name: dim.name,
              baseWeight: dim.weight,
              score: d.score,
            }
          : null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    if (selected.length === 0) {
      this.logger.warn(
        `[feedback] No scoring dimensions matched. ` +
          `returnedIds=${JSON.stringify(validated.applied_dimensions.map((d) => d.id))} ` +
          `allowedIds=${JSON.stringify(allowedDims.map((d) => d.id))} rawLength=${raw.length}`,
      );
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'AI returned no valid scoring dimensions',
      );
    }

    const baseSum = selected.reduce((s, d) => s + d.baseWeight, 0);
    const appliedDimensions: AppliedDimension[] = selected.map((d) => ({
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

- [ ] **Step 1.3: Viết test mới trong base-pipeline.service.spec.ts**

Thêm vào cuối `describe('evaluateAnswer', ...)`:

```typescript
    it('KHÔNG log "Zod validation failed" khi Zod pass nhưng dimension không match', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'ZZ', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await expect(service.evaluateAnswer(feedbackInput)).rejects.toMatchObject({
        errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR,
      });
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(warnMessages.some((m) => m.includes('Zod validation failed'))).toBe(false);
    });

    it('log "No scoring dimensions matched" kèm returnedIds khi dimension fail', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'WRONG_ID', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await expect(service.evaluateAnswer(feedbackInput)).rejects.toMatchObject({
        errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR,
      });
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(warnMessages.some((m) => m.includes('returnedIds='))).toBe(true);
      expect(warnMessages.some((m) => m.includes('No scoring dimensions matched'))).toBe(true);
    });

    it('log "Zod validation failed" khi Zod thật sự throw', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify({ bad: 'data' }));
      const zodError = new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        422,
        'bad schema',
      );
      mockZodValidator.validate.mockImplementation(() => {
        throw zodError;
      });

      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await expect(service.evaluateAnswer(feedbackInput)).rejects.toThrow();
      const warnMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(warnMessages.some((m) => m.includes('Zod validation failed'))).toBe(true);
    });
```

- [ ] **Step 1.4: Chạy test để xác nhận test cũ vẫn xanh và test mới xanh**

```bash
cd server && npm test -- base-pipeline.service.spec.ts --verbose
```

Expected: tất cả pass, kể cả 3 test mới và các test cũ dòng 214, 238, 259, 274, 285.

- [ ] **Step 1.5: Build kiểm tra type**

```bash
cd server && npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 1.6: Commit**

```bash
git add server/src/ai/pipelines/base-pipeline.service.ts server/src/ai/pipelines/base-pipeline.service.spec.ts
git commit -m "fix(ai): fix log labeling in evaluateAnswer, expose returnedIds on dimension fail"
```

---

## Task 2: Viết test đỏ cho dimension-matcher (TDD)

**Skills:** `andrej-karpathy-skills:karpathy-guidelines` → `superpowers:test-driven-development` (invoke trước bước 2.1, theo đúng TDD flow của skill)

**Files:**
- Create: `server/src/ai/pipelines/dimension-matcher.spec.ts` (test fail vì file chưa có)

**Interfaces:**
- Consumes: `RubricDimensionEntry` từ `../context-pack.service`
- Produces: contract `resolveAppliedDimensions` + `MatchedDimension` — dùng bởi Task 3 và Task 4

- [ ] **Step 2.1: Tạo file test**

Tạo `server/src/ai/pipelines/dimension-matcher.spec.ts`:

```typescript
import { resolveAppliedDimensions } from './dimension-matcher';
import type { RubricDimensionEntry } from '../context-pack.service';

// Dimension data thật từ VN pack (context-pack.data.ts)
const VN_BEHAVIORAL: RubricDimensionEntry[] = [
  { id: 'D1', name: 'Giao tiếp & Trình bày', weight: 0.2 },
  { id: 'D2', name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
  { id: 'D3', name: 'Làm việc nhóm', weight: 0.15 },
  { id: 'D4', name: 'Thái độ & Động lực', weight: 0.2 },
  { id: 'D5', name: 'Phù hợp văn hóa', weight: 0.15 },
  { id: 'D6', name: 'Tự nhận thức', weight: 0.1 },
];

const VN_TECHNICAL: RubricDimensionEntry[] = [
  { id: 'TD1', name: 'Kiến thức nền tảng', weight: 0.25 },
  { id: 'TD2', name: 'Khả năng áp dụng thực tế', weight: 0.25 },
  { id: 'TD3', name: 'Tư duy hệ thống', weight: 0.2 },
  { id: 'TD4', name: 'Code quality & Best practices', weight: 0.2 },
  { id: 'TD5', name: 'Debug & Problem-solving', weight: 0.1 },
];

describe('resolveAppliedDimensions', () => {
  describe('Branch 1 — exact ID match', () => {
    it('khớp "D1" chính xác → trả D1', () => {
      const result = resolveAppliedDimensions([{ id: 'D1', score: 80 }], VN_BEHAVIORAL);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'D1',
        name: 'Giao tiếp & Trình bày',
        baseWeight: 0.2,
        score: 80,
        matchBranch: 'exact',
      });
    });

    it('khớp "TD1" chính xác với technical dims', () => {
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 70 }], VN_TECHNICAL);
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'exact' });
    });
  });

  describe('Branch 2 — normalized ID match (case, whitespace, dash)', () => {
    it('"d1" (lowercase) → D1', () => {
      const result = resolveAppliedDimensions([{ id: 'd1', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('"D-1" (có dấu gạch) → D1', () => {
      const result = resolveAppliedDimensions([{ id: 'D-1', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('" D1 " (có khoảng trắng) → D1', () => {
      const result = resolveAppliedDimensions([{ id: ' D1 ', score: 80 }], VN_BEHAVIORAL);
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'normId' });
    });

    it('"td1" (technical lowercase) → TD1 trong mixed dims', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions([{ id: 'td1', score: 70 }], mixed);
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'normId' });
    });
  });

  describe('Branch 3 — regex code extraction', () => {
    it('"D1: Giao tiếp & Trình bày" → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1: Giao tiếp & Trình bày', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'code' });
    });

    it('"D1 Communication" → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1 Communication', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'code' });
    });

    it('"TD1: Kiến thức nền tảng" → TD1 trong mixed dims', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions(
        [{ id: 'TD1: Kiến thức nền tảng', score: 70 }],
        mixed,
      );
      expect(result[0]).toMatchObject({ id: 'TD1', matchBranch: 'code' });
    });

    it('TD1 không nhầm thành D1 — regex T?D ưu tiên bắt T', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 70 }], mixed);
      expect(result[0].id).toBe('TD1');
    });
  });

  describe('Branch 4 — name normalize match', () => {
    it('"Giao tiếp & Trình bày" (tên đầy đủ có dấu) → D1', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'Giao tiếp & Trình bày', score: 80 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'name' });
    });

    it('"lam viec nhom" (tên không dấu) → D3', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'lam viec nhom', score: 70 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D3', matchBranch: 'name' });
    });
  });

  describe('Branch 5 — substring fallback', () => {
    it('"giao tiep" (partial VN name) → D1 qua substring', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'giao tiep', score: 75 }],
        VN_BEHAVIORAL,
      );
      expect(result[0]).toMatchObject({ id: 'D1', matchBranch: 'substring' });
    });

    it('"kien thuc" → TD1 qua substring', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'kien thuc', score: 70 }],
        VN_TECHNICAL,
      );
      expect(result[0]?.matchBranch).toBe('substring');
      expect(result[0]?.id).toBe('TD1');
    });
  });

  describe('Session type filtering', () => {
    it('TD1 với HR dims → [] (technical không có trong behavioral)', () => {
      const result = resolveAppliedDimensions([{ id: 'TD1', score: 80 }], VN_BEHAVIORAL);
      expect(result).toHaveLength(0);
    });

    it('mixed dims → nhận cả D1 (behavioral) và TD1 (technical)', () => {
      const mixed = [...VN_BEHAVIORAL, ...VN_TECHNICAL];
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'TD1', score: 70 }],
        mixed,
      );
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.id)).toEqual(['D1', 'TD1']);
    });
  });

  describe('Dedup', () => {
    it('duplicate cùng ID: giữ entry đầu tiên (score 80), bỏ entry sau (score 60)', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'D1', score: 60 }],
        VN_BEHAVIORAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(80);
    });

    it('duplicate qua normalize ("D1" và "d1"): giữ entry đầu tiên', () => {
      const result = resolveAppliedDimensions(
        [{ id: 'D1', score: 80 }, { id: 'd1', score: 60 }],
        VN_BEHAVIORAL,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('D1');
      expect(result[0].score).toBe(80);
    });
  });

  describe('Edge cases — không bao giờ throw', () => {
    it('id bịa "ZZ" → []', () => {
      expect(resolveAppliedDimensions([{ id: 'ZZ', score: 50 }], VN_BEHAVIORAL)).toHaveLength(0);
    });

    it('id inventé "communication" không khớp tên VN → []', () => {
      // normalizeKey("communication")="communication"; D1 name normalizes to "giaotieptrinhbay"
      // không có substring overlap → no match
      expect(
        resolveAppliedDimensions([{ id: 'communication', score: 80 }], VN_BEHAVIORAL),
      ).toHaveLength(0);
    });

    it('applied rỗng → []', () => {
      expect(resolveAppliedDimensions([], VN_BEHAVIORAL)).toHaveLength(0);
    });

    it('allowedDims rỗng → []', () => {
      expect(resolveAppliedDimensions([{ id: 'D1', score: 80 }], [])).toHaveLength(0);
    });

    it('id là chuỗi rỗng → không throw', () => {
      expect(() =>
        resolveAppliedDimensions([{ id: '', score: 1 }], VN_BEHAVIORAL),
      ).not.toThrow();
    });

    it('id là ký tự đặc biệt → không throw', () => {
      expect(() =>
        resolveAppliedDimensions([{ id: '???!!!', score: 50 }], []),
      ).not.toThrow();
    });
  });
});
```

- [ ] **Step 2.2: Chạy test để xác nhận fail vì file chưa tồn tại**

```bash
cd server && npm test -- dimension-matcher.spec.ts --verbose
```

Expected: FAIL với `Cannot find module './dimension-matcher'`.

---

## Task 3: Implement dimension-matcher.ts

**Skills:** `andrej-karpathy-skills:karpathy-guidelines` → `superpowers:test-driven-development` (tiếp tục flow từ Task 2: implement để test xanh) → `superpowers:verification-before-completion` (trước commit)

**Files:**
- Create: `server/src/ai/pipelines/dimension-matcher.ts`

**Interfaces:**
- Consumes: `RubricDimensionEntry` từ `../context-pack.service`
- Produces: `resolveAppliedDimensions(applied, allowedDims): MatchedDimension[]` — dùng bởi Task 4

- [ ] **Step 3.1: Tạo file dimension-matcher.ts**

Tạo `server/src/ai/pipelines/dimension-matcher.ts`:

```typescript
import type { RubricDimensionEntry } from '../context-pack.service';

export interface MatchedDimension {
  id: string;
  name: string;
  baseWeight: number;
  score: number;
  matchBranch: 'exact' | 'normId' | 'code' | 'name' | 'substring';
}

// Regex bắt code token dạng D1, TD2, D-1 (T?D để phân biệt TD1 vs D1)
const CODE_REGEX = /\bT?D\s*\d+\b/i;

// Strip dấu tiếng Việt (U+0300–U+036F), đ/Đ→d, lowercase, bỏ ký tự không phải [a-z0-9]
function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function resolveOne(
  entry: { id: string; score: number },
  allowedDims: RubricDimensionEntry[],
): MatchedDimension | null {
  const raw = entry.id;

  // Branch 1: exact ID
  const exact = allowedDims.find((d) => d.id === raw);
  if (exact) {
    return { id: exact.id, name: exact.name, baseWeight: exact.weight, score: entry.score, matchBranch: 'exact' };
  }

  // Branch 2: normalized ID (case-insensitive, whitespace/dash stripped)
  const normRaw = normalizeKey(raw);
  const byNormId = allowedDims.find((d) => normalizeKey(d.id) === normRaw);
  if (byNormId) {
    return { id: byNormId.id, name: byNormId.name, baseWeight: byNormId.weight, score: entry.score, matchBranch: 'normId' };
  }

  // Branch 3: extract code token via regex (e.g. "D1: Giao tiếp", "TD2 - some desc")
  const codeMatch = CODE_REGEX.exec(raw);
  if (codeMatch) {
    const token = normalizeKey(codeMatch[0]);
    const byCode = allowedDims.find((d) => normalizeKey(d.id) === token);
    if (byCode) {
      return { id: byCode.id, name: byCode.name, baseWeight: byCode.weight, score: entry.score, matchBranch: 'code' };
    }
  }

  // Branch 4: match by normalized dimension name (gemma returned full name instead of ID)
  const byName = allowedDims.find((d) => normalizeKey(d.name) === normRaw);
  if (byName) {
    return { id: byName.id, name: byName.name, baseWeight: byName.weight, score: entry.score, matchBranch: 'name' };
  }

  // Branch 5: substring fallback — only if normalized name >= 4 chars (reduces false positives)
  const bySubstring = allowedDims.find((d) => {
    const normName = normalizeKey(d.name);
    if (normName.length < 4) return false;
    return normRaw.includes(normName) || normName.includes(normRaw);
  });
  if (bySubstring) {
    return {
      id: bySubstring.id,
      name: bySubstring.name,
      baseWeight: bySubstring.weight,
      score: entry.score,
      matchBranch: 'substring',
    };
  }

  return null;
}

// Total function: never throws. Empty array is a valid result — caller decides what to do.
export function resolveAppliedDimensions(
  applied: { id: string; score: number }[],
  allowedDims: RubricDimensionEntry[],
): MatchedDimension[] {
  const seen = new Set<string>();
  const result: MatchedDimension[] = [];

  for (const entry of applied) {
    try {
      const resolved = resolveOne(entry, allowedDims);
      if (resolved && !seen.has(resolved.id)) {
        seen.add(resolved.id);
        result.push(resolved);
      }
    } catch {
      // resolveOne should not throw, but belt-and-suspenders: skip entry on unexpected error
    }
  }

  return result;
}
```

- [ ] **Step 3.2: Chạy test để xác nhận tất cả pass**

```bash
cd server && npm test -- dimension-matcher.spec.ts --verbose
```

Expected: tất cả test từ Task 2 pass. Nếu có test fail, sửa implementation trước khi tiếp tục.

- [ ] **Step 3.3: Commit**

```bash
git add server/src/ai/pipelines/dimension-matcher.ts server/src/ai/pipelines/dimension-matcher.spec.ts
git commit -m "feat(ai): add dimension-matcher — normalize + resolve applied dimensions"
```

---

## Task 4: Integrate matcher vào BasePipelineService

**Skills:** `andrej-karpathy-skills:karpathy-guidelines` → `feature-dev:feature-dev` → `superpowers:verification-before-completion` (trước commit) → `superpowers:requesting-code-review` (sau commit, đây là task cuối của core flow)

**Files:**
- Modify: `server/src/ai/pipelines/base-pipeline.service.ts`
- Modify: `server/src/ai/pipelines/base-pipeline.service.spec.ts`

**Interfaces:**
- Consumes: `resolveAppliedDimensions`, `MatchedDimension` từ `./dimension-matcher`
- Produces: `evaluateAnswer` với normalize layer — không đổi return type

- [ ] **Step 4.1: Thêm import matcher vào base-pipeline.service.ts**

Thêm vào block imports sau import `SURGICAL_FEEDBACK_PROMPT_CONFIG`:

```typescript
import { resolveAppliedDimensions } from './dimension-matcher';
```

- [ ] **Step 4.2: Thay thế inline allowedById.get() bằng resolveAppliedDimensions**

Trong `evaluateAnswer`, thay đoạn sau dòng `const allowedById = new Map(...)` đến hết phần `selected`:

```typescript
    // TRƯỚC (xóa đoạn này):
    const allowedById = new Map(allowedDims.map((d) => [d.id, d]));
    const selected = validated.applied_dimensions
      .map((d) => {
        const dim = allowedById.get(d.id);
        return dim
          ? { id: dim.id, name: dim.name, baseWeight: dim.weight, score: d.score }
          : null;
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    // SAU (thay bằng):
    const selected = resolveAppliedDimensions(validated.applied_dimensions, allowedDims);

    selected
      .filter((d) => d.matchBranch === 'substring')
      .forEach((d) =>
        this.logger.debug(`[feedback] Fuzzy dimension match (substring): resolved=${d.id}`),
      );
```

Phần còn lại của hàm (từ `if (selected.length === 0)` trở đi) giữ nguyên. `selected` vẫn có `id`, `name`, `baseWeight`, `score` — `matchBranch` thêm không ảnh hưởng.

- [ ] **Step 4.3: Thêm test integration matcher trong base-pipeline.service.spec.ts**

Thêm vào cuối `describe('evaluateAnswer', ...)`:

```typescript
    it('gemma trả id sai casing "d1" → vẫn resolve D1, isFallback không xảy ra', async () => {
      const rawFeedback = {
        model_answer: 'Answer.',
        key_takeaway: 'Good.',
        applied_dimensions: [{ id: 'd1', score: 80 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toHaveLength(1);
      expect(result.appliedDimensions[0]).toMatchObject({ id: 'D1', name: 'Communication', score: 80 });
      expect(result.overallScore).toBe(80);
    });

    it('gemma trả tên dimension "Teamwork" → vẫn resolve D2', async () => {
      const rawFeedback = {
        model_answer: 'Answer.',
        key_takeaway: 'Good.',
        applied_dimensions: [{ id: 'd1', score: 80 }, { id: 'Teamwork', score: 60 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      const result = await service.evaluateAnswer(feedbackInput);

      expect(result.appliedDimensions).toHaveLength(2);
      expect(result.appliedDimensions.map((d) => d.id)).toEqual(['D1', 'D2']);
    });

    it('dimension không match sau normalize → vẫn throw SCHEMA_VALIDATION_ERROR', async () => {
      const rawFeedback = {
        model_answer: 'x',
        key_takeaway: 'y',
        applied_dimensions: [{ id: 'TOTALLY_BOGUS', score: 50 }],
        annotated_segments: [],
      };
      mockOpenAI.chatCompletion.mockResolvedValue(JSON.stringify(rawFeedback));
      mockZodValidator.validate.mockReturnValue(rawFeedback);

      await expect(service.evaluateAnswer(feedbackInput)).rejects.toMatchObject({
        errorCode: ErrorCode.SCHEMA_VALIDATION_ERROR,
      });
    });
```

- [ ] **Step 4.4: Chạy toàn bộ test suite liên quan**

```bash
cd server && npm test -- base-pipeline.service.spec.ts dimension-matcher.spec.ts --verbose
```

Expected: tất cả pass, kể cả test cũ dòng 214 (overallScore), 238 (loại TD1 từ HR), 259 (throw ZZ), 274 (reject wrong session type), 285 (temperature/maxTokens), và tất cả test mới từ Task 1, 4.

- [ ] **Step 4.5: Build kiểm tra**

```bash
cd server && npm run build
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add server/src/ai/pipelines/base-pipeline.service.ts server/src/ai/pipelines/base-pipeline.service.spec.ts
git commit -m "feat(ai): integrate dimension-matcher into evaluateAnswer, reduce fallback rate"
```

---

## Task 5 (Optional): Tighten prompt + bump PROMPT_VERSION

**Skills:** `andrej-karpathy-skills:karpathy-guidelines` → `feature-dev:feature-dev` → `superpowers:verification-before-completion` (trước commit)

**Khi nào làm Task 5:** Sau khi deploy Task 1-4 và quan sát log từ 2-3 session HR. Nếu vẫn còn `returnedIds` cho thấy gemma trả id dạng hoàn toàn xa lạ (không phải format/case error), tightening prompt sẽ giúp giảm thêm.

**Files:**
- Modify: `server/src/ai/prompt-builder.service.ts:91-95`
- Modify: `server/src/ai/pipelines/pipeline.schemas.ts:3`
- Modify: `server/src/ai/CLAUDE.md` (2 chỗ hardcode `surgical-feedback-v1.4`)

- [ ] **Step 5.1: Thay rule thứ 3 trong selectionRules tại prompt-builder.service.ts**

```typescript
// TRƯỚC:
`Return them in "applied_dimensions" as objects { "id", "score" } using the ids exactly as listed.`,

// SAU:
`Return them in "applied_dimensions" as objects { "id", "score" } — copy the id token EXACTLY as shown (e.g. D1, D3, TD2). Do not translate, rename, or describe the id.`,
```

- [ ] **Step 5.2: Bump PROMPT_VERSION trong pipeline.schemas.ts**

```typescript
// TRƯỚC:
export const PROMPT_VERSION = 'surgical-feedback-v1.4';

// SAU:
export const PROMPT_VERSION = 'surgical-feedback-v1.5';
```

- [ ] **Step 5.3: Cập nhật server/src/ai/CLAUDE.md**

Tìm 2 chỗ hardcode `surgical-feedback-v1.4` trong file và thay thành `surgical-feedback-v1.5`:
1. Mục "Per-question Scoring" dòng mô tả prompt version
2. Dòng "Prompt version hiện tại"

- [ ] **Step 5.4: Chạy test**

```bash
cd server && npm test -- base-pipeline.service.spec.ts --verbose
```

Test tại dòng 235 (`expect(result.promptVersion).toBe(PROMPT_VERSION)`) tự động update vì import const — expected pass.

- [ ] **Step 5.5: Commit**

```bash
git add server/src/ai/prompt-builder.service.ts server/src/ai/pipelines/pipeline.schemas.ts server/src/ai/CLAUDE.md
git commit -m "feat(ai): tighten dimension id instruction in prompt, bump to v1.5"
```

---

## Validation Commands (sau khi hoàn thành)

```bash
cd server && npm test -- dimension-matcher.spec.ts base-pipeline.service.spec.ts --verbose
cd server && npm run build
cd server && npm run lint
```

## Completion Criteria

- [ ] `resolveAppliedDimensions` đã replace inline `allowedById.get()` trong `evaluateAnswer`
- [ ] Log "Zod validation failed" chỉ xuất hiện khi Zod thật sự fail
- [ ] Log kèm `returnedIds=` khi dimension fail — có thể dùng để debug future sessions
- [ ] Tất cả test cũ tại `base-pipeline.service.spec.ts` vẫn xanh
- [ ] `dimension-matcher.spec.ts` pass toàn bộ
- [ ] `npm run build` và `npm run lint` không có error
- [ ] Local model hiện tại không đổi
- [ ] Fallback vẫn hoạt động an toàn cho case JSON lỗi hoặc Zod fail

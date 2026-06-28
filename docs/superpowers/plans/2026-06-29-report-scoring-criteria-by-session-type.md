# Hiển thị tiêu chí chấm điểm theo loại phỏng vấn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trang báo cáo phỏng vấn hiển thị đúng tiêu chí chấm điểm theo `sessionType`: HR → chỉ tiêu chí hành vi, Technical → chỉ tiêu chí kỹ thuật, Mixed → cả hai với công thức tổng hợp.

**Architecture:** Pure frontend change. Rubric data được hard-code client-side trong `lib/rubric-config.ts` (mirror `server/src/prisma/context-pack.data.ts`). Không cần API mới. `session.sessionType` đã được fetch bởi report page.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4

## Global Constraints

- Không thay đổi backend
- Không thêm API call mới
- UI label tiếng Việt: "Tiêu chí hành vi", "Tiêu chí kỹ thuật"
- Tailwind classes phải match pattern hiện tại trong file
- `SessionType` và `ContextPack` import từ `@/lib/types` (đã export sẵn)
- Không tạo file test mới (không có unit test cho client components)

---

## File Map

| Action | File |
|--------|------|
| CREATE | `client/lib/rubric-config.ts` |
| REWRITE | `client/components/report/ScoringMethodCard.tsx` |
| MODIFY | `client/components/report/AnnotatedTranscript.tsx` |
| MODIFY | `client/app/(app)/sessions/[sessionId]/report/page.tsx` |
| MODIFY | `client/components/report/CLAUDE.md` |

---

## Skills & Subagents

Theo skill auto-activation rules trong global CLAUDE.md. Invoke skill TRƯỚC khi làm, không phải sau.

| Áp dụng | Skill / Subagent | Thời điểm | Lý do |
|---------|------------------|-----------|-------|
| Toàn plan | `superpowers:executing-plans` | Khi bắt đầu thực thi | Điều phối task-by-task, mỗi task verify + commit riêng |
| Task 1–4 | `andrej-karpathy-skills:karpathy-guidelines` | Trước khi viết/sửa bất kỳ code nào | Mandatory cho mọi thay đổi code |
| Task 2, 3 | `frontend-design:frontend-design` | Trước khi sửa `.tsx` | Component + Tailwind, đảm bảo UI render & class pattern đúng |
| Task 1–5 | `superpowers:verification-before-completion` | Trước khi đánh dấu task done | `npx tsc --noEmit` (Task 1–4) + `npm run lint && npm run build` (final) phải pass |
| Sau Task 4 | `code-review` (hoặc `code-reviewer` subagent) | Trước khi coi branch hoàn tất | Một lượt review tổng cho 4 file thay đổi; diff nhỏ nên không cần review từng commit |
| Task 5 | `claude-md-management:revise-claude-md` | Khi sync CLAUDE.md | Giữ đúng format/section của module CLAUDE.md |

Ghi chú: không dùng TDD/qa-tester — plan không tạo test (Global Constraints). Không spawn subagent cho code-writing (diff nhỏ, parent cần giữ context xuyên suốt 5 task); chỉ dùng `code-reviewer` subagent ở bước review cuối để có fresh eyes.

---

## Task 1: Tạo rubric-config.ts — nguồn dữ liệu tiêu chí

**Files:**
- Create: `client/lib/rubric-config.ts`

**Interfaces:**
- Produces: `RubricDimension`, `RubricCategory`, `getRubricCategories()`, `getRubricHint()` — dùng bởi Task 2 và Task 3

- [x] **Step 1: Tạo file `client/lib/rubric-config.ts`**

```typescript
import type { ContextPack, SessionType } from '@/lib/types'

export interface RubricDimension {
  code: string       // 'D1', 'TD1', ...
  nameVi: string     // tên tiêu chí
  weightPct: number  // phần trăm trong-category (integer, e.g. 20)
}

export interface RubricCategory {
  label: string
  categoryWeightPct: number  // phần trăm của điểm tổng
  dimensions: RubricDimension[]
}

const RUBRIC_DATA: Record<ContextPack, { behavioral: RubricCategory; technical: RubricCategory }> = {
  VN: {
    behavioral: {
      label: 'Tiêu chí hành vi',
      categoryWeightPct: 50,
      dimensions: [
        { code: 'D1', nameVi: 'Giao tiếp & Trình bày',      weightPct: 20 },
        { code: 'D2', nameVi: 'Tư duy & Giải quyết vấn đề', weightPct: 20 },
        { code: 'D3', nameVi: 'Làm việc nhóm',               weightPct: 15 },
        { code: 'D4', nameVi: 'Thái độ & Động lực',          weightPct: 20 },
        { code: 'D5', nameVi: 'Phù hợp văn hóa',             weightPct: 15 },
        { code: 'D6', nameVi: 'Tự nhận thức',                weightPct: 10 },
      ],
    },
    technical: {
      label: 'Tiêu chí kỹ thuật',
      categoryWeightPct: 50,
      dimensions: [
        { code: 'TD1', nameVi: 'Kiến thức nền tảng',           weightPct: 25 },
        { code: 'TD2', nameVi: 'Khả năng áp dụng thực tế',     weightPct: 25 },
        { code: 'TD3', nameVi: 'Tư duy hệ thống',              weightPct: 20 },
        { code: 'TD4', nameVi: 'Code quality & Best practices', weightPct: 20 },
        { code: 'TD5', nameVi: 'Debug & Problem-solving',       weightPct: 10 },
      ],
    },
  },
  Western: {
    behavioral: {
      label: 'Tiêu chí hành vi',
      categoryWeightPct: 45,
      dimensions: [
        { code: 'D1', nameVi: 'Communication & Presentation', weightPct: 20 },
        { code: 'D2', nameVi: 'Critical Thinking',            weightPct: 20 },
        { code: 'D3', nameVi: 'Collaboration & Teamwork',     weightPct: 15 },
        { code: 'D4', nameVi: 'Leadership & Initiative',      weightPct: 20 },
        { code: 'D5', nameVi: 'Culture Fit & Values',         weightPct: 15 },
        { code: 'D6', nameVi: 'Self-Awareness & Growth',      weightPct: 10 },
      ],
    },
    technical: {
      label: 'Tiêu chí kỹ thuật',
      categoryWeightPct: 55,
      dimensions: [
        { code: 'TD1', nameVi: 'Foundational Knowledge',        weightPct: 20 },
        { code: 'TD2', nameVi: 'Practical Application',         weightPct: 25 },
        { code: 'TD3', nameVi: 'Systems Thinking',              weightPct: 20 },
        { code: 'TD4', nameVi: 'Code Quality & Best Practices', weightPct: 20 },
        { code: 'TD5', nameVi: 'Debug & Problem-solving',       weightPct: 15 },
      ],
    },
  },
}

export function getRubricCategories(
  contextPackId: ContextPack,
  sessionType: SessionType,
): RubricCategory[] {
  const config = RUBRIC_DATA[contextPackId]
  if (sessionType === 'hr') return [config.behavioral]
  if (sessionType === 'technical') return [config.technical]
  return [config.behavioral, config.technical]
}

export function getRubricHint(
  contextPackId: ContextPack,
  sessionType: SessionType,
): string {
  const config = RUBRIC_DATA[contextPackId]
  if (sessionType === 'hr') {
    return `Tiêu chí hành vi: ${config.behavioral.dimensions
      .map((d) => `${d.code} ${d.nameVi} (${d.weightPct}%)`)
      .join(' · ')}`
  }
  if (sessionType === 'technical') {
    return `Tiêu chí kỹ thuật: ${config.technical.dimensions
      .map((d) => `${d.code} ${d.nameVi} (${d.weightPct}%)`)
      .join(' · ')}`
  }
  return `Hành vi ${config.behavioral.categoryWeightPct}% + Kỹ thuật ${config.technical.categoryWeightPct}%`
}
```

- [x] **Step 2: Verify TypeScript compile**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 errors liên quan đến file mới. (Nếu có pre-existing errors thì bỏ qua, chỉ cần không có error trong `lib/rubric-config.ts`.)

- [x] **Step 3: Commit**

```bash
git add client/lib/rubric-config.ts
git commit -m "feat(client): add rubric-config with session-type-aware dimension data"
```

---

## Task 2: Rewrite ScoringMethodCard — hiển thị đúng theo sessionType

**Files:**
- Modify: `client/components/report/ScoringMethodCard.tsx`

**Interfaces:**
- Consumes: `getRubricCategories(contextPackId, sessionType): RubricCategory[]` từ `@/lib/rubric-config`
- Consumes: `RubricCategory`, `RubricDimension` từ `@/lib/rubric-config`
- Props thay đổi: thêm `sessionType: SessionType` (required)

- [ ] **Step 1: Thay toàn bộ nội dung `ScoringMethodCard.tsx`**

```tsx
import type { ContextPack, SessionType } from '@/lib/types'
import { getRubricCategories } from '@/lib/rubric-config'
import type { RubricCategory } from '@/lib/rubric-config'

interface ScoringMethodCardProps {
  contextPackId: ContextPack
  sessionType: SessionType
}

function CategorySection({ category }: { category: RubricCategory }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{category.label}</h3>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand">
          {category.categoryWeightPct}% điểm tổng
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {category.dimensions.map((dim) => (
          <div key={dim.code} className="flex items-center gap-3">
            <div className="w-52 shrink-0 text-sm text-gray-700">
              <span className="mr-1.5 text-xs font-medium text-gray-400">{dim.code}</span>
              {dim.nameVi}
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${dim.weightPct}%` }}
                />
              </div>
            </div>
            <span className="w-10 text-right text-xs font-medium text-gray-500">
              {dim.weightPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScoringMethodCard({ contextPackId, sessionType }: ScoringMethodCardProps) {
  const categories = getRubricCategories(contextPackId, sessionType)
  const isMixed = sessionType === 'mixed'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Phương pháp chấm điểm</h2>

      <p className="mb-4 text-sm text-gray-600">
        Điểm tổng = trung bình cộng điểm từng câu trả lời. Mỗi câu được chấm trên thang 1–100 bởi
        AI dựa trên các tiêu chí dưới đây:
      </p>

      {isMixed && (
        <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-ink">
          <span className="font-medium">Công thức: </span>
          Điểm = (Điểm hành vi × {categories[0].categoryWeightPct}%) + (Điểm kỹ thuật ×{' '}
          {categories[1].categoryWeightPct}%)
        </p>
      )}

      <div className={`flex flex-col ${isMixed ? 'gap-6' : 'gap-2'}`}>
        {categories.map((cat) => (
          <CategorySection key={cat.label} category={cat} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compile**

```bash
cd client && npx tsc --noEmit
```

Expected: Không có lỗi mới từ `ScoringMethodCard.tsx` (có thể có lỗi từ report page vì prop chưa được update — sẽ fix ở Task 4).

- [ ] **Step 3: Commit**

```bash
git add client/components/report/ScoringMethodCard.tsx
git commit -m "feat(report): rewrite ScoringMethodCard to show session-type-aware rubric dimensions"
```

---

## Task 3: Update AnnotatedTranscript — hint đúng theo sessionType

**Files:**
- Modify: `client/components/report/AnnotatedTranscript.tsx`

**Interfaces:**
- Consumes: `getRubricHint(contextPackId, sessionType): string` từ `@/lib/rubric-config`
- Props thay đổi: thêm `sessionType?: SessionType` (optional)

- [ ] **Step 1: Xóa `RUBRIC_DIMENSIONS` constant và thêm imports**

Thay lines 1–7 (RUBRIC_DIMENSIONS constant và `AnnotatedSegment` import):

```tsx
import { TranscriptItem, AnnotatedSegment } from "@/lib/types";
import type { SessionType } from "@/lib/types";
import { getRubricHint } from "@/lib/rubric-config";
```

- [ ] **Step 2: Update props interface**

Tìm và thay:
```tsx
// OLD (lines 77-80)
interface AnnotatedTranscriptProps {
  items: TranscriptItem[];
  contextPackId?: "VN" | "Western";
}
```

Thành:
```tsx
interface AnnotatedTranscriptProps {
  items: TranscriptItem[];
  contextPackId?: "VN" | "Western";
  sessionType?: SessionType;
}
```

- [ ] **Step 3: Update function signature**

Tìm và thay:
```tsx
// OLD
export default function AnnotatedTranscript({
  items,
  contextPackId,
}: AnnotatedTranscriptProps) {
```

Thành:
```tsx
export default function AnnotatedTranscript({
  items,
  contextPackId,
  sessionType,
}: AnnotatedTranscriptProps) {
```

- [ ] **Step 4: Update rubric hint rendering**

Tìm và thay block:
```tsx
// OLD
{contextPackId && (
  <p className="mb-3 text-xs text-gray-400">
    Tiêu chí đánh giá: {RUBRIC_DIMENSIONS[contextPackId]}
  </p>
)}
```

Thành:
```tsx
{contextPackId && sessionType && (
  <p className="mb-3 text-xs text-gray-400">
    Tiêu chí đánh giá: {getRubricHint(contextPackId, sessionType)}
  </p>
)}
```

- [ ] **Step 5: Verify TypeScript compile**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 lỗi mới.

- [ ] **Step 6: Commit**

```bash
git add client/components/report/AnnotatedTranscript.tsx
git commit -m "feat(report): update AnnotatedTranscript rubric hint to use sessionType"
```

---

## Task 4: Update report page — truyền sessionType vào components

**Files:**
- Modify: `client/app/(app)/sessions/[sessionId]/report/page.tsx`

**Interfaces:**
- Consumes: `ScoringMethodCard` với props `{ contextPackId, sessionType }` (cả hai required)
- Consumes: `AnnotatedTranscript` với props thêm `sessionType?: SessionType`

- [ ] **Step 1: Update ScoringMethodCard invocation**

Tìm và thay (lines 142–144):
```tsx
// OLD
{session?.contextPackId && (
  <ScoringMethodCard contextPackId={session.contextPackId} />
)}
```

Thành:
```tsx
{session?.contextPackId && session?.sessionType && (
  <ScoringMethodCard
    contextPackId={session.contextPackId}
    sessionType={session.sessionType}
  />
)}
```

- [ ] **Step 2: Update AnnotatedTranscript invocation**

Tìm và thay:
```tsx
// OLD
<AnnotatedTranscript
  items={report.transcript ?? []}
  contextPackId={session?.contextPackId}
/>
```

Thành:
```tsx
<AnnotatedTranscript
  items={report.transcript ?? []}
  contextPackId={session?.contextPackId}
  sessionType={session?.sessionType}
/>
```

- [ ] **Step 3: Verify TypeScript compile — phải pass sạch**

```bash
cd client && npx tsc --noEmit
```

Expected: 0 lỗi từ 4 files đã thay đổi.

- [ ] **Step 4: Commit**

```bash
git add "client/app/(app)/sessions/[sessionId]/report/page.tsx"
git commit -m "feat(report): pass sessionType to ScoringMethodCard and AnnotatedTranscript"
```

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `client/components/report/CLAUDE.md`

- [ ] **Step 1: Cập nhật ScoringMethodCard Props section**

Tìm `## ScoringMethodCard Props` và thay toàn bộ block:

```markdown
## ScoringMethodCard Props

```ts
interface ScoringMethodCardProps {
  contextPackId: 'VN' | 'Western'
  sessionType: SessionType  // 'hr' | 'technical' | 'mixed'
}
```

Rubric data từ `lib/rubric-config.ts` (mirror của `server/src/prisma/context-pack.data.ts`):
- `hr` → hiển thị chỉ 6 tiêu chí hành vi (D1–D6) với within-category weights
- `technical` → hiển thị chỉ 5 tiêu chí kỹ thuật (TD1–TD5) với within-category weights
- `mixed` → cả hai nhóm, kèm badge `categoryWeightPct%` và công thức tổng hợp
```

- [ ] **Step 2: Cập nhật AnnotatedTranscript Props section**

Tìm `## AnnotatedTranscript Props` và thay:

```markdown
## AnnotatedTranscript Props

```ts
interface AnnotatedTranscriptProps {
  items: TranscriptItem[]
  contextPackId?: 'VN' | 'Western'
  sessionType?: SessionType   // cần có để hiển thị rubric hint per question
}
```

Rubric hint (dòng nhỏ bên dưới header mỗi câu):
- Chỉ hiển thị khi cả `contextPackId` và `sessionType` đều có
- Gọi `getRubricHint(contextPackId, sessionType)` từ `lib/rubric-config.ts`
```

- [ ] **Step 3: Commit**

```bash
git add client/components/report/CLAUDE.md
git commit -m "docs(claude-md): sync report component props after sessionType changes"
```

---

## Verification

### Visual check (manual)

```bash
cd client && npm run dev
```

Truy cập report page với mỗi loại session:

**HR session** (`sessionType: 'hr'`):
- `ScoringMethodCard` hiển thị duy nhất section "Tiêu chí hành vi"
- Có 6 dimension bars: D1–D6 với weights 20/20/15/20/15/10
- Không hiển thị công thức Mixed, không có section "Tiêu chí kỹ thuật"
- Per-question hint trong `AnnotatedTranscript`: bắt đầu bằng "Tiêu chí hành vi: D1..."

**Technical session** (`sessionType: 'technical'`):
- `ScoringMethodCard` hiển thị duy nhất section "Tiêu chí kỹ thuật"
- Có 5 dimension bars: TD1–TD5
- VN weights: 25/25/20/20/10; Western weights: 20/25/20/20/15
- Per-question hint: bắt đầu bằng "Tiêu chí kỹ thuật: TD1..."

**Mixed session** (`sessionType: 'mixed'`):
- `ScoringMethodCard` hiển thị cả hai section với gap giữa chúng
- Dòng công thức: "Điểm = (Điểm hành vi × 50%) + (Điểm kỹ thuật × 50%)" với VN
- Dòng công thức: "...× 45%) + (... × 55%)" với Western
- Per-question hint: "Hành vi 50% + Kỹ thuật 50%" (VN)

### Lint + build check

```bash
cd client
npm run lint
npm run build
```

Expected: 0 errors mới. Lint warnings pre-existing có thể bỏ qua.

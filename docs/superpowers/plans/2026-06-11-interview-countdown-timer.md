# Interview Countdown Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị bộ đếm ngược trong trang phỏng vấn, đếm từ `durationMin` phút (người dùng chọn ở Step 2) xuống 0.

**Architecture:** Tạo custom hook `useCountdown` để quản lý logic đếm giây, component `CountdownTimer` để render, và sửa interview page để fetch full session data (thay thế call `/status` hiện tại) lấy `durationMin`. Countdown bắt đầu khi questions load xong — không phải khi session tạo — để tránh tính cả thời gian generate câu hỏi. Timer là informational only: đổi màu khi gần hết giờ, không auto-complete.

**Tech Stack:** React hooks (`useEffect`, `useRef`), TypeScript, Tailwind CSS v4, Next.js App Router

---

## File Map

| Action | File | Mô tả |
|--------|------|-------|
| Create | `client/hooks/useCountdown.ts` | Hook quản lý countdown logic |
| Create | `client/components/interview/CountdownTimer.tsx` | Component hiển thị MM:SS |
| Modify | `client/app/(app)/sessions/[sessionId]/page.tsx` | Fetch full session, render CountdownTimer |

---

## Task 1: Tạo `useCountdown` hook

**Files:**
- Create: `client/hooks/useCountdown.ts`

- [ ] **Step 1: Tạo file hook với logic đếm ngược**

```typescript
// client/hooks/useCountdown.ts
import { useEffect, useRef, useState } from 'react'

interface CountdownResult {
  remainingSeconds: number
  isWarning: boolean
  isExpired: boolean
}

export function useCountdown(totalSeconds: number, active: boolean): CountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active || totalSeconds <= 0) return

    startTimeRef.current = Date.now()
    setRemainingSeconds(totalSeconds)

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000)
      const remaining = Math.max(0, totalSeconds - elapsed)
      setRemainingSeconds(remaining)
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [totalSeconds, active])

  return {
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds <= 300, // < 5 phút
    isExpired: remainingSeconds === 0,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/hooks/useCountdown.ts
git commit -m "feat: add useCountdown hook for interview timer"
```

---

## Task 2: Tạo `CountdownTimer` component

**Files:**
- Create: `client/components/interview/CountdownTimer.tsx`

- [ ] **Step 1: Tạo component hiển thị MM:SS**

```tsx
// client/components/interview/CountdownTimer.tsx
import { useCountdown } from '@/hooks/useCountdown'

interface CountdownTimerProps {
  durationMin: number
  active: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer({ durationMin, active }: CountdownTimerProps) {
  const totalSeconds = durationMin * 60
  const { remainingSeconds, isWarning, isExpired } = useCountdown(totalSeconds, active)

  const colorClass = isExpired
    ? 'text-danger'
    : isWarning
      ? 'text-amber-500'
      : 'text-ink-muted'

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-ink-muted">Còn lại</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${colorClass}`}>
        {formatTime(remainingSeconds)}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/interview/CountdownTimer.tsx
git commit -m "feat: add CountdownTimer component with warning and expired states"
```

---

## Task 3: Sửa interview page để fetch full session và render timer

**Files:**
- Modify: `client/app/(app)/sessions/[sessionId]/page.tsx`

**Context:**

Hiện tại page gọi:
```typescript
const currentSession = await apiClient.get<{ status: SessionStatus }>(
  `/sessions/${sessionId}/status`,
)
```

Thay bằng `GET /sessions/:id` để lấy full session bao gồm `durationMin`.

- [ ] **Step 1: Thêm state và thay thế status call**

Thêm import `Session` type (sửa dòng 13):
```typescript
import type { Session, SessionStatus } from '@/lib/types'
```

Thêm 2 state mới (sau `const [accessToken, setAccessToken] = useState('')`):
```typescript
const [durationMin, setDurationMin] = useState<number>(30)
const [questionsReady, setQuestionsReady] = useState(false)
```

Thay block status check (dòng 47–53) thành:
```typescript
const session = await apiClient.get<Session>(`/sessions/${sessionId}`)
if (session.status === 'completing' || session.status === 'completed') {
  router.replace(`/sessions/${sessionId}/report`)
  return
}
if (session.durationMin) setDurationMin(session.durationMin)
```

Sau `setQuestions(qs)` (dòng 64), thêm:
```typescript
setQuestionsReady(true)
```

- [ ] **Step 2: Thêm CountdownTimer vào JSX**

Thêm import:
```typescript
import CountdownTimer from '@/components/interview/CountdownTimer'
```

Trong phần `return` chính, thêm dòng `<div className="mb-4 flex justify-end">` trước `QuestionCard`:

```tsx
return (
  <ErrorBoundary>
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex justify-end">
        <CountdownTimer durationMin={durationMin} active={questionsReady} />
      </div>

      {current && (
        <QuestionCard
          questionText={followUp ?? current.content}
          orderIndex={currentIndex}
          totalQuestions={questions.length}
        />
      )}

      <div className="mt-6 flex gap-3">
        {(['text', 'voice'] as AnswerMode[]).map((m) => (
          <Button
            key={m}
            variant={answerMode === m ? 'primary' : 'secondary'}
            onClick={() => setAnswerMode(m)}
          >
            {m === 'text' ? 'Text' : 'Giọng nói'}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {answerMode === 'text' ? (
          <TextAnswerInput onSubmit={submitText} />
        ) : (
          <VoiceRecorder
            onSubmit={submitVoice}
            supabaseUrl={supabaseUrl}
            accessToken={accessToken}
          />
        )}
      </div>
    </div>
  </ErrorBoundary>
)
```

- [ ] **Step 3: Commit**

```bash
git add client/app/(app)/sessions/[sessionId]/page.tsx
git commit -m "feat: show countdown timer in interview page using session durationMin"
```

---

## Task 4: Cập nhật CLAUDE.md

**Files:**
- Modify: `client/components/interview/CLAUDE.md`

- [ ] **Step 1: Thêm `CountdownTimer` vào bảng Components**

Thêm row vào bảng Components trong `client/components/interview/CLAUDE.md`:

```markdown
| `CountdownTimer` | `CountdownTimer.tsx` | Đếm ngược từ `durationMin` phút, đổi màu khi < 5 phút (amber) hoặc hết giờ (danger) |
```

- [ ] **Step 2: Commit**

```bash
git add client/components/interview/CLAUDE.md
git commit -m "docs: update interview CLAUDE.md with CountdownTimer"
```

---

## Verification

1. Chạy dev server: `cd client && npm run dev`
2. Tạo session với duration 30 phút ở setup page
3. Vào trang interview — countdown phải hiển thị `29:5X` (trừ đi giây đã qua khi load)
4. Đổi sang session 1 tiếng — countdown hiển thị `59:5X`
5. Kiểm tra: khi remaining < 5 phút, chữ đổi sang amber
6. Kiểm tra TypeScript: `cd client && npm run lint`

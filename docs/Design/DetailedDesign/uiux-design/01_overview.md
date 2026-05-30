# UI/UX Design — Overview

Nội dung chi tiết: 01_overview.md, 02_flows_auth_setup.md, 03_flows_interview.md, 04_flows_features.md.

---

## 1. Sitemap

```
/
├── /auth/callback                              (public — no auth)
├── /onboarding                                 (protected)
├── /dashboard                                  (protected)
├── /sessions/new                               (protected)
├── /sessions/[id]/interview                    (protected)
├── /sessions/[id]/report                       (protected)
├── /sessions/[id]/rewrite/[questionId]         (protected)
├── /progress                                   (protected)
├── /admin/users                                (admin only)
└── /admin/questions                            (admin only)
```

---

## 2. Screen Inventory

| Route | Page Component | Module | UC liên quan | Auth | Priority |
|-------|---------------|--------|-------------|------|---------|
| `/auth/callback` | `AuthCallbackPage` | Auth | UC-01 | No | MUST |
| `/onboarding` | `OnboardingPage` | Session | UC-02, UC-11 | Yes | MUST |
| `/dashboard` | `DashboardPage` | Session | UC-08, UC-13 | Yes | MUST |
| `/sessions/new` | `SessionSetupWizard` | Session | UC-03, UC-12 | Yes | MUST |
| `/sessions/[id]/interview` | `InterviewPage` | Answer | UC-04, UC-12 | Yes | MUST |
| `/sessions/[id]/report` | `ReportPage` | Feedback | UC-05, UC-06 | Yes | MUST |
| `/sessions/[id]/rewrite/[questionId]` | `RewritePage` | Feedback | UC-07 | Yes | MUST |
| `/progress` | `ProgressPage` | Session | UC-08 | Yes | SHOULD |
| `/admin/users` | `AdminUsersPage` | Auth | — | Admin | COULD |
| `/admin/questions` | `AdminQuestionsPage` | Question | — | Admin | COULD |

**Transition rules:**
- Unauthenticated → `/auth/callback` → `/onboarding` (first login) or `/dashboard`
- Interview `status = ended` → auto-redirect `/sessions/[id]/report` hoặc `/sessions/[id]/rewrite/[questionId]`
- Admin routes: redirect to `/dashboard` nếu không có `role = admin`

---

## 3. Design System Tokens (Tailwind CSS)

Dựa trên Tailwind CSS defaults, không hardcode giá trị màu.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50…900` | Tailwind default | CTA buttons, links, focus rings |
| `neutral-50…950` | Tailwind default | Background, text, borders |
| `error-500` | `#ef4444` | Validation errors, destructive actions |
| `success-500` | `#22c55e` | Positive scores, confirmation |
| `warning-500` | `#f59e0b` | Fallback states, partial success |
| `info-500` | `#3b82f6` | Informational highlights |

**Không hardcode màu trong code.** Dùng Tailwind class hoặc CSS custom property.

### Typography

| Scale | Class | Size | Usage |
|-------|-------|------|-------|
| `text-xs` | 12px | 0.75rem | Captions, timestamps |
| `text-sm` | 14px | 0.875rem | Secondary text, labels |
| `text-base` | 16px | 1rem | Body text |
| `text-lg` | 18px | 1.125rem | Subheadings |
| `text-xl` | 20px | 1.25rem | Page section titles |
| `text-2xl` | 24px | 1.5rem | Page titles |
| `text-3xl` | 30px | 1.875rem | Hero / landing headline |

Font family: `font-sans` (Inter, system-ui fallback — via Tailwind defaults).

### Spacing

Base unit: 4px. Sử dụng Tailwind spacing scale (`space-1` = 4px, `space-2` = 8px, …).

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 2px | Small chips, badges |
| `rounded` | 4px | Inputs, cards |
| `rounded-md` | 6px | Buttons, panels |
| `rounded-lg` | 8px | Modals, large cards |
| `rounded-xl` | 12px | Feature panels |

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Inputs, small cards |
| `shadow-md` | Cards, panels |
| `shadow-lg` | Modals, dropdowns |
| `shadow-xl` | Full-page overlays |

### Motion

| Token | Duration | Usage |
|-------|----------|-------|
| `duration-150` | 150ms | Micro-interactions (hover, focus) |
| `duration-300` | 300ms | Panel transitions, modals |
| `duration-500` | 500ms | Page transitions, SSE loading states |

SSE loading states (question generating, feedback pending): dùng skeleton loader, không dùng spinner cho content > 1s.

---

## 4. Layout Patterns

### 4.1 Interview Page — 3-Panel Layout (Final Round AI Reference)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: logo | session type badge | timer | end session        │
├───────────────────┬──────────────────────┬──────────────────────┤
│                   │                      │                      │
│  Interviewer      │  AI Suggestions       │  Interviewee         │
│  Transcript       │  (Follow-up, scores,  │  Transcript         │
│  (question +      │  key points after    │  (user's answer +    │
│  follow-up)       │  answer submitted)   │  annotation)        │
│                   │                      │                      │
├───────────────────┴──────────────────────┴──────────────────────┤
│ Bottom bar: [Text input] [🎤 Voice] [Send] | progress bar      │
└─────────────────────────────────────────────────────────────────┘
```

Panel widths: 1:1:1 trên desktop, stacked trên mobile (interviewer → AI suggestions → interviewee).

### 4.2 Report Page — Score + Transcript Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Overall Score Badge (0–100) | Context Pack Badge | Date         │
├──────────────────────────────┬───────────────────────────────────┤
│ Competency Scores            │ Transcript Annotations            │
│ - Clarity       [████░░] 72  │ Highlighted answer text with      │
│ - Structure     [███░░░] 58  │ color-coded spans per dimension  │
│ - Content       [████░░] 75  │ (click span → tooltip score+suggestion)│
│ - Culture Fit   [█████░] 82  │                                   │
├──────────────────────────────┴───────────────────────────────────┤
│ Action Plan: bulleted improvement list                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Responsive Breakpoints

| Breakpoint | Width | Layout changes |
|------------|-------|---------------|
| Mobile | `< 640px` | Single column, bottom sheet panels |
| Tablet | `640px – 1024px` | 2-column (interview: stacked) |
| Desktop | `> 1024px` | 3-panel interview, 2-column report |

---

## 5. Accessibility Baseline (WCAG 2.1 AA)

### 5.1 Mandatory

- Color contrast: `4.5:1` cho text nhỏ hơn 18px/thường, `3:1` cho text >= 18px/in đậm
- Keyboard navigation: tất cả interactive elements focusable, visible focus indicator
- ARIA roles: button/link/input không dùng `div`; modal có `role="dialog"` + `aria-modal="true"`
- Screen reader: `aria-label` cho icon-only buttons; `aria-live` regions cho SSE updates

### 5.2 Interview-Specific

- Voice recording button: visible label (không icon-only), `aria-pressed` khi recording
- SSE loading states: `aria-live="polite"` + `aria-busy="true"` khi đang chờ
- Error messages: `role="alert"` cho network/AI errors hiển thị inline

### 5.3 Restricted

- `outline-none` chỉ khi có alternative focus indicator — không strip focus ring toàn bộ app
- Không dùng `color` làm sole indicator of state — luôn kèm icon/text/shape

### 5.4 Focus Order

1. Start session → first focus vào input/record button
2. Question displayed → focus vào answer panel
3. Follow-up → focus vào answer panel
4. End session → focus vào "View Report" CTA

---

## 6. Component Inventory

| Component | Type | States | Notes |
|-----------|------|--------|-------|
| `AudioRecorder` | Client component | idle / recording / stopped / error | Web Audio API + MediaRecorder API |
| `SseListener` | Client component | connecting / connected / reconnecting / error | EventSource, auto-reconnect |
| `FollowUpPanel` | Client component | hidden / loading / visible | Rendered on `followup_ready` event |
| `SurgicalFeedback` | Client component | hidden / loading / visible | Annotated transcript, highlight spans |
| `ScoreBadge` | Shared | 0–100 | Color scales: red (<50) / yellow (50–75) / green (>75) |
| `TimerDisplay` | Shared | running / paused / ended | `aria-live` every 30s, not every second |
| `SessionCard` | Shared | active / ended / generating | Dashboard list item |
| `JDInputPanel` | Shared | empty / loading / parsed / error | Paste or file upload |
| `ContextPackSelector` | Shared | VN / WESTERN | Radio group, keyboard accessible |
| `RewriteComparePanel` | Client component | loading / comparing / accepted / rejected | Side-by-side |
| `CompetencyHeatmap` | Client component | loading / visible | Score breakdown per question |

Không có `div`-based buttons hoặc `div`-based form controls. Dùng native `<button>` và `<input>`.

---

## 7. State Management

- Server state: React Query (TanStack Query) — session list, report, answers
- UI state: React `useState` / `useReducer` — modals, panel visibility, recording state
- SSE state: `useSseStream(sessionId)` custom hook — manages EventSource lifecycle, reconnect, event dispatch
- Auth state: NextAuth.js session provider — `useSession()` hook, redirect on 401
- Form state: React Hook Form — session setup, rewrite input

SSE reconnect: client gửi `Last-Event-ID` header (EventSource API hỗ trợ native). Server không replay missed events — client fetch lại từ REST API sau reconnect nếu cần.

---

## 8. Key References

- HLD §2.2.1 — Page inventory (11 routes)
- HLD §5 — BullMQ jobs + SSE events: `question_ready`, `followup_ready`, `feedback_ready`, `session_ended`, `error`
- ADR-006 — SSE + Redis pub/sub
- D-07 — Job timeout/fallback specs (FeedbackJob 15s, ComprehensiveReportJob 30s)
- 02_product_deep_dives.md — Final Round AI 3-panel layout reference
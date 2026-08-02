# Tiến độ Thực hiện Kế hoạch Đánh giá Component

Tài liệu này dùng để theo dõi quá trình khắc phục và hoàn thiện các tiêu chí "Definition of Done" cho toàn bộ 73 components trong `@client/components`. Chiến lược là "chia để trị", thực hiện cuốn chiếu theo từng nhóm component.

## Task 1: Nhóm Auth Components (Đang thực hiện)
Mục tiêu: Refactor kiến trúc, dùng `react-hook-form` + `zod`, bổ sung test & docs.
- [x] Refactor `LoginForm` (Đẩy logic lên Page, form thuần RHF + Zod).
- [x] Refactor `RegisterForm` (Đẩy logic lên Page, form thuần RHF + Zod).
- [x] Refactor `LogoutButton` (Chuyển thành pure component, bóc tách logic lên app/(auth)/LogoutAction).
- [x] Bổ sung `.stories.tsx` cho nhóm Auth. (Đã xong LoginForm, RegisterForm, LogoutButton)
- [x] Bổ sung `.test.tsx` cho nhóm Auth. (Đã xong LoginForm, RegisterForm, LogoutButton)

## Task 2: Nhóm Core UI Primitives 1
Mục tiêu: Phủ test, docs và a11y cho các UI nền tảng cốt lõi.
- [x] Tích hợp `@storybook/addon-a11y` và `jest-axe` (Setup môi trường).
- [x] Hoàn thiện `.stories.tsx` & `.test.tsx` cho `Button`.
- [x] Hoàn thiện `.stories.tsx` & `.test.tsx` cho `Dialog`.
- [x] Hoàn thiện `.stories.tsx` & `.test.tsx` cho `DropdownMenu`.
- [x] Hoàn thiện `.stories.tsx` & `.test.tsx` cho `Tabs`.
- [x] Bổ sung `.stories.tsx` & `.test.tsx` cho `Input` & `Label`.

## Task 3: Nhóm Core UI Primitives 2
Mục tiêu: Các UI component còn lại phục vụ form và tương tác.
- [x] Hoàn thiện `Checkbox`, `RadioGroup`.
- [x] Hoàn thiện `Select`, `Switch`.
- [x] Hoàn thiện `Tooltip`, `Popover`.
- [x] Hoàn thiện `Accordion`.
- [x] Hoàn thiện `Badge`, `Card`, `Textarea`.
- [ ] Các primitives khác:
  - [x] `AlertDialog`
  - [x] `Combobox`
  - [x] `Command`
  - [x] `Sheet`
  - [x] `Table`
  - [x] `Toast`
  - [x] `LoadingSpinner`
  - [x] `ThemeToggle`
  - [x] `ErrorBoundary`

## Task 4: Nhóm Layout & Patterns
Mục tiêu: Layout chính và các Pattern tổng hợp.
- [x] Bổ sung `.stories.tsx` & `.test.tsx` cho `AppHeader` & `AppSidebar`.
- [x] Bổ sung `.stories.tsx` & `.test.tsx` cho `AppLayout` & `NavLinks`.
- [x] Bổ sung `.stories.tsx` & `.test.tsx` cho các `<Name>Patterns`.

## Task 5: Nhóm Feature Components còn lại
Mục tiêu: Đảm bảo 100% components nghiệp vụ tuân thủ chuẩn.
- [x] Nhóm `interview` (CountdownTimer, QuestionCard, TextAnswerInput, VoiceRecorder): Đã bóc tách logic, thêm Storybook và Unit Test.
- [x] Nhóm `landing` (CtaSection, FeaturesSection, HeroSection): Đã phủ Storybook và Unit Test.
- [x] Nhóm `profile` (11 components): Đã bóc tách logic (sạch sẵn), thêm Storybook và Unit Test.
- [x] Nhóm `report` (AnnotatedTranscript, CompetencyScoreChart, ScoringMethodCard, SessionMetadataCard): Đã phủ Storybook và Unit Test.
- [x] Khảo sát, bóc tách logic, phủ test & docs cho nhóm `setup`.
  - Fix vi phạm kiến trúc: tạo `lib/setup-types.ts`, chuyển `JdFormData`, `InterviewDuration`, `DURATION_OPTIONS`, `EMPTY_JD`, `isJdValid` ra khỏi `app/(candidate)/setup/page.tsx`.
  - Bổ sung `.stories.tsx` cho `ConfigForm`, `ConfirmStep`, `JdForm`, `SavedJdPicker`.
  - Bổ sung `.test.tsx` cho `ConfigForm`, `ConfirmStep`, `JdForm`, `SavedJdPicker`.
  - Kết quả: 50/50 tests PASS (14 Storybook stories + 36 unit tests).

---
**Trạng thái chung:** 🟢 Hoàn thành (Task 5 - Nhóm Feature Components đã xong toàn bộ — cả 5 tasks đã hoàn thành)

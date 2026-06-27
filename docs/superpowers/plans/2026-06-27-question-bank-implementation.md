# Question Bank — Self-hosted Implementation (Hướng A)

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai self-hosted question bank làm fallback cho OpenAI question generation. Tổng 120 câu (90 gốc + 30 frontend), đa ngôn ngữ (vi/en), có usage tracking.

**Gap cần giải quyết:**
1. DB tables chưa tồn tại — chưa chạy migration
2. Schema thiếu: `translations`, `contentJson`, `tags`, `estimatedTimeMin`, bảng `question_usage`
3. Nội dung: 45 câu VN pack đang là tiếng Việt; thiếu frontend questions
4. Architecture: fallback logic inline trong `QuestionGenerationProcessor`, cần tách ra service

---

## Task 1: Kiểm tra sessionType consistency

- [x] Xác nhận `SessionType = 'hr' | 'technical' | 'mixed'` khớp với seed data — **Done, không cần sửa**

---

## Task 2: Mở rộng schema Prisma

**File**: `server/prisma/schema.prisma`

- [ ] Thêm vào model `QuestionBank` (sau field `applicableLevels`):
  ```prisma
  tags             String[]   @default([]) @map("tags")
  estimatedTimeMin Int?       @map("estimated_time_min")
  translations     Json?      // { vi?: string, en?: string }
  contentJson      Json?      @map("content_json")
  questionUsages   QuestionUsage[]
  ```

- [ ] Thêm model `QuestionUsage` (sau model `QuestionBank`):
  ```prisma
  model QuestionUsage {
    id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    questionBankId String       @map("question_bank_id") @db.Uuid
    sessionId      String?      @map("session_id") @db.Uuid
    userId         String       @map("user_id") @db.Uuid
    usedAt         DateTime     @default(now()) @map("used_at") @db.Timestamptz(6)
    questionBank   QuestionBank @relation(fields: [questionBankId], references: [id], onDelete: Cascade)
    @@index([questionBankId, usedAt(sort: Desc)], map: "idx_question_usage_bank_used")
    @@index([userId, usedAt(sort: Desc)],         map: "idx_question_usage_user_used")
    @@map("question_usage")
  }
  ```

---

## Task 3: Chạy Prisma migration

- [ ] `cd server && npx prisma migrate dev --name init-schema-with-question-bank`
- [ ] Verify: migration file tạo thành công tại `server/prisma/migrations/`

---

## Task 4: Rewrite seed data (02-question-bank.ts)

**File**: `server/prisma/seed/02-question-bank.ts`

- [ ] Dịch 45 câu VN pack sang tiếng Anh (content field), giữ VN cultural framing
- [ ] Thêm `translations: { en: '...', vi: '...' }` cho TẤT CẢ 90 câu
- [ ] Thêm `tags: string[]` và `estimatedTimeMin: number` cho tất cả câu
- [ ] Thêm 30 câu frontend: React hooks, CSS, JavaScript browser — split VN×15 + Western×15
- [ ] Cập nhật idempotency check từ `count >= 90` thành `count >= 120`

Tổng: **120 câu** — hr×VN=15, hr×Western=15, technical×VN=20, technical×Western=20, mixed×VN=15, mixed×Western=15

---

## Task 5: Thêm language vào job payload

- [ ] `server/src/session/session.service.ts`: thêm `language: session.language` vào BullMQ enqueue payload
- [ ] `server/src/ai/processors/question-generation.processor.ts`: thêm `language: string` vào `QuestionGenerationJobDto`

---

## Task 6: Tạo QuestionBankService + Module

**Files mới**: `server/src/question-bank/question-bank.service.ts`, `server/src/question-bank/question-bank.module.ts`

- [ ] `selectFallbackQuestions(sessionType, contextPackId, count, language)` — query + difficulty spread
- [ ] `recordUsage(questionBankId, sessionId, userId)` — insert vào `question_usage`
- [ ] `private resolveText(question, language)` — translations[lang] ?? content
- [ ] `private selectWithDifficultySpread(items, count)` — moved từ processor (30/50/20)
- [ ] QuestionBankModule: providers + exports, không import PrismaModule (global)

---

## Task 7: Refactor QuestionGenerationProcessor

**File**: `server/src/ai/processors/question-generation.processor.ts`

- [ ] Inject `QuestionBankService`
- [ ] Replace fallback Prisma query với `questionBankService.selectFallbackQuestions(..., language)`
- [ ] Gọi `questionBankService.recordUsage(...)` sau khi persist session questions
- [ ] Xóa `selectWithDifficultySpread()` private method

**File**: `server/src/ai/ai.module.ts`

- [ ] Import `QuestionBankModule`

---

## Task 8: Cập nhật CLAUDE.md + CHANGELOG

- [ ] Tạo `server/src/question-bank/CLAUDE.md`
- [ ] Cập nhật `server/CLAUDE.md` §Module Index — thêm row QuestionBank
- [ ] Cập nhật `CHANGELOG.md`

---

## Task 9: Chạy seed + verify

- [ ] `cd server && npm run seed`
- [ ] Verify 120 rows trong `question_bank`, `deleted_at IS NULL`, `translations IS NOT NULL`
- [ ] Verify distribution: 6 pairs đúng count
- [ ] Verify `question_usage` table tồn tại (0 rows)
- [ ] Fallback smoke test: `OPENAI_API_KEY=invalid`, tạo session, kiểm tra questions trả về

---

# Schema Evolution Tasks

> Nguồn: [schema-design-review.md](../../Design/DetailedDesign/database-design/schema-design-review.md) — 8 vấn đề thiết kế DB raised 2026-06-27, đã phân loại theo phase.
> **Thứ tự ưu tiên (cập nhật 2026-06-27, quyết định user):** hoàn thành TOÀN BỘ Schema Evolution trước Question Bank. T10–T11 done. Thứ tự còn lại: T12 → T13 → T14 → T15 → T16 → rồi Question Bank T4–T9. Phase B/C được kéo vào active sprint (không còn backlog).
> **Lưu ý chung về schema change:** dự án dùng `prisma db push` (không `migrate dev`) → drop column sẽ **mất dữ liệu**; CHECK constraint không express được trong Prisma, cần raw SQL ngoài quy trình push. Mọi schema change đụng "design complete" phase → ghi nhận là discovered gap, cân nhắc ADR.

## Phase A — MVP Hardening (làm ngay sau question bank)

### Task 10: Loại bỏ PII bloat khỏi user_profiles (SR-03)

**Skills:** `supabase` (Prisma schema), `feature-dev` (user module), `frontend-design` (profile form), `security-review` (PII/PDPD).

- [x] **Audit usage trước khi xóa** — grep toàn repo (`server/`, `client/`) cho từng field: `dateOfBirth`/`date_of_birth`, `phone`, `gender`, `hometown`, `nationality`, `personality`. Ghi lại nơi đọc/ghi.
- [x] Xác minh riêng `personality`: có feed vào prompt generation (`question-generation.processor.ts` / prompt builder) không. Nếu có → **giữ lại**, loại khỏi danh sách xóa. → **giữ lại** (quyết định user).
- [x] Xóa khỏi `server/prisma/schema.prisma` model `UserProfile`: các field PII thuần không có usage (`dateOfBirth`, `phone`, `gender`, `hometown`, `nationality`).
- [x] Cập nhật `server/src/user/dto/update-profile.dto.ts` — bỏ các field tương ứng.
- [x] Cập nhật `server/src/user/user.service.ts` — bỏ tham chiếu field đã xóa trong `updateProfile()`.
- [x] Cập nhật client: profile form component + `client/lib/types.ts`.
- [x] **KHÔNG** đụng `education`/`workExperience`/`projects`/`technicalSkills`/`certifications`/`awards` — thuộc phạm vi T12 (SR-02), giữ nguyên.
- [x] `cd server && npx prisma db push` + `npx prisma generate`. Xác nhận DB không còn user thật trước khi push (drop column mất data).
- [x] Cập nhật `server/CLAUDE.md` §User Module (`UpdateProfileDto` shape), `Database.md` (D5), CHANGELOG.
- [x] Cập nhật design doc liệt kê profile fields: `docs/Design/DetailedDesign/api-design/08_profile.md` (grep xác nhận có ref `date_of_birth`/`nationality`); kiểm tra thêm `MVP_Scope.md`, `SRS_InterviewAI_Full.md`. → cập nhật thêm `07_backend_api_inventory.md` (bỏ note dateOfBirth lỗi thời). MVP_Scope/SRS không có ref PII column (match `giới tính` trong SRS là anti-discrimination rule, giữ nguyên).

### Task 11: Fix session_type drift + CHECK constraints chọn lọc (SR-05)

**Skills:** `supabase` (raw SQL/Prisma), `understand` (trace enum usage).

Phần 1 — drift (rẻ, làm ngay):
- [x] Grep `docs/` cho `hr_behavioral` → đổi về `hr` cho khớp code/seed. Đã sửa: `MVP_Scope.md:39`, `SRS_InterviewAI_Full.md:537,587,1039`.
- [x] Xác nhận không còn doc nào ghi `hr_behavioral` (chỉ còn tham chiếu cố ý: plan/progress, `schema-design-review.md`, `Database.md` D1).

Phần 2 — CHECK constraints — **DEFER sang backlog** (quyết định user 2026-06-27): `db push` không giữ được CHECK constraint, raw SQL phải apply thủ công sau mỗi push → rủi ro drift cao hơn lợi ích khi đã có DTO + ValidationPipe. Làm khi chuyển sang proper migration workflow.
- [ ] Quyết định scope: chỉ `interview_sessions.session_type`, `users.status`, `users.role` (bỏ qua field ít rủi ro).
- [ ] Vì Prisma không express CHECK + dùng `db push`: viết raw SQL `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` lưu trong `server/prisma/sql/` (hoặc thư mục tương đương), áp dụng thủ công sau mỗi `db push`.
- [ ] Ghi ADR mới (discovered gap): raw SQL nằm ngoài Prisma `db push` → cập nhật quy trình apply để tránh drift. Xác nhận số ADR kế tiếp trong `docs/Design/ArchitecturalDesign/ADRs/` trước khi tạo.
- [ ] Cập nhật `Database.md` Constraints section + CHANGELOG.

## Phase B — v1.1 (ACTIVE sprint này — quyết định user 2026-06-27)

### Task 12: Tách bảng resumes (SR-02) — scope B (quyết định user 2026-06-27)

**Skills:** `supabase`, `feature-dev`. (`security-review` cho file upload chuyển sang T12b.)

Scope B: chỉ tách bảng + migrate JSONB. API contract giữ phẳng (DTO/client/types không đổi). CV upload + parser + link `resume_id` defer sang T12b (xem progress.md D5).

- [x] Thêm model `Resume` vào schema (xem snippet trong schema-design-review.md SR-02).
- [x] Migrate dữ liệu resume-structured (`education`/`workExperience`/`projects`/`technicalSkills`/`certifications`/`awards`) từ `user_profiles` JSONB sang `resumes.parsed_json`; xóa các JSONB field khỏi `user_profiles`. (`db push --accept-data-loss` drop 6 cột + RLS resumes + reseed done 2026-06-27 — DB chỉ seed/demo nên skip backfill)
- [ ] (T12b) CV upload endpoint (PDF/DOCX → Supabase Storage), parser → `parsed_text` + `parsed_json`, `parser_version`.
- [ ] (T12b) Liên kết câu hỏi generate với `resume_id` để truy vết.
- [x] Cập nhật design docs + CLAUDE.md + CHANGELOG (scope B). Docs CV v1.1 (`api-design/08_profile.md`, `MVP_Scope.md`, `SAD`) giữ cho T12b.

### Task 13: Tách bảng session_reports (SR-07)

**Skills:** `supabase`, `feature-dev` (report module).

- [x] Thêm model `SessionReport` (xem snippet SR-07).
- [x] Refactor report processors ghi vào `session_reports` thay vì 6 JSON columns trên `interview_sessions`.
- [x] Migrate report cũ; deprecate/drop 6 cột JSON sau khi migrate. (`migration.sql` §9 có guarded backfill nếu cột cũ còn tồn tại; schema hiện không còn 6 cột JSON)
- [x] Cập nhật `report.service.ts`, `report-response.dto.ts`, CLAUDE.md, CHANGELOG.

## Phase C — v2 (ACTIVE sprint này — quyết định user 2026-06-27; trước đó là backlog v2)

### Task 14: prompt_templates table (SR-01)
- [ ] Khi cần hot-swap/A-B prompt không deploy: thêm model `PromptTemplate` (snippet SR-01), join qua `prompt_version` đang lưu sẵn. Trước đó: giữ prompt-in-code.

### Task 15: Master data job_roles / skills / junctions (SR-04)
- [ ] **Mitigation MVP (làm cùng T4 nếu tiện):** thay magic string trong seed bằng TS const/enum để tránh typo `applicable_roles`/`tags`.
- [ ] v2: normalize thành `job_roles`, `skills`, `question_skills`, `role_skills` khi xây skill-based recommendation + JD→skill mapping.

### Task 16: ai_feedback_runs versioning (SR-06)
- [ ] Khi cần regenerate / A-B model / so sánh prompt: thêm model `AiFeedbackRun` (snippet SR-06), chuyển `ai_feedbacks` 1:1 sang 1:n có cờ `is_selected`. MVP giữ 1:1 + `is_fallback`.

## Đã cover

- **SR-08** (seed data production-quality): chính là Task 4 — seed 120 câu thật, đa ngôn ngữ. Không tạo task mới.

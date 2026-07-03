# MVP Scope — InterviewAI

Tài liệu này là quick reference IN/OUT cho MVP. Không thay thế SRS, HLD, hay DB design —
chỉ trả lời câu hỏi "cái này có trong MVP không?" để API Design, UI/UX Design, LLD tra nhanh
mà không cần đọc qua nhiều file lớn.

## Source of Truth

| Loại thông tin | Xem tại |
| -------------- | ------- |
| UC acceptance criteria, NFR thresholds | [SRS_InterviewAI_Full.md](../RequirementAnalysis/SRS/SRS_InterviewAI_Full.md) |
| DB DDL, RLS, indexes, design decisions | [database-design/](DetailedDesign/database-design/) |
| Component inventory, data flows, BullMQ jobs | [HLD_InterviewAI_v1.0.md](ArchitecturalDesign/HLD_InterviewAI_v1.0.md) §2, §3, §5 |
| AI prompt architecture, fallback strategy | [SAD_InterviewAI_v1.0.md](ArchitecturalDesign/SAD_InterviewAI_v1.0.md) §2 |
| Architecture decisions (tech stack, SSE, BullMQ) | [ADRs/](ArchitecturalDesign/ADRs/) ADR-001→007 |

---

## 1. MVP Use Cases (5)

Core value proposition: paste JD → thực hiện phỏng vấn AI → nhận surgical feedback.

| UC | Tên | MoSCoW | Primary Modules | Ghi chú |
| -- | --- | ------- | --------------- | ------- |
| UC-02 | Quản lý hồ sơ luyện tập | SHOULD | AuthModule | Hybrid: CV upload/parsing OUT (v1.1) |
| UC-03 | Cấu hình phiên phỏng vấn | MUST | SessionModule | JD + session type + context pack |
| UC-04 | Thực hiện phiên phỏng vấn AI | MUST | TurnModule, AIModule | Voice + text, follow-up, không có reverse Q (UC-12 defer) |
| UC-05 | AI sinh Surgical Feedback | MUST | AIModule, ReportModule | BullMQ async, 4-step pipeline |
| UC-06 | Xem Surgical Feedback chi tiết | MUST | ReportModule | SSE stream, annotated transcript |

### Mô tả chi tiết

**UC-02 — Quản lý hồ sơ luyện tập**
- MVP IN: `display_name`, `target_role`, `experience_level` (`intern/fresher/junior`), `tech_stack`, `preferred_language` (`vi/en`).
- MVP OUT: CV upload, CV parsing, `placement_level` — các columns `cv_file_url`, `cv_parsed_text`, `cv_structured_json`, `placement_level` chưa có trong schema.
- Page: `/onboarding` — wizard 1 bước, điền trước khi tạo session đầu tiên.

**UC-03 — Cấu hình phiên phỏng vấn**
- Input: JD text (100–5.000 ký tự), session type (`hr`/`technical`/`mixed`), question count (3–7, default 5), context pack (`vn`/`western`).
- Session types `live_coding`/`system_design`/`mock_final` hiển thị badge "Sắp ra mắt", disabled.
- Sau submit: tạo `interview_sessions` row → enqueue `QuestionGenerationJob` → redirect `/sessions/[id]/interview`.
- Giới hạn: max 10 sessions mới/24h per user (NFR S-12).

**UC-04 — Thực hiện phiên phỏng vấn AI**
- Luồng per turn: AI đọc câu hỏi → candidate trả lời (voice hoặc text) → Whisper transcribe (≤5s p95, timeout 10s) → FollowUpJob (AI judge có/không) → câu tiếp hoặc closing.
- Voice: max 5 phút/câu (NFR P-17), file ≤25 MB (NFR P-16), upload Cloudflare R2, Whisper-1.
- Follow-up: 0 hoặc 1 per main question. Không có reverse questions (UC-12 deferred).
- Kết thúc: `interview_sessions.status = completed` → enqueue `ComprehensiveReportJob`.
- Content moderation: transcript flagged trước khi lưu (NFR AS-02).

**UC-05 — AI sinh Surgical Feedback**
- Trigger: `ComprehensiveReportJob` sau khi session completed.
- 4 bước: aggregate turns → per-answer FeedbackJob (`ai_feedbacks` + `annotated_segments`) → scoring per dimension → AI action plan.
- Timeout: FeedbackJob 15s/retry 1, ComprehensiveReportJob 30s/retry 1.
- Fallback: FeedbackJob timeout → text-only feedback, không có annotated segments.
- AI output validated bởi `ZodValidatorService` trước INSERT.

**UC-06 — Xem Surgical Feedback chi tiết**
- Page: `/sessions/[id]/report`
- Executive Summary (điểm tổng, action plan) + Annotated Transcript (highlight RED/YELLOW/GREEN kèm gợi ý).
- SSE stream: `GET /api/v1/sessions/:id/events` → nhận `report.ready` event. Skeleton loading khi job chưa xong.

> **Lưu ý kiến trúc — User Identity:** UC-01 (Auth) defer sang v1.1. MVP cần cơ chế định danh user tối giản (ví dụ hardcoded test user hoặc simplified token) để UC-03→06 hoạt động. Cần xác định approach này trước khi implement UC-03.

---

## 2. MVP Database (11 tables)

### Tables IN (11)

| Layer | Table | Ghi chú MVP |
| ----- | ----- | ----------- |
| 0 — Lookup | `context_packs` | 2 rows: `vn`, `western` |
| 0 — Lookup | `question_bank` | Seed questions cho fallback |
| 1 — Auth | `users` | Role + status. Supabase auth extension |
| 1 — Auth | `user_profiles` | Profile cơ bản, KHÔNG có `cv_*` columns |
| 2 — Session | `interview_sessions` | Config + report JSON columns |
| 2 — Session | `session_questions` | Questions per session (LLM-generated hoặc seed) |
| 3 — Answer | `user_answers` | Voice transcript + audio URL, hoặc text |
| 3 — Answer | `follow_up_questions` | FollowUpProcessor output |
| 3 — Feedback | `ai_feedbacks` | MVP: `user_answer_id NOT NULL`, không có `rewrite_answer_id` |
| 3 — Feedback | `annotated_segments` | Highlight segments (good/warning/critical) |

Ghi chú `ai_feedbacks`: MVP schema khác v1.1 schema trong DB design file — `user_answer_id NOT NULL`, không có `rewrite_answer_id`, không có `chk_ai_feedbacks_source` CHECK constraint. Xem [DD-01](DetailedDesign/database-design/08_design_decisions.md).

### Tables và Changes OUT (v1.1)

- `ai_quality_log`: defer; recreate later if AI call observability/token analytics becomes required.

| Item | Loại | Liên quan |
| ---- | ---- | --------- |
| `reverse_questions` | Table mới | UC-12 defer |
| `rewrite_answers` | Table mới | UC-07 defer |
| `progress_snapshots` | Table mới | UC-13 defer |
| `placement_test_answers` | Table mới | UC-11 defer |
| `user_profiles`: ADD `placement_level`, `cv_file_url`, `cv_parsed_text`, `cv_structured_json` | ALTER | UC-11/UC-02 CV |
| `ai_feedbacks`: ADD `rewrite_answer_id`, ALTER `user_answer_id` DROP NOT NULL, ADD `chk_ai_feedbacks_source` | ALTER | UC-07 |

---

## 3. MVP Frontend Routes (5)

| Route | Component | UC liên quan | Status |
| ----- | --------- | ------------ | ------ |
| `/` | `LandingPage` | — | MVP |
| `/onboarding` | `OnboardingPage` | UC-02 | MVP |
| `/sessions/new` | `SessionSetupWizard` | UC-03 | MVP |
| `/sessions/[id]/interview` | `InterviewPage` | UC-04 | MVP (không có reverse Q) |
| `/sessions/[id]/report` | `ReportPage` | UC-05, UC-06 | MVP |

### Routes OUT (v1.1)

| Route | UC | Lý do |
| ----- | -- | ----- |
| `/auth/callback` | UC-01 | Auth defer |
| `/dashboard` | UC-08 | Session history defer |
| `/sessions/[id]/rewrite/[questionId]` | UC-07 | Rewrite defer |
| `/progress` | UC-13 | Progress dashboard defer |
| `/admin/users` | UC-09 | Admin defer |
| `/admin/questions` | UC-10 | Admin defer |

---

## 4. MVP Backend Modules

| Module | Status | Ghi chú |
| ------ | ------ | ------- |
| AuthModule | MVP (minimal) | UC-01 defer → không có Google OAuth. Cần approach định danh user tối giản |
| SessionModule | MVP | SessionController, SessionService, QuestionComposerService, AntiRepeatService |
| TurnModule | MVP | TurnController, TurnService, WhisperService, FollowUpCoordinatorService |
| AIModule | MVP | OpenAIGateway, PromptBuilderService, 4 AI Services, FeedbackProcessor, QuestionGenerationProcessor, FollowUpProcessor. `RewriteEvalProcessor` là v1.1 |
| ReportModule | MVP | ReportController, ReportService, ComprehensiveReportBuilder. `ProgressSnapshotService` không INSERT `progress_snapshots` trong MVP (bảng chưa tạo) |
| AdminModule | v1.1 | UC-09, UC-10 defer |

---



## 6. Deferred Backlog v1.1

### Use Cases

| UC | Tên | Lý do defer |
| -- | --- | ----------- |
| UC-01 | Đăng ký / Đăng nhập | Không cần full auth cho prototype; MVP dùng cơ chế định danh tối giản |
| UC-07 | Rewrite & Compare | Phụ thuộc UC-04/05 hoàn thiện; `rewrite_answers` làm phức tạp `ai_feedbacks` schema |
| UC-08 | Xem lịch sử phiên | Không thuộc core value proposition; thêm sau khi core loop hoạt động |
| UC-09 | Admin User Management | Ngoài scope graduation project; quản lý qua DB trực tiếp |
| UC-10 | Admin Question Bank | Seed questions quản lý qua migration |
| UC-11 | Placement Test | Tăng onboarding friction; user tự chọn level đủ cho prototype |
| UC-12 | Phỏng vấn ngược | Feature phụ, không ảnh hưởng core loop JD → answer → feedback |
| UC-13 | Progress Dashboard | Cần data từ nhiều sessions; `progress_snapshots` chưa tạo |

### DB / Schema Changes

| Item | Trigger |
| ---- | ------- |
| `reverse_questions` table | Implement UC-12 |
| `rewrite_answers` table + ALTER `ai_feedbacks` | Implement UC-07 |
| `progress_snapshots` table | Implement UC-13 |
| `placement_test_answers` table | Implement UC-11 |
| ADD `cv_file_url`, `cv_parsed_text`, `cv_structured_json`, `placement_level` vào `user_profiles` | Implement UC-02 CV + UC-11 |

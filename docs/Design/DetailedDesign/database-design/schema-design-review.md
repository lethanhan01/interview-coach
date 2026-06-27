# Schema Design Review & Evolution Backlog

> Ngày review: 2026-06-27. Đối chiếu `server/prisma/schema.prisma` (12 tables) với nhu cầu một app AI Mock Interview thực tế.
> Mục đích: ghi nhận hạn chế thiết kế hiện tại + phân loại theo phase. Không phải tất cả đều là MVP-blocking.
> Tasks triển khai: xem [plan question-bank §Schema Evolution Tasks](../../../superpowers/plans/2026-06-27-question-bank-implementation.md).

## Verdict Summary

| ID | Vấn đề | Severity | Phase | Task |
|----|--------|----------|-------|------|
| SR-03 | `user_profiles` phình to + chứa PII nhạy cảm không dùng | High | MVP now | T10 |
| SR-05 | Thiếu CHECK/enum ở DB level + drift `hr` vs `hr_behavioral` | Medium-High | MVP now | T11 |
| SR-02 | Thiếu bảng `resumes` riêng — resume data nhét JSONB | Medium | v1.1 | T12 done (schema split + migrate + RLS); CV upload defer T12b |
| SR-07 | Report JSON quá tải trong `interview_sessions` | Medium | v1.1 | T13 |
| SR-01 | Thiếu bảng `prompt_templates` | Low (MVP) | v2 | T14 |
| SR-04 | Thiếu master data `job_roles` / `skills` / junctions | Low (MVP) | v2 | T15 |
| SR-06 | `ai_feedbacks` one-to-one — không version được feedback | Low (MVP) | v2 | T16 |
| SR-08 | Seed data phải là production-quality, không placeholder | N/A | đã cover | T4 |

Nguyên tắc phân loại: **MVP now** = rủi ro/bug thật, chi phí thấp. **v1.1** = cần khi có tính năng CV upload + dashboard tiến bộ. **v2** = chỉ đáng làm khi đã có người dùng thật, cần analytics/A-B/recommendation. Xây bảng trước khi có tính năng = YAGNI.

---

## SR-03 — user_profiles phình to + PII nhạy cảm (MVP now)

**Current state:** `user_profiles` có 25 columns. Các field `date_of_birth`, `gender`, `hometown`, `nationality`, `personality` được document trong `api-design/08_profile.md` (dòng 45-49, 134-138) nhưng **không có trong bảng database-design** — đặc tả DB gốc chỉ ~13 cột (snapshot đánh dấu D5: 25 vs 13). Tức API contract có nhưng table spec không, và bản thân chúng là scope creep so với giá trị coaching.

**Problem:**
- Thu thập PII (`date_of_birth`, `phone`, `gender`, `nationality`, `hometown`) mà logic phỏng vấn không dùng đến = trách nhiệm pháp lý thuần (Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân) không kèm lợi ích sản phẩm.
- Form profile dài không cần thiết → tăng friction onboarding.
- Tăng phạm vi cần bảo vệ khi có breach.

**Phân biệt 3 nhóm field thêm ngoài design:**
- PII thuần, không dùng cho phỏng vấn: `date_of_birth`, `phone`, `gender`, `hometown`, `nationality` → **ứng viên loại bỏ**.
- Resume-structured: `education`, `work_experience`, `projects`, `technical_skills`, `certifications`, `awards` → thuộc phạm vi SR-02 (migrate sang bảng `resumes` ở v1.1), giữ tạm.
- `personality` → cần xác minh có feed vào prompt generation không trước khi quyết định.

**Recommendation:** Bỏ nhóm PII thuần khỏi `user_profiles` cho MVP. **Không** tách 3 bảng (`user_profiles`/`candidate_profiles`/`resume_profiles`) — over-normalize cho MVP; chỉ cần xóa field thừa.

**Blast radius:** không chỉ schema. Đụng `UpdateProfileDto`, `user.service.ts`, client profile form, `lib/types.ts`. Phải audit usage trước khi xóa.

---

## SR-05 — Thiếu CHECK/enum DB level + drift session_type (MVP now)

**Current state:** Không model nào có CHECK constraint trong Prisma schema. Các enum-like field (`session_type`, `difficulty`, `status`, `language`, `answer_mode`, `transcription_status`, `highlight_level`, `role`, user `status`) chỉ validate ở application layer. Tồn tại drift: design docs ghi `hr_behavioral | technical | mixed`, schema + seed + code dùng `hr | technical | mixed` (D1).

**Problem:**
- Dữ liệu sai có thể lọt qua seed/admin tool/migration/raw SQL — không qua ValidationPipe.
- Drift `hr_behavioral` vs `hr` là bug nhất quán thật: doc và code lệch nhau.

**Recommendation (2 phần, tách bạch):**
1. **Drift (rẻ, làm ngay):** code + seed đã chuẩn hóa `hr` (T1 xác nhận). Sửa design docs về `hr` cho khớp — không đổi code.
2. **CHECK constraints (cân nhắc):** Prisma **không** express CHECK natively, và dự án đang dùng `prisma db push` (D2) — không track raw SQL. Thêm CHECK = raw SQL nằm ngoài Prisma → tạo nguồn drift mới. Nếu làm, chỉ làm cho field rủi ro cao nhất (`session_type`, `users.status`, `users.role`) và phải ghi ADR nói rõ raw SQL ngoài Prisma + cập nhật quy trình apply.

---

## SR-02 — Thiếu bảng resumes riêng (v1.1)

**Status (2026-06-27, T12 scope B — DONE):** Đã apply model `Resume` đúng snippet bên dưới, đã bỏ 6 field CV khỏi `user_profiles`, RLS `resumes` đã thêm (read/insert/update own). API `/profile` reroute storage nhưng giữ contract phẳng. Migration đã chạy: `db push --accept-data-loss` drop 6 cột + tạo bảng `resumes`, reseed tạo demo resume (DB chỉ seed/demo nên skip backfill §8). CÒN LẠI (defer T12b): CV upload PDF/DOCX → Supabase Storage, parser (`parsed_text`/`parser_version`), link `resume_id` vào question generation.

**Current state:** `education`, `work_experience`, `projects`, `technical_skills`, `certifications`, `awards` nằm dạng JSONB trong `user_profiles`. Design docs vốn đã defer CV upload sang v1.1 (`cv_file_url`, `cv_parsed_text`, `cv_structured_json` — xuất hiện trong `api-design/08_profile.md`, `MVP_Scope.md`, `SAD_InterviewAI_v1.0.md`), nhưng dự định nhét vào `user_profiles`, không phải bảng riêng.

**Problem:** với JSONB-on-profile thì khó: lưu nhiều CV/user, version CV, biết câu hỏi generate từ CV nào, debug lỗi parse, hỗ trợ upload PDF/DOCX.

**Recommendation:** Khi làm CV upload (v1.1), tạo bảng `resumes` riêng thay vì cột JSONB:

```prisma
// PROPOSAL — v1.1, chưa apply
model Resume {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  fileUrl          String?  @map("file_url")          // Supabase Storage
  originalFilename String?  @map("original_filename")
  parsedText       String?  @map("parsed_text")
  parsedJson       Json?    @map("parsed_json")        // education/work/projects/skills
  language         String   @default("vi")
  parserVersion    String?  @map("parser_version")     // debug parse lỗi
  active           Boolean  @default(true)             // CV đang dùng
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, active])
  @@map("resumes")
}
```

Migrate JSONB resume fields từ `user_profiles` sang `resumes.parsed_json` khi xây.

---

## SR-07 — Report JSON quá tải trong interview_sessions (v1.1)

**Current state:** 6 JSON columns report trong `interview_sessions`: `plan_json`, `self_eval_json`, `executive_summary_json`, `comm_analysis_json`, `competency_heatmap_json`, `action_plan_json` (denormalized từ processors).

**Problem (lâu dài):** khó version report, khó regenerate từng phần, khó query thống kê theo competency, khó so sánh tiến bộ nhiều session, đổi JSON structure khó migrate.

**Tradeoff:** report ghi một lần → JSON-on-session nhanh và đủ cho MVP. Tách bảng giờ = chi phí JOIN + migration chưa ai dùng.

**Recommendation:** Khi cần regenerate từng phần hoặc dashboard tiến bộ (v1.1+), tách:

```prisma
// PROPOSAL — v1.1+, chưa apply
model SessionReport {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId       String   @map("session_id") @db.Uuid
  reportType      String   @map("report_type")     // executive_summary | comm_analysis | ...
  version         Int      @default(1)
  contentJson     Json     @map("content_json")
  generatedByModel String? @map("generated_by_model")
  promptVersion   String?  @map("prompt_version")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  session         InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@unique([sessionId, reportType, version])
  @@map("session_reports")
}
```

---

## SR-01 — Thiếu bảng prompt_templates (v2)

**Current state:** `ai_feedbacks.prompt_version` và `ai_quality_log.prompt_version` lưu version string; không có bảng quản lý prompt template.

**Assessment:** Cho MVP một dev, prompt-in-code + git là version control đủ và dễ debug hơn. Bảng DB chỉ đáng khi cần sửa prompt không qua deploy hoặc cho non-dev edit. `prompt_version` string đang là join key đúng để gắn về sau.

**Recommendation (v2):** Khi cần hot-swap/A-B prompt không deploy:

```prisma
// PROPOSAL — v2, chưa apply
model PromptTemplate {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  jobType     String   @map("job_type")        // question-gen | feedback | ...
  version     String                            // khớp prompt_version đang lưu
  content     String                            // template text
  active      Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  @@unique([jobType, version])
  @@map("prompt_templates")
}
```

---

## SR-04 — Thiếu master data job_roles / skills / junctions (v2)

**Current state:** `question_bank` dùng `applicable_roles`, `applicable_levels`, `tags` dạng `TEXT[]`.

**Assessment:** Array linh hoạt, đủ cho 120 câu. Lo typo (`Backend`/`backend`/`back-end`) là thật nhưng giải bằng TS const/enum trong seed code, **không cần 4 bảng + junction**. Recommendation/JD→skill→question mapping là tính năng v2 — xây bảng trước khi có tính năng là YAGNI.

**Recommendation (v2):** Khi xây skill-based recommendation, normalize:

```prisma
// PROPOSAL — v2, chưa apply
// job_roles(id, name, category)
// skills(id, name, type)
// question_skills(question_id, skill_id)   — junction
// role_skills(role_id, skill_id)           — junction
```

Mitigation MVP: thay magic string bằng const enum trong `server/prisma/seed/`.

---

## SR-06 — ai_feedbacks one-to-one, không version feedback (v2)

**Current state:** `ai_feedbacks` one-to-one với `user_answers` (UNIQUE `user_answer_id`). Có `is_fallback` flag.

**Assessment:** MVP không regenerate feedback; `is_fallback` đã cover ca fallback. One-to-one đơn giản, đủ dùng.

**Recommendation (v2):** Khi cần regenerate / so sánh model A-B / chạy lại prompt:

```prisma
// PROPOSAL — v2, chưa apply
model AiFeedbackRun {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userAnswerId  String   @map("user_answer_id") @db.Uuid
  model         String
  promptVersion String   @map("prompt_version")
  outputJson    Json     @map("output_json")
  overallScore  Int      @map("overall_score")
  isSelected    Boolean  @default(false) @map("is_selected")  // bản được chọn hiển thị
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  @@index([userAnswerId, isSelected])
  @@map("ai_feedback_runs")
}
```

---

## SR-08 — Seed data phải production-quality (đã cover bởi T4)

**Làm rõ cách diễn đạt:** "không được tạo seed data" sai về cơ chế — seed **là** cách đúng nạp reference data. Điều cần: *nội dung* phải production-quality, không placeholder.

- `context_packs` (rubric, scoring_weights): reference data bắt buộc curate tay.
- `question_bank`: là **fallback questions** dùng khi AI fail — phải là câu hỏi dùng được thật, không Lorem ipsum.

Task 4 của plan chính là yêu cầu này: seed 120 câu thật, đa ngôn ngữ. Đây là yêu cầu chất lượng nội dung cho T4, không phải lỗi thiết kế.

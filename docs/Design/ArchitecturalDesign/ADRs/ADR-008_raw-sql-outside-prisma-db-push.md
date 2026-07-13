# ADR-008: Raw SQL ngoài Prisma `db push` — quy trình apply thủ công

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-008 |
| **Ngày** | 27/06/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

Dự án sync schema bằng `prisma db push` thay vì `prisma migrate dev` (xem progress.md D2: `migrate dev` fail với P3006 do shadow DB không có baseline migration). `db push` chỉ áp những gì biểu diễn được trong `schema.prisma`.

Một số object DB không biểu diễn được bằng Prisma schema và bị `db push` bỏ qua hoàn toàn:

- RLS policies + `ENABLE ROW LEVEL SECURITY`
- Auth sync trigger (`auth.users` → `public.users`)
- Partial/filtered indexes không express an toàn bằng Prisma trong mọi trường hợp (`WHERE deleted_at IS NULL`, `WHERE active = true`)
- Composite FK/constraint bổ sung để đảm bảo `user_answers.question_id` thuộc đúng `session_id`
- Trigger same-user cho `interview_sessions.saved_job_description_id`
- Trigger bảo toàn rubric version-derived invariant: `rubric_criteria.code` không trùng trong cùng version qua `rubric_categories.rubric_version_id`, `question_bank_criteria` chỉ trỏ tới active rubric đúng context, và `session_question_criteria` chỉ trỏ tới criterion thuộc rubric version đã khóa của session.
- **CHECK constraints** (role/status/type/range/score/audio/report/offset)

Các object này đã được gom sẵn trong `server/prisma/migrations/migration.sql` và apply thủ công sau `db push`. Khi thêm CHECK constraint (SR-05), gap trở nên rõ ràng: `db push` không tạo, không giữ, và sẽ không cảnh báo khi constraint biến mất sau một lần push trên môi trường mới.

Vấn đề cốt lõi: nếu raw SQL không được apply sau mỗi `db push`, DB có thể drift (RLS tắt, CHECK mất, trigger không chạy, partial unique index thiếu) mà schema Prisma vẫn "hợp lệ". Vì vậy `db:sync:full` trở thành đường chuẩn thay cho chạy rời từng bước.

Các lựa chọn:

- **Option A**: Chuyển sang `prisma migrate dev` với baseline migration đầy đủ → raw SQL nằm trong migration files, apply tự động. Chi phí: phải baseline lại toàn bộ schema hiện có, giải quyết shadow DB issue (D2).
- **Option B**: Giữ `db push`, gom toàn bộ raw SQL idempotent vào một file (`migration.sql`), apply thủ công sau mỗi push, document quy trình trong ADR.

## Decision

**Chọn Option B** cho giai đoạn development hiện tại.

Quy trình apply (bắt buộc theo thứ tự):

```bash
cd server
npm run db:validate                     # validate schema.prisma
npm run db:verify:pre                   # anomaly gate trước khi thêm constraint/index
npx prisma generate                     # rebuild client
npm run db:prepare-user-answer-unique   # consolidate duplicate user_answers nếu có
npm run db:prepare-db-push-raw-sql      # tạm gỡ raw constraint Prisma db push không quản lý
npx prisma db push                      # sync columns/tables/Prisma-expressible indexes
npm run db:apply-sql                    # apply migration.sql (RLS/policies/trigger/CHECK/raw indexes)
npm run db:verify                       # catalog + anomaly verification sau apply
# tương đương thủ công: psql "$DATABASE_URL" -f prisma/migrations/migration.sql (service role / superuser)
```

Script gộp:

```bash
npm run db:sync:full
```

Ràng buộc với `migration.sql`:

- Mọi statement phải **idempotent** — re-run an toàn. Toàn bộ file đã hardened: trigger dùng `DROP TRIGGER IF EXISTS` + `CREATE`; RLS policy dùng `DROP POLICY IF EXISTS` + `CREATE`; index dùng `CREATE INDEX IF NOT EXISTS`; CHECK constraint dùng `DROP CONSTRAINT IF EXISTS` + `ADD`; seed dùng `ON CONFLICT`. Chạy `npm run db:apply-sql` lại sau mỗi `db push` không gây lỗi.
- Vì Prisma `db push` có thể cố drop raw composite constraint hoặc trigger không có trong `schema.prisma`, `db:sync:full` chạy `db:prepare-db-push-raw-sql` trước `db push` để tạm gỡ `user_answers_question_session_match_fkey`, `session_questions_id_session_id_key` và các trigger/function raw-only; `db:apply-sql` thêm lại ngay sau đó.
- `db:verify:pre` phải pass trước khi apply raw SQL. Các anomaly chặn migration gồm `user_answers` lệch session/question, `interview_sessions.saved_job_description_id` khác user, duplicate active resume, và dữ liệu đang vi phạm CHECK/range.
- `question_usage` đã retired vì chỉ có write-path audit, chưa có read-path repeat avoidance. Nếu cần chống lặp thật sự, thêm lại bằng schema mới kèm selection logic và verification tương ứng.
- CHECK constraint chỉ áp cho cột có tập giá trị/range ổn định trong code hiện tại:
  - `users.role` ∈ `{candidate, admin}`
  - `interview_sessions.session_type` ∈ `{hr, technical, mixed}`
  - `interview_sessions.status` ∈ `{generating, active, paused, canceled, completing, completed, error}`
  - `user_answers.answer_mode` ∈ `{text, voice}`
  - `user_answers.transcription_status` NULL hoặc ∈ `{pending, done, failed}`
  - `session_reports.report_type` ∈ `{executive_summary, comm_analysis, competency_heatmap, action_plan, skipped_answers}`
  - score/range/audio metadata/annotated segment offsets trong khoảng hợp lệ.
- Không CHECK các tập giá trị chưa có source-of-truth ổn định, ví dụ `annotated_segments.highlight_level`.

## Consequences

**Positive:**

- Raw SQL tập trung một file, có thứ tự apply rõ ràng và có script `db:sync:full`.
- Idempotent → re-run sau mỗi `db push` không gây lỗi.
- CHECK/trigger/composite FK/partial unique index là defense-in-depth ở DB layer, bổ sung cho DTO/service validation.

**Negative:**

- **Apply thủ công = rủi ro drift** nếu bỏ qua `db:sync:full`: quên chạy `migration.sql` sau `db push` → RLS/CHECK/trigger/raw index biến mất. `db:verify` giảm rủi ro phát hiện drift nhưng không thay thế migration workflow đầy đủ.
- Không có audit trail SQL dạng incremental migration — `db push` không tạo migration file.
- Mở rộng tập giá trị CHECK (vd thêm role mới) phải sửa cả `migration.sql` lẫn application code, dễ lệch nếu chỉ sửa một nơi.

**Điều kiện revise:**

- Trước khi deploy production: chuyển sang Option A (proper migration workflow với baseline) để loại bỏ bước apply thủ công và có audit trail. Lúc đó CHECK constraint nằm trong migration files, ADR này được superseded.
- Nếu thêm giá trị status/report/answer mode mới, phải sửa application code, `migration.sql`, `verify-db-hardening.ts`, `test-db-hardening-constraints.ts`, và docs cùng lúc.

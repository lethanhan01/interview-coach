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
- Partial indexes (`WHERE deleted_at IS NULL`)
- **CHECK constraints** (discovered gap — task T11/SR-05)

Các object này đã được gom sẵn trong `server/prisma/migrations/migration.sql` và apply thủ công sau `db push`. Khi thêm CHECK constraint (SR-05), gap trở nên rõ ràng: `db push` không tạo, không giữ, và sẽ không cảnh báo khi constraint biến mất sau một lần push trên môi trường mới.

Vấn đề cốt lõi: không có cơ chế tự động đảm bảo raw SQL được apply sau mỗi `db push`. Quên một lần = drift (RLS tắt, CHECK mất, trigger không chạy) mà schema Prisma vẫn "hợp lệ".

Các lựa chọn:

- **Option A**: Chuyển sang `prisma migrate dev` với baseline migration đầy đủ → raw SQL nằm trong migration files, apply tự động. Chi phí: phải baseline lại toàn bộ schema hiện có, giải quyết shadow DB issue (D2).
- **Option B**: Giữ `db push`, gom toàn bộ raw SQL idempotent vào một file (`migration.sql`), apply thủ công sau mỗi push, document quy trình trong ADR.

## Decision

**Chọn Option B** cho giai đoạn development hiện tại.

Quy trình apply (bắt buộc theo thứ tự):

```bash
cd server
npm run db:prepare-user-answer-unique   # chỉ khi DB có duplicate user_answers cần consolidate
npx prisma db push                      # sync columns/tables/Prisma-expressible indexes
npx prisma generate                     # rebuild client
npm run db:apply-sql                    # apply migration.sql (prisma db execute, đọc datasource từ prisma.config.ts)
# tương đương thủ công: psql "$DATABASE_URL" -f prisma/migrations/migration.sql (service role / superuser)
```

Ràng buộc với `migration.sql`:

- Mọi statement phải **idempotent** — re-run an toàn. Toàn bộ file đã hardened: trigger dùng `DROP TRIGGER IF EXISTS` + `CREATE`; RLS policy dùng `DROP POLICY IF EXISTS` + `CREATE`; index dùng `CREATE INDEX IF NOT EXISTS`; CHECK constraint dùng `DROP CONSTRAINT IF EXISTS` + `ADD`; seed dùng `ON CONFLICT`. Chạy `npm run db:apply-sql` lại sau mỗi `db push` không gây lỗi.
- CHECK constraint chỉ áp cho cột có **tập giá trị ổn định, đã verify**:
  - `interview_sessions.session_type` ∈ `{hr, technical, mixed}` — khớp `CreateSessionDto` + seed.
  - `users.role` ∈ `{candidate, admin}` — candidate là default schema, admin tham chiếu trong RLS policies.
- **Không** áp CHECK cho cột tập giá trị biến động/đơn trị (`users.status` chỉ có `active`; `interview_sessions.status` 8 giá trị hay thay đổi khi thêm flow) — enforce ở application layer qua DTO + `ValidationPipe`.

## Consequences

**Positive:**

- Raw SQL tập trung một file, có thứ tự apply rõ ràng, document trong ADR.
- Idempotent → re-run sau mỗi `db push` không gây lỗi.
- CHECK constraint là defense-in-depth ở DB layer cho hai cột rủi ro thấp, bổ sung cho DTO validation.

**Negative:**

- **Apply thủ công = rủi ro drift**: quên chạy `migration.sql` sau `db push` → RLS/CHECK/trigger biến mất. Không có cơ chế tự động phát hiện. Đây là tradeoff chính được chấp nhận cho development.
- Không có audit trail SQL dạng incremental migration — `db push` không tạo migration file.
- Mở rộng tập giá trị CHECK (vd thêm role mới) phải sửa cả `migration.sql` lẫn application code, dễ lệch nếu chỉ sửa một nơi.

**Điều kiện revise:**

- Trước khi deploy production: chuyển sang Option A (proper migration workflow với baseline) để loại bỏ bước apply thủ công và có audit trail. Lúc đó CHECK constraint nằm trong migration files, ADR này được superseded.
- Nếu tập giá trị `users.status` / `interview_sessions.status` ổn định lại (ngừng thêm flow mới) → cân nhắc mở rộng scope CHECK.

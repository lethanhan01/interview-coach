# Phase 1 — Đưa Rubric Catalog về Assessment ownership

**Mục tiêu:** `PrismaModule` chỉ còn database capability; rubric catalog, versioning và snapshot do Assessment sở hữu. Runtime không còn âm thầm upsert business catalog lúc startup.

## Current state và ràng buộc

- `src/prisma/reference-data.service.ts` implements `OnApplicationBootstrap`, normalize legacy context pack và upsert RubricVersion/Category/Criterion.
- `context-pack.data.ts` và `rubric-versioning.ts` cũng ở Prisma dù là business data/logic.
- `SessionService`, AI pipeline và rubric controller đang phụ thuộc API `ensureActiveRubricVersion`/`ensureContextPack`.
- Không đổi seeded catalog, checksum, `rubricVersionId`, criterion link hay foreign-key behavior trong phase này.

## Nhiệm vụ

- [x] Tạo `src/assessment/rubric/` và move-by-import `context-pack.data.ts`, `rubric-versioning.ts`; không rename toàn bộ tree cùng PR.
- [x] Tạo `RubricCatalogService` với read API tương thích cho `ensureActiveRubricVersion` và `ensureContextPack`; migrate sole runtime caller nên không cần giữ facade cũ.
- [x] Tách runtime read active catalog khỏi provision/update default catalog.
- [x] Giữ provision trong `npm run seed`, idempotent và versioned; test HTTP provision catalog rõ ràng trước contract flow.
- [x] Chuyển legacy ID normalization thành `npm run db:migrate-legacy-context-packs` one-off có log; không chạy khi application start.
- [x] Migrate Session và AI context-pack imports sang Assessment ownership; rubric controller tiếp tục dùng compatibility API `ContextPackService`.
- [x] Bỏ `ReferenceDataService` export khỏi `PrismaModule`; module này chỉ export `PrismaService`.
- [x] Test read path không transaction/write, provision fresh catalog và existing session HTTP flow/snapshot path đều pass.

## Vận hành catalog

- Môi trường mới: chạy `npm run seed` sau khi schema đã được apply để provision catalog mặc định `v1`.
- Dữ liệu có legacy `vn`/`western`: chạy một lần `npm run db:migrate-legacy-context-packs`; lệnh này ghi log kết quả và không chạy lúc API khởi động.

## PR slicing

1. Data/versioning move + compatibility export.
2. Assessment read service và caller migration.
3. Explicit provisioning + startup side-effect removal.
4. Delete old Prisma business exports/imports.

## Exit criteria và rollback

- Startup không write rubric business data; provision có command/seed rõ và test được.
- Create session, rubric endpoint, criteria persistence, score/snapshot regression đều pass.
- Rollback bằng compatibility facade và restore startup provision tạm thời; không chạy migration phá hủy data trong phase này.

# Phase 1 — Đưa Rubric Catalog về Assessment ownership

**Mục tiêu:** `PrismaModule` chỉ còn database capability; rubric catalog, versioning và snapshot do Assessment sở hữu. Runtime không còn âm thầm upsert business catalog lúc startup.

## Current state và ràng buộc

- `src/prisma/reference-data.service.ts` implements `OnApplicationBootstrap`, normalize legacy context pack và upsert RubricVersion/Category/Criterion.
- `context-pack.data.ts` và `rubric-versioning.ts` cũng ở Prisma dù là business data/logic.
- `SessionService`, AI pipeline và rubric controller đang phụ thuộc API `ensureActiveRubricVersion`/`ensureContextPack`.
- Không đổi seeded catalog, checksum, `rubricVersionId`, criterion link hay foreign-key behavior trong phase này.

## Nhiệm vụ

- [ ] Tạo `src/assessment/rubric/` và move-by-import `context-pack.data.ts`, `rubric-versioning.ts` trước; không rename toàn bộ tree cùng PR.
- [ ] Tạo `RubricCatalogService` với read API tương thích cho `ensureActiveRubricVersion` và `ensureContextPack`; giữ facade cũ trong một PR nếu caller chưa migrate.
- [ ] Tách runtime read active catalog khỏi provision/update default catalog.
- [ ] Đưa provision vào seed hoặc command rõ ràng, idempotent, versioned; document command cho dev/CI/environment mới.
- [ ] Chuyển legacy ID normalization thành migration/command one-off có log; không chạy vô điều kiện khi application start.
- [ ] Migrate imports từ Session, rubric controller, question criteria và pipeline theo từng PR nhỏ.
- [ ] Bỏ `ReferenceDataService` export khỏi `PrismaModule` sau khi không còn consumer; `PrismaModule` chỉ export Prisma/database helper.
- [ ] Test restart app không làm mutate catalog, fresh environment provision thành công, existing session vẫn resolve đúng rubric snapshot.

## PR slicing

1. Data/versioning move + compatibility export.
2. Assessment read service và caller migration.
3. Explicit provisioning + startup side-effect removal.
4. Delete old Prisma business exports/imports.

## Exit criteria và rollback

- Startup không write rubric business data; provision có command/seed rõ và test được.
- Create session, rubric endpoint, criteria persistence, score/snapshot regression đều pass.
- Rollback bằng compatibility facade và restore startup provision tạm thời; không chạy migration phá hủy data trong phase này.

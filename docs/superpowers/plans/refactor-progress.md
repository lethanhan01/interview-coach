# Tiến độ refactor backend

**Cập nhật lần cuối:** 2026-08-10  
**Nguồn kế hoạch:** [index](./README.md) · [roadmap tổng](./2026-08-10-server-backend-refactor-roadmap.md)

## Trạng thái hiện tại

**Phase đang thực hiện:** Hoàn tất Phase 1 — Rubric Catalog.
**Blocker hiện tại:** Chưa có.
**Bước tiếp theo:** Chờ xác nhận để bắt đầu Phase 2 — AI boundary.

## Bảng Phase

| Phase | Trạng thái | Đã hoàn thành | Bước tiếp theo | Evidence/ghi chú |
| --- | --- | --- | --- | --- |
| 0 — Safety net | Hoàn tất | Baseline, contract inventory, queue/SSE/lifecycle characterization, integration taxonomy và HTTP contract harness. | Chờ xác nhận bắt đầu Phase 1. | Build pass; unit 43 suites/378 tests pass; integration 1 suite pass; HTTP E2E 1 suite pass trên PostgreSQL/Redis cô lập. Question-generation baseline không có `jobId`/dedup. |
| 1 — Rubric Catalog | Hoàn tất | Assessment sở hữu catalog read/provision code; startup không còn write/migrate catalog. | Chờ xác nhận bắt đầu Phase 2. | Build pass; unit 44 suites/379 tests pass; integration và HTTP E2E pass. |
| 2 — AI boundary | Chưa bắt đầu | — | Chờ Phase 0 exit criteria. | — |
| 3 — Question | Chưa bắt đầu | — | Chờ Phase 1 và 2. | — |
| 4 — Voice | Chưa bắt đầu | — | Chờ Phase 2. | — |
| 5 — Assessment | Chưa bắt đầu | — | Chờ Phase 1 và 2. | — |
| 6 — Reporting | Chưa bắt đầu | — | Chờ Phase 5. | — |
| 7 — Session | Chưa bắt đầu | — | Chờ Phase 1 và 6. | — |
| 8 — Turn | Chưa bắt đầu | — | Chờ Phase 4 và 5. | — |
| 9 — Infrastructure | Chưa bắt đầu | — | Chờ semantic phases. | — |
| 10 — Identity | Chưa bắt đầu | — | Chờ interview pipeline ổn định. | — |

## Quyết định quan trọng

| Ngày | Quyết định | Lý do | Ảnh hưởng |
| --- | --- | --- | --- |
| 2026-08-10 | Giữ modular monolith; không rewrite/microservice/CQRS toàn hệ thống. | Hệ thống đã có Nest module, BullMQ, Redis/SSE và fallback AI hoạt động; pain point là ownership/dependency. | Mọi phase là strangler refactor nhỏ, reversible. |
| 2026-08-10 | Freeze REST, queue, SSE, DB write, AI behavior và audio security contract trong refactor. | Dễ phân biệt architectural regression với product change. | Thay đổi contract phải là plan/ADR riêng. |
| 2026-08-10 | Chỉ dùng port/adapter ở external boundary thật. | Tránh một port/repository/factory cho từng service khi mới có một implementation. | OpenAI, STT, storage, realtime là seam ưu tiên. |
| 2026-08-10 | Reporting vẫn là context riêng trong các phase đầu. | Report tiêu thụ Assessment nhưng có API/read model/queue lifecycle riêng. | Không ép move vào Assessment. |
| 2026-08-10 | Giữ audio validation tại upload và STT download. | Download URL là SSRF boundary cho queued/retry path. | Không “simplify” bằng cách bỏ validation thứ hai. |
| 2026-08-10 | Move behavior trước, move folder sau. | Folder-only PR lớn gây noise và che semantic regression. | Mỗi phase có compatibility facade rồi cleanup. |

## Nhật ký thực hiện

### 2026-08-10 — Phase 1 / Rubric Catalog exit criteria đạt

- Phase: 1 — Rubric Catalog
- Trạng thái: Hoàn tất
- Hoàn thành: di chuyển context-pack data/versioning và catalog provision về `src/assessment/rubric/`; `RubricCatalogService` chỉ đọc/validate active version; Session migrate sang Assessment; xoá `ReferenceDataService` khỏi `PrismaModule` và bỏ toàn bộ startup provision/legacy-ID write.
- Contract kiểm tra: giữ nguyên seeded catalog `v1`, checksum, `rubricVersionId`, criterion link, foreign-key behavior và REST rubric/session response; HTTP E2E provision catalog rõ ràng thay vì dựa vào side effect startup.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (44 suites, 379 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite); `git diff --check` — pass.
- Quyết định: `npm run seed` là provisioning path idempotent cho environment mới; `npm run db:migrate-legacy-context-packs` là command one-off có log cho `vn`/`western`, không chạy khi app boot.
- Rủi ro/rollback: environment mới phải chạy seed sau schema apply; rollback có thể tạm restore startup provision, không cần schema/data migration phá hủy.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 2 — AI boundary.

### 2026-08-10 — Phase 0 / baseline repository

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: ghi baseline commit `7817d629a337e836ebf14e1e5491f4de2e232dc3` và xác nhận worktree sạch; từ commit tạo plan `c73bc61` đến baseline không có thay đổi trong `server/src`, `server/test` hoặc `server/package.json`.
- Contract kiểm tra: chưa thay đổi runtime contract.
- Verification: `git status --short`, `git diff --name-only c73bc61..7817d62 -- server/src server/test server/package.json` — pass (không có thay đổi backend/refactor chưa ghi nhận).
- Quyết định: baseline là HEAD hiện tại, không dùng commit tạo plan vì HEAD là trạng thái repository thực tế sẽ được kiểm thử.
- Rủi ro/rollback: baseline chưa phải test xanh; không được coi đây là approval để bắt đầu refactor runtime.
- Bước tiếp theo: lập contract inventory versioned cho Session, Turn, Report, Rubric và Auth.

### 2026-08-10 — Phase 0 / contract inventory

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: thêm [contract inventory](./00-phase-0-contract-inventory.md) versioned cho REST Session/Turn/Report/Rubric/Auth, bốn queue, SSE channel/event và lifecycle/security invariants.
- Contract kiểm tra: inventory đối chiếu trực tiếp với controller, DTO, producer và worker hiện tại; không thay đổi runtime contract.
- Verification: rà soát source controller/DTO/queue/SSE; `git diff --check` — pass.
- Quyết định: giữ inventory ở `docs/superpowers/plans/` để version cùng roadmap và dùng làm source cho các test characterization tiếp theo.
- Rủi ro/rollback: response projection chi tiết của một số read model (questions, feedback progress, audio upload) cần được HTTP contract test khóa ở task sau; tài liệu không thay thế assertion tự động.
- Bước tiếp theo: chuẩn hóa typed fixture cho bốn queue và bắt đầu characterization test SSE/lifecycle.

### 2026-08-10 — Phase 0 / test taxonomy và HTTP harness

- Phase: 0 — Safety net
- Trạng thái: Đang thực hiện
- Hoàn thành: sửa stale mock `savedJobDescription.userId` trong flow test; đổi nó thành `session-completion-flow.integration-spec.ts` và thêm `npm run test:integration`; thêm HTTP E2E boot `AppModule` với PostgreSQL `interviewcoach_test` và Redis cục bộ, workers tắt, provider credential giả.
- Contract kiểm tra: Auth register/cookie, create Session, `GET /sessions/:id/status`; không gọi OpenAI/Supabase production.
- Verification: `npm run build` — pass (109.5s); `npm test -- --runInBand` — pass (43 suites, 378 tests, 136.36s); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 HTTP suite).
- Quyết định: CI Server job provision PostgreSQL 16 + Redis, apply schema vào DB test rồi chạy integration/HTTP contract suites; flow mock không còn bị gọi nhầm là E2E HTTP.
- Rủi ro/rollback: HTTP suite mới chỉ khóa Auth/session create/status; các endpoint Turn, audio, Report, Rubric và SSE authorization vẫn phải được thêm trước khi Phase 0 hoàn tất.
- Bước tiếp theo: xem entry hoàn tất Phase 0 bên dưới.

### 2026-08-10 — Phase 0 / exit criteria đạt

- Phase: 0 — Safety net
- Trạng thái: Hoàn tất
- Hoàn thành: mở rộng HTTP contract test qua Session read/questions/status, Turn text/voice queue, audio validation, Report pending, Rubric và SSE auth; kiểm tra queue/SSE/lifecycle/worker assertions; phân loại question-generation baseline là không có `jobId`/dedup theo quyết định đã xác nhận.
- Contract kiểm tra: REST, queue, SSE, session lifecycle, fallback/retry và audio input boundary; không đổi runtime behavior/schema/provider.
- Verification: `npm run build` — pass; `npm test -- --runInBand` — pass (43 suites, 378 tests); `npm run test:integration` — pass (1 suite); `npm run test:e2e` — pass (1 suite); `git diff --check` — pass.
- Quyết định: preserve absence of `jobId`/dedup for `question-generation`; chỉ thay đổi này qua contract migration riêng nếu cần trong tương lai.
- Rủi ro/rollback: PostgreSQL test là container tạm `localhost:5433`; CI dùng service container riêng. Phase 0 không có runtime migration nên rollback chỉ là revert test/docs/CI harness.
- Bước tiếp theo: chờ xác nhận để bắt đầu Phase 1 — Rubric Catalog.

### 2026-08-10 — Khởi tạo kế hoạch

- Hoàn thành: audit source và tạo roadmap tổng, index, tài liệu Phase 0–10, progress ledger.
- Chưa thay đổi: không có source/runtime behavior nào bị refactor.
- Test: `npm test -- --runInBand` được khởi chạy nhưng môi trường dừng ở 60 giây trước kết quả tổng kết; các log lỗi hiển thị là expected-path test logs, không đủ để kết luận pass/fail.
- Tiếp theo: thực hiện Phase 0 theo checklist, ghi commit SHA và artifact CI tại entry kế tiếp.

## Mẫu entry sau mỗi PR

```md
### YYYY-MM-DD — <PR/commit/title>

- Phase: <n> — <name>
- Trạng thái: Chưa bắt đầu | Đang thực hiện | Blocked | Hoàn tất
- Hoàn thành: <task/checklist và file thay đổi>
- Contract kiểm tra: <REST / queue / SSE / DB / security>
- Verification: `<commands>` — <pass/fail + link artifact>
- Quyết định: <decision và lý do, hoặc “không có”>
- Rủi ro/rollback: <nếu có>
- Bước tiếp theo: <một hành động cụ thể>
```

## Quy ước trạng thái

- **Chưa bắt đầu:** chưa có implementation task được bắt đầu.
- **Đang thực hiện:** có một PR/task active; cập nhật ít nhất sau mỗi ngày làm việc.
- **Blocked:** không thể tiếp tục vì dependency, decision hoặc test/environment; nêu owner và điều kiện mở khóa.
- **Hoàn tất:** tất cả checklist/exit criteria của file phase đạt, evidence test đã ghi.

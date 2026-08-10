# Tiến độ refactor backend

**Cập nhật lần cuối:** 2026-08-10  
**Nguồn kế hoạch:** [index](./README.md) · [roadmap tổng](./2026-08-10-server-backend-refactor-roadmap.md)

## Trạng thái hiện tại

**Phase đang thực hiện:** Chưa có — chuẩn bị Phase 0.  
**Blocker hiện tại:** Chưa có blocker kỹ thuật; cần baseline test xanh trước khi chạm kiến trúc.  
**Bước tiếp theo:** Bắt đầu Phase 0: ghi baseline SHA/worktree, tạo contract inventory và chạy đủ build/unit/test:e2e trên CI hoặc môi trường không bị timeout.

## Bảng Phase

| Phase | Trạng thái | Đã hoàn thành | Bước tiếp theo | Evidence/ghi chú |
| --- | --- | --- | --- | --- |
| 0 — Safety net | Chưa bắt đầu | Roadmap và scope test đã được xác định. | Baseline SHA, contract inventory, test harness. | Unit suite đã được thử 2026-08-10 nhưng timeout tại giới hạn 60 giây trước summary; không coi là pass. |
| 1 — Rubric Catalog | Chưa bắt đầu | — | Chờ Phase 0 exit criteria. | — |
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

# ADR-007: BullMQ over Bull 4.x

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-007 |
| **Ngày** | 10/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

HLD §5.2 xác định 5 Bull queues (`question-gen`, `follow-up`, `feedback`, `rewrite-eval`, `report`) với timeout/retry matrix riêng biệt. SAD v1.1 reference `Bull 4.x` và `@nestjs/bull` package.

Bull 4.x đang ở maintenance mode — maintainer (Taskforce.sh) đã chuyển development effort sang BullMQ, một rewrite hoàn toàn với:

- TypeScript-first API (types được ship cùng package, không cần `@types/bull` riêng)
- Flows API: cho phép define dependency chain giữa jobs (parent job chờ child jobs hoàn thành)
- Worker concurrency model cải tiến: mỗi `Worker` instance là 1 consumer group riêng, không share state với other workers
- Không require Redis Cluster (giống Bull 4.x — Redis Standalone đủ)

NestJS cung cấp `@nestjs/bullmq` package chính thức, tương đương `@nestjs/bull` về DI integration.

Các lựa chọn:

- **Option A**: Giữ Bull 4.x (`bull` + `@nestjs/bull`) — không có migration effort, nhưng dùng package maintenance-only; security patches có thể không được backport.
- **Option B**: Upgrade lên BullMQ (`bullmq` + `@nestjs/bullmq`) — migration effort nhỏ (decorator rename, config key rename), nhưng được active development và type safety tốt hơn.

## Decision

**Chọn Option B: BullMQ.**

Lý do:

1. **Maintenance mode risk**: Bull 4.x không nhận feature development. Security patches không được cam kết long-term. Prototype được build để grow — staying on maintenance-mode queue library là tech debt từ ngày đầu.

2. **TypeScript types**: BullMQ ship types natively. `@nestjs/bull` với Bull 4.x cần `@types/bull` riêng, types thường lag behind package. Job payload DTOs (5 job types trong §5.2) benefit từ strict typing.

3. **Flows API cho FollowUp → Feedback ordering**: HLD §5.2 define `FeedbackJob` enqueue sau khi follow-up resolved. BullMQ Flows cho phép model dependency này explicitly thay vì dùng manual conditional enqueue trong processor code.

4. **Migration cost thấp**: API surface giữa `@nestjs/bull` và `@nestjs/bullmq` đủ tương đồng để migrate toàn bộ 5 queues trong 1 session:
   - `BullModule.registerQueue()` → `BullMQModule.registerQueue()`
   - `@Process()` decorator → `@Processor()` decorator trên worker class
   - `Job<T>` type import từ `bullmq` thay vì `bull`
   - Queue names và job payload schemas (§5.2 table) giữ nguyên 100%

5. **`@nestjs/bull` và `@nestjs/bullmq` không coexist**: Phải migrate tất cả 5 queues cùng lúc — điều này thực ra là ràng buộc tích cực: không để partial migration tồn tại lâu trong codebase.

Điều kiện để revise quyết định này:

- BullMQ introduce breaking changes không compatible với `@nestjs/bullmq` version đang dùng → pin BullMQ version, evaluate upgrade path riêng
- NestJS drop support cho `@nestjs/bullmq` → evaluate alternative queue library (e.g., `pg-boss` nếu muốn Postgres-backed queue)

## Consequences

**Positive:**

- Job payload DTOs type-safe end-to-end — processor nhận `Job<QuestionGenerationJobData>` không cần manual cast
- Active maintenance: security patches, bug fixes được nhận liên tục
- Flows API sẵn có để model job dependencies nếu cần (không bắt buộc dùng ngay)
- `@nestjs/bullmq` documentation đầy đủ, community lớn hơn Bull 4.x về long-term

**Negative:**

- **All-or-nothing migration**: Không thể migrate từng queue một nếu `@nestjs/bull` đang chạy — phải migrate cả 5 queues trong 1 PR. Rủi ro nếu có queue đang có jobs in-flight khi deploy.
- **Redis data format**: BullMQ dùng Redis key format khác Bull 4.x. Khi switch, existing jobs trong Bull queues sẽ không được pick up bởi BullMQ workers. Với prototype (chưa có production data), đây không phải vấn đề — nhưng cần document cho bất kỳ future migration nào có live data.
- **Learning curve nhỏ**: Worker/Queue/Job API khác Bull về naming — developer quen Bull cần đọc BullMQ docs trước khi implement.

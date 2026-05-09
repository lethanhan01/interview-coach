# ADR-006: SSE Event Delivery via Redis Pub/Sub

| Thuộc tính | Giá trị |
| --- | --- |
| **ID** | ADR-006 |
| **Ngày** | 10/05/2026 |
| **Trạng thái** | Accepted |
| **Tác giả** | Lê Thành An |

## Status

Accepted

## Context

HLD §5.3 định nghĩa 5 SSE event types (`session.status`, `turn.follow_up`, `turn.feedback_ready`, `report.ready`, `rewrite.done`) được deliver qua endpoint `GET /api/v1/sessions/:id/events`. Draft ban đầu dùng in-memory `Subject<MessageEvent>` per `session_id` trong `SseService`.

Railway deployment chạy multi-instance (autoscale): khi traffic tăng, Railway spawn thêm NestJS replica. SSE connection là persistent HTTP connection gắn với 1 process cụ thể. Nếu Bull processor trên instance A hoàn thành job và emit event, nhưng client đang connect vào instance B, event sẽ bị mất — `Subject` trong instance A không visible với instance B.

Các lựa chọn:

- **Option A**: Sticky session routing — Railway route request từ cùng client về cùng instance. Railway không có built-in sticky session config; cần header-based routing tự cấu hình, không đảm bảo khi instance restart.
- **Option B**: Redis pub/sub — processor publish event vào Redis channel `sse:session:{session_id}`; mỗi NestJS instance subscribe channel đó và forward event tới SSE connection đang mở trên instance mình. Redis đã là dependency bắt buộc của BullMQ (xem ADR-007).
- **Option C**: Single instance — limit Railway deployment về 1 replica, dùng in-memory `Subject`. Đơn giản nhất nhưng không scale khi load tăng; prototype có thể outgrow nhanh.

## Decision

**Chọn Option B: Redis pub/sub qua ioredis.**

Lý do:

1. **Railway không đảm bảo sticky session**: Railway cung cấp private networking và load balancing tự động nhưng không expose sticky session config trong tier hiện tại. Phụ thuộc vào routing behavior undocumented là fragile.

2. **Redis đã là dependency**: BullMQ (ADR-007) yêu cầu Redis làm queue backend. `ioredis` client đã có trong dependency graph — không cần thêm infrastructure mới để enable pub/sub.

3. **Pattern chuẩn cho multi-instance SSE**: Redis pub/sub là standard approach cho fan-out events across NestJS instances, được document chính thức trong NestJS microservices docs.

4. **Horizontal scale path**: Khi user base tăng, Railway có thể tăng replica count mà không cần thay đổi architecture.

Pattern triển khai:

```
BullMQ Processor (bất kỳ instance) 
  → ioredis PUBLISH sse:session:{session_id} {event_json}
    → Redis
      → ioredis SUBSCRIBE trên tất cả instances
        → SseService.emit(session_id, event) trên instance có SSE connection
          → Client nhận event
```

`SseService` maintain một `Map<session_id, Subject<MessageEvent>>`. Khi Redis message đến, lookup subject theo `session_id` và `next()` nếu có subscriber.

Điều kiện để revise quyết định này:

- Railway bổ sung sticky session config native → có thể revert về in-memory `Subject` để giảm complexity
- Deployment confirm single-instance permanent → Option C đủ, bỏ Redis subscriber trong `SseService`

## Consequences

**Positive:**

- SSE hoạt động đúng trên multi-instance Railway deployment, không phụ thuộc routing behavior
- Không cần thêm infrastructure — Redis đã có cho BullMQ
- `SseService` stateless về routing logic: chỉ cần subscribe Redis channel, forward event

**Negative:**

- `SseService` acquire Redis dependency — không còn pure in-memory service, khó unit test hơn (cần mock ioredis)
- ~1–2ms latency overhead per SSE event cho Redis round-trip (publish → subscribe → forward). Không ảnh hưởng SLO vì SLO đo latency đến khi AI result ready, không phải event delivery
- Cần handle Redis subscriber lifecycle: mỗi SSE connection mở → subscribe; đóng → unsubscribe. Leak nếu không cleanup đúng

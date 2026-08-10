# Phase 0 — Baseline và safety net

**Mục tiêu:** biến REST, queue, SSE, lifecycle và behavior fallback hiện hữu thành regression contract trước khi di chuyển bất kỳ ownership nào.

**Không làm:** đổi logic sản phẩm, đổi schema, sửa prompt/scoring, đổi retry/backoff hoặc đổi provider.

## Điều kiện vào phase

- Đọc [roadmap tổng](./2026-08-10-server-backend-refactor-roadmap.md), đặc biệt “Contract bất biến”.
- Ghi commit SHA baseline và trạng thái worktree vào progress log.
- Chọn DB test cô lập và fake adapter cho Redis/OpenAI/Supabase; test không được gọi external provider thật.

## Nhiệm vụ

- [ ] Tạo inventory versioned cho endpoint, HTTP status, request/response DTO; bắt đầu từ Session, Turn, Report, Rubric và Auth.
- [ ] Chuẩn hóa typed fixture cho bốn job hiện hữu. Assert job name, payload, `jobId`, `attempts`, `backoff`, delay và dedup behavior.
- [ ] Characterize SSE trên channel `sse:session:${sessionId}`: `session.status`, `turn.feedback_ready`, `turn.transcription_ready`, `session.feedback_progress`, `report.ready` và payload từng event.
- [ ] Viết table-driven test cho tất cả Session status: `generating`, compatibility `ready`, `active`, `paused`, `completing`, `completed`, `error`, `canceled`; bao gồm auto-skip và rollback nếu enqueue report thất bại.
- [ ] Giữ `test/session-completion-flow.e2e-spec.ts` là fast integration flow và đổi mô tả/taxonomy nếu cần; nó mock Prisma/queue nên không được gọi là E2E HTTP thật.
- [ ] Bổ sung worker integration test cho success, retry, fallback và duplicate delivery: question generation, feedback, transcription, comprehensive report.
- [ ] Tạo HTTP contract test boot Nest app với DB test: create/read/status/questions session; submit text; audio metadata/voice retry; report pending/ready; SSE auth.
- [ ] Chạy và lưu kết quả `npm run build`, `npm test -- --runInBand`, `npm run test:e2e` trong CI/PR; khắc phục test flake trước Phase 1.

## Source/test cần chạm

`src/session/session.service.ts`, `src/turn/turn.service.ts`, `src/report/report.service.ts`, `src/ai/processors/*`, `src/common/services/sse.service.ts`, `test/session-completion-flow.e2e-spec.ts`.

## Exit criteria

- Mỗi contract bất biến có ít nhất một assertion tự động.
- Test unit, integration, HTTP contract đều chạy độc lập không phụ thuộc OpenAI/Supabase production.
- Có evidence pass đầy đủ, không chỉ timeout. Lần audit 2026-08-10, unit suite bị timeout ở giới hạn 60 giây của môi trường trước summary nên chưa thể coi là baseline xanh.
- Đã ghi baseline và link test artifact vào progress log.

## Rollback

Phase này chỉ thêm/điều chỉnh test và tài liệu. Revert test harness nếu làm CI mất ổn định; không có migration hay runtime behavior để rollback.

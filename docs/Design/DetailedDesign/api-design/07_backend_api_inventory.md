# Backend API Inventory

Đối chiếu tại ngày 2026-06-28 với:

- `server/src/app.controller.ts`
- `server/src/auth/auth.controller.ts`
- `server/src/health/health.controller.ts`
- `server/src/session/session.controller.ts`
- `server/src/turn/turn.controller.ts`
- `server/src/report/report.controller.ts`
- `server/src/user/user.controller.ts`
- `server/src/saved-job-description/saved-job-description.controller.ts`
- Các DTO, service, exception filter và `server/prisma/schema.prisma`

## Kết quả rà soát

Backend expose **18 API**. Sau khi cập nhật, cả 18 API đều có:

1. Endpoint URL.
2. Purpose bằng tiếng Việt.
3. Request body và chú thích từng trường, hoặc ghi rõ không có body.
4. Response body và chú thích từng trường.
5. Errors theo HTTP status và `errorCode` thực tế.

## Ma trận đầy đủ

| # | Endpoint | URL | Purpose VI | Request | Response | Errors | Tài liệu |
|---|----------|-----|------------|---------|----------|--------|----------|
| 1 | `GET /api/v1` | Đủ | Đủ | Đủ | Đủ | Đủ | [01_overview.md](01_overview.md) |
| 2 | `POST /api/v1/auth/refresh` | Đủ | Đủ | Đủ | Đủ | Đủ | [02_auth.md](02_auth.md) |
| 3 | `POST /api/v1/auth/logout` | Đủ | Đủ | Đủ | Đủ | Đủ | [02_auth.md](02_auth.md) |
| 4 | `POST /api/v1/sessions` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 5 | `GET /api/v1/sessions` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 6 | `GET /api/v1/sessions/:id` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 7 | `GET /api/v1/sessions/:id/status` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 8 | `GET /api/v1/sessions/:id/questions` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 9 | `PATCH /api/v1/sessions/:id/status` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 10 | `GET /api/v1/sessions/:id/events` | Đủ | Đủ | Đủ | Đủ | Đủ | [03_session.md](03_session.md) |
| 11 | `POST /api/v1/sessions/:sessionId/turns` | Đủ | Đủ | Đủ | Đủ | Đủ | [04_answer.md](04_answer.md) |
| 12 | `GET /api/v1/sessions/:sessionId/report` | Đủ | Đủ | Đủ | Đủ | Đủ | [05_report.md](05_report.md) |
| 13 | `GET /api/v1/profile` | Đủ | Đủ | Đủ | Đủ | Đủ | [08_profile.md](08_profile.md) |
| 14 | `PATCH /api/v1/profile` | Đủ | Đủ | Đủ | Đủ | Đủ | [08_profile.md](08_profile.md) |
| 15 | `GET /api/v1/health` | Đủ | Đủ | Đủ | Đủ | Đủ | [01_overview.md](01_overview.md) |
| 16 | `POST /api/v1/sessions/:sessionId/turns/audio` | Đủ | Đủ | Đủ | Đủ | Đủ | [04_answer.md](04_answer.md) |
| 17 | `GET /api/v1/saved-job-descriptions` | Đủ | Đủ | Đủ | Đủ | Đủ | [09_saved_job_description.md](09_saved_job_description.md) |
| 18 | `POST /api/v1/saved-job-descriptions` | Đủ | Đủ | Đủ | Đủ | Đủ | [09_saved_job_description.md](09_saved_job_description.md) |

## Response contract thực tế

- Success response chưa đồng nhất và được mô tả riêng ở từng API.
- Error response chung:

```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Error message",
  "path": "/api/v1/...",
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

- DTO validation trả HTTP `400`, không phải `422`.
- JSON field dùng camelCase, không dùng snake_case.
- `POST /auth/logout` trả `204` và không có body.
- SSE auth dùng query `token`, không dùng Bearer header.
- Voice answer dùng `audioFileUrl` trong JSON, không dùng multipart upload.

## Endpoint có trong design cũ nhưng không có trong backend

Các endpoint sau không có controller tại thời điểm rà soát và không được tính vào 14 API:

| Endpoint dự kiến/cũ | Trạng thái |
|---------------------|------------|
| `GET /api/v1/auth/google` | Chưa triển khai |
| `GET /api/v1/auth/google/callback` | Chưa triển khai |
| `GET /api/v1/sessions/:id/turns/:turnId` | Chưa triển khai |
| `POST /api/v1/sessions/:id/turns/:turnId/followup` | Chưa triển khai |
| `GET /api/v1/sessions/:id/turns/:turnId/feedback` | Chưa triển khai |
| `GET /api/v1/sessions/:id/answers/:answerId/rewrite-context` | Draft trong [06_rewrite.md](06_rewrite.md) |
| `POST /api/v1/sessions/:id/answers/:answerId/rewrites` | Draft trong [06_rewrite.md](06_rewrite.md) |
| `GET /api/v1/sessions/:id/answers/:answerId/rewrites` | Draft trong [06_rewrite.md](06_rewrite.md) |
| `GET /api/v1/progress` | Chưa triển khai |
| `POST /api/v1/profile/cv` | Chưa triển khai |
| `POST /api/v1/sessions/:id/report/generate` | Chưa triển khai; report được enqueue khi PATCH status thành `completed` |

## Chênh lệch code cần lưu ý

Đây là các hành vi hiện tại đã được phản ánh trong tài liệu, đồng thời là điểm có thể cần cải thiện ở backend:

- `ThrottlerModule` có cấu hình nhưng chưa gắn `ThrottlerGuard`, nên global rate limit chưa chạy.
- Refresh cookie dùng `Path=/auth`, không khớp route có prefix `/api/v1/auth/...` nếu server được gọi trực tiếp.
- SSE guard xác thực JWT nhưng controller chưa kiểm tra ownership của session.
- SSE không có event ID, replay hay keep-alive.
- `PATCH /sessions/:id/status` chưa validate state transition.
- Success response chưa có envelope thống nhất.

# API Design - Overview

Reference: [API_design.md](API_design.md)

## 1. Base URL

```text
Development: http://localhost:3000/api/v1
Production:  <server-origin>/api/v1
```

`server/src/main.ts` đặt global prefix là `api/v1`. Domain production không được hard-code trong backend.

## 2. Authentication

| Loại API | Credential |
|----------|------------|
| API được bảo vệ | Header `Authorization: Bearer <Supabase JWT>` |
| Refresh token | Cookie `refresh_token` |
| SSE | Query parameter `token=<Supabase JWT>` |
| Health check | Không yêu cầu |

JWT dùng thuật toán `HS256`, được kiểm tra chữ ký và thời hạn. Khi `AUTH_ENABLED=false`, guard dùng mock user từ biến môi trường phục vụ development.

## 3. Request validation

Global `ValidationPipe` bật:

- `whitelist: true`: trường không khai báo trong DTO bị loại khỏi request body.
- `transform: true`: NestJS thực hiện transform theo metadata có sẵn.
- DTO validation thất bại trả HTTP `400` với `errorCode = VALIDATION_ERROR`.

## 4. Success response

Backend hiện chưa có success envelope chung:

- Hầu hết API trả raw object hoặc object wrapper riêng của controller.
- `POST /api/v1/auth/refresh` trả `{ success: true, data: {...} }`.
- `POST /api/v1/auth/logout` trả `204 No Content`.
- `GET /api/v1` trả plain text.

Mỗi endpoint bên dưới mô tả đúng response thực tế thay vì áp dụng một envelope giả định.

## 5. Error response

Mọi lỗi HTTP được `InterviewAIExceptionFilter` chuẩn hóa:

```json
{
  "success": false,
  "errorCode": "SESSION_NOT_FOUND",
  "message": "SESSION_NOT_FOUND",
  "path": "/api/v1/sessions/00000000-0000-0000-0000-000000000000",
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `success` | boolean | Luôn là `false` đối với error response. |
| `errorCode` | string | Mã lỗi ổn định để client xử lý. |
| `message` | string | Thông báo lỗi; có thể là tiếng Việt, tiếng Anh hoặc chính mã lỗi. |
| `path` | string | URL path đã gây lỗi. |
| `timestamp` | string | Thời điểm phát sinh lỗi theo ISO 8601 UTC. |

Các lỗi dùng chung:

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Request body không vượt qua DTO validation. |
| 401 | `UNAUTHORIZED` | Thiếu, sai hoặc hết hạn Bearer JWT/refresh cookie. |
| 403 | `FORBIDDEN` | User không sở hữu resource hoặc guard từ chối request. |
| 404 | `NOT_FOUND` | Resource chung không tồn tại. |
| 500 | `INTERNAL_ERROR` | Lỗi không được xử lý riêng. |

## 6. Headers và content type

- JSON request/response: `application/json`.
- SSE response: `text/event-stream`.
- Mọi response có header `X-Request-ID`. Backend dùng giá trị client gửi trong `X-Request-ID`, hoặc tự sinh UUID.
- Cookie `refresh_token` dùng `HttpOnly`, `SameSite=Strict`; `Secure` chỉ bật khi `NODE_ENV=production`.

## 7. Rate limiting

- `ThrottlerModule` được cấu hình `100` request trong `60` giây, nhưng code hiện tại chưa đăng ký `ThrottlerGuard`; vì vậy giới hạn này **chưa được thực thi**.
- `POST /api/v1/sessions` có giới hạn nghiệp vụ đang được thực thi: tối đa `10` session trong `24` giờ cho mỗi user.

## GET /api/v1

**Endpoint URL**

`GET /api/v1`

**Purpose**

Kiểm tra backend đang hoạt động ở mức cơ bản.

**Authentication**

Không yêu cầu.

**Request body**

Không có.

**Response body - 200 OK**

```text
Hello World!
```

Response là plain text; không có trường JSON.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 500 | `INTERNAL_ERROR` | Lỗi ngoài dự kiến trong server. |

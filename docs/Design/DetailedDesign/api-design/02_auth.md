# API Design - Authentication

Reference: [01_overview.md](01_overview.md)

## Endpoint summary

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/refresh` | Cookie `refresh_token` |
| POST | `/api/v1/auth/logout` | Bearer JWT |

Backend hiện tại không expose `GET /auth/google` hoặc OAuth callback. Client thực hiện luồng đăng nhập qua Supabase; backend chỉ xử lý refresh và logout.

## POST /api/v1/auth/refresh

**Endpoint URL**

`POST /api/v1/auth/refresh`

**Purpose**

Đổi refresh token hợp lệ lấy access token mới, đồng thời rotate refresh token trong cookie.

**Authentication**

Cookie:

```http
Cookie: refresh_token=<token>
```

**Request body**

Không có. Token được đọc từ cookie `refresh_token`.

**Response body - 200 OK**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "expiresIn": 3600
  }
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `success` | boolean | Luôn là `true` khi refresh thành công. |
| `data.accessToken` | string | Supabase access token mới dùng cho Bearer authentication. |
| `data.expiresIn` | number | Số giây còn hiệu lực của access token. |

Response đặt lại cookie:

```http
Set-Cookie: refresh_token=<new-token>; HttpOnly; SameSite=Strict; Max-Age=604800; Path=/auth
```

`Secure` chỉ có trong production.

Lưu ý: controller hiện đặt `Path=/auth`, trong khi URL có global prefix là `/api/v1/auth/refresh`. Nếu không có reverse proxy rewrite path, trình duyệt sẽ không gửi cookie này tới route refresh.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Không có cookie `refresh_token`. Message: `Missing refresh token`. |
| 401 | `TOKEN_EXPIRED` | Refresh token sai, hết hạn hoặc Supabase không trả session. |
| 500 | `INTERNAL_ERROR` | Lỗi ngoài dự kiến khi gọi Supabase. |

## POST /api/v1/auth/logout

**Endpoint URL**

`POST /api/v1/auth/logout`

**Purpose**

Đăng xuất user hiện tại khỏi Supabase và xóa refresh token cookie trên trình duyệt.

**Authentication**

```http
Authorization: Bearer <access_token>
```

**Request body**

Không có.

**Response body - 204 No Content**

Không có response body.

Response xóa cookie `refresh_token` với `Path=/auth`.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai chữ ký hoặc hết hạn. |
| 500 | `INTERNAL_ERROR` | Supabase sign-out thất bại. Message: `Logout failed`. |

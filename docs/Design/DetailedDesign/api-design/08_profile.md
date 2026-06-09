# API Design - User Profile

Reference: [01_overview.md](01_overview.md)

## Endpoint summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/profile` | Lấy user và profile |
| PATCH | `/api/v1/profile` | Tạo/cập nhật profile |

Cả hai endpoint yêu cầu Bearer JWT và trả trực tiếp Prisma `User` kèm relation `profile`.

## Shared response: UserWithProfile

### User fields

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `id` | string | UUID user, đồng thời là Supabase user ID. |
| `email` | string | Email đăng nhập. |
| `role` | string | Vai trò user; mặc định `candidate`. |
| `status` | string | Trạng thái tài khoản; mặc định `active`. |
| `profileCompleted` | boolean | Profile đã được đánh dấu hoàn tất hay chưa. |
| `lastLoginAt` | string \| null | Lần đăng nhập gần nhất theo ISO 8601. |
| `deletedAt` | string \| null | Thời điểm soft delete, nếu có. |
| `createdAt` | string | Thời điểm tạo user theo ISO 8601. |
| `updatedAt` | string | Thời điểm cập nhật user theo ISO 8601. |
| `profile` | UserProfile \| null | Profile chi tiết; `null` nếu chưa được tạo. |

### UserProfile fields

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `id` | string | UUID profile. |
| `userId` | string | UUID user sở hữu profile. |
| `fullName` | string \| null | Họ tên đầy đủ. |
| `targetPosition` | string \| null | Vị trí công việc mục tiêu. |
| `targetRoleCategory` | string \| null | Nhóm vai trò mục tiêu. |
| `targetLevel` | string \| null | Cấp bậc mục tiêu. |
| `preferredTechStack` | string \| null | Tech stack ưu tiên. |
| `yearsExperience` | number | Số năm kinh nghiệm; mặc định `0`. |
| `defaultLanguage` | string | Ngôn ngữ mặc định; mặc định `vi`. |
| `ttsEnabled` | boolean | Trạng thái bật text-to-speech. |
| `dateOfBirth` | string \| null | Ngày sinh, serialized theo ISO 8601. |
| `gender` | string \| null | Giới tính do user cung cấp. |
| `phone` | string \| null | Số điện thoại. |
| `hometown` | string \| null | Quê quán. |
| `nationality` | string \| null | Quốc tịch. |
| `personality` | string \| null | Mô tả tính cách. |
| `education` | object \| null | Dữ liệu học vấn dạng JSON. |
| `workExperience` | array \| null | Danh sách kinh nghiệm làm việc dạng JSON. |
| `projects` | array \| null | Danh sách dự án dạng JSON. |
| `technicalSkills` | array \| null | Danh sách kỹ năng kỹ thuật dạng JSON. |
| `certifications` | array \| null | Danh sách chứng chỉ dạng JSON. |
| `awards` | array \| null | Danh sách giải thưởng dạng JSON. |
| `deletedAt` | string \| null | Thời điểm soft delete profile. |
| `createdAt` | string | Thời điểm tạo profile theo ISO 8601. |
| `updatedAt` | string | Thời điểm cập nhật profile theo ISO 8601. |

## GET /api/v1/profile

**Endpoint URL**

`GET /api/v1/profile`

**Purpose**

Lấy thông tin tài khoản và profile của user đang đăng nhập.

**Authentication**

Bearer JWT.

**Request body**

Không có.

**Response body - 200 OK**

Trả trực tiếp `UserWithProfile`. Xem chú thích tại [Shared response: UserWithProfile](#shared-response-userwithprofile).

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "candidate",
  "status": "active",
  "profileCompleted": false,
  "lastLoginAt": null,
  "deletedAt": null,
  "createdAt": "2026-06-09T12:00:00.000Z",
  "updatedAt": "2026-06-09T12:00:00.000Z",
  "profile": null
}
```

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 404 | `NOT_FOUND` | JWT hợp lệ nhưng không tìm thấy user tương ứng trong DB. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi ngoài dự kiến. |

## PATCH /api/v1/profile

**Endpoint URL**

`PATCH /api/v1/profile`

**Purpose**

Tạo profile nếu chưa có hoặc cập nhật các trường profile được gửi lên, sau đó trả dữ liệu user/profile mới nhất.

**Authentication**

Bearer JWT.

**Request body**

Tất cả trường đều optional. Trường không gửi sẽ không bị thay đổi.

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `fullName` | string | Họ tên đầy đủ. |
| `targetPosition` | string | Vị trí mục tiêu. |
| `targetRoleCategory` | string | Nhóm vai trò mục tiêu. |
| `targetLevel` | string | Cấp bậc mục tiêu. |
| `preferredTechStack` | string | Tech stack ưu tiên. |
| `yearsExperience` | integer | Số năm kinh nghiệm, tối thiểu 0. |
| `defaultLanguage` | string | Ngôn ngữ mặc định; DTO chưa giới hạn enum. |
| `ttsEnabled` | boolean | Bật/tắt text-to-speech. |
| `dateOfBirth` | string | Chuỗi ngày; nên dùng `YYYY-MM-DD`. Chuỗi rỗng được lưu thành `null`. |
| `gender` | string | Giới tính. |
| `phone` | string | Số điện thoại. |
| `hometown` | string | Quê quán. |
| `nationality` | string | Quốc tịch. |
| `personality` | string | Mô tả tính cách. |
| `education` | object | Dữ liệu học vấn JSON; cấu trúc con chưa được DTO validate. |
| `workExperience` | array | Kinh nghiệm làm việc; phần tử chưa được DTO validate. |
| `projects` | array | Dự án; phần tử chưa được DTO validate. |
| `technicalSkills` | array | Kỹ năng kỹ thuật; phần tử chưa được DTO validate. |
| `certifications` | array | Chứng chỉ; phần tử chưa được DTO validate. |
| `awards` | array | Giải thưởng; phần tử chưa được DTO validate. |

Ví dụ:

```json
{
  "fullName": "Nguyen Van A",
  "targetPosition": "Backend Developer",
  "yearsExperience": 2,
  "defaultLanguage": "vi",
  "ttsEnabled": true
}
```

**Response body - 200 OK**

Trả trực tiếp `UserWithProfile` sau upsert. Xem toàn bộ trường tại [Shared response: UserWithProfile](#shared-response-userwithprofile).

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Trường sai kiểu, `yearsExperience` âm, hoặc trường JSON không đúng object/array yêu cầu. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 404 | `NOT_FOUND` | Upsert xong nhưng không tìm thấy user để trả response. |
| 500 | `INTERNAL_ERROR` | Ngày không parse được, lỗi ràng buộc DB hoặc lỗi ngoài dự kiến. |

## API profile chưa có

- `POST /api/v1/profile/cv`
- `GET /api/v1/progress`

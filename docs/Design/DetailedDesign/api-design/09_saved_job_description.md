# API Design - Saved Job Descriptions

Reference: [01_overview.md](01_overview.md)

Backend expose 2 API quản lý danh sách Job Description đã lưu của user.

## GET /api/v1/saved-job-descriptions

**Endpoint URL**

`GET /api/v1/saved-job-descriptions`

**Purpose**

Lấy danh sách tất cả Job Description đã lưu của user hiện tại (chưa bị xóa mềm). Kết quả sắp xếp theo `lastUsedAt` giảm dần, nếu bằng nhau thì theo `updatedAt` giảm dần.

**Authentication**

Bearer JWT.

**Request body**

Không có.

**Response body - 200 OK**

```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "companyName": "Công ty TNHH ABC",
      "companyWebsite": "https://abc.com",
      "jobTitle": "Backend Developer",
      "headcount": "5-10",
      "location": "Hà Nội",
      "requirements": "Yêu cầu 1 năm kinh nghiệm...",
      "jobContent": "Mô tả công việc chi tiết...",
      "techStack": ["Node.js", "PostgreSQL"],
      "benefits": "Thưởng tháng 13",
      "salary": "15-20 triệu",
      "bonus": "KPI hàng quý",
      "lastUsedAt": "2026-06-28T10:00:00.000Z",
      "deletedAt": null,
      "createdAt": "2026-06-01T08:00:00.000Z",
      "updatedAt": "2026-06-28T10:00:00.000Z"
    }
  ]
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `items` | array | Danh sách JD đã lưu; mảng rỗng nếu chưa có. |
| `id` | string | UUID của bản ghi. |
| `userId` | string | UUID của user sở hữu. |
| `companyName` | string | Tên công ty. |
| `companyWebsite` | string \| null | URL website công ty. |
| `jobTitle` | string | Tên vị trí. |
| `headcount` | string \| null | Số lượng tuyển dụng (free text). |
| `location` | string \| null | Địa điểm làm việc. |
| `requirements` | string | Yêu cầu ứng viên. |
| `jobContent` | string | Mô tả chi tiết công việc. |
| `techStack` | string[] | Danh sách công nghệ; mảng rỗng nếu không có. |
| `benefits` | string \| null | Phúc lợi. |
| `salary` | string \| null | Mức lương (free text). |
| `bonus` | string \| null | Thông tin thưởng. |
| `lastUsedAt` | string \| null | Lần cuối JD này được dùng để tạo session. |
| `deletedAt` | null | Luôn `null` trong response (record đã xóa bị lọc ra). |
| `createdAt` | string | Thời điểm tạo theo ISO 8601 UTC. |
| `updatedAt` | string | Thời điểm cập nhật lần cuối theo ISO 8601 UTC. |

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi không dự kiến. |

---

## POST /api/v1/saved-job-descriptions

**Endpoint URL**

`POST /api/v1/saved-job-descriptions`

**Purpose**

Lưu hoặc cập nhật một Job Description. Logic upsert: nếu user đã có JD với cùng `companyName` + `jobTitle` (chưa xóa mềm) thì cập nhật các trường còn lại và `lastUsedAt`; ngược lại tạo mới. HTTP status luôn là `201`.

**Authentication**

Bearer JWT.

**Request body**

`application/json`.

```json
{
  "companyName": "Công ty TNHH ABC",
  "companyWebsite": "https://abc.com",
  "jobTitle": "Backend Developer",
  "headcount": "5-10",
  "location": "Hà Nội",
  "requirements": "Yêu cầu 1 năm kinh nghiệm...",
  "jobContent": "Mô tả công việc chi tiết...",
  "techStack": ["Node.js", "PostgreSQL"],
  "benefits": "Thưởng tháng 13",
  "salary": "15-20 triệu",
  "bonus": "KPI hàng quý"
}
```

| Trường | Kiểu | Bắt buộc | Chú thích |
|--------|------|----------|-----------|
| `companyName` | string | Có | `@MinLength(1)` `@MaxLength(160)`. Được trim trước khi lưu. |
| `companyWebsite` | string | Không | `@MaxLength(300)`. |
| `jobTitle` | string | Có | `@MinLength(1)` `@MaxLength(160)`. Được trim trước khi lưu. |
| `headcount` | string | Không | `@MaxLength(80)`. |
| `location` | string | Không | `@MaxLength(160)`. |
| `requirements` | string | Có | `@MinLength(30)`. |
| `jobContent` | string | Có | `@MinLength(30)`. |
| `techStack` | string[] | Không | Mảng string; item rỗng sau trim bị loại. |
| `benefits` | string | Không | Không giới hạn độ dài. |
| `salary` | string | Không | `@MaxLength(120)`. |
| `bonus` | string | Không | `@MaxLength(120)`. |

**Response body - 201 Created**

Trả về object `SavedJobDescription` có shape giống từng item trong `GET /saved-job-descriptions` ở trên.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Request body sai kiểu, thiếu trường bắt buộc hoặc vi phạm giới hạn độ dài. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi không dự kiến. |

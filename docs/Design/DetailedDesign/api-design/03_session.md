# API Design - Interview Sessions

Reference: [01_overview.md](01_overview.md)

## Endpoint summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/sessions` | Tạo session |
| GET | `/api/v1/sessions` | Lấy lịch sử session |
| GET | `/api/v1/sessions/:id` | Lấy chi tiết session |
| GET | `/api/v1/sessions/:id/status` | Lấy trạng thái rút gọn |
| GET | `/api/v1/sessions/:id/questions` | Lấy câu hỏi |
| PATCH | `/api/v1/sessions/:id/status` | Cập nhật trạng thái |
| GET | `/api/v1/sessions/:id/events` | Mở SSE stream |

Trừ SSE, tất cả endpoint trong file này yêu cầu Bearer JWT.

## Shared response: InterviewSession

`POST /sessions`, `GET /sessions/:id` và `PATCH /sessions/:id/status` trả trực tiếp object sau. `GET /sessions` trả mảng các object cùng schema.

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `id` | string | UUID của session. |
| `userId` | string | UUID user sở hữu session. |
| `jobDescription` | string | Nội dung mô tả công việc dùng để sinh câu hỏi. |
| `jdSource` | string | Nguồn JD; API tạo session hiện gán `paste`. |
| `jdUrl` | string \| null | URL JD nếu có; API hiện không gán. |
| `jobTitle` | string \| null | Tên vị trí được suy ra/lưu nếu có. |
| `sessionType` | string | Loại phỏng vấn: `hr`, `technical` hoặc `mixed`. |
| `numQuestions` | number | Số câu hỏi của session. |
| `difficulty` | string | Độ khó; mặc định DB là `medium`. |
| `persona` | string | Persona người phỏng vấn; mặc định `neutral_tech_lead`. |
| `mode` | string | Chế độ session; mặc định `practice`. |
| `durationMin` | number | Thời lượng dự kiến theo phút; mặc định `30`. |
| `language` | string | Ngôn ngữ session; mặc định `vi`. |
| `contextPackId` | string | Context pack: `VN` hoặc `Western`. |
| `showPrepCard` | boolean | Có hiển thị thẻ chuẩn bị hay không. |
| `status` | string | Trạng thái hiện tại, ví dụ `generating`, `active`, `completed`, `error`. |
| `planJson` | object/array/value \| null | Kế hoạch câu hỏi do hệ thống lưu, nếu có. |
| `openingTranscript` | string \| null | Transcript phần mở đầu, nếu có. |
| `selfEvalJson` | object/array/value \| null | Dữ liệu tự đánh giá, nếu có. |
| `overallScore` | number \| null | Điểm tổng sau khi report được tạo. |
| `executiveSummaryJson` | object/array/value \| null | Tóm tắt điều hành của report. |
| `commAnalysisJson` | object/array/value \| null | Phân tích giao tiếp. |
| `competencyHeatmapJson` | object/array/value \| null | Dữ liệu heatmap năng lực. |
| `reverseQEvalJson` | object/array/value \| null | Đánh giá câu hỏi ngược, nếu có. |
| `actionPlanJson` | object/array/value \| null | Kế hoạch cải thiện. |
| `completedAt` | string \| null | Thời điểm hoàn tất theo ISO 8601. |
| `createdAt` | string | Thời điểm tạo theo ISO 8601. |
| `updatedAt` | string | Thời điểm cập nhật theo ISO 8601. |

## POST /api/v1/sessions

**Endpoint URL**

`POST /api/v1/sessions`

**Purpose**

Tạo một phiên phỏng vấn mới và đưa job sinh câu hỏi vào BullMQ.

**Authentication**

Bearer JWT.

**Request body**

```json
{
  "jobDescription": "Mô tả công việc dài ít nhất 100 ký tự...",
  "sessionType": "technical",
  "contextPack": "VN",
  "numQuestions": 5,
  "targetRoles": ["Backend Developer"]
}
```

| Trường | Kiểu | Bắt buộc | Chú thích |
|--------|------|----------|-----------|
| `jobDescription` | string | Có | JD dùng để sinh câu hỏi; tối thiểu 100 ký tự. |
| `sessionType` | string | Có | Một trong `hr`, `technical`, `mixed`. |
| `contextPack` | string | Có | Một trong `VN`, `Western`. |
| `numQuestions` | integer | Không | Số câu hỏi, từ 3 đến 10; mặc định `5`. |
| `targetRoles` | string[] | Không | Danh sách vai trò mục tiêu truyền cho job sinh câu hỏi; không được lưu trực tiếp vào session. |

**Response body - 201 Created**

Trả trực tiếp một `InterviewSession`. Khi tạo thành công:

- `status` là `generating`.
- `jdSource` là `paste`.
- `numQuestions` là giá trị request hoặc `5`.

Xem chú thích toàn bộ trường tại [Shared response: InterviewSession](#shared-response-interviewsession).

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Thiếu trường, JD dưới 100 ký tự, enum sai, hoặc `numQuestions` ngoài 3-10. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 429 | `SESSION_LIMIT_EXCEEDED` | User đã tạo ít nhất 10 session trong 24 giờ gần nhất. |
| 503 | `SERVICE_UNAVAILABLE` | Không khởi tạo được context pack hoặc không enqueue được job sinh câu hỏi. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi ngoài dự kiến. |

## GET /api/v1/sessions

**Endpoint URL**

`GET /api/v1/sessions`

**Purpose**

Lấy toàn bộ session của user hiện tại, sắp xếp mới nhất trước.

**Authentication**

Bearer JWT.

**Request body**

Không có.

**Response body - 200 OK**

```json
{
  "sessions": []
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `sessions` | InterviewSession[] | Danh sách session theo `createdAt` giảm dần; mảng rỗng nếu chưa có session. |

Mỗi phần tử dùng schema [InterviewSession](#shared-response-interviewsession).

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi ngoài dự kiến. |

## GET /api/v1/sessions/:id

**Endpoint URL**

`GET /api/v1/sessions/:id`

**Purpose**

Lấy đầy đủ dữ liệu của một session thuộc user hiện tại.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `id` | string | UUID session. Controller chưa validate định dạng UUID trước khi query. |

**Request body**

Không có.

**Response body - 200 OK**

Trả trực tiếp một [InterviewSession](#shared-response-interviewsession).

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session tồn tại nhưng thuộc user khác. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 500 | `INTERNAL_ERROR` | Lỗi ngoài dự kiến. |

## GET /api/v1/sessions/:id/status

**Endpoint URL**

`GET /api/v1/sessions/:id/status`

**Purpose**

Lấy trạng thái rút gọn để client poll mà không tải toàn bộ session.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `id` | string | UUID session. |

**Request body**

Không có.

**Response body - 200 OK**

```json
{
  "status": "active",
  "numQuestions": 5
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `status` | string | Trạng thái hiện tại của session. |
| `numQuestions` | number | Tổng số câu hỏi được cấu hình. |

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 500 | `INTERNAL_ERROR` | Lỗi ngoài dự kiến. |

## GET /api/v1/sessions/:id/questions

**Endpoint URL**

`GET /api/v1/sessions/:id/questions`

**Purpose**

Lấy danh sách câu hỏi đã được sinh cho session theo đúng thứ tự phỏng vấn.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `id` | string | UUID session. |

**Request body**

Không có.

**Response body - 200 OK**

```json
{
  "questions": [
    {
      "id": "question-uuid",
      "content": "Hãy giới thiệu về kinh nghiệm gần nhất của bạn.",
      "orderIndex": 1
    }
  ]
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `questions` | object[] | Danh sách câu hỏi tăng dần theo `orderIndex`; mảng rỗng nếu chưa sinh xong. |
| `questions[].id` | string | UUID câu hỏi. |
| `questions[].content` | string | Nội dung câu hỏi, map từ `questionText` trong DB. |
| `questions[].orderIndex` | number | Thứ tự câu hỏi, bắt đầu từ 1 trong job hiện tại. |

Nếu đã có câu hỏi và session đang là `generating` hoặc `ready`, service cập nhật session sang `active`.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 500 | `INTERNAL_ERROR` | Lỗi DB hoặc lỗi ngoài dự kiến. |

## PATCH /api/v1/sessions/:id/status

**Endpoint URL**

`PATCH /api/v1/sessions/:id/status`

**Purpose**

Đặt session sang `active` hoặc `completed`; khi hoàn tất, backend enqueue job tạo báo cáo tổng hợp.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `id` | string | UUID session. |

**Request body**

```json
{
  "status": "completed"
}
```

| Trường | Kiểu | Bắt buộc | Chú thích |
|--------|------|----------|-----------|
| `status` | string | Có | Chỉ nhận `active` hoặc `completed`. Code hiện chưa kiểm tra state transition cũ -> mới. |

**Response body - 200 OK**

Trả trực tiếp [InterviewSession](#shared-response-interviewsession) sau khi cập nhật. Với `completed`, `completedAt` được đặt thành thời điểm hiện tại.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Thiếu `status` hoặc giá trị không phải `active`/`completed`. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 500 | `INTERNAL_ERROR` | Lỗi cập nhật DB hoặc enqueue report job. |

## GET /api/v1/sessions/:id/events

**Endpoint URL**

`GET /api/v1/sessions/:id/events?token=<jwt>`

**Purpose**

Mở kết nối Server-Sent Events để nhận trạng thái xử lý bất đồng bộ của session theo thời gian thực.

**Authentication**

Supabase JWT trong query parameter `token`. `EventSource` không cần tự gắn Authorization header.

**Path và query parameters**

| Tên | Kiểu | Bắt buộc | Chú thích |
|-----|------|----------|-----------|
| `id` | string | Có | UUID session, đồng thời xác định Redis channel `sse:session:{id}`. |
| `token` | string | Có | Supabase JWT hợp lệ. |

**Request body**

Không có.

**Response body - 200 OK**

`Content-Type: text/event-stream`. Stream có các event:

| Event | Payload fields | Chú thích |
|-------|----------------|-----------|
| `session.status` | `status`: `active` hoặc `error`; `sessionId`: string có thể vắng khi lỗi | Kết quả job sinh câu hỏi. |
| `turn.follow_up` | `turnId`: string; `followUpText`: string | Câu hỏi phụ đã được sinh cho answer. |
| `turn.feedback_ready` | `answerId`: string; `hasAnnotations`: boolean | Feedback đã sẵn sàng; cho biết có annotated segments hay không. |
| `report.ready` | `sessionId`: string | Báo cáo tổng hợp đã được lưu. |

Ví dụ:

```text
event: turn.feedback_ready
data: {"answerId":"answer-uuid","hasAnnotations":true}
```

Code hiện tại không phát event ID, không replay event đã lỡ và không gửi keep-alive định kỳ.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 403 | `FORBIDDEN` | Thiếu `token`, token sai hoặc hết hạn; `SseTokenGuard` trả `false`. |
| 500 | `INTERNAL_ERROR` | Lỗi khi thiết lập stream trước khi response bắt đầu. |

**Security note**

Controller hiện chỉ xác thực token, chưa kiểm tra session tồn tại hoặc session có thuộc user trong token hay không. Đây là hành vi code hiện tại, không phải đảm bảo ownership.

# API Design - Turns and Answers

Reference: [01_overview.md](01_overview.md)

Backend hiện tại chỉ expose một API turn.

## POST /api/v1/sessions/:sessionId/turns

**Endpoint URL**

`POST /api/v1/sessions/:sessionId/turns`

**Purpose**

Lưu câu trả lời dạng text hoặc voice cho một câu hỏi, sau đó enqueue job sinh follow-up và feedback.

**Authentication**

Bearer JWT.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `sessionId` | string | UUID session nhận câu trả lời. |

**Request body**

Request luôn là `application/json`. Voice mode nhận URL file audio, không nhận multipart upload.

```json
{
  "questionId": "question-uuid",
  "answerMode": "text",
  "answerText": "Nội dung trả lời...",
  "audioFileUrl": "https://example.com/answer.webm",
  "audioDurationSeconds": 90,
  "audioSizeBytes": 1250000
}
```

| Trường | Kiểu | Bắt buộc | Chú thích |
|--------|------|----------|-----------|
| `questionId` | string | Có | ID câu hỏi; câu hỏi phải thuộc `sessionId`. |
| `answerMode` | string | Có | `text` hoặc `voice`. |
| `answerText` | string | Khi `answerMode=text` | Nội dung trả lời text. DTO hiện chỉ kiểm tra kiểu string, không kiểm tra chuỗi rỗng. |
| `audioFileUrl` | string URL | Khi `answerMode=voice` | URL công khai/backend có thể fetch để gửi sang Whisper. |
| `audioDurationSeconds` | integer | Không | Thời lượng audio do client cung cấp, tối thiểu 0; nếu thiếu sẽ dùng duration từ Whisper. |
| `audioSizeBytes` | integer | Không | Kích thước audio do client báo, tối thiểu 0; chỉ dùng để lưu metadata. |

Trong text mode, `audioFileUrl` không được service sử dụng để transcribe. Trong voice mode, `answerText` gửi kèm không được dùng; transcript từ Whisper là nội dung được lưu.

**Response body - 201 Created**

```json
{
  "answerId": "answer-uuid",
  "followUpQueued": true,
  "feedbackQueued": true
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `answerId` | string | UUID của `UserAnswer` vừa tạo. |
| `followUpQueued` | boolean | `true` nếu câu trả lời dài ít nhất 50 ký tự và chưa phải câu cuối. |
| `feedbackQueued` | boolean | Luôn là `true` khi API trả thành công. |

Nếu session đang là `ready` hoặc `generating`, service chuyển session sang `active` trước khi lưu answer.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Request body sai kiểu, thiếu trường theo mode, URL audio sai hoặc số metadata âm. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 403 | `SESSION_NOT_ACTIVE` | Session không ở một trong `active`, `ready`, `generating`. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 404 | `NOT_FOUND` | `questionId` không tồn tại trong session. |
| 413 | `AUDIO_TOO_LARGE` | File tải từ `audioFileUrl` lớn hơn 10 MiB. |
| 500 | `INTERNAL_ERROR` | Fetch/transcribe audio thất bại, lỗi DB hoặc lỗi enqueue job. |

## API turn chưa có

Các API sau từng xuất hiện trong design cũ nhưng không có controller:

- `GET /api/v1/sessions/:id/turns/:turnId`
- `POST /api/v1/sessions/:id/turns/:turnId/followup`
- `GET /api/v1/sessions/:id/turns/:turnId/feedback`

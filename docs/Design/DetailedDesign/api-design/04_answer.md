# API Design - Turns and Answers

Reference: [01_overview.md](01_overview.md)

Backend hiện tại expose API upload audio và API submit turn.

## POST /api/v1/sessions/:sessionId/turns/audio

**Endpoint URL**

`POST /api/v1/sessions/:sessionId/turns/audio`

**Purpose**

Upload file audio của câu trả lời vào Supabase Storage bucket `interview-audio` qua backend. Backend xác thực owner của session rồi dùng service role để upload, giúp voice mode hoạt động cả khi môi trường local đang bật mock auth.
Sau upload, backend gọi Whisper để trả transcript nháp cho frontend hiển thị và cho phép user chỉnh sửa trước khi submit turn.

**Authentication**

Bearer JWT hoặc dev mock token khi `AUTH_ENABLED=false`.

**Request body**

`multipart/form-data` với field `file`. MIME hỗ trợ: `audio/webm`, `audio/mp4`, `audio/wav`. Kích thước tối đa 10 MiB.

**Response body - 201 Created**

```json
{
  "audioFileUrl": "https://project.supabase.co/storage/v1/object/public/interview-audio/user/session/audio.webm",
  "audioSizeBytes": 1250000,
  "transcript": "Nội dung câu trả lời được transcript...",
  "transcriptDurationSeconds": 90
}
```

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

Request luôn là `application/json`. Voice mode nhận URL file audio đã được upload qua `/turns/audio`. Nếu frontend gửi `answerText` trong voice mode, đó là transcript đã được user chỉnh sửa và backend dùng trực tiếp để enqueue feedback; backend không transcribe lại audio trong bước submit.

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
| `answerText` | string | Khi `answerMode=text`; tùy chọn khi `answerMode=voice` | Nội dung trả lời text hoặc transcript voice đã được chỉnh sửa. Nếu có giá trị thì phải tối thiểu 10 ký tự. |
| `audioFileUrl` | string URL | Khi `answerMode=voice` | URL công khai/backend có thể fetch để gửi sang Whisper. |
| `audioDurationSeconds` | integer | Không | Thời lượng audio do client cung cấp, tối thiểu 0; nếu thiếu sẽ dùng duration từ Whisper. |
| `audioSizeBytes` | integer | Không | Kích thước audio do client báo, tối thiểu 0; chỉ dùng để lưu metadata. |

Trong text mode, `audioFileUrl` không được service sử dụng để transcribe. Trong voice mode mới, frontend gửi `answerText` đã chỉnh sửa; backend lưu nội dung này với `transcriptionStatus=done`. Nếu client cũ chỉ gửi audio URL mà không gửi `answerText`, backend vẫn dùng fallback async transcription queue.

**Response body - 201 Created**

```json
{
  "answerId": "answer-uuid",
  "feedbackQueued": true,
  "transcriptionPending": false
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `answerId` | string | UUID của `UserAnswer` vừa tạo. |
| `feedbackQueued` | boolean | `true` nếu feedback job đã được enqueue. Voice mode có transcript đã chỉnh sửa enqueue feedback ngay. |
| `transcriptionPending` | boolean | `true` nếu voice answer audio-only đã lưu placeholder và đang chờ transcription worker. |

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

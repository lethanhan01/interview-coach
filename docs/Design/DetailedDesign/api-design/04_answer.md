# API Design - Turns and Answers

Reference: [01_overview.md](01_overview.md)

Backend hiện tại expose API submit turn cho cả hai chế độ text và voice. Tính năng lưu trữ file âm thanh và transcription qua Whisper phía server đã được gỡ bỏ hoàn toàn. Thay vào đó, giọng nói được nhận diện trực tiếp tại trình duyệt ứng viên (Web Speech API) và gửi text transcript kèm thời lượng về server để chấm điểm và phân tích voice metrics.

## POST /api/v1/sessions/:sessionId/turns

**Endpoint URL**

`POST /api/v1/sessions/:sessionId/turns`

**Purpose**

Lưu câu trả lời dạng text hoặc voice cho một câu hỏi, tính toán voice metrics (nếu là voice), lưu vào cơ sở dữ liệu và enqueue job sinh feedback/đánh giá AI qua BullMQ Outbox.

**Authentication**

Bearer JWT hoặc dev mock token khi `AUTH_ENABLED=false`.

**Path parameters**

| Tên | Kiểu | Chú thích |
|-----|------|-----------|
| `sessionId` | string | UUID session nhận câu trả lời. |

**Request body**

Request luôn là `application/json`.
- Ở chế độ `text`: ứng viên nhập trực tiếp văn bản trả lời (`answerText`).
- Ở chế độ `voice`: ứng viên trả lời qua microphone, trình duyệt chuyển đổi trực tiếp thành transcript bằng Web Speech API; ứng viên xác nhận/chỉnh sửa nội dung rồi gửi `answerText` kèm `audioDurationSeconds`. Server không lưu trữ file âm thanh và không gọi Whisper.

```json
{
  "questionId": "question-uuid",
  "answerMode": "voice",
  "answerText": "Nội dung trả lời hoặc transcript từ giọng nói...",
  "audioDurationSeconds": 90,
  "skipQuestion": false
}
```

| Trường | Kiểu | Bắt buộc | Chú thích |
|--------|------|----------|-----------|
| `questionId` | string | Có | ID câu hỏi; câu hỏi phải thuộc `sessionId`. |
| `answerMode` | string | Có | `text` hoặc `voice`. |
| `answerText` | string | Khi không skip | Nội dung trả lời text hoặc transcript giọng nói đã xác nhận (tối thiểu 10 ký tự nếu có). |
| `audioDurationSeconds` | integer | Tùy chọn (khi voice) | Thời lượng phát biểu (giây) tính từ trình duyệt, tối thiểu 0. Dùng để tính chỉ số nhịp điệu nói (WPM, filler words). |
| `skipQuestion` | boolean | Không | `true` nếu ứng viên chọn bỏ qua câu hỏi này. |

**Response body - 201 Created**

```json
{
  "answerId": "answer-uuid",
  "feedbackQueued": true
}
```

| Trường | Kiểu | Chú thích |
|--------|------|-----------|
| `answerId` | string | UUID của `UserAnswer` vừa tạo. |
| `feedbackQueued` | boolean | `true` nếu feedback job đã được enqueue vào outbox. |

Nếu session đang là `ready` hoặc `generating`, service chuyển session sang `active` trước khi lưu answer.

**Errors**

| HTTP | `errorCode` | Khi xảy ra |
|------|-------------|------------|
| 400 | `VALIDATION_ERROR` | Request body sai kiểu, thiếu trường theo mode hoặc nội dung dưới 10 ký tự. |
| 401 | `UNAUTHORIZED` | Bearer token thiếu, sai hoặc hết hạn. |
| 403 | `FORBIDDEN` | Session thuộc user khác. |
| 403 | `SESSION_NOT_ACTIVE` | Session không ở một trong `active`, `ready`, `generating`. |
| 404 | `SESSION_NOT_FOUND` | Không tìm thấy session. |
| 404 | `NOT_FOUND` | `questionId` không tồn tại trong session. |
| 500 | `INTERNAL_ERROR` | Lỗi cơ sở dữ liệu hoặc lỗi enqueue outbox job. |

## Ghi chú về Endpoint Upload Audio đã gỡ bỏ

- `POST /api/v1/sessions/:sessionId/turns/audio` (Upload file multipart audio và server-side Whisper transcription): **Đã gỡ bỏ hoàn toàn**. Hệ thống hiện tối ưu hóa bằng cách xử lý speech-to-text realtime tại client, tiết kiệm chi phí lưu trữ object storage và giảm độ trễ phản hồi.

# Interview Flow — Vấn đề và Phân tích

Tài liệu này ghi lại các vấn đề phát hiện sau khi phân tích luồng xử lý khi user tham gia phỏng vấn và nhận kết quả. Mỗi vấn đề kèm bằng chứng code (file:line) và hệ quả cụ thể.

---

## Vấn đề 1: Report generation dùng retry loop thay vì event-driven

**Mức độ:** Cao — latency tăng, fragility cao khi feedback bị delay

### Mô tả

Khi user PATCH `completed`, `session.service.ts:212` enqueue `comprehensive-report` job ngay lập tức, nhưng tại thời điểm đó các `feedback` jobs cho session đó có thể chưa xong. `ComprehensiveReportProcessor` kiểm tra đủ feedbacks tại line 44-51 và throw nếu thiếu, dẫn đến retry:

```
queue.constants.ts:9  → REPORT_JOB_ATTEMPTS = 20
queue.constants.ts:10 → REPORT_JOB_RETRY_DELAY_MS = 3_000
```

Tổng thời gian chờ tối đa: 60 giây, mỗi retry tốn 1 DB round-trip kiểm tra count.

### Hệ quả

- Nếu feedback job của 1 answer bị stuck hoặc fail, report job consume hết 20 attempts và fail hoàn toàn.
- 20 attempts không cần thiết, mỗi lần chạy query DB.
- Không có cơ chế signal rõ ràng "tất cả feedback đã hoàn thành".

### Root cause

`session.service.ts:212` enqueue report sớm hơn cần thiết. Đúng ra report chỉ nên enqueue khi feedback cuối cùng hoàn thành.

---

## Vấn đề 2: Voice transcription chạy đồng bộ trong HTTP handler

**Mức độ:** Cao — request timeout, UX kém

### Mô tả

`turn.service.ts:84` gọi `WhisperService.transcribe()` trực tiếp trong HTTP request handler:

```
POST /turns → download audio (timeout 15s) → call Whisper API → save → enqueue jobs → return
```

`whisper.service.ts` download file (timeout 15s, max 10MB), rồi call OpenAI Whisper-1. Với file audio 1-2 phút, tổng time có thể 5–30 giây. Client bị block trong thời gian này.

### Hệ quả

- Request timeout nếu audio lớn hoặc network chậm.
- Không thể hiển thị "processing" state cho user trong khi transcribe.
- Nếu Whisper API slow, user chờ mà không có feedback gì.

---

## Vấn đề 3: Follow-up job không có retry, không có fallback

**Mức độ:** Trung bình — silent data loss

### Mô tả

`turn.service.ts:137-140`:
```ts
await this.followUpQueue.add('follow-up', jobBase, {
  jobId: `follow-up-${answer.id}`,
  attempts: 1,  // hardcoded, không dùng constant
});
```

`follow-up.processor.ts:75-88`: catch block bắt quota error và log, nhưng với transient error (network timeout, 5xx), processor log error rồi **không re-throw** — job được coi là completed. Không có fallback content.

So sánh với `feedback.processor.ts`: 2 attempts, fallback message khi fail.

### Hệ quả

- Transient error → follow-up question mất silently.
- User không biết, không có cách recover.
- 1 attempt là quá ít cho I/O-heavy operation gọi OpenAI.

---

## Vấn đề 4: `answerText` không có minimum length validation

**Mức độ:** Trung bình — wasted AI tokens, data chất lượng kém

### Mô tả

`submit-answer.dto.ts:20-22`:
```ts
@ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'text')
@IsString()
answerText?: string;  // không có @MinLength
```

Empty string hoặc chuỗi 1-2 ký tự được chấp nhận. Khi đó:
- `feedback` job chạy với `answerText = ''` → GPT-4o generate feedback vô nghĩa → tốn tokens
- `overallScore = 0` tính vào `overallScore` của session report
- `FollowUpCoordinatorService.shouldGenerateFollowUp()` có check `length < 50` nhưng đây là business logic, không phải input validation — feedback job vẫn chạy

Thêm vào đó `turn.service.ts:95`: `answerText = dto.answerText ?? ''` — nếu text mode mà `answerText` không được gửi, sẽ là empty string.

---

## Vấn đề 5: Submission được chấp nhận khi session ở trạng thái 'generating'

**Mức độ:** Trung bình — race condition tiềm ẩn

### Mô tả

`turn.service.ts:49`:
```ts
if (!['active', 'ready', 'generating'].includes(session.status)) {
```

User có thể submit answer khi `status = 'generating'` — tức là `QuestionGenerationProcessor` chưa chạy xong, `session_questions` chưa được insert. `SessionQuestion.findFirst` ở line 56-62 check questionId theo sessionId, nhưng nếu questions chưa tồn tại, FK validation sẽ fail với lỗi không rõ ràng.

`turn.service.ts:64-69`: auto-activate session từ bất kỳ trạng thái nào (kể cả 'generating'), điều này tạo side-effect không kiểm soát được trong turn service.

---

## Vấn đề 6: Dead code — RewriteEvalProcessor và reverseQEvalJson

**Mức độ:** Thấp — technical debt, confusing codebase

### Mô tả

Các artifact tồn tại trong code nhưng không được sử dụng:

| Artifact | File | Trạng thái |
|----------|------|-----------|
| `RewriteEvalProcessor` | `ai/processors/rewrite-eval.processor.ts` | Processor có spec file, không được enqueue ở đâu |
| `REWRITE_EVAL_QUEUE` | `common/constants/queue.constants.ts:5` | Queue constant không dùng |
| `reverseQEvalJson` | `InterviewSession` Prisma model | Column luôn `{}` |
| `ReverseQuestion` | Prisma schema | Model có trong DB nhưng không có service/endpoint |

`queue.constants.ts:5` khai báo `REWRITE_EVAL_QUEUE = 'rewrite-eval'` — còn cả spec file `rewrite-eval.processor.spec.ts`.

---

## Vấn đề 7: Report chưa có signal rõ ràng về quality

**Mức độ:** Thấp — UX, client phải tự suy luận

### Mô tả

`report.service.ts:103-113`: khi tất cả feedbacks đều là fallback, `overallScore` được trả về `null`. Client phải check `overallScore === null` để biết report không đáng tin cậy. Không có field explicit như `reportQuality`.

Nếu một phần feedbacks là fallback (partial), không có cách nào client biết bao nhiêu turns được đánh giá thực sự vs bao nhiêu là placeholder.

`executiveSummary` có field `evaluatedTurns` và `fallbackTurns` từ `ComprehensiveReportProcessor`, nhưng client phải parse vào `executiveSummary` object (untyped) để lấy thông tin này.

---

## Vấn đề 8: SSE — N message handlers cho N concurrent clients

**Mức độ:** Thấp (scale) — minor optimization

### Mô tả

`sse.service.ts:68` và `44-89`: mỗi SSE connection đăng ký 1 handler riêng qua `this.subscriber.on('message', handler)`. Với N concurrent SSE connections, mỗi Redis message sẽ trigger N handlers (mỗi handler check `receivedChannel === channel`).

Lưu ý: `channelSubscribers` map (`sse.service.ts:22`) đảm bảo chỉ có 1 `subscriber.subscribe(channel)` call per channel (không phải per connection) — đây là điểm tốt. Vấn đề chỉ là O(N) handler dispatch thay vì O(subscribers_per_channel).

Ở scale MVP (< 100 concurrent), đây không phải bottleneck.

---

## Tóm tắt

| # | Vấn đề | Mức độ | Loại |
|---|--------|--------|------|
| 1 | Report dùng retry loop 20 lần thay vì event-driven | Cao | Architecture |
| 2 | Voice transcription đồng bộ trong HTTP handler | Cao | Architecture |
| 3 | Follow-up job: 1 attempt, không retry, không fallback | Trung bình | Reliability |
| 4 | `answerText` không có MinLength validation | Trung bình | Data quality |
| 5 | Cho phép submit khi session 'generating' | Trung bình | Correctness |
| 6 | Dead code: RewriteEvalProcessor, reverseQEvalJson | Thấp | Maintainability |
| 7 | Report quality signal mờ | Thấp | UX |
| 8 | SSE: N handlers cho N clients | Thấp | Performance |

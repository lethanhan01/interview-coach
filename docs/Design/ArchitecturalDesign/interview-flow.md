# Luồng xử lý phiên phỏng vấn — Từ đầu đến cuối

Tài liệu này mô tả những gì xảy ra bên trong hệ thống từ khi người dùng bắt đầu phiên phỏng vấn cho đến khi nhận được báo cáo đầy đủ từ AI.

---

## Bước 1: Người dùng tạo phiên phỏng vấn

Người dùng vào trang `/setup`, điền Job Description, chọn loại phỏng vấn (HR / Technical / Mixed), ngôn ngữ đánh giá (VN / Western), và số câu hỏi muốn luyện (3–10 câu).

Sau khi bấm Submit:

- Frontend gửi `POST /api/v1/sessions` lên backend.
- Backend tạo một record session trong database với trạng thái `generating`.
- Backend đẩy một job sinh câu hỏi vào hàng đợi BullMQ, rồi trả response ngay lập tức — **không chờ AI**.
- Frontend nhận response, chuyển người dùng sang trang phỏng vấn `/sessions/:id`.

> Tại sao không chờ? Vì gọi AI tốn vài giây. Backend đẩy việc sang worker chạy nền để người dùng không phải nhìn màn hình trắng chờ.

---

## Bước 2: AI sinh câu hỏi ở nền (background)

Trong khi người dùng đang thấy màn hình chờ, một worker BullMQ xử lý job sinh câu hỏi:

1. Worker chọn chiến lược phù hợp với loại phỏng vấn đã chọn (HR / Technical / Mixed).
2. Gọi GPT-4o với Job Description và rubric đánh giá của context pack (VN hoặc Western).
3. GPT-4o trả về danh sách câu hỏi dưới dạng JSON, được validate tự động.
4. **Nếu AI lỗi**: hệ thống lấy câu hỏi từ Question Bank — kho dự phòng 120 câu có sẵn trong database, chọn theo loại phỏng vấn và phân bố độ khó (30% dễ / 50% trung bình / 20% khó).
5. Lưu câu hỏi vào database, cập nhật trạng thái session thành `ready`.
6. Gửi thông báo về frontend qua SSE (Server-Sent Events).

---

## Bước 3: Frontend nhận câu hỏi và hiển thị

Ngay khi vào trang phỏng vấn, frontend mở một kết nối SSE duy trì suốt phiên:

```
GET /api/v1/sessions/:id/events?token=<access_token>
```

Kết nối này không đóng — backend sẽ đẩy thông báo về bất cứ khi nào có sự kiện mới. (Token qua query param vì browser không cho đặt header với EventSource.)

Song song đó, frontend cũng polling `GET /sessions/:id/questions` mỗi 5 giây, tối đa 6 lần, phòng trường hợp SSE bị miss.

Khi nhận được thông báo `session.status = 'ready'`:

- Frontend fetch danh sách câu hỏi.
- Hiển thị câu hỏi đầu tiên lên màn hình.
- Gửi `PATCH /sessions/:id/status { status: 'active' }` để chính thức bắt đầu phiên.

---

## Bước 4: Người dùng trả lời từng câu hỏi

Với mỗi câu hỏi, người dùng chọn một trong hai cách trả lời:

### Trả lời bằng text

Nhập trực tiếp vào ô text (tối thiểu 10 ký tự). Bấm Submit → frontend gửi:

```
POST /api/v1/sessions/:sessionId/turns
{ questionId, answerMode: 'text', answerText }
```

Backend lưu câu trả lời, đẩy job feedback vào hàng đợi, trả về `{ feedbackQueued: true }`.

### Trả lời bằng giọng nói

1. Người dùng bấm ghi âm — `MediaRecorder` API trong browser thu âm thanh.
2. Sau khi dừng: audio upload trực tiếp lên Supabase Storage, nhận về một public URL.
3. Frontend gửi URL đó lên backend:

```
POST /api/v1/sessions/:sessionId/turns
{ questionId, answerMode: 'voice', audioFileUrl, audioDurationSeconds, audioSizeBytes }
```

Backend lưu câu trả lời với text rỗng và `transcriptionStatus: 'pending'`, đẩy job transcription vào hàng đợi, trả về `{ transcriptionPending: true }`.

---

## Bước 5: AI đánh giá từng câu trả lời (chạy nền)

### Với câu trả lời text

Worker `FeedbackProcessor` xử lý:

1. Load câu hỏi + câu trả lời từ database.
2. Load rubric đánh giá theo context pack (VN: 4 tiêu chí × 25%; Western: 5 tiêu chí × 20%).
3. Gọi GPT-4o với câu hỏi, câu trả lời, và rubric.
4. GPT-4o trả về:
   - Điểm tổng (1–100).
   - Câu trả lời mẫu.
   - Nhận xét tóm tắt (key takeaway).
   - Danh sách các đoạn text cụ thể trong câu trả lời, mỗi đoạn được đánh dấu là `strength` (điểm mạnh) hoặc `improvement` (cần cải thiện), kèm comment và gợi ý cụ thể.
5. Lưu tất cả vào database.
6. Gửi SSE `turn.feedback_ready` về frontend.

Frontend nhận thông báo → hiển thị inline feedback cho câu đó trong khi người dùng tiếp tục trả lời câu tiếp theo.

### Với câu trả lời giọng nói

Thêm một bước trước feedback:

1. Worker `TranscriptionProcessor` lấy audio URL, gọi OpenAI Whisper để chuyển thành text.
2. Sau khi có text, tự động đẩy tiếp job feedback — từ đây xử lý giống hệt text mode.
3. Nếu Whisper thất bại (hết số lần thử): lưu feedback dự phòng với `isFallback=true`, không có điểm số, vẫn tính là đã xử lý xong.

---

## Bước 6: Kết thúc phỏng vấn và tạo báo cáo tổng hợp

Sau khi người dùng trả lời hết tất cả câu hỏi, frontend gửi:

```
PATCH /api/v1/sessions/:id/status { status: 'completed' }
```

Backend kiểm tra số câu trả lời phải đủ bằng số câu hỏi, rồi:

1. Cập nhật trạng thái session thành `completing` ngay (để retry an toàn nếu cần).
2. Đẩy job `comprehensive-report` vào hàng đợi với tất cả ID câu trả lời.

Worker `ComprehensiveReportProcessor` xử lý:

1. Load toàn bộ feedback, câu hỏi, câu trả lời của phiên.
2. Tính điểm tổng hợp theo trọng số của context pack.
3. Gọi GPT-4o để sinh 4 phần của báo cáo:
   - **Executive summary**: tóm tắt tổng quan, điểm tổng, số câu đã trả lời.
   - **Comm analysis**: phân tích kỹ năng giao tiếp.
   - **Competency heatmap**: điểm từng competency domain.
   - **Action plan**: kế hoạch cải thiện cụ thể, có thể thực hiện ngay.
4. Lưu 4 phần báo cáo vào database.
5. Cập nhật session thành `completed`.
6. Gửi SSE `report.ready` về frontend.

Frontend nhận thông báo → tự động chuyển người dùng sang trang báo cáo `/sessions/:id/report`.

---

## Bước 7: Hiển thị báo cáo

Trang `/sessions/:id/report` polling `GET /sessions/:id/report` mỗi 5 giây. Backend trả lỗi `REPORT_NOT_READY (202)` nếu chưa xong; frontend tiếp tục poll cho đến khi nhận được data thật.

Khi có báo cáo, trang hiển thị từ trên xuống dưới:

- **Điểm tổng**: con số lớn trên cùng (thang 0–100).
- **Metadata**: loại phỏng vấn, context pack, thời gian.
- **Phương pháp chấm điểm**: giải thích rubric và trọng số từng tiêu chí.
- **Tóm tắt tổng quan**: từ executive summary.
- **Biểu đồ competency**: bar chart điểm từng lĩnh vực.
- **Action plan**: kế hoạch cải thiện.
- **Annotated transcript**: toàn bộ transcript phiên phỏng vấn — mỗi câu trả lời có các đoạn được highlight màu theo `strength` / `improvement`, click vào xem comment và gợi ý cụ thể từ AI.

---

## Sơ đồ toàn luồng

```
[Người dùng] → POST /sessions
                    ↓
              [NestJS Backend] → lưu DB → đẩy job sinh câu hỏi
                    ↓
              [BullMQ Worker] → gọi GPT-4o → lưu câu hỏi → SSE "ready"
                    ↓
              [Frontend] nhận SSE → hiển thị câu hỏi
                    ↓
              [Người dùng trả lời] → POST /turns (text hoặc voice)
                    ↓
              [BullMQ Worker] → (Whisper nếu voice) → GPT-4o feedback
                             → lưu DB → SSE "feedback_ready"
                    ↓
              [Frontend] hiển thị inline feedback
                    ↓
              [Người dùng kết thúc] → PATCH status=completed
                    ↓
              [BullMQ Worker] → GPT-4o tạo 4 phần báo cáo → lưu DB
                             → SSE "report.ready"
                    ↓
              [Frontend] chuyển trang → poll GET /report → hiển thị
```

---

## Các trạng thái của session

| Trạng thái | Ý nghĩa |
|------------|---------|
| `generating` | Đang sinh câu hỏi |
| `ready` | Câu hỏi đã sẵn sàng, chưa bắt đầu |
| `active` | Đang diễn ra phỏng vấn |
| `completing` | Đang tạo báo cáo |
| `completed` | Báo cáo đã sẵn sàng |
| `error` | Sinh câu hỏi thất bại hoàn toàn |

Client chỉ được phép chuyển session lên `active` hoặc `completed` — các trạng thái còn lại do backend tự quản lý.

# SRS — AI Interview Coach System (InterviewAI)
## Chương 4: Yêu cầu phi chức năng
## Chương 5: Đặc tả tích hợp AI

---

> **Phiên bản:** 1.0 | **Ngày:** 22/04/2026 | **Trạng thái:** Draft

---

# CHƯƠNG 4 — YÊU CẦU PHI CHỨC NĂNG

---

## 4.1 Tính dễ dùng (Usability)

### 4.1.1 Nguyên tắc thiết kế

Hệ thống được thiết kế để người dùng có thể hoàn thành phiên phỏng vấn đầu tiên **mà không cần đọc hướng dẫn**. Toàn bộ luồng chính (paste JD → chọn Context Pack → trả lời → xem feedback) phải hoàn thành được chỉ với các nút và placeholder text đủ rõ ràng.

### 4.1.2 Các tiêu chí đo lường Usability

| Mã | Tiêu chí | Mục tiêu | Phương pháp đo |
|---|---|---|---|
| U-01 | Thời gian hoàn thành phiên đầu tiên (first session) | ≤ 5 phút kể từ lúc đăng nhập | User testing với nhóm 10 người |
| U-02 | Tỷ lệ người dùng hoàn thành cấu hình phiên mà không cần hỗ trợ | ≥ 90% | Funnel analytics: Session Config → Session Start |
| U-03 | Tỷ lệ người dùng hiểu được ý nghĩa 3 màu annotation | ≥ 85% trả lời đúng | Survey sau khi xem Annotated Transcript lần đầu |
| U-04 | Tỷ lệ người dùng tìm và sử dụng tính năng Rewrite | ≥ 70% sau khi xem Feedback | Behavioral tracking: nút "Luyện lại" |
| U-05 | Điểm SUS (System Usability Scale) | ≥ 70 / 100 | Khảo sát SUS 10 câu sau khi dùng thử |

### 4.1.3 Yêu cầu cụ thể

| Mã | Yêu cầu |
|---|---|
| U-06 | Hệ thống phải hiển thị trạng thái rõ ràng trong tất cả các bước có xử lý bất đồng bộ: loading spinner với text mô tả ("AI đang phân tích câu trả lời của bạn..."). |
| U-07 | Tất cả thông báo lỗi phải được viết bằng ngôn ngữ người dùng (tiếng Việt / Anh), không hiển thị mã lỗi kỹ thuật thô (stack trace, HTTP status code). |
| U-08 | Giao diện Annotated Transcript phải có legend màu sắc luôn hiển thị để người dùng không cần nhớ ý nghĩa từng màu. |
| U-09 | Popup feedback khi click segment phải đóng được bằng cả ba cách: click ra ngoài, nhấn phím Escape, và nhấn nút X. |
| U-10 | Khu vực ghi âm phải có visual feedback rõ ràng: waveform animation khi đang ghi, countdown timer nếu gần đạt giới hạn 5 phút. |
| U-11 | Trên màn hình Rewrite & Compare, cột "Lần trước" phải được làm mờ (opacity 0.6) và không cho phép tương tác để Candidate tập trung vào cột nhập mới. |
| U-12 | Hệ thống phải responsive trên màn hình ≥ 1024px (desktop/laptop). Không yêu cầu mobile trong v1.0 nhưng không được vỡ layout. |

---

## 4.2 Hiệu năng (Performance)

### 4.2.1 Latency — Toàn bộ hệ thống

Bảng dưới đây phân loại toàn bộ các operation theo thời gian phản hồi kỳ vọng, với ngưỡng cảnh báo và ngưỡng lỗi tương ứng.

| Mã | Operation | Mục tiêu (P95) | Ngưỡng cảnh báo | Ngưỡng lỗi | Ghi chú |
|---|---|---|---|---|---|
| **P-01** | Tải trang (non-AI pages) | ≤ 1,500 ms | > 2,000 ms | > 5,000 ms | First Contentful Paint |
| **P-02** | Tất cả API call non-AI (CRUD) | ≤ 200 ms | > 500 ms | > 2,000 ms | Đo từ client gửi đến nhận response |
| **P-03** | Upload audio lên Cloudflare R2 | ≤ 2,000 ms | > 3,000 ms | > 8,000 ms | File ≤ 10 MB |
| **P-04** | Whisper API — Transcription (audio ≤ 2 phút) | ≤ 3,000 ms | > 5,000 ms | > 10,000 ms | Đo từ khi gửi audio đến nhận transcript |
| **P-05** | Follow-up Engine (GPT-4o) | ≤ 4,000 ms | > 6,000 ms | > 8,000 ms | Timeout trigger fallback ở 8,000 ms |
| **P-06** | Feedback Analyzer — Surgical Feedback | ≤ 8,000 ms | > 10,000 ms | > 15,000 ms | Timeout trigger retry ở 15,000 ms |
| **P-07** | Rewrite Evaluator (GPT-4o) | ≤ 8,000 ms | > 10,000 ms | > 15,000 ms | Tương tự Feedback Analyzer |
| **P-08** | Toàn bộ pipeline một câu trả lời (Whisper + Follow-up + Feedback) | ≤ 15,000 ms | > 20,000 ms | > 30,000 ms | End-to-end từ user stop recording đến annotation hiển thị |
| **P-09** | Question Generator (cấu hình phiên) | ≤ 10,000 ms | > 12,000 ms | > 15,000 ms | Có thể chạy background; UI tiếp tục ngay |
| **P-10** | Parse CV PDF (pdfplumber) | ≤ 3,000 ms | > 5,000 ms | > 10,000 ms | File ≤ 5 MB |

> **Chú thích P95:** 95% requests phải đạt mục tiêu. 5% còn lại có thể vượt nhưng không được vượt ngưỡng lỗi.

### 4.2.2 Throughput và Concurrency

| Mã | Tiêu chí | Mục tiêu | Giai đoạn |
|---|---|---|---|
| P-11 | Concurrent active sessions | ≥ 50 phiên đồng thời | Prototype (v1.0) |
| P-12 | Concurrent active sessions | ≥ 500 phiên đồng thời | Sau prototype (v2.0) |
| P-13 | API requests per second (non-AI) | ≥ 200 RPS | Prototype |
| P-14 | OpenAI API calls per minute | Giới hạn bởi OpenAI tier | Theo tier đăng ký |
| P-15 | Thời gian khởi động cold start — FastAPI | ≤ 5,000 ms | Railway deployment |

### 4.2.3 Kích thước và giới hạn dữ liệu

| Mã | Giới hạn | Giá trị | Lý do kỹ thuật |
|---|---|---|---|
| P-16 | Kích thước file audio tối đa | 25 MB | Giới hạn Whisper API |
| P-17 | Thời lượng audio tối đa mỗi câu | 5 phút | Tránh transcript quá dài vượt token budget |
| P-18 | Độ dài JD tối đa | 5,000 ký tự | Khoảng 1,000–1,500 tokens; kiểm soát input budget |
| P-19 | Kích thước CV PDF tối đa | 5 MB | Đủ cho 3–5 trang CV; tránh timeout parse |
| P-20 | Số câu hỏi tối đa mỗi phiên | 7 câu | Cân bằng giữa độ sâu và chi phí AI |
| P-21 | Số lần Rewrite tối đa mỗi câu | Không giới hạn | Khuyến khích luyện tập; chi phí do người dùng tạo ra |

---

## 4.3 Bảo mật (Security)

### 4.3.1 Xác thực và Phân quyền

| Mã | Yêu cầu | Chi tiết |
|---|---|---|
| S-01 | JWT Authentication | Tất cả API endpoints (trừ `/auth/*` và `/health`) yêu cầu Bearer token hợp lệ. |
| S-02 | Token expiry | JWT hết hạn sau **7 ngày**. Refresh token hết hạn sau **30 ngày**. |
| S-03 | Role-based access | Hai role: `user` và `admin`. Endpoint `/admin/*` chỉ cho phép `admin`. Middleware validate role tại backend. |
| S-04 | Row-Level Security (RLS) | Bật RLS trên tất cả bảng Supabase. Người dùng chỉ SELECT/UPDATE được row có `user_id = auth.uid()`. |
| S-05 | API Key bảo mật | OpenAI API key, Cloudflare R2 credentials và Supabase service key **chỉ tồn tại trên server-side**. Không bao giờ expose ra client hoặc lưu trong localStorage. |

### 4.3.2 Bảo vệ dữ liệu

| Mã | Yêu cầu | Chi tiết |
|---|---|---|
| S-06 | HTTPS bắt buộc | Toàn bộ traffic phải qua TLS 1.2+. HTTP request bị redirect tự động về HTTPS. |
| S-07 | Audio privacy | File audio chỉ được upload lên Cloudflare R2 và gửi đến Whisper API. Không chia sẻ với bất kỳ bên thứ ba nào khác. URL R2 phải là pre-signed URL với TTL 1 giờ — không phải public URL. |
| S-08 | CV data | Nội dung CV parse được lưu dạng encrypted-at-rest trong Supabase. Không được log `cv_parsed_text` ra console hoặc error log. |
| S-09 | Input sanitization | Tất cả text input từ người dùng (JD, câu trả lời) phải được strip HTML và kiểm tra độ dài trước khi đưa vào prompt AI. |
| S-10 | Prompt injection prevention | System prompt của AI Engine phải được tách biệt hoàn toàn với user input bằng delimiter rõ ràng. Không cho phép user input override system prompt. |

### 4.3.3 Giới hạn và Rate Limiting

| Mã | Endpoint / Operation | Giới hạn | Hành vi khi vượt |
|---|---|---|---|
| S-11 | POST `/ai/*` (tất cả AI calls) | 10 requests/phút/user | HTTP 429; message: "Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau." |
| S-12 | POST `/sessions` (tạo phiên mới) | 10 phiên/ngày/user | HTTP 429; message: "Đã đạt giới hạn phiên hôm nay." |
| S-13 | POST `/auth/*` (đăng nhập) | 20 attempts/15 phút/IP | Block IP 15 phút; log sự kiện |
| S-14 | Upload file (CV, audio) | 50 MB/giờ/user | HTTP 429 |

---

## 4.4 Độ tin cậy (Reliability)

### 4.4.1 Uptime và Availability

| Mã | Tiêu chí | Mục tiêu | Ghi chú |
|---|---|---|---|
| R-01 | Uptime hệ thống (frontend + backend non-AI) | ≥ 99.0% / tháng | Cho phép tối đa ~7 giờ downtime/tháng |
| R-02 | Uptime khi phụ thuộc OpenAI có sự cố | Degraded mode hoạt động | Xem 4.4.2 |
| R-03 | Thời gian phục hồi sau sự cố (RTO) | ≤ 30 phút | Với Railway auto-restart |
| R-04 | Thời gian mất dữ liệu tối đa (RPO) | ≤ 5 phút | Supabase có WAL và point-in-time recovery |

### 4.4.2 Degraded Mode — Khi OpenAI API không khả dụng

| Tính năng | Hành vi khi OpenAI offline |
|---|---|
| Question Generator | Dùng câu hỏi từ Question Bank seed. Không tạo câu hỏi mới từ JD. |
| Follow-up Engine | `skip_follow_up = true` cho toàn bộ câu. Phiên vẫn tiếp tục. |
| Feedback Analyzer | Hiển thị fallback text: *"Phân tích AI tạm thời không khả dụng. Câu trả lời của bạn đã được lưu. Hãy quay lại sau để xem phân tích đầy đủ."* |
| Whisper (STT) | Yêu cầu người dùng chuyển sang Text input. |

### 4.4.3 Data Integrity

| Mã | Yêu cầu |
|---|---|
| R-05 | Transcript phải được lưu **trước** khi gọi AI. Nếu AI fail, transcript không bị mất. |
| R-06 | `InterviewSession` và `UserAnswer` phải được lưu với transaction — hoặc cả hai thành công, hoặc cả hai rollback. |
| R-07 | Audio file trên R2 và `audio_url` trong DB phải nhất quán. Batch job hàng ngày kiểm tra orphaned files. |
| R-08 | Không cho phép `DELETE` vật lý trên `UserAnswer`, `AIFeedback`, `AnnotatedSegment`. Chỉ dùng soft delete (`is_deleted = true`). |

---

## 4.5 Khả năng mở rộng (Scalability)

| Mã | Tiêu chí | Thiết kế hiện tại | Thiết kế tương lai |
|---|---|---|---|
| SC-01 | Tăng concurrent users | Vercel auto-scale serverless; Railway scale theo container | Kubernetes + horizontal pod autoscaling |
| SC-02 | Tăng AI throughput | Tăng OpenAI tier; thêm request queue | Multi-provider (OpenAI + Gemini + local LLM) |
| SC-03 | Thêm Context Pack mới | Thêm record vào bảng `ContextPack` trong DB; không cần code thay đổi | — |
| SC-04 | Thêm ngôn ngữ phỏng vấn | Cập nhật system prompt; filler words dictionary theo ngôn ngữ | — |
| SC-05 | Vector search cho JD | pgvector đã được bật trên Supabase; schema sẵn sàng | Bật semantic search khi Question Bank > 1,000 câu |
| SC-06 | Database | Supabase free tier (500 MB) đủ cho prototype | Supabase Pro ($25/tháng) khi vượt 500 MB |

---

## 4.6 Khả năng bảo trì (Maintainability)

| Mã | Yêu cầu | Chi tiết |
|---|---|---|
| M-01 | Cấu trúc monorepo | `/frontend` (Next.js), `/backend-auth` (NestJS), `/backend-ai` (FastAPI), `/docs` (SRS + ADR). |
| M-02 | Environment variables | Tất cả config nhạy cảm phải qua `.env`. Không hardcode API key hoặc URL vào code. |
| M-03 | Logging | Tất cả AI request/response (không bao gồm nội dung nhạy cảm) phải được log với `session_id`, `question_id`, `latency_ms`, `token_usage`. |
| M-04 | Prompt versioning | Mỗi prompt type phải có version string (ví dụ: `followup-v1.2`). Khi cập nhật prompt, phải bump version và ghi chú thay đổi. |
| M-05 | Schema migration | Dùng Supabase Migration files (`supabase/migrations/*.sql`). Không chỉnh DB trực tiếp trên production. |
| M-06 | Error tracking | Tích hợp Sentry (hoặc tương đương) cho cả frontend và backend. Mọi unhandled exception phải tạo alert. |
| M-07 | AI quality log | Lưu riêng bảng `AIQualityLog` ghi lại: session_id, question_id, prompt_version, output_quality (nếu user report), để phục vụ cải thiện prompt. |

---

## 4.7 Chất lượng AI (AI Quality)

### 4.7.1 Tiêu chí chất lượng định lượng

| Mã | Tiêu chí | Mục tiêu | Phương pháp đo |
|---|---|---|---|
| Q-01 | Tỷ lệ Follow-up câu hỏi chứa phrase từ transcript người dùng | 100% | Automated test: kiểm tra `target_phrase` ∈ `user_transcript` |
| Q-02 | Tỷ lệ Surgical Feedback segments `warning`/`critical` có `improved_version` không rỗng | 100% | Backend validation; log violation |
| Q-03 | Tỷ lệ người dùng đánh giá feedback là "cụ thể và hữu ích" | ≥ 80% | Post-session survey (1 câu, 5-point scale) |
| Q-04 | Tỷ lệ người dùng dùng tính năng Rewrite sau khi xem feedback | ≥ 70% | Behavioral tracking: event `rewrite_started` |
| Q-05 | Tỷ lệ AI output đúng schema (không cần fallback) | ≥ 95% | Log: `is_fallback` field trong `AIFeedback` |
| Q-06 | Filler words tiếng Việt được detect chính xác | ≥ 90% precision | Manual test với transcript mẫu có/không có filler words |
| Q-07 | Delta Score phản ánh đúng cải thiện thực tế | Correlation ≥ 0.7 với human rater | So sánh Delta Score AI với đánh giá của 3 HR chuyên gia |

### 4.7.2 Cơ chế đo lường và cải thiện liên tục

```
Vòng lặp cải thiện chất lượng AI:

[User session] → [AI output] → [User behavior]
                                       │
                    ┌──────────────────┤
                    │                  │
             [Survey rating]    [Rewrite rate]
             [Thumbs up/down]   [Session completion]
                    │
                    ▼
             [AIQualityLog]
                    │
                    ▼
          [Weekly prompt review]
                    │
                    ▼
          [Prompt update + version bump]
```

| Chu kỳ | Hoạt động |
|---|---|
| Hàng ngày | Review log các session có `is_fallback = true` |
| Hàng tuần | Phân tích survey ratings và Rewrite rate; identify outlier sessions |
| Khi cần | Cập nhật prompt nếu Q-03 < 70% trong 3 ngày liên tiếp |

---

## 4.8 An toàn nội dung AI (AI Safety)

### 4.8.1 Xử lý input không phù hợp

| Mã | Loại input | Xử lý |
|---|---|---|
| AS-01 | JD chứa nội dung nhạy cảm / offensive | OpenAI Moderation API kiểm tra JD trước khi đưa vào Question Generator. Nếu flagged → từ chối tạo phiên, hiển thị thông báo. |
| AS-02 | Câu trả lời chứa nội dung không phù hợp | OpenAI Moderation API kiểm tra transcript. Nếu flagged → không gọi Feedback Analyzer; hiển thị: *"Câu trả lời của bạn chứa nội dung không phù hợp và không thể phân tích."* |
| AS-03 | Prompt injection trong câu trả lời | System prompt và user input được tách biệt bằng XML-style delimiter. Input người dùng được wrap trong `<user_answer>...</user_answer>`. |
| AS-04 | JD quá ngắn hoặc vô nghĩa | Minimum 50 ký tự; nếu Question Generator trả về câu hỏi không liên quan đến phỏng vấn → fallback Question Bank. |

### 4.8.2 Giới hạn nội dung AI được phép sinh

| Loại nội dung | Cho phép | Không cho phép |
|---|---|---|
| Câu hỏi phỏng vấn | Tất cả loại phỏng vấn behavioral, situational, motivational | Câu hỏi phân biệt đối xử (tuổi, giới tính, tôn giáo, tình trạng hôn nhân) |
| Feedback | Nhận xét về kỹ năng giao tiếp, cấu trúc, nội dung | Nhận xét về ngoại hình, giọng nói theo nghĩa phân biệt đối xử |
| Model Answer | Câu trả lời mẫu phù hợp với JD | Bịa đặt thông tin không có trong CV hoặc JD |
| Follow-up | Câu hỏi đào sâu về kinh nghiệm và kỹ năng | Câu hỏi về đời tư không liên quan đến công việc |

### 4.8.3 Content Moderation Policy

```
Input flow với moderation:

[User Input (JD / Transcript)]
           │
           ▼
[OpenAI Moderation API]
     /            \
[Safe]          [Flagged]
  │                │
  ▼                ▼
[Tiếp tục]    [Block + Log + Notify user]
              [Không lưu flagged content vào DB]
```

---

## 4.9 Chi phí & Giới hạn vận hành AI (AI Cost)

### 4.9.1 Token Budget — Chi tiết từng operation

Bảng dưới đây xác định giới hạn token cho từng lần gọi API, cùng với ước tính chi phí theo giá GPT-4o hiện tại ($2.50/1M input tokens, $10.00/1M output tokens — tháng 4/2026).

#### Bảng 1: Token Budget per API Call

| Operation | Model | Input Tokens | Output Tokens | Tổng Tokens | Chi phí ước tính/call |
|---|---|---|---|---|---|
| **Question Generator** | GPT-4o | ≤ 1,500 | ≤ 600 | ≤ 2,100 | ~$0.0096 |
| — System prompt | | ~400 | | | |
| — JD context | | ~800 | | | |
| — CV context (optional) | | ~300 | | | |
| **Follow-up Engine** | GPT-4o | ≤ 900 | ≤ 150 | ≤ 1,050 | ~$0.0037 |
| — System prompt | | ~350 | | | |
| — Câu hỏi gốc | | ~50 | | | |
| — User transcript | | ~400 | | | |
| — JD context (tóm tắt) | | ~100 | | | |
| **Feedback Analyzer** | GPT-4o | ≤ 2,000 | ≤ 1,500 | ≤ 3,500 | ~$0.0200 |
| — System prompt + rubric | | ~600 | | | |
| — Composite transcript | | ~600 | | | |
| — JD context | | ~500 | | | |
| — CV context (optional) | | ~300 | | | |
| **Rewrite Evaluator** | GPT-4o | ≤ 2,500 | ≤ 1,500 | ≤ 4,000 | ~$0.0213 |
| — Như Feedback Analyzer | | ~2,000 | | | |
| — Old transcript + summary | | ~500 | | | |
| **Whisper (STT)** | whisper-1 | N/A | N/A | ~1 phút audio | $0.006/phút |

#### Bảng 2: Chi phí ước tính per Session (5 câu)

| Thành phần | Số lần gọi | Chi phí/lần | Tổng |
|---|---|---|---|
| Question Generator | 1 | $0.0096 | $0.0096 |
| Whisper (trung bình 2 phút audio/câu) | 5 câu × 2 phút | $0.006/phút | $0.0600 |
| Follow-up Engine | 5 câu (giả sử 80% có follow-up) | $0.0037 | $0.0148 |
| Whisper (follow-up, ~1 phút/câu) | 4 câu × 1 phút | $0.006/phút | $0.0240 |
| Feedback Analyzer | 5 câu | $0.0200 | $0.1000 |
| **Tổng — Phiên cơ bản** | | | **~$0.21** |
| Rewrite Evaluator (nếu Rewrite 2 câu) | 2 lần | $0.0213 | $0.0426 |
| **Tổng — Phiên đầy đủ (với Rewrite)** | | | **~$0.25** |

#### Bảng 3: Chi phí ước tính theo quy mô người dùng

| Số phiên/ngày | Chi phí AI/ngày | Chi phí AI/tháng | Ghi chú |
|---|---|---|---|
| 50 phiên | ~$10.50 | ~$315 | Prototype — nhóm thử nghiệm |
| 200 phiên | ~$42 | ~$1,260 | Post-prototype |
| 1,000 phiên | ~$210 | ~$6,300 | Scale-up; cần batch discount |

### 4.9.2 Rate Limiting và Chiến lược Tối ưu

#### Giới hạn từ OpenAI (tier mặc định)

| Metric | Giới hạn OpenAI | Giới hạn hệ thống (buffer 20%) |
|---|---|---|
| Requests per minute (RPM) | 500 RPM | 400 RPM effective |
| Tokens per minute (TPM) | 200,000 TPM | 160,000 TPM effective |
| Tokens per day (TPD) | 2,000,000 TPD | 1,600,000 TPD effective |

#### Chiến lược tối ưu chi phí

| Chiến lược | Mô tả | Tiết kiệm ước tính |
|---|---|---|
| **JD Summarization** | Nếu JD > 800 tokens, dùng GPT-4o-mini để tóm tắt trước khi đưa vào prompt chính | ~15% input tokens |
| **CV Caching** | Parse CV một lần, cache `cv_parsed_text` trong Redis (TTL: 24 giờ). Không re-parse mỗi phiên | ~$0.001/phiên |
| **Follow-up Caching** | Nếu cùng câu hỏi + transcript giống > 85% → dùng cached follow-up (Redis, TTL: 1 giờ) | ~5–10% follow-up calls |
| **Batch AI calls** | Follow-up Engine và Feedback Analyzer có thể gọi song song (Promise.all) nếu không có follow-up | ~2,000 ms latency reduction |
| **Whisper optimization** | Compress audio WebM → MP3 (bitrate 64kbps) trước khi upload. Giảm file size ~60% | Không giảm token cost; giảm storage |
| **GPT-4o-mini cho non-critical** | Question Generator (fallback) có thể dùng GPT-4o-mini ($0.15/1M input vs $2.50) | ~85% cho operation này |

### 4.9.3 Monitoring và Alert

| Alert | Ngưỡng kích hoạt | Hành động |
|---|---|---|
| Chi phí AI hàng ngày | > $20/ngày | Gửi email alert; review manual |
| Tỷ lệ fallback | > 10% sessions trong 1 giờ | Alert Slack; kiểm tra OpenAI status |
| TPM utilization | > 80% trong 5 phút liên tiếp | Kích hoạt request queue; throttle tạo session mới |
| Token budget violation | Bất kỳ call nào vượt token limit | Log warning; cắt bớt input tự động |

---

# CHƯƠNG 5 — ĐẶC TẢ TÍCH HỢP AI (AI INTEGRATION SPECIFICATION)

---

## 5.1 AI Provider & Model

### 5.1.1 Lựa chọn Provider và Model

| Module | Provider | Model | Lý do lựa chọn |
|---|---|---|---|
| Question Generator | OpenAI | `gpt-4o` | JSON mode đảm bảo output có cấu trúc; chất lượng câu hỏi phong phú, bám sát JD. |
| Follow-up Engine | OpenAI | `gpt-4o` | Yêu cầu hiểu ngữ cảnh sâu để phân tích transcript và sinh câu hỏi contextual. GPT-4o vượt trội so với mini model trong tác vụ này. |
| Feedback Analyzer | OpenAI | `gpt-4o` | Tác vụ phức tạp nhất — phân tích từng đoạn, so sánh rubric, sinh `improved_version`. Không thể dùng model nhỏ hơn. |
| Rewrite Evaluator | OpenAI | `gpt-4o` | Cần so sánh 2 transcript và tính Delta Score chính xác. |
| Speech-to-Text | OpenAI | `whisper-1` | Độ chính xác cao nhất cho tiếng Việt trong số các STT API hiện có. Latency thấp (~1–2 giây cho audio 1 phút). |
| JD Embedding (optional) | OpenAI | `text-embedding-3-small` | Chi phí thấp ($0.02/1M tokens); đủ chất lượng cho semantic search trong Question Bank. |
| Question Generator (fallback) | OpenAI | `gpt-4o-mini` | Dùng khi Question Generator chính bị rate limit; chi phí thấp hơn 94%; chất lượng đủ cho câu hỏi seed. |

### 5.1.2 Phiên bản và tính ổn định

| Yêu cầu | Chi tiết |
|---|---|
| Model pinning | Sử dụng model string cố định (`gpt-4o-2024-11-20` hoặc alias `gpt-4o`) thay vì `latest` để tránh breaking changes khi OpenAI update. |
| Kiểm tra model availability | Health check endpoint gọi `GET /models` mỗi 5 phút để phát hiện sớm nếu model bị deprecated. |
| Fallback chain | `gpt-4o` → `gpt-4o-mini` (nếu rate limit) → Question Bank (nếu cả hai fail). |

---

## 5.2 Chiến lược Prompt (Prompt Engineering)

### 5.2.1 Kiến trúc Prompt Chung

Tất cả prompt trong InterviewAI tuân theo cấu trúc 3 lớp:

```
┌──────────────────────────────────────────────────────────┐
│ LAYER 1 — Base System Prompt (bất biến)                  │
│ Định nghĩa vai trò AI, ngôn ngữ, format output bắt buộc │
│ Nhúng: JSON schema yêu cầu                              │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│ LAYER 2 — Context Pack Overlay (theo phiên)             │
│ System prompt của VN / Western Pack                     │
│ Rubric chấm điểm với trọng số                           │
│ Lưu ý văn hóa đặc thù                                   │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│ LAYER 3 — Dynamic User Context (theo câu hỏi)           │
│ <job_description>...</job_description>                  │
│ <cv_context>...</cv_context>                            │
│ <question>...</question>                                │
│ <user_answer>...</user_answer>                          │
└──────────────────────────────────────────────────────────┘
```

> **Quy tắc bảo mật:** User input **luôn** được wrap trong XML tag tương ứng. Kỹ thuật này ngăn prompt injection vì model đã được instruction rõ ràng rằng nội dung trong tag là "dữ liệu đầu vào" — không phải instruction.

### 5.2.2 Prompt 1 — Question Generator

**Version:** `question-gen-v1.0`

**System Prompt:**
```
Bạn là chuyên gia HR và phỏng vấn với nhiều năm kinh nghiệm tuyển dụng.

NHIỆM VỤ: Dựa trên Job Description và thông tin ứng viên, sinh ra {n} câu hỏi phỏng vấn phù hợp.

[CONTEXT PACK OVERLAY — được inject động từ DB]

QUY TẮC:
1. Câu hỏi phải liên quan trực tiếp đến yêu cầu trong JD — không hỏi chủ đề không liên quan.
2. Phân bổ: 60% Behavioral ("Hãy kể về..."), 30% Situational ("Nếu bạn gặp tình huống..."), 10% Motivational ("Tại sao bạn...").
3. Mỗi câu hỏi phải có độ khó phù hợp với level ứng viên.
4. KHÔNG hỏi về: tuổi, giới tính, tình trạng hôn nhân, tôn giáo, quốc tịch.
5. Trả lời CHÍNH XÁC theo JSON schema. Không thêm text ngoài JSON.
6. Nếu JD không đủ thông tin, sinh câu hỏi behavioral chung về kỹ năng mềm.
```

**User Prompt:**
```
<job_description>
{jd_text}
</job_description>

<cv_context>
{cv_parsed_text_or_empty}
</cv_context>

Hãy sinh {n} câu hỏi phỏng vấn. Trả về JSON theo schema sau.
```

**Output Schema:**
```json
{
  "questions": [
    {
      "id": "q_001",
      "text": "Hãy kể về một lần bạn phải xử lý mâu thuẫn trong nhóm và kết quả như thế nào?",
      "category": "behavioral",
      "difficulty": "junior",
      "jd_relevance": "teamwork requirement in JD line 3"
    }
  ],
  "generation_metadata": {
    "prompt_version": "question-gen-v1.0",
    "context_pack": "vn",
    "question_count": 5
  }
}
```

### 5.2.3 Prompt 2 — Follow-up Engine

**Version:** `followup-v1.0`

**System Prompt:**
```
Bạn là HR chuyên gia đang thực hiện phỏng vấn trực tiếp.

[CONTEXT PACK OVERLAY]

NHIỆM VỤ: Đọc câu trả lời của ứng viên và quyết định có nên hỏi thêm không.

NGUYÊN TẮC BẮT BUỘC — VI PHẠM BẤT KỲ ĐIỀU NÀO LÀ LỖI CHẤT LƯỢNG:
1. Câu follow-up PHẢI chứa ít nhất 1 cụm từ được trích dẫn nguyên văn từ transcript người dùng. Field target_phrase phải là substring của user_transcript.
2. KHÔNG hỏi về chủ đề hoàn toàn mới không có trong transcript.
3. Chỉ chọn đúng 1 loại follow-up: clarify / challenge / expand.
4. Nếu câu trả lời đã cụ thể, có số liệu, và đủ cả 4 thành phần STAR → đặt skip_follow_up = true.
5. Field "reasoning" là ghi chú nội bộ, KHÔNG hiển thị cho ứng viên.
6. Trả lời CHÍNH XÁC theo JSON schema. Không thêm text ngoài JSON.

ĐỊNH NGHĨA CÁC LOẠI FOLLOW-UP:
- clarify: Ứng viên dùng từ mơ hồ ("khá tốt", "một thời gian", "thành công") cần được làm rõ bằng số liệu hoặc mô tả cụ thể.
- challenge: Ứng viên đưa ra claim chưa được chứng minh ("Tôi giỏi nhất", "Ai cũng đồng ý") cần được thách thức.
- expand: Câu trả lời đầy đủ nhưng thiếu chiều sâu — có thể đào sâu vào khó khăn, bài học, hoặc tình huống phức tạp hơn.
- skip: Không cần follow-up.
```

**User Prompt:**
```
<question>
{question_text}
</question>

<user_answer>
{user_transcript}
</user_answer>

<job_description_summary>
{jd_summary_200_tokens}
</job_description_summary>

Phân tích và trả về JSON theo schema.
```

### 5.2.4 Prompt 3 — Feedback Analyzer (Surgical Feedback)

**Version:** `surgical-feedback-v1.0`

**System Prompt:**
```
Bạn là chuyên gia phân tích kỹ năng phỏng vấn với nhiều năm huấn luyện ứng viên.

[CONTEXT PACK OVERLAY với RUBRIC đầy đủ]

NHIỆM VỤ: Phân tích transcript câu trả lời và sinh Surgical Feedback theo từng đoạn.

NGUYÊN TẮC PHÂN TÍCH — TUÂN THỦ NGHIÊM NGẶT:
1. Chia transcript thành các segment có nghĩa. Một segment = một ý hoàn chỉnh (thường 5–25 từ).
2. Filler words ("ừm", "à", "thì", "ý là", "kiểu như", "thật ra thì", "um", "uh", "like", "you know") → LUÔN là "critical".
3. Ngôn ngữ mơ hồ không định lượng được (trong context cần số liệu) → "warning".
4. Câu đổ lỗi cho người khác hoặc môi trường → "critical".
5. Câu thể hiện tinh thần tập thể rõ ràng (VN Pack) / Câu có số liệu cụ thể (Western Pack) → "good".
6. Mỗi segment "warning" hoặc "critical" PHẢI có improved_version không rỗng — cụ thể, không phải lời khuyên chung.
7. improved_version là PHIÊN BẢN ĐÃ VIẾT LẠI của đúng đoạn đó — không phải câu trả lời hoàn chỉnh.
8. Model Answer là câu trả lời HOÀN CHỈNH lý tưởng, tham chiếu JD và CV ứng viên (nếu có).
9. Key Takeaway là 1 câu ngắn — điểm cải thiện QUAN TRỌNG NHẤT và DUY NHẤT.
10. overall_score dựa trên rubric của Context Pack. Tính có trọng số.
11. Ngôn ngữ feedback: khớp với ngôn ngữ trong transcript (Việt → feedback Việt, Anh → feedback Anh).
12. Trả lời CHÍNH XÁC theo JSON schema. KHÔNG thêm bất kỳ text nào ngoài JSON.
```

**User Prompt:**
```
<question>
{question_text}
</question>

<composite_transcript>
{transcript_main_answer}

[Follow-up question]: {follow_up_question_text}
[Follow-up answer]: {transcript_follow_up_answer}
</composite_transcript>

<job_description>
{jd_text}
</job_description>

<cv_context>
{cv_parsed_text_or_empty}
</cv_context>

Phân tích và trả về JSON Surgical Feedback theo schema.
```

### 5.2.5 Prompt 4 — Rewrite Evaluator

**Version:** `rewrite-eval-v1.0`

**System Prompt:**
```
[System Prompt giống Feedback Analyzer]

BỔ SUNG — ĐÂY LÀ LẦN THỬ LẠI SỐ {attempt_number}:
- Transcript cũ và điểm cũ được cung cấp để so sánh.
- Ngoài phân tích thông thường, hãy tính delta_score = overall_score_new - overall_score_old.
- Trong comparison_summary:
  • issues_fixed: Những vấn đề trong lần cũ đã được sửa trong lần này.
  • issues_remaining: Vấn đề từ lần cũ vẫn còn tồn tại.
  • new_issues: Vấn đề mới xuất hiện trong lần này (không có trong lần cũ).
- Key Takeaway nên ghi nhận tiến bộ nếu delta_score > 0.
- Trả lời CHÍNH XÁC theo JSON schema.
```

**User Prompt:**
```
<question>
{question_text}
</question>

<new_answer>
{new_transcript}
</new_answer>

<old_answer>
{old_transcript}
</old_answer>

<old_feedback_summary>
Overall score: {old_score}
Critical issues: {old_critical_issues_list}
</old_feedback_summary>

<job_description>
{jd_text}
</job_description>

Đánh giá lại và trả về JSON Rewrite Evaluation theo schema.
```

### 5.2.6 Cơ chế kiểm soát Output

| Kỹ thuật | Áp dụng cho | Chi tiết |
|---|---|---|
| **JSON Mode** | Tất cả 4 prompt | `response_format: { type: "json_object" }` — đảm bảo output luôn là JSON hợp lệ về cú pháp. |
| **Temperature** | Follow-up Engine | `temperature: 0.7` — cần đa dạng nhưng vẫn logic. |
| **Temperature** | Feedback Analyzer, Rewrite Evaluator | `temperature: 0.3` — cần nhất quán và chính xác. |
| **Temperature** | Question Generator | `temperature: 0.8` — cần câu hỏi đa dạng. |
| **Max tokens** | Tất cả | Đặt `max_tokens` tương ứng với output budget trong Bảng 1 mục 4.9.1. |
| **XML delimiter** | Tất cả user input | Input người dùng được wrap trong XML tag riêng để tránh prompt injection. |
| **Schema validation** | Backend FastAPI | Validate Pydantic model sau khi nhận JSON từ AI trước khi lưu DB. |

---

## 5.3 Cấu trúc Output AI (Response Schema)

### 5.3.1 Schema 1 — Question Generator Output

```json
{
  "questions": [
    {
      "id": "q_001",
      "text": "Hãy kể về một dự án mà bạn phải đưa ra quyết định kỹ thuật quan trọng khi áp lực deadline rất lớn. Bạn đã tiếp cận vấn đề như thế nào?",
      "category": "behavioral",
      "difficulty": "mid",
      "jd_relevance": "Yêu cầu 'problem-solving under pressure' trong phần Technical Requirements"
    },
    {
      "id": "q_002",
      "text": "Nếu một stakeholder yêu cầu thay đổi lớn về yêu cầu hệ thống 2 tuần trước khi launch, bạn sẽ xử lý như thế nào?",
      "category": "situational",
      "difficulty": "mid",
      "jd_relevance": "Stakeholder communication requirement"
    }
  ],
  "generation_metadata": {
    "prompt_version": "question-gen-v1.0",
    "context_pack": "western",
    "question_count": 5,
    "jd_token_length": 642
  }
}
```

**Validation rules:**
- `questions` array: độ dài = số câu yêu cầu (3–7).
- `category` ∈ `{"behavioral", "situational", "motivational"}`.
- `difficulty` ∈ `{"junior", "mid", "senior"}`.
- `text` không rỗng, ≥ 20 ký tự.

---

### 5.3.2 Schema 2 — Follow-up Engine Output

```json
{
  "follow_up_type": "clarify",
  "target_phrase": "cuối cùng chúng tôi đã đồng ý",
  "follow_up_question": "Bạn đề cập rằng 'cuối cùng chúng tôi đã đồng ý' — quá trình đạt được sự đồng thuận đó diễn ra như thế nào cụ thể? Ai là người đưa ra quyết định cuối cùng?",
  "skip_follow_up": false,
  "reasoning": "Candidate mô tả outcome (đồng ý) nhưng không giải thích process ra quyết định. Đây là gap trong STAR — phần Action bị bỏ qua."
}
```

**Trường hợp skip:**
```json
{
  "follow_up_type": "skip",
  "target_phrase": null,
  "follow_up_question": null,
  "skip_follow_up": true,
  "reasoning": "Candidate đã cung cấp đủ STAR: bối cảnh rõ ràng, action cụ thể (benchmark 2 ngày, số liệu 40%), result rõ ràng. Không cần đào sâu thêm."
}
```

**Validation rules:**

| Field | Rule |
|---|---|
| `follow_up_type` | ∈ `{"clarify", "challenge", "expand", "skip"}` |
| `target_phrase` | Nếu `skip_follow_up = false`: phải là substring của `user_transcript`. Nếu `skip_follow_up = true`: `null`. |
| `follow_up_question` | Nếu `skip_follow_up = false`: không rỗng, ≥ 20 ký tự. Nếu `skip_follow_up = true`: `null`. |
| `skip_follow_up` | Boolean bắt buộc. |
| `reasoning` | Không rỗng (dùng cho internal logging). |

**Backend validation logic (FastAPI/Pydantic):**
```python
class FollowUpResponse(BaseModel):
    follow_up_type: Literal["clarify", "challenge", "expand", "skip"]
    target_phrase: Optional[str]
    follow_up_question: Optional[str]
    skip_follow_up: bool
    reasoning: str

    @validator("target_phrase")
    def phrase_must_be_in_transcript(cls, v, values):
        if not values.get("skip_follow_up") and v:
            # Validated separately against actual transcript
            assert len(v) >= 3, "target_phrase quá ngắn"
        return v

    @validator("follow_up_question")
    def question_required_if_not_skip(cls, v, values):
        if not values.get("skip_follow_up"):
            assert v and len(v) >= 20, "follow_up_question bắt buộc khi không skip"
        return v
```

---

### 5.3.3 Schema 3 — Surgical Feedback Output (Feedback Analyzer)

Đây là schema phức tạp và quan trọng nhất của hệ thống. Thay thế hoàn toàn phương pháp chấm điểm theo tiêu chí (criteria score) bằng annotation từng đoạn (segment annotation).

```json
{
  "overall_score": 62,
  "context_pack": "vn",
  "voice_metrics": {
    "filler_word_count": 3,
    "filler_words_detected": ["ừm", "thật ra thì", "ý là"],
    "estimated_wpm": 145,
    "note": "WPM được ước tính từ độ dài transcript và thời lượng audio"
  },
  "segments": [
    {
      "text": "Trong dự án semester 4 của tôi, tôi và một bạn trong nhóm có quan điểm khác nhau về cách thiết kế database.",
      "start_index": 0,
      "end_index": 109,
      "level": "good",
      "reason": "Situation được thiết lập rõ ràng với bối cảnh cụ thể (dự án semester 4) và mô tả mâu thuẫn rõ ràng.",
      "suggestion": null,
      "improved_version": null
    },
    {
      "text": "Tôi nghĩ nên dùng NoSQL vì tốc độ",
      "start_index": 110,
      "end_index": 145,
      "level": "warning",
      "reason": "Lý do kỹ thuật ('vì tốc độ') quá đơn giản. Không thể hiện được tư duy trade-off của một developer có kinh nghiệm.",
      "suggestion": "Nên giải thích rõ tại sao NoSQL phù hợp với bài toán cụ thể này hơn SQL, và thừa nhận trade-off (VD: thiếu ACID transaction).",
      "improved_version": "Tôi đề xuất dùng MongoDB vì schema của chúng tôi thay đổi thường xuyên và không có quan hệ phức tạp, dù tôi biết sẽ đánh đổi ACID transaction."
    },
    {
      "text": "Cuối cùng chúng tôi đã thảo luận và đi đến được thống nhất.",
      "start_index": 146,
      "end_index": 207,
      "level": "critical",
      "reason": "Phần Action — quan trọng nhất trong STAR — hoàn toàn thiếu chi tiết. 'Thảo luận và đi đến thống nhất' không nói lên được bạn đã LÀM GÌ để giải quyết mâu thuẫn.",
      "suggestion": "Mô tả cụ thể: bạn đề xuất gì? Ai ra quyết định? Có dữ liệu hay bằng chứng gì không? Mất bao lâu?",
      "improved_version": "Tôi đề xuất chúng tôi cùng viết một POC nhỏ: benchmark hiệu năng cả hai giải pháp với dataset thực tế trong 2 ngày. Sau khi có kết quả, cả nhóm đồng thuận dựa trên data."
    },
    {
      "text": "Ừm, thật ra thì",
      "start_index": 254,
      "end_index": 270,
      "level": "critical",
      "reason": "3 filler words xuất hiện liên tiếp, chiếm 2–3 giây. Đây là dấu hiệu mất tự tin hoặc thiếu chuẩn bị khi bị hỏi follow-up.",
      "suggestion": "Thay bằng 1–2 giây im lặng tự nhiên. Sự ngừng có kiểm soát thể hiện sự suy nghĩ, không phải sự do dự.",
      "improved_version": "[Dừng 1-2 giây tự nhiên] Chúng tôi đã tổ chức một cuộc họp nhanh..."
    },
    {
      "text": "mọi người đều đồng ý với nhau sau khi nghe tôi giải thích",
      "start_index": 271,
      "end_index": 330,
      "level": "warning",
      "reason": "Trong văn hóa VN, cụm từ 'sau khi nghe tôi giải thích' có thể bị hiểu là tự đề cao. Nên nhấn vào quyết định tập thể hơn.",
      "suggestion": "Điều chỉnh để thể hiện tinh thần đồng đội — phù hợp với rubric VN Pack (trọng số teamwork 30%).",
      "improved_version": "Sau khi xem kết quả benchmark cùng nhau, cả team đồng thuận chọn MongoDB vì phù hợp nhất với yêu cầu dự án."
    }
  ],
  "model_answer": "Trong dự án cuối kỳ năm 4, team tôi có bất đồng về lựa chọn database: tôi đề xuất MongoDB trong khi một thành viên muốn dùng PostgreSQL. Để giải quyết một cách khách quan, tôi đề nghị cả nhóm thực hiện POC: benchmark hiệu năng cả hai với dataset thực tế của dự án trong 2 ngày. Kết quả cho thấy MongoDB nhanh hơn 40% cho các read operation chúng tôi cần, trong khi PostgreSQL phù hợp hơn nếu cần strong consistency. Vì dự án của chúng tôi ưu tiên tốc độ đọc và schema linh hoạt, cả team đồng thuận chọn MongoDB. Dự án hoàn thành đúng deadline và hiệu năng đáp ứng yêu cầu đặt ra. Qua lần đó, tôi học được rằng mâu thuẫn kỹ thuật nên được giải quyết bằng dữ liệu thực tế thay vì lý luận suông.",
  "key_takeaway": "Phần Action trong STAR hoàn toàn thiếu chi tiết — đây là điểm yếu quyết định của câu trả lời này. Luôn mô tả cụ thể BẠN ĐÃ LÀM GÌ, không chỉ kết quả.",
  "generation_metadata": {
    "prompt_version": "surgical-feedback-v1.0",
    "context_pack": "vn",
    "segment_count": 5,
    "critical_count": 2,
    "warning_count": 2,
    "good_count": 1,
    "is_fallback": false
  }
}
```

**Validation rules — Surgical Feedback:**

| Field | Rule | Hành vi khi vi phạm |
|---|---|---|
| `overall_score` | Integer, 0 ≤ score ≤ 100 | Clamp về [0, 100]; ghi log |
| `context_pack` | ∈ `{"vn", "western"}` | Reject; fallback |
| `segments` | Array, không rỗng | Nếu rỗng → fallback text feedback |
| `segments[].level` | ∈ `{"good", "warning", "critical"}` | Reject segment; ghi log |
| `segments[].improved_version` | Nếu level = "warning" hoặc "critical": không được `null` hoặc `""` | Placeholder: "[AI không thể gợi ý]"; ghi log |
| `segments[].start_index` | Integer ≥ 0; `start_index` < `end_index` | Discard segment; ghi log |
| `model_answer` | Không rỗng, ≥ 50 ký tự | Fallback: "Model answer không khả dụng." |
| `key_takeaway` | Không rỗng, ≤ 200 ký tự | Fallback: `segments[level=critical][0].reason` |

---

### 5.3.4 Schema 4 — Rewrite Evaluator Output

```json
{
  "overall_score": 79,
  "delta_score": 17,
  "context_pack": "vn",
  "voice_metrics": {
    "filler_word_count": 0,
    "filler_words_detected": [],
    "estimated_wpm": 0,
    "note": "Text input — không tính WPM"
  },
  "segments": [
    {
      "text": "Trong dự án cuối kỳ năm 4, team tôi có bất đồng về lựa chọn database.",
      "start_index": 0,
      "end_index": 69,
      "level": "good",
      "reason": "Situation rõ ràng. Không filler words.",
      "suggestion": null,
      "improved_version": null
    },
    {
      "text": "Tôi đề xuất MongoDB vì schema của chúng tôi thay đổi thường xuyên.",
      "start_index": 70,
      "end_index": 135,
      "level": "good",
      "reason": "Lý do kỹ thuật cụ thể hơn lần trước. Có giải thích trade-off.",
      "suggestion": null,
      "improved_version": null
    },
    {
      "text": "cả team đồng thuận chọn MongoDB vì phù hợp nhất với yêu cầu dự án",
      "start_index": 260,
      "end_index": 327,
      "level": "warning",
      "reason": "Result chưa rõ — 'phù hợp nhất' vẫn còn mơ hồ. Chưa đề cập kết quả thực tế của dự án.",
      "suggestion": "Thêm kết quả cuối cùng của dự án để hoàn thiện STAR.",
      "improved_version": "cả team đồng thuận chọn MongoDB. Dự án hoàn thành đúng deadline và hệ thống đạt hiệu năng đặt ra."
    }
  ],
  "comparison_summary": {
    "issues_fixed": [
      "Loại bỏ hoàn toàn 3 filler words (ừm, thật ra thì, ý là)",
      "Action trong STAR đã cụ thể hơn với POC và số liệu benchmark",
      "Điều chỉnh cách diễn đạt phù hợp văn hóa VN (bớt 'tôi giải thích', thêm tinh thần tập thể)"
    ],
    "issues_remaining": [
      "Phần Result chưa hoàn chỉnh — chưa đề cập kết quả cuối cùng của dự án"
    ],
    "new_issues": []
  },
  "model_answer": "...",
  "key_takeaway": "Tiến bộ rõ rệt! (+17 điểm). Chỉ cần thêm Result cụ thể (dự án thành công như thế nào) để hoàn thiện STAR.",
  "generation_metadata": {
    "prompt_version": "rewrite-eval-v1.0",
    "attempt_number": 2,
    "context_pack": "vn",
    "is_fallback": false
  }
}
```

**Validation rules bổ sung cho Rewrite:**

| Field | Rule |
|---|---|
| `delta_score` | Integer; có thể âm (nếu điểm giảm). Tính = `overall_score` - `old_overall_score`. |
| `comparison_summary.issues_fixed` | Array, có thể rỗng (nếu không có gì cải thiện). |
| `comparison_summary.new_issues` | Array, có thể rỗng. Nếu không rỗng → hiển thị cảnh báo cho Candidate. |

---

## 5.4 Xử lý lỗi & Fallback

### 5.4.1 Ma trận Fallback toàn hệ thống

| Module | Lỗi | Retry | Fallback hành vi | Log level |
|---|---|---|---|---|
| **Question Generator** | Timeout > 15s | 1 lần | Dùng Question Bank seed (30 câu VN / 30 câu Western) | WARNING |
| | Schema sai | 0 lần | Dùng Question Bank seed | ERROR |
| | Rate limit | Queue 30s | Queue và retry; hiển thị spinner | WARNING |
| **Whisper API** | Timeout > 10s | 1 lần | Yêu cầu user nhập text thay thế | WARNING |
| | Empty transcript | 0 lần | Hiển thị: "Không nhận được giọng nói. Thử ghi âm lại." | INFO |
| | Audio quá dài | 0 lần | Cắt tại 5 phút; gửi phần đã cắt | INFO |
| **Follow-up Engine** | Timeout > 8s | 0 lần | `skip_follow_up = true`; tiếp tục phiên | WARNING |
| | Schema sai | 0 lần | `skip_follow_up = true`; tiếp tục phiên | ERROR |
| | `target_phrase` không khớp | 0 lần | `skip_follow_up = true`; ghi log để debug | ERROR |
| **Feedback Analyzer** | Timeout > 15s | 1 lần (sau 3s) | Fallback text feedback (non-annotated) | ERROR |
| | Schema sai | 1 lần | Fallback text feedback | ERROR |
| | `segments[]` rỗng | 0 lần | Hiển thị overall_score + model_answer; không có annotation | WARNING |
| | `improved_version` rỗng | 0 lần | Placeholder text; ghi log | WARNING |
| **Rewrite Evaluator** | Timeout > 15s | 1 lần | Lưu transcript; không hiển thị comparison | ERROR |
| | Schema sai | 0 lần | Lưu transcript; không hiển thị comparison | ERROR |

### 5.4.2 Fallback Text Feedback Template

Khi Feedback Analyzer fail hoàn toàn (sau retry), hệ thống hiển thị:

```
⚠ Phân tích chi tiết không khả dụng lúc này

Câu trả lời của bạn đã được lưu thành công.

Gợi ý tự đánh giá trong lúc chờ:
• Câu trả lời có đủ STAR (Situation, Task, Action, Result) chưa?
• Bạn có dùng số liệu cụ thể để chứng minh không?
• Có filler words nào không (ừm, à, ý là)?

Bạn có thể xem lại câu trả lời của mình trong phần Lịch sử.
Hệ thống sẽ tự động thử phân tích lại trong 10 phút.
```

### 5.4.3 Retry Strategy

```python
# Exponential backoff configuration
RETRY_CONFIG = {
    "feedback_analyzer": {
        "max_retries": 1,
        "initial_delay_ms": 3000,
        "backoff_multiplier": 2,
        "max_delay_ms": 10000,
        "timeout_ms": 15000
    },
    "follow_up_engine": {
        "max_retries": 0,  # Không retry — fail fast và skip
        "timeout_ms": 8000
    },
    "question_generator": {
        "max_retries": 1,
        "initial_delay_ms": 2000,
        "timeout_ms": 15000
    }
}
```

---

## 5.5 Chính sách lưu trữ dữ liệu AI

### 5.5.1 Dữ liệu nào được lưu

| Dữ liệu | Bảng DB | Thời gian lưu | Mục đích |
|---|---|---|---|
| Transcript (text) | `UserAnswer.transcript` | Vĩnh viễn | Hiển thị lại cho Candidate; input cho Rewrite |
| Annotation segments | `AnnotatedSegment` | Vĩnh viễn | Hiển thị lại Surgical Feedback |
| Overall score | `AIFeedback.overall_score` | Vĩnh viễn | Lịch sử phiên |
| Model answer | `AIFeedback.model_answer` | Vĩnh viễn | Tham khảo cho Candidate |
| Audio file | Cloudflare R2 | **30 ngày** | Tái sử dụng nếu cần re-transcribe; sau đó xóa |
| Prompt gốc gửi lên AI | `AIQualityLog.prompt_snapshot` | **90 ngày** | Debug và cải thiện prompt |
| AI raw response | `AIQualityLog.raw_response` | **90 ngày** | Debug schema violation |
| Token usage | `AIQualityLog.token_usage` | **90 ngày** | Cost monitoring |
| `reasoning` field (Follow-up) | `FollowUpQuestion.internal_reasoning` | **30 ngày** | Đánh giá chất lượng AI; không hiển thị User |

### 5.5.2 Dữ liệu KHÔNG được lưu

| Dữ liệu | Lý do |
|---|---|
| Nội dung CV gốc (file PDF) | Lưu trên R2 trong 30 ngày rồi xóa; chỉ giữ `cv_parsed_text` |
| API key trong log | Tuyệt đối không log API key hoặc credentials |
| Transcript trong error log | Transcript chứa thông tin cá nhân — không log ra console |
| Email người dùng trong AI prompt | Chỉ truyền `user_id` cho AI; không truyền PII |

### 5.5.3 Tuân thủ chính sách OpenAI

| Chính sách OpenAI | Hành động của hệ thống |
|---|---|
| API data usage policy | Không dùng API data để train model theo mặc định. Xác nhận opt-out nếu cần. |
| Data retention | OpenAI giữ API data tối đa 30 ngày theo policy mặc định. Không gửi PII không cần thiết. |
| Prohibited use | Không dùng AI để tạo content phân biệt đối xử, misleading, hoặc harass người dùng. |

### 5.5.4 Xóa dữ liệu theo yêu cầu

Khi Candidate yêu cầu xóa tài khoản:

```
1. Xóa mềm User record (is_deleted = true)
2. Xóa vĩnh viễn audio files trên Cloudflare R2 ngay lập tức
3. Xóa vĩnh viễn cv_parsed_text
4. Anonymize transcript: thay user_id bằng NULL trong UserAnswer
5. Giữ anonymized AIFeedback và AnnotatedSegment 90 ngày cho mục đích nghiên cứu
6. Xóa hoàn toàn sau 90 ngày
```

---

*Hết Chương 4 và Chương 5*

---

> **Ghi chú:** Phụ lục A (ERD), Phụ lục B (UI/UX Wireframe) và Phụ lục C (Sample Data) sẽ được trình bày trong phần tiếp theo của tài liệu SRS.
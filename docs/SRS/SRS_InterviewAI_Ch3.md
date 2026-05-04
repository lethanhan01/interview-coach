# Chương 3 — Đặc tả Use Case

> **Tài liệu:** SRS — AI Interview Coach System (InterviewAI)
> **Phiên bản:** 1.0 | **Ngày:** 21/04/2026

---

## Template Use Case

Mọi Use Case trong chương này đều tuân theo template sau:

| Trường | Nội dung |
|---|---|
| **Mã UC** | Định danh duy nhất |
| **Tên UC** | Tên ngắn gọn, bắt đầu bằng động từ |
| **Mô tả tóm tắt** | 1–2 câu mô tả mục tiêu |
| **Tác nhân chính** | Ai khởi tạo |
| **Tác nhân phụ** | Hệ thống / AI tham gia |
| **Tiền điều kiện** | Điều kiện phải thỏa trước khi UC bắt đầu |
| **Hậu điều kiện** | Trạng thái hệ thống sau khi UC kết thúc thành công |
| **Main Flow** | Luồng sự kiện chính |
| **Alternative Flow** | Luồng thay thế hợp lệ |
| **Exception Flow** | Các kịch bản lỗi và xử lý |
| **AI Spec** | *(Chỉ với UC liên quan AI)* Input/Output/Fallback |
| **Acceptance Criteria** | Tiêu chí kiểm thử nghiệm thu |

---

## Nhóm A — Luyện phỏng vấn

---

### UC-01: Đăng ký / Đăng nhập hệ thống

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-01 |
| **Tên UC** | Đăng ký / Đăng nhập hệ thống |
| **Mô tả tóm tắt** | Candidate tạo tài khoản mới hoặc đăng nhập vào hệ thống thông qua Google OAuth 2.0. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | Supabase Auth, Google Identity Platform |
| **Tiền điều kiện** | Candidate có trình duyệt hỗ trợ; có tài khoản Google hợp lệ. |
| **Hậu điều kiện** | Candidate được xác thực; JWT access token được lưu vào secure cookie; Candidate được chuyển đến Dashboard. |

**Main Flow:**

1. Candidate truy cập URL của hệ thống.
2. Hệ thống hiển thị trang Landing với nút **"Đăng nhập bằng Google"**.
3. Candidate nhấn nút đăng nhập.
4. Hệ thống redirect đến Google OAuth consent screen.
5. Candidate chọn tài khoản Google và cấp quyền.
6. Google trả token về Supabase Auth callback endpoint.
7. Supabase xác thực token và kiểm tra email trong database:
   - Nếu email **chưa tồn tại**: tạo bản ghi User mới với `role = candidate`, `profile_completed = false`.
   - Nếu email **đã tồn tại**: cập nhật `last_login_at`.
8. Hệ thống phát sinh JWT (access token 7 ngày, refresh token 30 ngày), lưu vào secure HttpOnly cookie.
9. Nếu `profile_completed = false`: redirect đến **UC-02** để hoàn thiện hồ sơ.
10. Nếu `profile_completed = true`: redirect đến **Dashboard** (danh sách phiên + nút tạo phiên mới).

**Alternative Flow:**

- **AF-01-A**: Candidate đã đăng nhập trước đó (token còn hạn) → truy cập URL → hệ thống tự động redirect đến Dashboard, bỏ qua bước 2–8.
- **AF-01-B**: Refresh token còn hạn nhưng access token hết hạn → hệ thống tự động làm mới access token trong nền mà không yêu cầu Candidate đăng nhập lại.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-01-1 | Google OAuth trả về lỗi (user hủy, network timeout) | Hiển thị toast: "Đăng nhập thất bại. Vui lòng thử lại." Ở lại trang Landing. |
| E-01-2 | Supabase Auth không phản hồi trong 10 giây | Hiển thị: "Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau vài phút." |
| E-01-3 | Email bị Admin khóa (`status = banned`) | Hiển thị: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ." |

**Acceptance Criteria:**

- [ ] AC-01-1: Candidate đăng nhập thành công trong ≤ 5 giây.
- [ ] AC-01-2: JWT được lưu trong HttpOnly cookie, không accessible qua JavaScript.
- [ ] AC-01-3: Người dùng mới được tạo bản ghi trong bảng `users` với `role = candidate`.
- [ ] AC-01-4: Truy cập URL khi đã có token hợp lệ → tự động vào Dashboard, không hiển thị lại trang login.
- [ ] AC-01-5: Sau khi logout, token bị xóa; truy cập URL được redirect về Landing.

---

### UC-02: Quản lý hồ sơ luyện tập

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-02 |
| **Tên UC** | Quản lý hồ sơ luyện tập |
| **Mô tả tóm tắt** | Candidate cập nhật thông tin cá nhân, mục tiêu nghề nghiệp và upload CV để hệ thống cá nhân hóa câu hỏi và Model Answer. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | FastAPI (CV parsing), Supabase Storage |
| **Tiền điều kiện** | Candidate đã đăng nhập (UC-01 hoàn thành). |
| **Hậu điều kiện** | Thông tin hồ sơ được lưu; `profile_completed = true`; CV data được parse và lưu dưới dạng structured JSON. |

**Main Flow:**

1. Candidate truy cập trang **Hồ sơ** (Profile).
2. Hệ thống hiển thị form với các trường: Họ tên, Vị trí ứng tuyển mục tiêu, Số năm kinh nghiệm, Ngôn ngữ phỏng vấn mặc định (Tiếng Việt / Tiếng Anh).
3. Candidate điền thông tin và nhấn **"Lưu thông tin"**.
4. Hệ thống validate dữ liệu và lưu vào bảng `user_profiles`.
5. Candidate nhấn **"Upload CV (PDF)"** — tùy chọn nhưng được khuyến nghị.
6. Candidate chọn file PDF (≤ 5 MB).
7. Frontend gửi file đến FastAPI endpoint `/api/cv/parse`.
8. FastAPI:
   - Dùng `pdfplumber` đọc nội dung text của PDF.
   - Cấu trúc hóa thành JSON: `{name, education[], experience[], skills[], languages[]}`.
   - Lưu JSON vào bảng `user_profiles.cv_structured`.
   - Upload file gốc lên Supabase Storage, lưu URL vào `user_profiles.cv_file_url`.
9. Hệ thống cập nhật `profile_completed = true`.
10. Hiển thị thông báo thành công; chuyển đến Dashboard.

**Alternative Flow:**

- **AF-02-A**: Candidate bỏ qua upload CV → `cv_structured = null`. Hệ thống vẫn hoạt động; Question Generator và Feedback Analyzer không dùng dữ liệu CV.
- **AF-02-B**: Candidate muốn cập nhật CV mới → upload file mới → file cũ trên Storage bị ghi đè, `cv_structured` được cập nhật.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-02-1 | File upload không phải PDF | Hiển thị: "Chỉ chấp nhận file PDF. Vui lòng chọn lại." |
| E-02-2 | File PDF vượt quá 5 MB | Hiển thị: "File quá lớn (tối đa 5 MB). Vui lòng nén hoặc chọn file khác." |
| E-02-3 | `pdfplumber` không đọc được text (PDF scan, protected) | Lưu file lên Storage nhưng `cv_structured = null`; hiển thị: "Không thể đọc nội dung CV tự động. CV đã được lưu nhưng sẽ không được dùng để cá nhân hóa." |
| E-02-4 | Trường bắt buộc bỏ trống (Họ tên, Vị trí mục tiêu) | Highlight trường lỗi; hiển thị thông báo validation tương ứng. |

**Acceptance Criteria:**

- [ ] AC-02-1: CV PDF được parse thành công → `cv_structured` chứa ít nhất `experience[]` và `skills[]` không rỗng.
- [ ] AC-02-2: Trang Profile load trong ≤ 200 ms.
- [ ] AC-02-3: Upload CV ≤ 5 MB hoàn thành trong ≤ 5 giây.
- [ ] AC-02-4: Sau khi lưu hồ sơ, `profile_completed = true` được ghi vào DB.

---

### UC-03: Cấu hình phiên phỏng vấn

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-03 |
| **Tên UC** | Cấu hình phiên phỏng vấn |
| **Mô tả tóm tắt** | Candidate tạo một phiên luyện tập mới bằng cách cung cấp Job Description và các tham số cấu hình cần thiết. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | AI Engine (Question Generator) |
| **Tiền điều kiện** | Candidate đã đăng nhập; `profile_completed = true`. |
| **Hậu điều kiện** | Phiên mới được tạo với trạng thái `in_progress`; danh sách câu hỏi được sinh và lưu vào DB; Candidate chuyển đến màn hình phỏng vấn. |

**Main Flow:**

1. Candidate nhấn **"Tạo phiên mới"** từ Dashboard.
2. Hệ thống hiển thị form cấu hình phiên gồm 4 bước:
   - **Bước 1 — Thông tin công việc:** Paste Job Description (text area, bắt buộc, min 100 ký tự).
   - **Bước 2 — Cấu hình phỏng vấn:** Chọn số câu hỏi (3 / 5 / 7, mặc định 5); Loại phỏng vấn (Behavioral / Mixed, mặc định Behavioral).
   - **Bước 3 — Chọn Context Pack:** Xem **UC-03b**.
   - **Bước 4 — Xác nhận:** Hiển thị summary của tất cả lựa chọn.
3. Candidate nhấn **"Bắt đầu phỏng vấn"**.
4. Hệ thống tạo bản ghi `interview_sessions` với `status = generating`.
5. FastAPI gọi Question Generator với payload: `{jd, context_pack_id, num_questions, interview_type, cv_structured}`.
6. Question Generator trả về danh sách câu hỏi (xem AI Spec).
7. Hệ thống lưu câu hỏi vào bảng `session_questions`; cập nhật `status = in_progress`.
8. Redirect Candidate đến UC-04 (màn hình phỏng vấn).

**Alternative Flow:**

- **AF-03-A**: Candidate nhấn "Hủy" ở bất kỳ bước nào → quay về Dashboard; phiên không được tạo.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-03-1 | JD dưới 100 ký tự | Hiển thị: "Job Description quá ngắn. Vui lòng cung cấp mô tả đầy đủ hơn." |
| E-03-2 | Question Generator timeout (>10 giây) | Hủy bản ghi session; hiển thị: "Không thể tạo câu hỏi lúc này. Vui lòng thử lại." |
| E-03-3 | Question Generator trả về ít hơn số câu yêu cầu | Chấp nhận số câu trả về nếu ≥ 3; nếu < 3 → xử lý như E-03-2. |

**AI Spec — Question Generator:**

```
Input Payload:
{
  "jd": "string (full JD text)",
  "context_pack_id": "vn | western",
  "num_questions": 3 | 5 | 7,
  "interview_type": "behavioral | mixed",
  "cv_summary": {                          // null nếu không có CV
    "experience": ["..."],
    "skills": ["..."]
  }
}

Output Schema:
{
  "questions": [
    {
      "id": "q1",
      "text": "Hãy kể về một lần bạn phải xử lý conflict với đồng nghiệp?",
      "category": "behavioral | situational | motivational",
      "difficulty": "junior | mid | senior",
      "jd_keywords": ["teamwork", "conflict resolution"]
    }
  ]
}

System Prompt (Context Pack VN):
"Bạn là chuyên gia tuyển dụng với 10 năm kinh nghiệm tại các doanh nghiệp
Việt Nam. Sinh ra câu hỏi phỏng vấn hành vi (behavioral) và tình huống phù hợp
với JD và văn hóa doanh nghiệp Việt Nam. Ưu tiên câu hỏi về tinh thần teamwork,
sự kiên nhẫn, tôn trọng và trách nhiệm với tập thể."

System Prompt (Context Pack Western):
"You are a senior recruiter at an international technology company. Generate
behavioral and situational interview questions aligned with the JD using the
Western interview standard. Prioritize questions that reveal impact, ownership,
data-driven thinking, and direct accountability."

Fallback: Nếu AI call thất bại → lấy random 5 câu từ Question Bank seed data
phù hợp với context_pack_id.
```

**Acceptance Criteria:**

- [ ] AC-03-1: Phiên được tạo và câu hỏi sinh ra trong ≤ 10 giây.
- [ ] AC-03-2: JD dưới 100 ký tự → hiển thị lỗi validation, không cho tiếp tục.
- [ ] AC-03-3: Câu hỏi của Context Pack VN và Western rõ ràng khác nhau về nội dung và phong cách.
- [ ] AC-03-4: Bản ghi `interview_sessions` được tạo với đầy đủ foreign key hợp lệ.

---

### UC-03b: Chọn Context Pack

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-03b |
| **Tên UC** | Chọn Context Pack |
| **Mô tả tóm tắt** | Candidate chọn văn hóa công ty phù hợp với vị trí đang ứng tuyển; hệ thống load rubric chấm điểm tương ứng cho toàn bộ phiên. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | Hệ thống (load Context Pack config) |
| **Tiền điều kiện** | Đây là Bước 3 trong UC-03; JD đã được nhập; số câu đã được chọn. |
| **Hậu điều kiện** | `context_pack_id` được ghi vào bản ghi phiên; rubric JSON tương ứng được load vào bộ nhớ để sử dụng cho UC-04, UC-05, UC-07. |

**Main Flow:**

1. Hệ thống hiển thị 2 lựa chọn Context Pack dưới dạng card:

   | | 🇻🇳 Việt Nam | 🌍 Western / International |
   |---|---|---|
   | **Mô tả ngắn** | Phù hợp với công ty Việt Nam, doanh nghiệp nội địa, cơ quan nhà nước | Phù hợp với công ty nước ngoài, startup quốc tế, môi trường đa văn hóa |
   | **Câu hỏi trọng tâm** | Teamwork, tôn trọng, sự kiên nhẫn, gắn bó lâu dài | Impact cụ thể, ownership, số liệu, tư duy độc lập |
   | **Tiêu chuẩn câu trả lời** | Khiêm tốn, chú trọng tập thể, tránh nói quá về bản thân | Tự tin, "I did", STAR framework đầy đủ, nêu kết quả đo lường |

2. Candidate đọc mô tả và chọn một trong hai pack.
3. Hệ thống highlight card được chọn; hiển thị preview 1–2 tiêu chí chấm điểm của pack đó.
4. Candidate nhấn **"Xác nhận"** (hoặc nhấn "Tiếp tục" để sang Bước 4 của UC-03).
5. Hệ thống lưu `context_pack_id` vào session config; load `rubric_json` từ bảng `context_packs` vào phiên làm việc.

**Alternative Flow:**

- **AF-03b-A**: Candidate thay đổi lựa chọn trước khi nhấn Xác nhận → cập nhật highlight; không có side effect.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-03b-1 | Candidate không chọn pack và nhấn Tiếp tục | Highlight yêu cầu chọn; hiển thị: "Vui lòng chọn một Context Pack trước khi tiếp tục." |
| E-03b-2 | Bảng `context_packs` không truy xuất được từ DB | Load rubric mặc định (VN) từ file config tĩnh; ghi log lỗi. |

**Acceptance Criteria:**

- [ ] AC-03b-1: Hiển thị đủ 2 card với mô tả rõ ràng, không thể tiếp tục nếu chưa chọn.
- [ ] AC-03b-2: Rubric JSON tương ứng được load thành công vào session trong ≤ 200 ms.
- [ ] AC-03b-3: `context_pack_id` được ghi chính xác vào bảng `interview_sessions`.

---

### UC-04: Thực hiện phiên phỏng vấn AI

> **Đây là Use Case phức tạp nhất của hệ thống.** UC-04 tích hợp đồng thời Voice/Text input, Whisper transcription và Follow-up Engine. Mỗi câu hỏi có thể tạo ra tới 2 lượt tương tác (câu gốc + follow-up) trước khi chuyển sang Feedback Analyzer.

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-04 |
| **Tên UC** | Thực hiện phiên phỏng vấn AI |
| **Mô tả tóm tắt** | Candidate tương tác với AI phỏng vấn theo từng câu hỏi. Với mỗi câu, Candidate trả lời (voice/text), AI phân tích và đặt 1 câu follow-up dựa trên nội dung vừa nói, sau đó sinh Surgical Feedback. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | AI Engine (Whisper API, Follow-up Engine, Feedback Analyzer) |
| **Tiền điều kiện** | UC-03 hoàn thành; phiên có `status = in_progress`; danh sách câu hỏi đã được lưu vào DB. |
| **Hậu điều kiện** | Toàn bộ `user_answers`, `follow_up_questions`, `ai_feedbacks` và `annotated_segments` được lưu vào DB; `session.status = completed`; Candidate được chuyển đến UC-06 (Xem Feedback). |

#### Main Flow (lặp lại cho mỗi câu hỏi trong phiên)

**Giai đoạn 1 — Hiển thị câu hỏi**

1. Hệ thống lấy câu hỏi tiếp theo từ `session_questions` (theo thứ tự `order_index`).
2. Hiển thị câu hỏi dạng text trên màn hình; kèm indicator **"Câu [X] / [Total]"**.
3. *(Optional)* Hệ thống đọc câu hỏi bằng Web Speech API (TTS) nếu Candidate đã bật cài đặt này.
4. Hiển thị 2 nút: **🎤 Trả lời bằng giọng nói** và **✏️ Trả lời bằng văn bản**.

---

**Giai đoạn 2A — Trả lời bằng giọng nói (Voice Path)**

5. Candidate nhấn nút **🎤 Bắt đầu ghi âm**.
6. Frontend kích hoạt `MediaRecorder` via Web Audio API; hiển thị waveform animation và timer đếm lên.
7. Candidate nói câu trả lời.
8. Candidate nhấn **■ Dừng ghi âm** (hoặc tự động dừng sau 5 phút).
9. Frontend gửi audio blob (WebM/WAV) đến FastAPI endpoint `POST /api/session/{id}/transcribe`.
10. FastAPI gọi **Whisper API** với audio file:
    - Model: `whisper-1`
    - Language: `vi` nếu ngôn ngữ phiên = Tiếng Việt; `en` nếu = Tiếng Anh
    - Response format: `verbose_json` (để lấy word-level timestamps)
11. FastAPI nhận transcript text và word timestamps; tính toán các voice metrics:
    - **WPM** = (số từ / thời lượng audio) × 60
    - **Filler word count** = đếm xuất hiện của: ["ừm", "à", "thì", "ý là", "kiểu như", "um", "uh", "like", "you know"]
    - **Pause count** = số khoảng lặng > 2 giây trong word timestamps
12. FastAPI trả về: `{transcript, wpm, filler_count, pause_count, duration_seconds}`.
13. Frontend hiển thị transcript dưới câu hỏi; hiển thị badge voice metrics nhỏ.

**Giai đoạn 2B — Trả lời bằng văn bản (Text Path)**

5. Candidate nhấn **✏️ Trả lời bằng văn bản**.
6. Hiển thị textarea với placeholder gợi ý; Candidate gõ câu trả lời.
7. Candidate nhấn **"Gửi câu trả lời"**.
8. Frontend gửi text đến backend; backend lưu transcript; không tính voice metrics (WPM = null, filler = null).

---

**Giai đoạn 3 — Follow-up Engine phân tích [AI-critical]**

14. Backend lưu `user_answer` vào DB với transcript và voice metrics.
15. Backend gọi Follow-up Engine (xem **AI Spec — Follow-up Engine** bên dưới).
16. Backend nhận response từ AI và kiểm tra `skip_follow_up`:

    **Nếu `skip_follow_up = false`:**
    17a. Lưu `follow_up_questions` record vào DB.
    17b. Frontend hiển thị câu follow-up trong một bubble khác biệt với styling riêng (ví dụ: "AI hỏi thêm:...").
    17c. Bên dưới có badge nhỏ: **Đào sâu về: "[target_phrase]"** để Candidate hiểu tại sao AI hỏi.
    17d. Candidate trả lời follow-up (Voice hoặc Text — lặp lại Giai đoạn 2A hoặc 2B với `is_follow_up = true`).
    17e. Backend lưu answer follow-up vào `user_answers` với `parent_question_id = original_question_id`.

    **Nếu `skip_follow_up = true`:**
    17f. Bỏ qua bước 17a–17e; hiển thị indicator nhỏ: "Câu trả lời đã đầy đủ ✓".

---

**Giai đoạn 4 — Feedback Analyzer sinh Surgical Feedback [AI-critical]**

18. Backend tổng hợp toàn bộ context cho Feedback Analyzer:
    - `original_question`: câu hỏi gốc
    - `combined_transcript`: transcript câu gốc + transcript follow-up (nếu có), được ghép lại
    - `jd`: Job Description của phiên
    - `rubric_json`: rubric tương ứng Context Pack đã chọn
    - `cv_structured`: dữ liệu CV của Candidate (null nếu không có)
19. Backend gọi Feedback Analyzer (xem **AI Spec — Feedback Analyzer** bên dưới).
20. Backend nhận Surgical Feedback JSON; validate schema (xem Exception Flow E-04-5).
21. Backend lưu dữ liệu vào DB:
    - `ai_feedbacks`: overall_score, model_answer, key_takeaway, context_pack_id
    - `annotated_segments`: 1 record cho mỗi phần tử trong mảng `segments[]`
22. Frontend hiển thị indicator nhỏ: **"Đã phân tích ✓"** bên dưới câu trả lời.

---

**Giai đoạn 5 — Chuyển câu hỏi tiếp theo hoặc kết thúc**

23. Backend kiểm tra còn câu hỏi chưa trả lời trong phiên:

    **Nếu còn câu hỏi:**
    24a. Hiển thị nút **"Câu hỏi tiếp theo →"**.
    24b. Candidate nhấn → quay về Giai đoạn 1 với câu hỏi tiếp theo.

    **Nếu đã trả lời hết:**
    24c. Backend cập nhật `session.status = completed`; tính `session.overall_score` = trung bình cộng `overall_score` của tất cả câu hỏi.
    24d. Hiển thị màn hình kết thúc: tổng điểm + nút **"Xem phân tích chi tiết"** → chuyển đến UC-06.

#### Alternative Flow

- **AF-04-A**: Candidate muốn bỏ qua một câu hỏi → Nhấn nút "Bỏ qua" (chỉ hiển thị từ câu thứ 2 trở đi) → Câu hỏi được đánh dấu `skipped = true`; không có feedback cho câu đó; chuyển sang câu tiếp.
- **AF-04-B**: Candidate muốn nghe lại câu hỏi → Nhấn nút 🔊 → Web Speech API đọc lại.
- **AF-04-C**: Candidate ghi âm nhưng nghe lại không hài lòng → Nhấn **"Ghi âm lại"** (trong 5 giây đầu sau khi dừng) → Audio cũ bị xóa, bắt đầu ghi mới.
- **AF-04-D**: Candidate đang ở giữa phiên và đóng tab → Phiên được lưu với status `interrupted`; lần sau truy cập Dashboard → hiển thị "Tiếp tục phiên chưa hoàn thành?".

#### Exception Flow

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-04-1 | `MediaRecorder` không khởi động được (microphone bị chặn) | Hiển thị popup hướng dẫn cấp quyền microphone; tự động chuyển sang Text Path. |
| E-04-2 | Audio upload thất bại (network) | Retry tối đa 2 lần; nếu vẫn lỗi → hiển thị: "Không thể gửi audio. Bạn có muốn chuyển sang nhập văn bản không?" |
| E-04-3 | Whisper API timeout (> 15 giây) | Hiển thị: "Chuyển đổi giọng nói gặp sự cố. Vui lòng nhập câu trả lời bằng văn bản." Tự động mở Text Path. |
| E-04-4 | Whisper API trả về transcript rỗng | Hiển thị: "Không nhận diện được giọng nói. Vui lòng kiểm tra microphone hoặc chọn nhập văn bản." |
| E-04-5 | Follow-up Engine timeout hoặc trả về JSON không hợp lệ | Set `skip_follow_up = true` cho câu hỏi đó; tiếp tục sang Giai đoạn 4. Ghi log để debug. |
| E-04-6 | Feedback Analyzer timeout (> 15 giây) | Lưu transcript nhưng không lưu feedback; hiển thị: "Phân tích AI tạm thời không khả dụng. Câu trả lời đã được lưu, bạn có thể xem phân tích sau." |
| E-04-7 | Feedback Analyzer trả về `segments = []` (mảng rỗng) | Kích hoạt Fallback: hiển thị feedback dạng text thuần từ field `key_takeaway` (vẫn được sinh); annotated transcript không có highlight. |

---

#### AI Spec — Follow-up Engine

```
Endpoint: POST /api/ai/follow-up
Model: gpt-4o
Mode: JSON mode (response_format: { type: "json_object" })

Input Payload:
{
  "original_question": "Hãy kể về một lần bạn phải xử lý conflict với đồng nghiệp?",
  "transcript": "Ừm, thì hồi đó tôi làm việc với một bạn trong team và chúng
                 tôi không đồng ý về cách thiết kế database. Tôi đã cố gắng
                 communicate với bạn đó nhưng mà không hiệu quả lắm. Cuối cùng
                 team lead phải vào giải quyết và mọi thứ ổn hơn.",
  "jd_summary": "Backend Engineer tại công ty fintech, yêu cầu kỹ năng teamwork
                 và problem-solving.",
  "context_pack": "vn",
  "cv_experience_summary": "2 năm kinh nghiệm backend, đã tham gia 3 dự án nhóm"
}

System Prompt:
"Bạn là chuyên gia phỏng vấn. Phân tích transcript câu trả lời của ứng viên
và xác định XEM CÓ CẦN hỏi thêm không. Nếu có, tạo 1 câu follow-up duy nhất
bằng cách:
1. Xác định 1 claim/phrase cụ thể trong transcript mà ứng viên đề cập nhưng
   chưa đủ chi tiết (số liệu, ví dụ cụ thể, kết quả đo lường).
2. Đặt câu hỏi trực tiếp về claim đó, PHẢI TRÍCH DẪN ĐÚNG phrase từ transcript.
3. Nếu câu trả lời đã đầy đủ và cụ thể, set skip_follow_up = true.
QUAN TRỌNG: Không được hỏi câu hỏi generic. Câu follow-up PHẢI chứa ít nhất
1 từ/cụm từ lấy từ transcript của ứng viên."

Output Schema:
{
  "follow_up_type": "clarify | challenge | expand",
  "target_phrase": "cố gắng communicate",
  "follow_up_question": "Bạn vừa đề cập 'cố gắng communicate' — bạn đã làm
                         gì cụ thể? Họp 1-1, gửi email, hay tạo document
                         chung về quyết định thiết kế?",
  "reasoning": "Ứng viên dùng ngôn ngữ mơ hồ 'cố gắng communicate' mà không
                mô tả hành động cụ thể nào.",
  "skip_follow_up": false
}

Ví dụ output khi skip:
{
  "follow_up_type": null,
  "target_phrase": null,
  "follow_up_question": null,
  "reasoning": "Ứng viên đã mô tả đủ hành động cụ thể và kết quả đo lường.",
  "skip_follow_up": true
}

Fallback: Nếu timeout hoặc JSON không hợp lệ → {"skip_follow_up": true}
Token budget: max_tokens = 400 (output nhỏ gọn)
```

---

#### AI Spec — Feedback Analyzer

```
Endpoint: POST /api/ai/feedback
Model: gpt-4o
Mode: JSON mode (response_format: { type: "json_object" })

Input Payload:
{
  "question": "Hãy kể về một lần bạn phải xử lý conflict với đồng nghiệp?",
  "combined_transcript": "Ừm, thì hồi đó tôi làm việc với một bạn trong team
    và chúng tôi không đồng ý về cách thiết kế database. Tôi đã cố gắng
    communicate với bạn đó nhưng mà không hiệu quả lắm. Cuối cùng team lead
    phải vào giải quyết và mọi thứ ổn hơn.
    [FOLLOW-UP]: Bạn đã họp 1-1 với bạn đó ngay ngày hôm sau. Tôi đã chuẩn
    bị một doc nhỏ liệt kê ưu nhược điểm của 2 cách thiết kế, đưa cho bạn
    đọc trước. Buổi họp thì chúng tôi đã thống nhất được.",
  "jd": "Backend Engineer tại công ty fintech...",
  "rubric": {
    "culture": "vn",
    "criteria": [
      {"name": "Tính cụ thể của hành động", "weight": 0.3},
      {"name": "Kỹ năng giao tiếp & xử lý mâu thuẫn", "weight": 0.3},
      {"name": "Kết quả và bài học rút ra", "weight": 0.2},
      {"name": "Phong cách diễn đạt & từ ngữ", "weight": 0.2}
    ],
    "vn_specific_notes": "Đánh giá cao sự khiêm nhường, tinh thần tập thể.
    Không yêu cầu self-promotion mạnh. Chú ý đến sự tôn trọng với đồng nghiệp."
  },
  "cv_structured": {
    "experience": ["2 năm backend", "3 dự án nhóm"],
    "skills": ["Python", "PostgreSQL", "Teamwork"]
  }
}

System Prompt (Context Pack VN):
"Bạn là chuyên gia đánh giá phỏng vấn tại doanh nghiệp Việt Nam với 15 năm
kinh nghiệm. Nhiệm vụ của bạn là phân tích câu trả lời phỏng vấn và tạo
Surgical Feedback theo định dạng JSON chính xác.

QUY TẮC QUAN TRỌNG:
1. Phân tích TỪNG ĐOẠN của transcript, không nhận xét chung chung.
2. Mỗi segment 'warning' hoặc 'critical' BẮT BUỘC phải có improved_version
   khác hoàn toàn với text gốc — không chỉ chỉnh từ.
3. Đánh giá theo tiêu chuẩn VN: tôn trọng tập thể, khiêm tốn, không cần
   tự quảng cáo bản thân quá mức.
4. Filler words (ừm, thì, ý là, kiểu như) = critical nếu > 3 lần/phút.
5. overall_score phải phản ánh đúng tổng hợp các criteria có weighted score.
6. model_answer phải viết bằng cùng ngôn ngữ với transcript."

Output Schema — Surgical Feedback:
{
  "overall_score": 68,
  "context_pack": "vn",
  "voice_summary": {
    "wpm": 95,
    "filler_count": 4,
    "assessment": "Tốc độ nói vừa phải. Số filler words hơi nhiều (4 lần)."
  },
  "segments": [
    {
      "text": "Ừm, thì hồi đó",
      "start_index": 0,
      "end_index": 15,
      "level": "critical",
      "reason": "Mở đầu bằng 2 filler words liên tiếp ('Ừm', 'thì') tạo
                 ấn tượng thiếu chuẩn bị và thiếu tự tin.",
      "suggestion": "Bắt đầu bằng ngữ cảnh cụ thể thay vì filler words.",
      "improved_version": "Trong dự án thiết kế hệ thống thanh toán năm ngoái,"
    },
    {
      "text": "tôi đã cố gắng communicate với bạn đó nhưng mà không hiệu quả lắm",
      "start_index": 89,
      "end_index": 152,
      "level": "warning",
      "reason": "Từ 'cố gắng' mơ hồ — không cho thấy bạn đã làm gì cụ thể.
                 'Không hiệu quả lắm' nghe như đổ lỗi cho hoàn cảnh.",
      "suggestion": "Mô tả hành động cụ thể đã thực hiện và nhận trách nhiệm
                     về cách communicate của mình.",
      "improved_version": "Tôi nhận ra cách tôi trình bày quan điểm chưa đủ
                           thuyết phục, nên tôi đã chủ động chuẩn bị thêm tài
                           liệu so sánh 2 phương án."
    },
    {
      "text": "Cuối cùng team lead phải vào giải quyết và mọi thứ ổn hơn",
      "start_index": 154,
      "end_index": 213,
      "level": "warning",
      "reason": "Kết quả mơ hồ ('mọi thứ ổn hơn') và không thể hiện bạn đã
                 chủ động giải quyết — team lead là người 'phải vào' xử lý.",
      "suggestion": "Làm rõ vai trò của bạn trong kết quả cuối cùng và nêu
                     bài học rút ra.",
      "improved_version": "Sau khi đồng thuận phương án qua tài liệu so sánh,
                           hai bên đã thống nhất mà không cần escalate lên
                           team lead."
    },
    {
      "text": "Tôi đã chuẩn bị một doc nhỏ liệt kê ưu nhược điểm của 2 cách
               thiết kế, đưa cho bạn đọc trước",
      "start_index": 280,
      "end_index": 370,
      "level": "good",
      "reason": "Hành động cụ thể, có chuẩn bị, thể hiện sự tôn trọng với
                 đồng nghiệp — phù hợp với văn hóa VN.",
      "suggestion": null,
      "improved_version": null
    }
  ],
  "model_answer": "Trong dự án thiết kế module thanh toán tại công ty cũ, tôi
    và một đồng nghiệp không đồng ý về cách cấu trúc database — tôi đề xuất
    dùng relational approach còn bạn đó muốn dùng NoSQL. Nhận thấy cách tôi
    trình bày chưa đủ thuyết phục, tôi đã chủ động chuẩn bị một document
    phân tích ưu nhược điểm của cả 2 phương án theo tiêu chí: performance,
    scalability và maintenance cost. Tôi gửi document trước 2 ngày để bạn
    có thời gian đọc, rồi sắp xếp buổi họp 1-1 30 phút. Trong buổi họp,
    chúng tôi đã thống nhất sử dụng hybrid approach. Bài học tôi rút ra là
    khi có bất đồng kỹ thuật, số liệu và dẫn chứng cụ thể thường thuyết
    phục hơn nhiều so với chỉ nêu quan điểm.",
  "key_takeaway": "Thay 'cố gắng communicate' bằng hành động cụ thể đã thực
                   hiện và nêu kết quả đo lường được."
}

Validation Rules (backend phải check trước khi lưu):
1. overall_score: integer, 0–100
2. segments: array, length >= 1
3. Mỗi segment: text không rỗng; level thuộc ["good", "warning", "critical"]
4. Segment level "warning" hoặc "critical": improved_version không rỗng
5. model_answer: string, length >= 100 ký tự

Token budget: input max 2,000; output max 1,500
```

**Acceptance Criteria:**

- [ ] AC-04-1: Voice recording bắt đầu trong ≤ 1 giây sau khi nhấn nút.
- [ ] AC-04-2: Transcript từ Whisper hiển thị trong ≤ 5 giây sau khi dừng ghi âm.
- [ ] AC-04-3: Follow-up question phải chứa ít nhất 1 phrase từ transcript người dùng (validated bởi unit test với string matching).
- [ ] AC-04-4: Toàn bộ Giai đoạn 3 + 4 (Follow-up + Feedback) hoàn thành trong ≤ 8 giây.
- [ ] AC-04-5: Khi Follow-up Engine timeout → phiên không bị crash; tự động bỏ qua follow-up.
- [ ] AC-04-6: Khi Feedback Analyzer timeout → transcript được lưu; hiển thị thông báo phù hợp.
- [ ] AC-04-7: Phiên bị ngắt giữa chừng (đóng tab) → lần sau vào Dashboard thấy option "Tiếp tục".
- [ ] AC-04-8: Voice metrics (WPM, filler count) được tính đúng (sai số ≤ 10% so với đếm thủ công).

---

### UC-05: AI sinh Surgical Feedback

> **Lưu ý:** UC-05 mô tả quy trình AI xử lý nội bộ (backend), được kích hoạt tự động bởi UC-04. Candidate không tương tác trực tiếp với UC-05 — họ chỉ thấy kết quả thông qua UC-06.

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-05 |
| **Tên UC** | AI sinh Surgical Feedback |
| **Mô tả tóm tắt** | Backend gọi Feedback Analyzer, nhận Surgical Feedback JSON, validate schema và lưu dữ liệu annotation vào DB để UC-06 hiển thị. |
| **Tác nhân chính** | Hệ thống (kích hoạt tự động sau mỗi câu trả lời hoàn chỉnh) |
| **Tác nhân phụ** | AI Engine (Feedback Analyzer), Database |
| **Tiền điều kiện** | `user_answer` đã được lưu (bao gồm cả follow-up answer nếu có); `context_pack_id` đã xác định; `rubric_json` đã load. |
| **Hậu điều kiện** | Bản ghi `ai_feedbacks` và mảng `annotated_segments` được lưu vào DB; `user_answer.feedback_generated = true`. |

**Main Flow:**

1. Backend nhận trigger từ UC-04 (sau khi lưu `user_answer`).
2. Backend tổng hợp `FeedbackPayload`:
   - Lấy `original_question.text` từ `session_questions`.
   - Ghép transcript: `combined_transcript = main_answer.transcript + "\n[FOLLOW-UP]: " + follow_up_answer.transcript` (nếu có follow-up).
   - Lấy `session.jd_text`, `session.context_pack_id`, `context_pack.rubric_json`.
   - Lấy `user_profiles.cv_structured` (null nếu không có).
3. Backend gửi `FeedbackPayload` đến FastAPI endpoint `POST /api/ai/feedback`.
4. FastAPI xây dựng system prompt theo Context Pack (xem AI Spec trong UC-04).
5. FastAPI gọi GPT-4o với JSON mode, `temperature = 0.3` (giảm randomness cho feedback nhất quán).
6. FastAPI nhận response raw JSON.

**Bước 7 — Schema Validation (quan trọng):**

```python
def validate_feedback_schema(data: dict) -> tuple[bool, str]:
    # Rule 1: overall_score hợp lệ
    if not isinstance(data.get("overall_score"), int):
        return False, "overall_score must be integer"
    if not (0 <= data["overall_score"] <= 100):
        return False, "overall_score out of range"

    # Rule 2: segments không rỗng
    if not data.get("segments") or len(data["segments"]) == 0:
        return False, "segments array is empty"

    # Rule 3: Mỗi segment hợp lệ
    for i, seg in enumerate(data["segments"]):
        if not seg.get("text") or not seg.get("level"):
            return False, f"segment[{i}] missing required fields"
        if seg["level"] not in ["good", "warning", "critical"]:
            return False, f"segment[{i}] invalid level"
        if seg["level"] in ["warning", "critical"]:
            if not seg.get("improved_version"):
                return False, f"segment[{i}] missing improved_version"

    # Rule 4: model_answer đủ dài
    if len(data.get("model_answer", "")) < 100:
        return False, "model_answer too short"

    return True, "valid"
```

8. Nếu validation **pass**: lưu vào DB:
   - `INSERT INTO ai_feedbacks` (overall_score, model_answer, key_takeaway, context_pack_id, voice_summary_json, user_answer_id)
   - `INSERT INTO annotated_segments` (feedback_id, text, start_index, end_index, level, reason, suggestion, improved_version) — một record cho mỗi phần tử `segments[]`
   - Cập nhật `user_answers.feedback_generated = true`

9. Nếu validation **fail**: kích hoạt Fallback (xem bên dưới).

10. Trả về `{feedback_id, status: "success"}` cho UC-04.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-05-1 | GPT-4o timeout (> 15 giây) | Ghi log error với payload; trả về `{status: "timeout", fallback: true}` cho UC-04. |
| E-05-2 | GPT-4o trả về không phải JSON hợp lệ | Parse lỗi → kích hoạt Fallback; ghi log raw response. |
| E-05-3 | Schema validation fail (segments rỗng, missing fields) | Kích hoạt Fallback; ghi log chi tiết validation error. |
| E-05-4 | Database insert thất bại | Retry 1 lần; nếu vẫn lỗi → ghi vào error queue để xử lý sau; trả về status timeout cho người dùng. |

**Fallback Strategy:**

Khi Surgical Feedback không thể sinh hoặc không pass validation, hệ thống kích hoạt **Text Fallback**:

```python
def generate_text_fallback(transcript: str, question: str) -> dict:
    """
    Gọi GPT-4o với prompt đơn giản hơn — không yêu cầu segment annotation.
    Chỉ cần overall comment và gợi ý ngắn.
    """
    simple_prompt = f"""
    Câu hỏi: {question}
    Câu trả lời: {transcript}

    Đưa ra nhận xét ngắn gọn (2-3 câu) về điểm mạnh và điểm cần cải thiện.
    Trả về JSON: {{"comment": "...", "strength": "...", "improvement": "..."}}
    """
    # Gọi GPT-4o với max_tokens=300
    # Lưu vào ai_feedbacks với segments = [] và fallback_text = comment
    # Không lưu annotated_segments
```

**Acceptance Criteria:**

- [ ] AC-05-1: Surgical Feedback được sinh và lưu vào DB trong ≤ 8 giây từ khi trigger.
- [ ] AC-05-2: Mọi segment `warning`/`critical` đều có `improved_version` không rỗng, không null.
- [ ] AC-05-3: `overall_score` là integer trong khoảng [0, 100].
- [ ] AC-05-4: Khi validation fail → Fallback được kích hoạt; Candidate thấy text feedback thay vì lỗi kỹ thuật.
- [ ] AC-05-5: Tất cả records `annotated_segments` có `feedback_id` FK hợp lệ, không có orphan record.
- [ ] AC-05-6: Với cùng transcript và JD, 2 lần gọi Feedback Analyzer phải cho `overall_score` chênh lệch ≤ 10 điểm (temperature = 0.3 đảm bảo tính nhất quán).

---

### UC-06: Xem Surgical Feedback chi tiết

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-06 |
| **Tên UC** | Xem Surgical Feedback chi tiết |
| **Mô tả tóm tắt** | Candidate xem transcript được highlight từng đoạn theo mức độ chất lượng, tương tác với từng annotation để hiểu chính xác cần sửa gì, và xem Model Answer. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | Không có (chỉ đọc từ DB) |
| **Tiền điều kiện** | `ai_feedbacks` và `annotated_segments` đã được lưu đầy đủ (UC-05 hoàn thành). |
| **Hậu điều kiện** | Candidate đã xem ít nhất 1 annotation chi tiết; session được đánh dấu `viewed = true`. |

**Main Flow:**

1. Candidate nhấn **"Xem phân tích chi tiết"** từ màn hình kết thúc phiên, hoặc chọn câu hỏi từ UC-08.
2. Hệ thống hiển thị danh sách câu hỏi trong phiên dưới dạng tab.
3. Candidate chọn tab câu hỏi muốn xem (mặc định là câu hỏi đầu tiên).
4. Trang Feedback chi tiết hiển thị cấu trúc sau:

   ```
   ┌─────────────────────────────────────────────────────────┐
   │  Câu hỏi: "Hãy kể về một lần bạn xử lý conflict..."   │
   │  Điểm: 68/100  Context: 🇻🇳 VN Pack                   │
   │  💡 Key Takeaway: "Thay 'cố gắng communicate'..."      │
   ├─────────────────────────────────────────────────────────┤
   │  📝 Transcript của bạn                                  │
   │                                                         │
   │  [🔴 Ừm, thì hồi đó] tôi làm việc với một bạn trong   │
   │  team và chúng tôi không đồng ý về cách thiết kế       │
   │  database. [🟡 Tôi đã cố gắng communicate với bạn đó  │
   │  nhưng mà không hiệu quả lắm.] [🔴 Cuối cùng team     │
   │  lead phải vào giải quyết và mọi thứ ổn hơn.]         │
   │                                                         │
   │  [FOLLOW-UP] ... [🟢 Tôi đã chuẩn bị một doc nhỏ...]  │
   ├─────────────────────────────────────────────────────────┤
   │  🎯 Câu trả lời mẫu (Model Answer)                     │
   │  Trong dự án thiết kế module thanh toán...              │
   ├─────────────────────────────────────────────────────────┤
   │  [🔁 Luyện lại câu này]                                │
   └─────────────────────────────────────────────────────────┘
   ```

5. Candidate click hoặc hover vào đoạn màu **VÀNG** hoặc **ĐỎ**:
6. Hệ thống hiển thị **Annotation Popup** bên cạnh đoạn được click:

   ```
   ┌──────────────────────────────────────────┐
   │ 🔴 Cần sửa ngay                          │
   │ ─────────────────────────────────────    │
   │ 📌 Vấn đề:                               │
   │ Mở đầu bằng 2 filler words liên tiếp    │
   │ ('Ừm', 'thì') tạo ấn tượng thiếu chuẩn  │
   │ bị và thiếu tự tin.                      │
   │ ─────────────────────────────────────    │
   │ 💡 Gợi ý:                                │
   │ Bắt đầu bằng ngữ cảnh cụ thể thay vì    │
   │ filler words.                            │
   │ ─────────────────────────────────────    │
   │ ✅ Nên nói:                              │
   │ "Trong dự án thiết kế hệ thống thanh    │
   │  toán năm ngoái,"                        │
   └──────────────────────────────────────────┘
   ```

7. Candidate đọc annotation; có thể đóng popup bằng cách click ra ngoài.
8. Candidate xem **Model Answer** ở cuối trang.
9. Candidate nhấn **"🔁 Luyện lại câu này"** → kích hoạt UC-07.
10. Candidate nhấn tab câu hỏi khác → quay lại bước 3 với câu hỏi mới.

**Alternative Flow:**

- **AF-06-A**: Feedback được sinh theo Fallback (không có segment annotation) → Hiển thị tab "Nhận xét chung" thay vì Annotated Transcript; text comment hiện ở vị trí transcript; không có màu highlight.
- **AF-06-B**: Voice metrics khả dụng → Hiển thị badge nhỏ: `🎤 95 WPM · 4 filler words`.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-06-1 | `annotated_segments` không load được từ DB | Hiển thị skeleton loader trong 3 giây; retry 1 lần; nếu vẫn lỗi → hiển thị: "Không thể tải phân tích. Vui lòng thử lại." |
| E-06-2 | `start_index`/`end_index` không khớp với transcript text (lỗi index) | Log lỗi; hiển thị transcript không có highlight cho segment đó; các segment khác vẫn hiển thị bình thường. |

**Acceptance Criteria:**

- [ ] AC-06-1: Transcript với annotation load trong ≤ 500 ms.
- [ ] AC-06-2: Màu highlight chính xác: 🟢 good, 🟡 warning, 🔴 critical.
- [ ] AC-06-3: Click vào đoạn annotated → popup hiển thị đủ 3 phần (reason, suggestion, improved_version).
- [ ] AC-06-4: Model Answer luôn hiển thị đầy đủ, không bị truncate.
- [ ] AC-06-5: Nút "Luyện lại câu này" chỉ hiện khi có ít nhất 1 segment `warning` hoặc `critical`.

---

### UC-07: Rewrite & Compare

> **Đây là Use Case kết thúc vòng lặp học tập của hệ thống.** UC-07 cho phép Candidate nói/gõ lại câu trả lời và thấy ngay sự cải thiện qua so sánh annotation trước và sau — đây là điểm khác biệt lớn nhất so với tất cả các sản phẩm cạnh tranh hiện tại.

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-07 |
| **Tên UC** | Rewrite & Compare |
| **Mô tả tóm tắt** | Sau khi xem Surgical Feedback, Candidate nói hoặc gõ lại câu trả lời. AI re-evaluate theo cùng rubric và hiển thị so sánh hai phiên bản với delta score. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | AI Engine (Whisper, Feedback Analyzer) |
| **Tiền điều kiện** | UC-06 đã hiển thị Surgical Feedback cho câu hỏi; tồn tại ít nhất 1 segment `warning` hoặc `critical`. |
| **Hậu điều kiện** | `rewrite_answers` record được lưu với transcript mới, annotation mới và delta_score; Candidate thấy sự thay đổi rõ ràng giữa 2 phiên bản. |

**Main Flow:**

**Giai đoạn 1 — Khởi tạo Rewrite session**

1. Candidate nhấn **"🔁 Luyện lại câu này"** từ UC-06.
2. Hệ thống hiển thị màn hình Rewrite với layout 2 cột:
   - **Cột TRÁI** (50%): "Lần trả lời gốc" — Annotated Transcript cũ với highlight đỏ/vàng/xanh và điểm gốc.
   - **Cột PHẢI** (50%): "Lần thử [N]" — Vùng nhập liệu trống (Voice hoặc Text); countdown badge "Lần 1 / tối đa 5".
3. Hệ thống hiển thị lại câu hỏi gốc ở trên cùng để Candidate tham khảo.
4. Hiển thị **Key Takeaway** của lần gốc như "nhắc nhở": "💡 Nhớ: Thay 'cố gắng' bằng hành động cụ thể."

**Giai đoạn 2 — Candidate trả lời lại**

5. Candidate chọn Voice hoặc Text (mặc định giống lần gốc).

   **Voice Path:**
   6a. Candidate nhấn **🎤** → ghi âm → nhấn **■** dừng.
   6b. Audio gửi đến Whisper → nhận transcript mới.
   6c. Transcript mới hiển thị ở Cột PHẢI với animation typing.

   **Text Path:**
   6d. Candidate gõ vào textarea ở Cột PHẢI.
   6e. Candidate nhấn **"Gửi để phân tích"**.

**Giai đoạn 3 — Re-evaluation [AI-critical]**

7. Backend tổng hợp `RewritePayload` (xem AI Spec bên dưới).
8. Backend gọi Feedback Analyzer với flag `is_rewrite = true` và thêm `original_transcript` để AI có thể so sánh.
9. AI trả về `RewriteFeedback` schema (xem AI Spec).
10. Backend:
    - Lưu `rewrite_answers` record: (session_id, question_id, transcript, attempt_number, timestamp)
    - Lưu `annotated_segments` mới với `rewrite_answer_id`
    - Tính `delta_score = new_overall_score - original_overall_score`
    - Lưu `delta_score` vào `rewrite_answers`

**Giai đoạn 4 — Hiển thị Comparison**

11. Sau khi AI xử lý xong, màn hình cập nhật layout so sánh đầy đủ:

   ```
   ┌────────────────────────┬────────────────────────┐
   │  📝 Lần gốc — 68/100  │  📝 Lần 1 — 81/100    │
   │                        │                        │
   │  [🔴 Ừm, thì hồi đó] │  [🟢 Trong dự án       │
   │  tôi làm việc với...  │  thiết kế module...]   │
   │  [🟡 cố gắng          │  [🟢 Tôi đã chủ động  │
   │  communicate]         │  chuẩn bị document]    │
   │  [🔴 Cuối cùng team   │  [🟡 Kết quả: hai     │
   │  lead phải vào]       │  bên thống nhất]       │
   │                        │                        │
   │  Voice: 4 fillers      │  Voice: 1 filler       │
   ├────────────────────────┴────────────────────────┤
   │          ↑ +13 điểm    Cải thiện tốt! 🎉       │
   └─────────────────────────────────────────────────┘
   ```

12. Hiển thị **Delta Score badge** ở trung tâm:
    - `delta > 10`: màu xanh đậm, icon 🎉, text "Cải thiện rõ rệt!"
    - `delta 1–10`: màu xanh nhạt, icon ✓, text "Có cải thiện"
    - `delta = 0`: màu vàng, icon ⚡, text "Chưa thay đổi nhiều — xem gợi ý bên trái"
    - `delta < 0`: màu cam, icon ↩, text "Điểm giảm — xem lại annotation gốc"

13. Candidate có thể click vào annotation của **Lần 1** ở Cột PHẢI để xem popup giải thích mới.
14. Hệ thống hiển thị nút **"Thử lại lần [N+1]"** (nếu còn < 5 lần) hoặc **"Đã đạt tối đa lần thử"**.

**Giai đoạn 5 — Kết thúc Rewrite session**

15. Candidate nhấn **"Xong"** hoặc chọn sang câu hỏi khác → quay lại UC-06 với câu hỏi tiếp theo.

**Alternative Flow:**

- **AF-07-A**: Candidate muốn thử lại (lần 2, 3...) → nhấn "Thử lại" → quay về Giai đoạn 2; lần trước vẫn hiển thị ở Cột TRÁI (so sánh với lần cũ nhất).
- **AF-07-B**: Sau lần 3 trở đi, Cột TRÁI hiển thị lần có điểm cao nhất (không nhất thiết là lần gốc) để so sánh ý nghĩa hơn.
- **AF-07-C**: Candidate nhấn "So sánh tất cả" → hiển thị timeline tất cả các lần thử với điểm số trên trục thời gian.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-07-1 | Audio ghi âm lần Rewrite thất bại | Tương tự E-04-2; tự chuyển sang Text Path. |
| E-07-2 | Feedback Analyzer timeout cho lần Rewrite | Lưu transcript; hiển thị: "Phân tích đang xử lý, vui lòng đợi..." Retry 1 lần sau 5 giây. |
| E-07-3 | Candidate đã thử 5 lần | Ẩn nút "Thử lại"; hiển thị: "Bạn đã luyện lại câu này 5 lần. Hãy xem Model Answer để tham khảo cách tốt nhất." |
| E-07-4 | `delta_score` tính ra NaN hoặc null | Hiển thị điểm mới mà không hiển thị delta; ghi log. |

---

#### AI Spec — Rewrite Evaluator

```
Endpoint: POST /api/ai/feedback (cùng endpoint với UC-05, thêm flag is_rewrite)
Model: gpt-4o
Mode: JSON mode
Temperature: 0.3 (giữ nhất quán với lần gốc)

Input Payload:
{
  "question": "Hãy kể về một lần bạn phải xử lý conflict với đồng nghiệp?",
  "combined_transcript": "[LẦN THỬ MỚI] Trong dự án thiết kế hệ thống thanh
    toán năm ngoái, tôi và một đồng nghiệp có quan điểm khác nhau về cách
    cấu trúc database. Tôi đã chủ động chuẩn bị một document phân tích ưu
    nhược điểm của 2 phương án và gửi trước 2 ngày để bạn đọc. Sau buổi họp
    1-1, chúng tôi đã thống nhất dùng hybrid approach.",
  "original_transcript": "[LẦN GỐC] Ừm, thì hồi đó tôi làm việc với...",
  "original_score": 68,
  "original_segments_summary": "Lần gốc có vấn đề chính: filler words nhiều,
    hành động không cụ thể, đổ trách nhiệm cho team lead.",
  "jd": "...",
  "rubric": {...},
  "cv_structured": {...},
  "is_rewrite": true
}

System Prompt bổ sung cho Rewrite:
"Đây là lần thử lại sau khi ứng viên đã nhận được feedback. Hãy đánh giá
khách quan theo cùng rubric. Chú ý đặc biệt: ứng viên có cải thiện được
các điểm đã được chỉ ra ở lần trước không? Trong overall_score, phản ánh
sự tiến bộ thực chất, không phải khen ngợi để động viên."

Output Schema (giống Surgical Feedback nhưng thêm 2 field):
{
  "overall_score": 81,
  "context_pack": "vn",
  "improvement_note": "Đã loại bỏ filler words, hành động cụ thể hơn nhiều.
                       Vẫn cần làm rõ kết quả cuối cùng bằng số liệu.",
  "delta_score": 13,                    // Tính bởi AI để cross-check
  "segments": [...],                    // Annotation đầy đủ như UC-05
  "model_answer": "...",
  "key_takeaway": "Thêm kết quả đo lường: dự án hoàn thành đúng deadline
                   hay tiết kiệm được bao nhiêu thời gian?"
}

Validation: Giống UC-05
Token budget: max input 2,500 (thêm original transcript); max output 1,500
```

**Acceptance Criteria:**

- [ ] AC-07-1: Side-by-side comparison hiển thị đồng thời 2 cột, không cần scroll ngang trên desktop.
- [ ] AC-07-2: Delta Score hiển thị đúng (new_score - original_score) với icon và màu sắc tương ứng.
- [ ] AC-07-3: Candidate có thể Rewrite tối đa 5 lần cho mỗi câu hỏi.
- [ ] AC-07-4: Annotation của lần Rewrite được lưu riêng biệt, không ghi đè annotation gốc.
- [ ] AC-07-5: Toàn bộ quá trình Rewrite (ghi âm → transcribe → re-evaluate → hiển thị) hoàn thành trong ≤ 12 giây.
- [ ] AC-07-6: Key Takeaway của lần gốc hiển thị như nhắc nhở trong suốt quá trình Rewrite.
- [ ] AC-07-7: `improvement_note` phải nhận xét cụ thể về sự thay đổi so với lần gốc (không phải comment chung chung).

---

### UC-08: Xem danh sách phiên luyện tập

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-08 |
| **Tên UC** | Xem danh sách phiên luyện tập |
| **Mô tả tóm tắt** | Candidate xem lại toàn bộ phiên đã thực hiện, chọn một phiên để xem lại Surgical Feedback chi tiết. |
| **Tác nhân chính** | Candidate |
| **Tác nhân phụ** | Không có |
| **Tiền điều kiện** | Candidate đã đăng nhập; có ít nhất 1 phiên với `status = completed`. |
| **Hậu điều kiện** | Không có thay đổi dữ liệu; Candidate có thể navigate đến UC-06 từ đây. |

**Main Flow:**

1. Candidate truy cập **Dashboard** hoặc **Lịch sử**.
2. Hệ thống hiển thị danh sách phiên dưới dạng card theo thứ tự `created_at DESC`.
3. Mỗi card hiển thị:
   - Ngày và giờ thực hiện
   - Vị trí ứng tuyển (trích từ JD bằng AI, lưu khi tạo phiên)
   - Context Pack icon (🇻🇳 hoặc 🌍)
   - Điểm tổng (`session.overall_score`)
   - Số câu đã trả lời / tổng số câu
   - Badge `Đã Rewrite` nếu có ít nhất 1 câu được luyện lại
4. Candidate click vào một card → chuyển đến UC-06 với phiên được chọn, mặc định hiển thị câu hỏi đầu tiên.

**Alternative Flow:**

- **AF-08-A**: Phiên có `status = interrupted` → hiển thị badge "Chưa hoàn thành"; nhấn vào → tùy chọn "Tiếp tục phiên" (chuyển đến UC-04) hoặc "Xem những gì đã làm" (chuyển đến UC-06 với câu đã có feedback).
- **AF-08-B**: Không có phiên nào → hiển thị empty state: "Bạn chưa có phiên luyện tập nào. Hãy bắt đầu ngay!" + nút CTA.

**Exception Flow:**

| Mã lỗi | Tình huống | Xử lý |
|---|---|---|
| E-08-1 | Danh sách không load được | Retry 1 lần; hiển thị skeleton; nếu vẫn lỗi → thông báo lỗi và nút Tải lại. |

**Acceptance Criteria:**

- [ ] AC-08-1: Danh sách phiên load trong ≤ 300 ms.
- [ ] AC-08-2: Phiên interrupted được phân biệt rõ với phiên completed.
- [ ] AC-08-3: Click vào phiên → navigate đến UC-06 đúng phiên trong ≤ 200 ms.

---

## Nhóm B — Quản trị hệ thống

---

### UC-09: Quản trị người dùng

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-09 |
| **Tên UC** | Quản trị người dùng |
| **Mô tả tóm tắt** | Admin xem, tìm kiếm và quản lý danh sách Candidate đã đăng ký hệ thống. |
| **Tác nhân chính** | Admin |
| **Tác nhân phụ** | Không có |
| **Tiền điều kiện** | Admin đã đăng nhập với `role = admin`. |
| **Hậu điều kiện** | Thay đổi trạng thái user được lưu và có hiệu lực ngay. |

**Main Flow:**

1. Admin truy cập trang **Admin Panel > Người dùng**.
2. Hệ thống hiển thị bảng người dùng: Email, Tên, Ngày đăng ký, Số phiên, Trạng thái (active/banned).
3. Admin có thể:
   - **Tìm kiếm** theo email hoặc tên.
   - **Xem chi tiết**: click vào một user → xem profile, lịch sử phiên (số phiên, điểm trung bình).
   - **Khóa/Mở khóa tài khoản**: toggle `status = banned/active`.
4. Thay đổi trạng thái được lưu ngay; nếu user đang đăng nhập → phiên bị terminate khi gọi API tiếp theo.

**Exception Flow:** E-09-1: Admin cố khóa tài khoản Admin khác → Hệ thống từ chối; hiển thị: "Không thể khóa tài khoản Admin."

**Acceptance Criteria:**

- [ ] AC-09-1: Bảng người dùng load trong ≤ 500 ms.
- [ ] AC-09-2: Khóa tài khoản → user bị redirect về trang login khi gọi API tiếp theo.
- [ ] AC-09-3: Admin không thể tự khóa tài khoản của chính mình.

---

### UC-10: Quản lý ngân hàng câu hỏi

| Trường | Nội dung |
|---|---|
| **Mã UC** | UC-10 |
| **Tên UC** | Quản lý ngân hàng câu hỏi |
| **Mô tả tóm tắt** | Admin thêm, sửa, xóa câu hỏi seed trong Question Bank và gắn tag phù hợp để Question Generator sử dụng làm fallback. |
| **Tác nhân chính** | Admin |
| **Tác nhân phụ** | Không có |
| **Tiền điều kiện** | Admin đã đăng nhập. |
| **Hậu điều kiện** | Question Bank cập nhật; fallback của Question Generator sử dụng câu hỏi mới. |

**Main Flow:**

1. Admin truy cập **Admin Panel > Ngân hàng câu hỏi**.
2. Hệ thống hiển thị bảng câu hỏi với filter: Context Pack, Category, Difficulty.
3. **Thêm câu hỏi mới:** Admin nhấn "Thêm" → điền form:
   - `question_text` (bắt buộc)
   - `context_pack_id`: `vn` hoặc `western`
   - `category`: `behavioral | situational | motivational`
   - `difficulty`: `junior | mid | senior`
   - `tags`: mảng keyword tự do (ví dụ: ["teamwork", "conflict", "leadership"])
4. Nhấn Lưu → hệ thống validate và insert vào bảng `questions`.
5. **Sửa / Xóa:** Click vào câu hỏi → Edit form / nút Xóa (xóa mềm: `deleted_at = now()`).

**Exception Flow:** E-10-1: `question_text` trùng lặp (> 90% similarity) → cảnh báo "Câu hỏi này có thể đã tồn tại" nhưng vẫn cho phép lưu.

**Acceptance Criteria:**

- [ ] AC-10-1: Question Bank hiển thị tối thiểu 60 câu seed data (30 VN + 30 Western) khi demo.
- [ ] AC-10-2: Câu hỏi bị xóa (soft delete) không xuất hiện trong fallback của Question Generator.
- [ ] AC-10-3: Filter theo Context Pack và Category hoạt động chính xác.

---

*Hết Chương 3 — Đặc tả Use Case*

---

> **Ghi chú:** Chương 4 (Yêu cầu phi chức năng), Chương 5 (Đặc tả tích hợp AI) và Phụ lục sẽ được trình bày trong các phần tiếp theo.
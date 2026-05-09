# Glossary — InterviewAI

**Nguồn gốc:** Trích xuất và chuẩn hóa từ SRS v1.6 §1.3 và Discovery Document v0.1.
**Cập nhật lần cuối:** 2026-05-06
**Quy tắc:** Thuật ngữ mới phải được thêm vào đây trước khi dùng trong bất kỳ tài liệu nào khác.

---

## A

**Adaptive Follow-up**
Cơ chế AI đọc transcript câu trả lời của người dùng và sinh ra câu hỏi đào sâu dựa trên một claim cụ thể trong câu trả lời đó, thay vì hỏi câu hỏi tiếp theo theo danh sách cố định.
*Nguồn: SRS §1.3*

**Admin**
Tác nhân người dùng có quyền quản trị hệ thống — xem/khóa tài khoản, quản lý Question Bank. Quyền `admin` được gán thủ công trong cơ sở dữ liệu bởi tác giả; không có luồng đăng ký Admin qua giao diện.
*Nguồn: SRS §2.1.2*

**AI Engine**
Tập hợp các module AI của hệ thống bao gồm Question Generator, Follow-up Engine và Feedback Analyzer. Là tác nhân hệ thống phụ trợ, không phải người dùng cuối.
*Nguồn: SRS §1.3, §2.1.3*

**Annotated Transcript**
Bản ghi lời của người dùng (transcript) được đánh dấu màu sắc theo từng đoạn (segment) tương ứng với mức độ chất lượng: xanh (tốt), vàng (cần cải thiện), đỏ (cần sửa ngay).
*Nguồn: SRS §1.3*

---

## C

**Candidate**
Người dùng cuối của hệ thống — sinh viên năm cuối hoặc fresher CNTT tại Việt Nam có 0–12 tháng kinh nghiệm — sử dụng hệ thống để luyện tập phỏng vấn xin việc.
*Nguồn: SRS §1.3, §2.1.1*

**Claim**
Một phát biểu, con số, hoặc khẳng định cụ thể mà người dùng đưa ra trong câu trả lời. Ví dụ: *"Tôi đã lead team 5 người"* hoặc *"Dự án hoàn thành đúng deadline"*.
*Nguồn: SRS §1.3*

**Context Pack**
Gói cấu hình bao gồm system prompt template và rubric chấm điểm được thiết kế riêng cho một văn hóa doanh nghiệp cụ thể. Phiên bản v1.0 hỗ trợ hai pack: **VN** (Việt Nam) và **Western** (quốc tế).
*Nguồn: SRS §1.3, §1.2.3*

---

## D

**Delta Score**
Sự thay đổi về điểm số giữa câu trả lời gốc và câu trả lời sau khi Rewrite, thể hiện mức độ cải thiện hoặc sụt giảm. Được hiển thị trong UC-07 (Rewrite & Compare).
*Nguồn: SRS §1.3*

---

## F

**Fallback**
Hành vi dự phòng của hệ thống khi AI gặp lỗi (timeout, schema sai, rate limit), đảm bảo người dùng không nhận thông báo lỗi kỹ thuật thô. Xem chi tiết trong SAD §2.4.
*Nguồn: SRS §1.3*

**Feedback Analyzer**
Module AI thuộc AI Engine, nhận transcript và context (JD, Context Pack, CV) để sinh Surgical Feedback có cấu trúc JSON. Gọi thông qua FastAPI endpoint.
*Nguồn: SRS §2.1.3*

**Filler Words**
Các từ đệm không có nghĩa xuất hiện trong khi nói. Phổ biến trong tiếng Việt: *"ừm"*, *"à"*, *"thì"*, *"ý là"*, *"kiểu như"*. Được phát hiện qua voice analysis và hiển thị như thông tin hỗ trợ.
*Nguồn: SRS §1.3*

**Follow-up Engine**
Module AI thuộc AI Engine, sinh câu hỏi đào sâu (Adaptive Follow-up) dựa trên transcript câu trả lời vừa nhận.
*Nguồn: SRS §2.1.3*

**Follow-up Type**
Phân loại câu hỏi đào sâu gồm 3 loại:
- `clarify` — làm rõ điểm mơ hồ
- `challenge` — thách thức một khẳng định
- `expand` — mở rộng sang tình huống khó hơn

*Nguồn: SRS §1.3*

---

## I

**Interview Type**
Loại hình phỏng vấn được Candidate chọn khi cấu hình phiên. Gồm 2 giá trị:
- `behavioral` — chỉ câu hỏi hành vi theo cấu trúc STAR
- `mixed` — kết hợp behavioral, situational và motivational

*Nguồn: SRS §1.3*

---

## J

**JD (Job Description)**
Bản mô tả công việc do người dùng cung cấp bằng cách paste vào hệ thống dưới dạng plain text. AI sử dụng JD để sinh câu hỏi phù hợp và đánh giá độ tương thích của câu trả lời. Giới hạn: tối đa 5.000 ký tự; tối thiểu 100 ký tự có nghĩa.
*Nguồn: SRS §1.3, P-18, AS-04*

**Job Title**
Tên vị trí công việc ngắn gọn được AI trích xuất tự động từ JD khi tạo phiên. Ví dụ: *"Backend Engineer"*, *"Product Manager"*. Lưu vào `interview_sessions.job_title` để hiển thị trên card lịch sử phiên.
*Nguồn: SRS §1.3*

**JSON Mode**
Chế độ của OpenAI API đảm bảo output luôn là JSON hợp lệ. Được sử dụng cho các prompt có cấu trúc output phức tạp như Surgical Feedback schema.
*Nguồn: SRS §1.3*

---

## M

**Model Answer**
Câu trả lời mẫu được AI sinh ra dựa trên câu hỏi, JD, Context Pack và CV của người dùng (nếu có), thể hiện cách một ứng viên lý tưởng sẽ trả lời.
*Nguồn: SRS §1.3*

---

## Q

**Question Generator**
Module AI thuộc AI Engine, sinh câu hỏi phỏng vấn dựa trên JD, Interview Type và Context Pack khi Candidate tạo phiên (UC-03).
*Nguồn: SRS §2.1.3*

---

## R

**Rubric**
Bộ tiêu chí chấm điểm được định nghĩa trong Context Pack, quy định trọng số và tiêu chuẩn đánh giá phù hợp với từng văn hóa doanh nghiệp (VN hoặc Western).
*Nguồn: SRS §1.3*

**Rewrite & Compare**
Tính năng cho phép người dùng nói hoặc gõ lại câu trả lời sau khi xem Surgical Feedback, sau đó so sánh hai phiên bản (trước và sau) với annotation và delta score tương ứng. Giới hạn: tối đa 5 lần rewrite/câu hỏi.
*Nguồn: SRS §1.3, P-21*

---

## S

**Segment**
Một đoạn văn bản liên tục trong transcript được xác định bởi chỉ số bắt đầu (`start_index`) và kết thúc (`end_index`). Là đơn vị cơ bản của Surgical Feedback. Mỗi segment có level: `good`, `warning`, hoặc `critical`.
*Nguồn: SRS §1.3*

**Session / Phiên**
Một buổi luyện tập phỏng vấn hoàn chỉnh, bao gồm tối đa 7 câu hỏi, follow-up và feedback tương ứng. Phiên bị ngắt giữa chừng có thể tiếp tục (UC-04 AC-04-7).
*Nguồn: SRS §1.3, P-20*

**STAR Framework**
Phương pháp trả lời câu hỏi phỏng vấn hành vi (behavioral) theo cấu trúc:
- **S**ituation — Bối cảnh
- **T**ask — Nhiệm vụ
- **A**ction — Hành động
- **R**esult — Kết quả

*Nguồn: SRS §1.3*

**Surgical Feedback**
Phản hồi của AI được áp dụng ở cấp độ từng đoạn (segment) trong transcript, chỉ ra chính xác đoạn nào cần sửa, tại sao, và nên sửa thành gì — khác với feedback tổng quát theo tiêu chí.
*Nguồn: SRS §1.3; xem thêm UC-05, UC-06*

---

## T

**Token**
Đơn vị đo lường văn bản của mô hình ngôn ngữ (LLM). Tương đương khoảng 0,75 từ tiếng Anh hoặc 0,5 từ tiếng Việt.
*Nguồn: SRS §1.3*

**Transcript**
Bản ghi lời nói của người dùng, được chuyển đổi từ audio (qua Whisper API) hoặc nhập trực tiếp bằng văn bản. Là đầu vào chính cho Surgical Feedback.
*Nguồn: SRS §1.3*

---

## W

**WPM (Words Per Minute)**
Tốc độ nói tính bằng số từ trên phút. Là một trong các voice metrics được phân tích từ transcript và hiển thị như thông tin hỗ trợ (không thay thế đánh giá nội dung).
*Nguồn: SRS §1.3, Q-06*

---

## Thuật ngữ chưa định nghĩa / cần bổ sung

*(Để trống — điền vào khi elicit thêm requirements)*

---

*Xem thêm: [SRS §1.3](SRS/SRS_InterviewAI_Full.md#13-từ-điển-thuật-ngữ) — nguồn gốc của glossary này. Khi SRS thay đổi định nghĩa, cập nhật cả đây.*

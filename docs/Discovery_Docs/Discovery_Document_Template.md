# Product Discovery Document — Interview Coach

**Loại tài liệu:** Product Discovery / User Research Report
**Mục đích:** Tổng hợp toàn bộ nghiên cứu người dùng, phân tích thị trường, và định nghĩa vấn đề — làm input chính thức cho SRS.
**Vị trí trong chuỗi tài liệu:**

```
Business Case → [📍 Discovery Document] → Stakeholder Requirements → SRS → SAD → Code & Test
```

---

## 📖 Hướng dẫn sử dụng template này

> **Đọc phần này một lần trước khi bắt đầu fill in.**

**Cách viết:** Đừng viết tuần tự từ trên xuống dưới. Bắt đầu với Phần 4 (Personas) và Phần 7 (Problem Statement) trước khi viết Phần 1. Hai phần đó là xương sống — các phần khác bổ trợ chúng.

**Cách điền:** Tài liệu dùng các quy ước sau:
- `[ĐIỀN VÀO: ...]` — chỗ bạn cần điền nội dung
- `> 💡 **Gợi ý:** ...` — hướng dẫn cách viết
- `> 📝 **Ví dụ:** ...` — ví dụ minh họa, bạn xóa khi điền nội dung thật
- `> ⚠️ **Lưu ý:** ...` — cảnh báo lỗi thường gặp
- `> 🎯 **Validation prompt:** ...` — câu hỏi self-check cuối mỗi section

**Tiến độ:** Cập nhật mỗi tuần khi research, không để cuối mới viết. Mục **"Tracking sheet"** ở phụ lục giúp bạn theo dõi.

**Độ dài kỳ vọng:** Nội dung chính 25-40 trang khi xong. Phụ lục có thể dày hơn. Dưới 15 trang = research chưa đủ; trên 60 trang = nhồi nhét, cần tách bớt.

**Khi nào "xong":** Khi bạn có thể trả lời 5 câu hỏi cuối tài liệu (mục "Ready to write SRS?") với confidence cao.

---

## Front Matter

### Metadata

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | InterviewAI — AI Interview Coach System |
| **Phiên bản tài liệu** | [ĐIỀN VÀO: 0.1 / 0.2 / 1.0...] |
| **Ngày soạn** | [ĐIỀN VÀO] |
| **Ngày cập nhật** | [ĐIỀN VÀO] |
| **Trạng thái** | [ĐIỀN VÀO: Draft / In Review / Baselined] |
| **Tác giả** | Lê Thành An — MSSV: 20235631 |
| **Giảng viên hướng dẫn** | Tiến sĩ Cao Tuấn Dũng |
| **Đơn vị** | Viện CNTT \u0026 TT (SOICT), ĐHBKHN |

### Lịch sử phiên bản

| Phiên bản | Ngày | Mô tả thay đổi |
|---|---|---|
| 0.1 | [ngày] | Khởi tạo template, draft Phần 1-2 |
| 0.2 | [ngày] | Hoàn thành 5 user interviews, cập nhật Phần 4-5 |
| ... | ... | ... |

### Mục lục

- [1. Bối cảnh và động lực](#1-bối-cảnh-và-động-lực)
- [2. Phương pháp nghiên cứu](#2-phương-pháp-nghiên-cứu)
- [3. Phân tích thị trường và đối thủ](#3-phân-tích-thị-trường-và-đối-thủ)
- [4. Chân dung người dùng (User Personas)](#4-chân-dung-người-dùng-user-personas)
- [5. User Journey và Pain Points](#5-user-journey-và-pain-points)
- [6. Tổng hợp insight](#6-tổng-hợp-insight)
- [7. Định nghĩa vấn đề (Problem Statement)](#7-định-nghĩa-vấn-đề-problem-statement)
- [8. Cơ hội và định hướng giải pháp](#8-cơ-hội-và-định-hướng-giải-pháp)
- [9. Giả định và rủi ro](#9-giả-định-và-rủi-ro)
- [10. Validation Plan](#10-validation-plan)
- [Phụ lục](#phụ-lục)

### Executive Summary

> 💡 **Viết phần này CUỐI CÙNG**, sau khi hoàn thành các phần khác. Đây là phần duy nhất giảng viên/hội đồng đảm bảo đọc — nó cần chứng minh giá trị tài liệu trong 1 trang.

> 💡 **Cấu trúc đề xuất 1 trang:**
> 1. Bối cảnh (2-3 câu)
> 2. Vấn đề chính phát hiện được (3-4 câu)
> 3. Đối tượng người dùng (1-2 câu)
> 4. Cơ hội và định hướng giải pháp (3-4 câu)
> 5. Metric thành công (2-3 câu)

[ĐIỀN VÀO: Executive summary ~1 trang]

---

# 1. Bối cảnh và động lực

## 1.1 Bối cảnh thị trường lao động

> 💡 **Mục tiêu:** Cho người đọc hiểu *tại sao chủ đề này* và *tại sao bây giờ*. Dùng dữ liệu, không cảm tính.

> 📝 **Câu hỏi cần trả lời:**
> - Tỷ lệ thất nghiệp / underemployment của fresher Việt Nam hiện tại?
> - Số sinh viên CNTT tốt nghiệp mỗi năm vs số job opening?
> - Xu hướng tuyển dụng sau COVID, thời đại AI?
> - Mức lương khởi điểm fresher so với chi phí sống?

> ⚠️ **Lưu ý:** Mọi con số phải có nguồn trích dẫn. Tránh dùng "theo nhiều nghiên cứu", "đa số chuyên gia cho rằng".

[ĐIỀN VÀO: 2-3 đoạn về bối cảnh thị trường, có data và nguồn trích dẫn]

**Nguồn tham khảo gợi ý:**
- TopCV Vietnam Salary Report (annual)
- VietnamWorks Talent Insights
- Anphabe Workplace Report
- Tổng cục Thống kê — báo cáo lao động việc làm
- World Bank — Vietnam Economic Update

## 1.2 Bối cảnh công nghệ AI trong HR-tech

> 💡 **Mục tiêu:** Justify tại sao AI là approach phù hợp, không phải trào lưu.

> 📝 **Câu hỏi cần trả lời:**
> - LLM/AI đã đủ trưởng thành để feedback có chất lượng chưa?
> - Voice AI (Whisper) đã hỗ trợ tiếng Việt tốt chưa?
> - Chi phí AI có còn rào cản với sản phẩm B2C không?
> - Người dùng VN đã sẵn sàng tin tưởng AI feedback chưa?

[ĐIỀN VÀO: 1-2 đoạn về sự sẵn sàng của công nghệ]

## 1.3 Tại sao bây giờ (Why now)

> 💡 **Mục tiêu:** Trả lời câu hỏi quan trọng nhất của mọi product question — "tại sao bây giờ là thời điểm phù hợp, không phải 2 năm trước hay 2 năm sau".

[ĐIỀN VÀO: 3-5 lý do tại sao đây là timing phù hợp]

> 📝 **Ví dụ format:**
> 1. **Công nghệ chín muồi:** GPT-4-class models đã đủ tốt cho feedback có chất lượng (chưa có 2 năm trước).
> 2. **Chi phí giảm:** API price giảm 10x trong 18 tháng, khả thi cho sản phẩm dành cho sinh viên.
> 3. **Nhu cầu tăng:** Số fresher CNTT tăng X% post-pandemic, cạnh tranh việc làm gay gắt.
> 4. **Khoảng trống thị trường:** Chưa có sản phẩm tương tự cho thị trường Việt Nam.

## 1.4 Giả thuyết ban đầu (Initial Hypotheses)

> 💡 **Mục tiêu cực kỳ quan trọng:** Trước khi đi research, viết ra những gì bạn ĐANG GIẢ ĐỊNH. Sau research, đối chiếu để phát hiện bias của chính mình.

> ⚠️ **Đây không phải là kết luận. Đây là điểm xuất phát.**

| # | Giả thuyết | Mức độ tự tin (1-5) | Sau research: Đúng / Sai / Cần điều chỉnh |
|---|---|---|---|
| H1 | Fresher VN có nhu cầu lớn về luyện phỏng vấn nhưng thiếu công cụ chất lượng | [1-5] | [Điền sau research] |
| H2 | Họ thích voice input hơn text input vì giả lập tốt hơn | [1-5] | [Điền sau research] |
| H3 | Họ sẵn sàng dùng AI feedback nếu nó cụ thể và actionable | [1-5] | [Điền sau research] |
| H4 | Văn hóa phỏng vấn VN khác biệt rõ rệt với Western, ảnh hưởng đến rubric | [1-5] | [Điền sau research] |
| H5 | [ĐIỀN VÀO: Giả thuyết của bạn] | [1-5] | |
| H6 | [ĐIỀN VÀO] | [1-5] | |

> 🎯 **Validation prompt cuối Phần 1:**
> - Sau khi đọc phần này, người ngoài có hiểu *why this project* trong 5 phút không?
> - Có ít nhất 5 nguồn dữ liệu được trích dẫn không?
> - Bạn đã ghi rõ các giả thuyết của mình chưa?

---

# 2. Phương pháp nghiên cứu

## 2.1 Tổng quan phương pháp

> 💡 **Mục tiêu:** Thể hiện sự nghiêm túc về mặt phương pháp luận. Hội đồng phản biện sẽ hỏi rất kỹ phần này.

| Phương pháp | Mục đích | Sample | Trạng thái |
|---|---|---|---|
| **In-depth interview (định tính)** | Hiểu sâu pain point, motivation | 5-10 fresher | [Chưa làm / Đang làm / Hoàn thành — N người] |
| **Survey online (định lượng)** | Validate insight với mẫu lớn hơn | 30-50 người | |
| **Expert interview** | Validate rubric phỏng vấn từ HR | 2-3 HR/recruiter | |
| **Competitive analysis** | Hiểu landscape, identify gap | 5-7 sản phẩm | |
| **Secondary research** | Background data, statistics | N/A | |
| **Observation (optional)** | Quan sát hành vi luyện phỏng vấn | 2-3 buổi | |

## 2.2 Chi tiết từng phương pháp

### 2.2.1 In-depth Interview

**Mục tiêu:** [ĐIỀN VÀO: cụ thể — ví dụ "Hiểu hành trình luyện phỏng vấn hiện tại của fresher CNTT VN"]

**Tiêu chí chọn participant (recruitment criteria):**
- [ĐIỀN VÀO: ví dụ "Sinh viên năm cuối hoặc fresher 0-12 tháng kinh nghiệm"]
- [ĐIỀN VÀO: ví dụ "Đã ít nhất apply hoặc dự định apply CNTT job"]
- [ĐIỀN VÀO: thêm tiêu chí]

**Cấu trúc phỏng vấn:** Semi-structured, ~45-60 phút mỗi cuộc.

**Cách thức:** [ĐIỀN VÀO: Online qua Google Meet / Offline]

**Recording \u0026 consent:** [ĐIỀN VÀO: Có ghi âm? Có form consent?]

**Discussion guide:** Xem [Phụ lục B](#phụ-lục-b---discussion-guide-cho-interview).

### 2.2.2 Survey

**Mục tiêu:** [ĐIỀN VÀO]

**Kênh phân phối:** [ĐIỀN VÀO: Facebook groups CNTT, Discord BKHN, LinkedIn, mailing list...]

**Cấu trúc câu hỏi:** [ĐIỀN VÀO: Tổng số câu, dạng câu hỏi, thời gian hoàn thành]

**Tool sử dụng:** [ĐIỀN VÀO: Google Forms / Typeform / Notion Form]

**Câu hỏi survey:** Xem [Phụ lục C](#phụ-lục-c---survey-questionnaire).

### 2.2.3 Expert Interview

**Mục tiêu:** Validate cultural rubric (VN vs Western), đảm bảo feedback của AI sát thực tế HR.

**Đối tượng cần phỏng vấn:**
- HR Manager / Recruiter công ty Việt Nam (1-2 người)
- HR / Hiring Manager công ty Western/MNC tại VN (1 người)
- (Optional) Career coach chuyên fresher (1 người)

**Discussion guide:** Xem [Phụ lục D](#phụ-lục-d---expert-interview-guide).

### 2.2.4 Competitive Analysis

**Sản phẩm đưa vào phân tích:** [ĐIỀN VÀO: Liệt kê 5-7 sản phẩm]

**Tiêu chí so sánh:** Xem Phần 3.2.

**Phương pháp:** Sử dụng thử (free trial / demo), đọc review trên Product Hunt / Reddit / G2, phân tích feature page.

## 2.3 Timeline thực hiện

| Giai đoạn | Thời gian | Hoạt động chính |
|---|---|---|
| Tuần 1 | [ngày] | Secondary research, viết discussion guide |
| Tuần 2 | [ngày] | Recruit interview participant, pilot interview |
| Tuần 3-4 | [ngày] | Conduct interview (5-10 người) |
| Tuần 4-5 | [ngày] | Survey distribution \u0026 analysis |
| Tuần 5 | [ngày] | Expert interview |
| Tuần 5-6 | [ngày] | Competitive analysis |
| Tuần 6 | [ngày] | Synthesis, viết Discovery Doc final |

## 2.4 Hạn chế của nghiên cứu (Research Limitations)

> 💡 **Đây là phần học thuật nhất.** Thừa nhận hạn chế trước khi bị hỏi là dấu hiệu researcher trưởng thành. Hội đồng sẽ đánh giá cao.

> 📝 **Các loại hạn chế thường gặp:**
> - **Sample size:** "Chỉ phỏng vấn 8 người, không đủ generalize cho cả VN"
> - **Selection bias:** "Đa số participant từ ĐHBKHN, có thể không đại diện sinh viên trường khác"
> - **Geographic bias:** "Chỉ Hà Nội, không có data từ TP.HCM/Đà Nẵng"
> - **Self-reporting bias:** "Survey dựa trên self-report, có thể khác hành vi thực"
> - **Researcher bias:** "Tác giả là sinh viên CNTT, có thể có blind spot khi phỏng vấn ngành khác"
> - **Time constraint:** "3 tháng research giới hạn độ sâu của một số phần"

[ĐIỀN VÀO: 4-6 hạn chế cụ thể của bạn, kèm cách mitigate]

> 🎯 **Validation prompt cuối Phần 2:**
> - Người đọc có biết bạn nói chuyện với BAO NHIÊU người, AI, BẰNG CÁCH NÀO không?
> - Có justify được lý do chọn từng phương pháp không?
> - Đã thừa nhận hạn chế tường minh chưa?

---

# 3. Phân tích thị trường và đối thủ

## 3.1 Phân tích thị trường (Market Analysis)

### 3.1.1 Quy mô thị trường

> 💡 **Framework:** TAM / SAM / SOM
> - **TAM (Total Addressable Market):** Toàn bộ thị trường nếu bạn chiếm 100%
> - **SAM (Serviceable Addressable Market):** Phần TAM bạn có thể serve với mô hình hiện tại
> - **SOM (Serviceable Obtainable Market):** Phần SAM bạn thực tế có thể chiếm

> 📝 **Ví dụ ước lượng cho InterviewAI:**
> - **TAM:** ~500K fresher VN tốt nghiệp/năm × giả định 30% cần luyện phỏng vấn = 150K users tiềm năng/năm
> - **SAM:** Trong số đó, fresher CNTT \u0026 ngành tech = ~60K users/năm
> - **SOM (3 năm):** 1-3% SAM = 600-1,800 active users

[ĐIỀN VÀO: Ước tính TAM/SAM/SOM của bạn, kèm assumption rõ ràng]

### 3.1.2 Xu hướng thị trường

[ĐIỀN VÀO: 4-6 xu hướng quan trọng]

> 📝 **Các xu hướng đáng cân nhắc:**
> - AI integration trong HR-tech (HireVue, Final Round AI...)
> - Remote interview thành chuẩn mới
> - Tăng nhu cầu English proficiency cho job MNC
> - Gen Z attitude với AI: cởi mở hơn nhưng critical hơn
> - Nhu cầu personalization: không chấp nhận content generic

### 3.1.3 Customer segments

[ĐIỀN VÀO: Phân khúc khách hàng tiềm năng — bảng]

| Segment | Đặc điểm | Quy mô | Mức độ priority |
|---|---|---|---|
| Sinh viên năm cuối CNTT | ... | ... | High |
| Fresher 0-12m kinh nghiệm | ... | ... | High |
| Sinh viên non-tech pivot sang tech | ... | ... | Medium |
| Senior pivot career | ... | ... | Low (V2) |

## 3.2 Phân tích đối thủ (Competitive Analysis)

### 3.2.1 Bảng so sánh đối thủ chính

> 💡 **Tiêu chí so sánh:** Chọn tiêu chí có ý nghĩa với người dùng, không phải feature list.

| Tiêu chí | Pramp | BigInterview | InterviewBuddy | Yoodli | Final Round AI | **InterviewAI (proposed)** |
|---|---|---|---|---|---|---|
| **Target user** | Tech interviewees | General | General | General | Tech | Vietnamese fresher |
| **Ngôn ngữ** | English only | English | English | English | English | **Tiếng Việt + English** |
| **Voice support** | Yes (peer) | No | Yes (live) | Yes (AI) | Yes (real-time) | **Yes (record + AI)** |
| **AI feedback** | No (peer review) | Pre-recorded | Live coach | AI summary | Real-time AI | **Surgical AI feedback** |
| **CV personalization** | No | No | Limited | No | Yes | **Yes** |
| **Cultural context** | Western | Western | Western | Western | Western | **VN \u0026 Western** |
| **Pricing** | Free | $39-79/mo | $25-50/session | Free \u0026 Paid | $148/mo | **Free for students** |
| **Vietnamese-friendly** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

[ĐIỀN VÀO: Cập nhật bảng dựa trên research thực tế của bạn]

### 3.2.2 Phân tích sâu top 3 đối thủ

#### Đối thủ #1: [TÊN]

**Vị thế thị trường:** [ĐIỀN VÀO]
**Điểm mạnh:** [ĐIỀN VÀO 3-5 điểm]
**Điểm yếu:** [ĐIỀN VÀO 3-5 điểm]
**User reviews tiêu biểu:** [ĐIỀN VÀO 2-3 quote từ Reddit / G2 / App Store]
**Bài học cho InterviewAI:** [ĐIỀN VÀO]

#### Đối thủ #2: [TÊN]

[Tương tự cấu trúc trên]

#### Đối thủ #3: [TÊN]

[Tương tự]

### 3.2.3 Gap Analysis

> 💡 **Đây là phần quan trọng nhất của Phần 3.** Trả lời: "Khoảng trống nào trên thị trường mà chúng ta nhắm vào?"

> 📝 **Ví dụ gap đáng tin:**
> - **Language gap:** Không có sản phẩm nào hỗ trợ tiếng Việt thực sự (chỉ Google Translate)
> - **Cultural gap:** Tất cả rubric đang là Western, fresher VN bị đánh giá sai
> - **Affordability gap:** Tools chất lượng đều paywall $20-150/mo, sinh viên VN không đủ
> - **Specificity gap:** Feedback hiện tại đa phần generic, không actionable

[ĐIỀN VÀO: 4-6 gaps cụ thể bạn xác định được]

### 3.2.4 Vị thế đề xuất (Positioning Statement)

> 💡 **Format chuẩn (Geoffrey Moore):**
> *Cho [target customer], người [statement of need], [product name] là [product category] giúp [key benefit]. Khác với [primary alternative], sản phẩm của chúng ta [key differentiator].*

[ĐIỀN VÀO: Positioning statement của InterviewAI]

> 📝 **Ví dụ:**
> *Cho **sinh viên \u0026 fresher CNTT Việt Nam**, người **lo lắng về kỹ năng phỏng vấn nhưng không đủ tiền dùng tools quốc tế**, **InterviewAI** là **AI interview coach miễn phí** giúp **luyện phỏng vấn với feedback cụ thể bằng tiếng Việt, phù hợp văn hóa VN**. Khác với **Pramp / BigInterview**, sản phẩm của chúng ta **hiểu sâu context người Việt và đưa feedback surgical thay vì generic**.*

> 🎯 **Validation prompt cuối Phần 3:**
> - Đã đọc thử (hoặc ít nhất xem demo) ít nhất 3 đối thủ chưa?
> - Có quote thực tế từ user của đối thủ trong tài liệu không?
> - Gap analysis có dựa trên data, không phải tưởng tượng?
> - Positioning statement có cụ thể, không generic không?

---

# 4. Chân dung người dùng (User Personas)

> 💡 **Nguyên tắc cực kỳ quan trọng:** Persona phải dựa trên DATA THẬT. Mỗi đặc điểm trong persona nên có ít nhất 2-3 data point từ interview/survey ủng hộ.

> ⚠️ **Tối thiểu 2-3 personas, tối đa 5.** Quá nhiều = không thực sự hiểu user.

## 4.1 Tổng quan Persona Map

[ĐIỀN VÀO: Sơ đồ ngắn liệt kê các persona, vị trí của họ trên matrix Need vs Frequency, hoặc Tech-savvy vs Confidence]

> 📝 **Ví dụ persona map đề xuất cho InterviewAI:**
>
> ```
>                    Cao Confidence
>                          │
>                          │
>   [Persona C: Mai] ──────┼────── [Persona D: Senior pivot]
>   non-tech pivot         │              (V2 - không trong scope)
>                          │
>   ─────────────────────────────────────── Tech-savvy
>                          │
>                          │
>   [Persona A: Linh] ─────┼────── [Persona B: Hùng]
>   năm cuối, lần đầu      │       fresher 3 tháng job-search
>                          │
>                    Thấp Confidence
> ```

## 4.2 Persona A: [TÊN GIẢ — ví dụ: "Linh, sinh viên năm cuối CNTT"]

### Ảnh đại diện
[Insert photo placeholder hoặc emoji avatar]

### Quote tiêu biểu

> *"[ĐIỀN VÀO: Câu nói trực tiếp từ interview, chân thực, đắt giá]"*
>
> *— [Tên giả], [độ tuổi], [bối cảnh]*

> 📝 **Ví dụ quote tốt:**
> *"Em đọc 100 câu phỏng vấn trên mạng rồi mà vẫn không biết em trả lời tốt hay tệ. Em hỏi anh chị thì mỗi người nói một kiểu."*

### Demographics

| Thuộc tính | Giá trị |
|---|---|
| Tuổi | [ĐIỀN VÀO] |
| Giới tính | [ĐIỀN VÀO] |
| Vị trí địa lý | [ĐIỀN VÀO] |
| Học vấn | [ĐIỀN VÀO] |
| Tình trạng | [ĐIỀN VÀO: VD "Năm cuối CNTT, đang chuẩn bị apply"] |
| Thu nhập (nếu có) | [ĐIỀN VÀO] |
| Tech-savvy | [Thấp / Trung bình / Cao] |
| Trình độ tiếng Anh | [Thấp / Trung bình / Cao] |

### Bối cảnh sống và công việc

[ĐIỀN VÀO: 2-3 câu về cuộc sống thường ngày, môi trường học tập/làm việc, mối quan hệ xã hội ảnh hưởng đến quyết định]

### Goals (Mục tiêu)

**Goals dài hạn:**
- [ĐIỀN VÀO: Mục tiêu cuộc sống, career]

**Goals trong ngữ cảnh dự án (job hunting):**
- [ĐIỀN VÀO: VD "Có offer trước khi tốt nghiệp"]
- [ĐIỀN VÀO: VD "Vào được công ty product-led, không outsourcing"]
- [ĐIỀN VÀO]

### Frustrations / Pain Points

> ⚠️ **Cụ thể, không generic.** "Không tự tin" là không đủ. "Không tự tin trả lời câu hỏi behavioral bằng tiếng Anh vì không quen kể chuyện theo STAR" — đây mới là pain point.

[ĐIỀN VÀO: 5-8 pain point cụ thể]

### Behaviors

**Cách họ học/luyện phỏng vấn hiện tại:**
- [ĐIỀN VÀO]

**Tools họ đã / đang dùng:**
- [ĐIỀN VÀO]

**Kênh thông tin họ tin tưởng:**
- [ĐIỀN VÀO: VD "Group Facebook IT, Reddit, anh chị đi trước"]

**Thiết bị chính:**
- [ĐIỀN VÀO: VD "Laptop học tập, smartphone Android"]

### Needs vs Wants

| Needs (cần có) | Wants (muốn có) |
|---|---|
| Feedback cụ thể về câu trả lời | Mock interview với người thật |
| Câu hỏi sát với JD | Gamification, streak |
| Tiếng Việt | UI đẹp |

### Scenario điển hình

> 💡 **Viết 1 scenario 5-7 câu**, kể như một câu chuyện ngắn.

[ĐIỀN VÀO]

> 📝 **Ví dụ:**
> *Linh được công ty A mời phỏng vấn vòng technical sau 2 tuần. Em mở 3 tab: Glassdoor để xem review về công ty A, Google "câu hỏi phỏng vấn fresher dev", và file Word ghi câu trả lời nháp. Em đọc 100 câu hỏi mẫu nhưng không biết trả lời sao là "đúng". Em thử nói trước gương nhưng cảm thấy ngượng và không biết tự đánh giá. Đêm trước phỏng vấn em ngủ chỉ 4 tiếng vì lo lắng.*

---

## 4.3 Persona B: [TÊN GIẢ — ví dụ: "Hùng, fresher đã job-search 3 tháng"]

[Cấu trúc tương tự Persona A]

## 4.4 Persona C: [TÊN GIẢ — ví dụ: "Mai, non-tech pivot sang tech"]

[Cấu trúc tương tự Persona A]

## 4.5 Anti-Persona (Optional but Recommended)

> 💡 **Anti-persona** = nhóm người KHÔNG phải target, kể cả khi họ có thể dùng sản phẩm. Định nghĩa anti-persona giúp focus và tránh feature creep.

> 📝 **Ví dụ anti-persona cho InterviewAI:**
> - **Senior engineer 5+ năm kinh nghiệm:** Họ cần system design interview, behavioral cao cấp, lương deal — khác hoàn toàn fresher.
> - **Non-tech fresher (kế toán, marketing):** Domain rubric khác hoàn toàn, không trong scope V1.
> - **Người đi tìm việc tại nước ngoài:** Cần luyện cultural fit Western sâu hơn, English fluency cao.

[ĐIỀN VÀO: 2-3 anti-persona]

> 🎯 **Validation prompt cuối Phần 4:**
> - Mỗi persona có quote thực tế từ interview không?
> - Mỗi đặc điểm có data point ủng hộ không (không phải tưởng tượng)?
> - Personas có khác biệt rõ rệt không (không phải 3 phiên bản của cùng 1 người)?
> - Đã có anti-persona để định nghĩa "không phải" chưa?

---

# 5. User Journey và Pain Points

## 5.1 Current State Journey — [Tên Persona chính]

> 💡 **Format:** Vẽ journey theo các giai đoạn (phases), với mỗi giai đoạn có actions, thoughts, emotions, pain points, opportunities.

> 💡 **Tool gợi ý:** Vẽ trên Figma / Miro / Whimsical, embed link vào tài liệu. Hoặc dùng bảng Markdown như dưới.

### Journey: "Linh chuẩn bị cho buổi phỏng vấn đầu tiên"

| Phase | 1. Nhận lịch PV | 2. Tìm hiểu công ty | 3. Tự luyện | 4. Phỏng vấn thật | 5. Sau phỏng vấn |
|---|---|---|---|---|---|
| **Action** | Đọc email, ghi vào lịch | Search Glassdoor, LinkedIn | Đọc câu hỏi mạng, tự nói trước gương, hỏi bạn | Tham gia Google Meet, trả lời câu hỏi | Chờ kết quả, không biết mình làm tốt hay không |
| **Thought** | "Mình có 2 tuần để chuẩn bị" | "Công ty này có khắt khe không?" | "Câu trả lời này có ổn không?" | "Mình có nên nói cái này không?" | "Tại sao họ không gọi?" |
| **Emotion** | 😰 Lo lắng | 😟 Bất an | 😩 Bối rối, frustrated | 😨 Stress | 😞 Tự nghi ngờ |
| **Pain point** | Không có check-list rõ ràng | Thông tin tản mác | **Không có feedback chất lượng** ⭐ | Không biết answer template | Không học được gì để cải thiện |
| **Workaround** | Hỏi anh chị, đọc blog | Đọc nhiều nguồn rồi tổng hợp | Tự đoán, hỏi bạn không chuyên | Trả lời theo bản năng | Tự an ủi |
| **Opportunity** | | | **🎯 Đây là cơ hội của InterviewAI** | | Reflection tool, follow-up |

[ĐIỀN VÀO: Cập nhật bảng theo data thật từ interview]

> 💡 **Đánh dấu ⭐** vào pain point bạn đánh giá là quan trọng nhất — nơi sản phẩm của bạn sẽ tạo ra value lớn nhất.

## 5.2 Emotion Curve

> 💡 **Vẽ emotion curve** bằng cách plot mức độ cảm xúc qua từng phase. Đây là visual cực kỳ powerful cho phần này.

[ĐIỀN VÀO: Sơ đồ emotion curve hoặc mô tả]

> 📝 **Ví dụ mô tả:**
> *Emotion curve cho thấy điểm thấp nhất là phase 3 (tự luyện) — đây là nơi user "đói" feedback nhất. Phase 5 (sau phỏng vấn) cũng âm sâu vì không có tool reflection. Cả hai đều là "moments of truth" cho sản phẩm.*

## 5.3 Tổng hợp Pain Points (Across all Personas)

> 💡 **Mục tiêu:** Tổng hợp pain points từ tất cả persona, prioritize bằng impact và frequency.

| # | Pain Point | Persona bị ảnh hưởng | Impact (1-5) | Frequency (1-5) | Ưu tiên |
|---|---|---|---|---|---|
| P1 | Không có feedback chất lượng cho câu trả lời | A, B, C | 5 | 5 | ⭐⭐⭐ Top |
| P2 | Câu trả lời generic, không sát JD/CV | A, B | 4 | 4 | ⭐⭐⭐ |
| P3 | Không hiểu sự khác biệt văn hóa VN/Western | B, C | 4 | 3 | ⭐⭐ |
| P4 | Lo lắng về tiếng Anh trong phỏng vấn | A, C | 4 | 4 | ⭐⭐ |
| P5 | Không có ai để luyện cùng | A | 3 | 5 | ⭐⭐ |
| P6 | [ĐIỀN VÀO] | | | | |
| ... | | | | | |

## 5.4 Future State Vision (with InterviewAI)

> 💡 **Mục tiêu:** Vẽ lại cùng journey nhưng với sản phẩm của bạn. Đây là "north star" — cho thấy thay đổi cụ thể.

| Phase | 1. Nhận lịch PV | 2. Tìm hiểu công ty | **3. Tự luyện với InterviewAI** | 4. Phỏng vấn thật | 5. Sau phỏng vấn |
|---|---|---|---|---|---|
| **Action mới** | (Same) | (Same) | **Paste JD → Upload CV → Luyện 5 câu với feedback ngay** | Tự tin hơn | Review session, identify pattern |
| **Emotion mới** | 😰 → 😊 | 😟 → 🙂 | 😩 → 😊 | 😨 → 😎 | 😞 → 💪 |
| **Outcome** | Có plan | Có context | **Biết điểm yếu, biết cách fix** | Trả lời tự tin | Học được, growth mindset |

> 🎯 **Validation prompt cuối Phần 5:**
> - Journey có dựa trên interview thật không (không phải tưởng tượng)?
> - Đã đánh dấu pain points quan trọng nhất chưa?
> - Có cho thấy rõ "moments of truth" mà sản phẩm cần serve không?

---

# 6. Tổng hợp insight (Key Findings \u0026 Insights)

> 💡 **Đây là phần chuyển từ "data" sang "knowledge".** Sau khi đã trình bày data ở Phần 1-5, giờ rút ra insights.

> ⚠️ **Nguyên tắc:** Mỗi insight phải có **evidence** (data ủng hộ) và **implication** (nó dẫn đến quyết định gì).

## 6.1 Format insight chuẩn

```
🔍 Insight #N: [Một câu tóm tắt phát hiện]

📊 Evidence:
- [Data point 1 từ interview / survey / observation]
- [Data point 2]
- [Data point 3]

💡 Implication:
[Phát hiện này dẫn đến quyết định / requirement gì cho sản phẩm]

🎯 Confidence level: [Low / Medium / High] vì [lý do]
```

## 6.2 Top Insights

### 🔍 Insight #1: [Tên ngắn gọn]

> 📝 **Ví dụ:** *"Fresher VN biết câu hỏi phỏng vấn nào sẽ được hỏi, nhưng không biết câu trả lời của mình có tốt không."*

**📊 Evidence:**
- [ĐIỀN VÀO: 2-3 data point cụ thể]

> 📝 **Ví dụ evidence:**
> - 8/10 người được phỏng vấn nói đã đọc trước "100 câu phỏng vấn phổ biến"
> - 9/10 người nói "không biết tự đánh giá câu trả lời"
> - Survey: 73% (n=42) chọn "feedback chất lượng" là pain point #1

**💡 Implication:**
[ĐIỀN VÀO: 1-2 câu]

> 📝 **Ví dụ implication:**
> *Nhu cầu lớn nhất không phải là question bank, mà là **feedback chất lượng cao** trên câu trả lời. → Đây là core value prop của InterviewAI, không phải số lượng câu hỏi.*

**🎯 Confidence:** [High / Medium / Low] vì [lý do]

---

### 🔍 Insight #2: [Tên]

[Tương tự cấu trúc trên]

### 🔍 Insight #3: [Tên]

[Tương tự]

### 🔍 Insight #4-N: ...

> 💡 **Số lượng insight kỳ vọng:** 6-10 insights chất lượng, không phải 20 insight nửa vời.

## 6.3 Prioritization Matrix

> 💡 **Tool đề xuất:** Impact / Effort matrix để xếp hạng các insight thành actionable priorities.

```
                Impact (Tác động đến user) ↑
                     │
          High │  P1 ⭐⭐⭐    P2 ⭐⭐
                     │  (Quick wins)  (Major projects)
          Med  │
                     │  P3            P4
          Low  │  ────┼──────────────────────→
                     │  Low effort    High effort
```

[ĐIỀN VÀO: Plot insights của bạn vào ma trận]

## 6.4 Insights bị invalidate (Failed hypotheses)

> 💡 **Phần này quan trọng cho academic integrity.** Liệt kê các giả thuyết ban đầu (Phần 1.4) bị data invalidate.

| Giả thuyết ban đầu | Trạng thái | Lý do |
|---|---|---|
| H1: ... | ✅ Đúng | ... |
| H2: Voice input được ưa thích hơn text | ⚠️ Một phần | 60% thích voice nhưng 40% nói text "an toàn hơn". Cần có cả hai. |
| H3: ... | ❌ Sai | Data cho thấy ngược lại |

> 🎯 **Validation prompt cuối Phần 6:**
> - Mỗi insight có evidence cụ thể (con số / quote / observation) không?
> - Có insight nào bị invalidate không (nếu không có là dấu hiệu confirmation bias)?
> - Đã rank theo priority chưa?

---

# 7. Định nghĩa vấn đề (Problem Statement)

> 💡 **Đây là PHẦN QUAN TRỌNG NHẤT của tài liệu.** Một paragraph nhưng nó là seed cho mọi requirement trong SRS.

## 7.1 Problem Statement (Lean UX format)

> 💡 **Format:**
> *Người dùng [persona chính] gặp khó khăn khi [tình huống cụ thể] vì [nguyên nhân gốc] dẫn đến [hậu quả tiêu cực]. Một giải pháp tốt sẽ [tiêu chí thành công]. Chúng ta sẽ biết là thành công khi [metric đo được].*

[ĐIỀN VÀO: Problem statement ~5-7 câu của bạn]

> 📝 **Ví dụ tham khảo (không copy paste):**
>
> *Sinh viên năm cuối CNTT tại Việt Nam (như Linh, 22 tuổi) gặp khó khăn khi luyện phỏng vấn xin việc vì các phương pháp hiện tại — đọc câu hỏi trên mạng, tự nói trước gương, nhờ bạn bè đánh giá — không cung cấp feedback có chất lượng và phù hợp văn hóa Việt Nam. Hậu quả là họ bước vào phỏng vấn thật mà không biết điểm yếu cụ thể của mình, dẫn đến tỷ lệ pass thấp và mất tự tin sau những lần fail liên tiếp. Một giải pháp tốt sẽ cung cấp feedback **cụ thể** (highlight đoạn nào trong câu trả lời có vấn đề), **dựa trên transcript thật** (không generic), **có context văn hóa VN** (không áp đặt rubric Western), và **hành động được** (đưa improved version). Chúng ta sẽ biết là thành công khi ≥80% người dùng đánh giá feedback là "cụ thể và hữu ích" qua post-session survey.*

## 7.2 5 Whys (Root Cause Analysis)

> 💡 **Tool kinh điển** để đào sâu nguyên nhân gốc, đảm bảo bạn không chỉ giải quyết triệu chứng.

**Vấn đề bề mặt:** [ĐIỀN VÀO: VD "Fresher VN không tự tin khi đi phỏng vấn"]

**Why 1:** Tại sao họ không tự tin?
→ [ĐIỀN VÀO]

**Why 2:** Tại sao điều đó xảy ra?
→ [ĐIỀN VÀO]

**Why 3:** Tại sao?
→ [ĐIỀN VÀO]

**Why 4:** Tại sao?
→ [ĐIỀN VÀO]

**Why 5:** Tại sao?
→ [ĐIỀN VÀO: Đây là root cause]

## 7.3 "How Might We" Questions

> 💡 **Convert problem statement thành câu hỏi mở** để định hướng ideation.

[ĐIỀN VÀO: 3-5 câu HMW]

> 📝 **Ví dụ:**
> - HMW giúp fresher VN biết câu trả lời của họ tốt ở đâu, yếu ở đâu — bằng tiếng Việt?
> - HMW làm cho feedback AI cảm thấy "có người thật review" thay vì generic?
> - HMW giúp người dùng cải thiện qua nhiều session, không chỉ một lần?

> 🎯 **Validation prompt cuối Phần 7:**
> - Problem statement có cụ thể (không generic) không?
> - Có người dùng cụ thể, tình huống cụ thể, hậu quả cụ thể, metric cụ thể chưa?
> - Đã đào đến root cause chưa, hay chỉ đang ở triệu chứng?

---

# 8. Cơ hội và định hướng giải pháp

> ⚠️ **Phần này KHÔNG phải spec giải pháp.** SRS sẽ làm việc đó. Phần này chỉ định hướng tổng quát.

## 8.1 Liệt kê và prioritize cơ hội (Opportunities)

| # | Opportunity | Insight nguồn | Impact | Effort | Priority |
|---|---|---|---|---|---|
| O1 | Surgical feedback (highlight cụ thể) | Insight #1 | High | High | ⭐⭐⭐ |
| O2 | Cultural rubric VN/Western | Insight #4 | High | Med | ⭐⭐⭐ |
| O3 | Voice input có transcript | Insight #2 | Med | Med | ⭐⭐ |
| O4 | Adaptive follow-up | Insight #3 | High | High | ⭐⭐ |
| O5 | Question bank seed (60 câu) | Insight #5 | Low | Low | ⭐ |
| O6 | [ĐIỀN VÀO] | | | | |

## 8.2 Hướng giải pháp khả dĩ (Solution Alternatives)

> 💡 **Liệt kê 3-4 hướng giải pháp khác nhau**, không chỉ một. Sau đó chọn và justify.

### Hướng A: AI Feedback Web App (chosen)

**Mô tả:** [ĐIỀN VÀO: 2-3 câu]
**Ưu điểm:**
- [ĐIỀN VÀO]
**Nhược điểm:**
- [ĐIỀN VÀO]
**Cost / Effort:** [ĐIỀN VÀO]

### Hướng B: Peer-to-peer matchmaking (như Pramp)

**Mô tả:** Match fresher với nhau để mock interview lẫn nhau.
**Ưu điểm:**
- Realism cao
- Chi phí AI thấp
**Nhược điểm:**
- Cần critical mass user
- Chất lượng không đảm bảo
- Khó scale với 1 dev solo

### Hướng C: Human coach marketplace

**Mô tả:** Kết nối user với HR/coach trả phí.
**Ưu điểm:**
- Chất lượng cao
**Nhược điểm:**
- Chi phí cao cho user
- Không phù hợp solo developer / sinh viên
- Marketplace 2-sided khó build trong 3 tháng

### Hướng D: Mobile app first

**Mô tả:** Native iOS/Android app.
**Ưu điểm:**
- Voice UX tốt hơn
**Nhược điểm:**
- Effort 3x web
- Out of scope với 1 dev / 3 tháng

## 8.3 Hướng được chọn (Chosen Direction)

**Hướng A: AI Feedback Web App với Surgical Feedback + Cultural Context Pack.**

**Justification:**
1. [ĐIỀN VÀO: Lý do dựa trên user research]
2. [ĐIỀN VÀO: Lý do dựa trên feasibility]
3. [ĐIỀN VÀO: Lý do dựa trên market gap]

## 8.4 Design Principles

> 💡 **5-7 principles** sẽ guide mọi quyết định thiết kế sau này. Khi có 2 phương án, chọn cái align với principles.

[ĐIỀN VÀO: 5-7 principles]

> 📝 **Ví dụ:**
> 1. **Vietnamese-first.** Mọi feature default tiếng Việt; English là tùy chọn.
> 2. **Specific over generic.** Feedback luôn quote transcript cụ thể, không nhận xét chung.
> 3. **Actionable always.** Mỗi nhận xét phải có "improved version" để user copy được.
> 4. **Free for students.** Không paywall, không freemium. Chi phí tự lo.
> 5. **Cultural intelligence.** Rubric thay đổi theo target company culture.
> 6. **Privacy by default.** Voice không lưu sau khi transcript; transcript opt-in lưu.
> 7. **Speed > perfection.** P95 latency < 5s cho feedback; thà feedback đơn giản nhanh hơn detailed chậm.

## 8.5 Out of Scope (V1)

> 💡 **Liên kết với SRS:** Phần này feed vào Section 1.2.3 của SRS.

[ĐIỀN VÀO: 5-10 things rõ ràng KHÔNG làm trong V1, kèm lý do]

> 🎯 **Validation prompt cuối Phần 8:**
> - Có ít nhất 3 hướng giải pháp được considered không?
> - Hướng được chọn có justify dựa trên data, không phải sở thích cá nhân?
> - Design principles có concrete, có thể dùng để arbitration không?

---

# 9. Giả định và rủi ro

## 9.1 Assumptions Log

> 💡 **Format:** Mỗi assumption có owner, kế hoạch validate, và trạng thái.

| # | Assumption | Loại | Mức độ rủi ro nếu sai | Cách validate | Trạng thái |
|---|---|---|---|---|---|
| A1 | User có microphone hoạt động | Technical | Med | Survey: hỏi thiết bị | [Pending / Validated / Invalidated] |
| A2 | User chấp nhận nói tiếng Việt với AI | Behavioral | High | Interview + pilot test | |
| A3 | Whisper API hỗ trợ tiếng Việt accent miền Bắc/Nam đủ tốt | Technical | High | Test với 10 mẫu voice từ các vùng | |
| A4 | LLM feedback đủ tốt với tiếng Việt | Technical | Critical | Pilot test với 5 user, đánh giá bởi HR | |
| A5 | User thực sự sẽ dùng tự luyện ≥2 phiên | Behavioral | High | Beta test với 50 user, đo retention | |
| A6 | [ĐIỀN VÀO] | | | | |
| ... | | | | | |

> ⚠️ **Critical assumptions** (nếu sai → dự án fail) phải được validate SỚM, trước khi build feature liên quan.

## 9.2 Risk Register

### 9.2.1 Product Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| PR1 | User không thấy feedback "cụ thể, hữu ích" | Med | High | Pilot test sớm, iterate prompt |
| PR2 | User adoption thấp (\u003c 50 beta) | Med | High | Recruit qua network, FB groups CNTT |
| PR3 | [ĐIỀN VÀO] | | | |

### 9.2.2 Technical Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| TR1 | Whisper accuracy thấp với accent miền | High | Med | Test sớm; fallback text input |
| TR2 | LLM cost vượt budget | Med | High | Prompt caching, rate limit, monitoring |
| TR3 | OpenAI/Anthropic API down | Low | High | Fallback Question Bank, multi-provider |
| TR4 | [ĐIỀN VÀO] | | | |

### 9.2.3 Market / Adoption Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| MR1 | Đối thủ launch tương tự trong 3 tháng | Low | Med | Focus VN-specific, không generic |
| MR2 | [ĐIỀN VÀO] | | | |

### 9.2.4 Project / Resource Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| RR1 | Solo dev burnout | Med | High | Strict scope, weekly milestone |
| RR2 | Scope creep | High | High | Out-of-scope explicit, no exceptions |
| RR3 | [ĐIỀN VÀO] | | | |

## 9.3 Risk Heat Map

[ĐIỀN VÀO: Plot các risk lên ma trận Probability × Impact]

> 🎯 **Validation prompt cuối Phần 9:**
> - Đã liệt kê assumption tường minh chưa, hay đang ngầm định?
> - Critical risk có mitigation cụ thể (không phải "sẽ cố gắng tránh") không?
> - Có risk nào "không thể chấp nhận" — cần kill dự án nếu xảy ra — không?

---

# 10. Validation Plan

> 💡 **Mục tiêu:** Sau khi launch prototype, làm sao biết các findings ban đầu đúng? Đo gì, đo bằng cách nào?

## 10.1 Success Metrics

### 10.1.1 Adoption metrics

| Metric | Target | Cách đo | Tần suất đo |
|---|---|---|---|
| Số user đăng ký | ≥ 50 | Supabase Auth count | Daily |
| Số phiên trung bình/user | ≥ 2 | Database aggregate | Weekly |
| Activation rate (đăng ký → hoàn thành 1 phiên) | ≥ 60% | Funnel analysis | Weekly |

### 10.1.2 Engagement metrics

| Metric | Target | Cách đo | Tần suất đo |
|---|---|---|---|
| Phiên hoàn thành (5/5 câu) | ≥ 70% | Session status | Weekly |
| Rewrite usage rate | ≥ 30% | Event tracking | Weekly |
| [ĐIỀN VÀO] | | | |

### 10.1.3 Quality metrics

| Metric | Target | Cách đo | Tần suất đo |
|---|---|---|---|
| Feedback "cụ thể, hữu ích" rating | ≥ 80% | Post-session survey 5-point | Per session |
| Thumbs up rate | ≥ 70% | UI thumbs up/down | Real-time |
| [ĐIỀN VÀO] | | | |

## 10.2 Phương pháp validation

### 10.2.1 Quantitative

- **Analytics dashboard** với các metric trên
- **A/B test** (nếu có time): Test 2 phiên bản prompt feedback
- **Funnel analysis:** Identify dropout points

### 10.2.2 Qualitative

- **Post-session survey** ngắn (3-5 câu) sau mỗi phiên
- **In-depth interview** với 5-10 user sau 2 tuần dùng
- **Thumbs up/down + free comment** cho từng feedback

## 10.3 Pivot Criteria

> 💡 **Khi nào cần pivot?** Định nghĩa trước, không định nghĩa khi đã quá muộn.

[ĐIỀN VÀO: 3-5 pivot triggers]

> 📝 **Ví dụ:**
> 1. **Nếu** "feedback hữu ích" rating \u003c 50% sau 2 tuần beta **→** Iterate prompt urgently, có thể cần expert review
> 2. **Nếu** activation rate \u003c 30% **→** UX có vấn đề nghiêm trọng, simplify onboarding
> 3. **Nếu** chi phí/phiên \u003e $0.50 **→** Cần optimize hoặc giảm scope feature
> 4. **Nếu** Whisper accuracy \u003c 80% với tiếng Việt **→** Cân nhắc fallback hoặc dùng provider khác

## 10.4 Learning Goals

> 💡 **Câu hỏi bạn muốn trả lời được sau prototype.**

[ĐIỀN VÀO: 5-7 learning goals]

> 📝 **Ví dụ:**
> 1. Voice hay text được dùng nhiều hơn trong thực tế?
> 2. Cultural Pack có thực sự tạo khác biệt cảm nhận được?
> 3. User thích AI feedback "thẳng thắn" hay "khuyến khích"?
> 4. Adaptive follow-up có engage user hơn fixed questions không?
> 5. ...

> 🎯 **Validation prompt cuối Phần 10:**
> - Mọi metric có đo được cụ thể không (không phải "user happy")?
> - Có pivot criteria rõ ràng để biết khi nào cần đổi hướng?
> - Có cơ chế thu thập feedback ngay từ Day 1 prototype không?

---

# Phụ lục

## Phụ lục A — Tracking Sheet (Research Progress)

> 💡 **Cập nhật mỗi tuần** để theo dõi tiến độ research và Discovery Doc.

| Tuần | Hoạt động dự kiến | Hoàn thành | Note |
|---|---|---|---|
| 1 | Secondary research, viết discussion guide | [ ] | |
| 2 | Pilot interview, recruit participant | [ ] | |
| 3 | 5 interview chính thức | [ ] | |
| 4 | Survey distribution | [ ] | |
| 5 | Expert interview, competitive analysis | [ ] | |
| 6 | Synthesis, finalize Discovery Doc | [ ] | |

### Interview tracking

| # | Tên (giả) | Persona match | Ngày PV | Recording? | Summary done? | Quote tiêu biểu |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| ... | | | | | | |

### Survey tracking

| Metric | Target | Actual |
|---|---|---|
| Số response | 50 | |
| Completion rate | \u003e 80% | |
| Demographic spread | 3 trường / 2 thành phố | |

## Phụ lục B — Discussion Guide cho Interview

> 💡 **Chuẩn bị trước, không improvise.** Pilot với 1 người trước khi chính thức.

### Mở đầu (5 phút)

- Cảm ơn participant
- Giải thích mục đích, ghi âm consent
- Disclaimer: không có câu trả lời đúng/sai

### Warm-up (5 phút)

- "Em giới thiệu một chút về bản thân được không?"
- "Hiện tại em đang ở giai đoạn nào trong việc tìm việc?"

### Phần chính: Hành trình tìm việc (15 phút)

- "Em kể cho mình nghe về lần phỏng vấn gần nhất / sắp tới?"
- "Em chuẩn bị như thế nào?"
- "Cụ thể em đã làm gì để luyện?"
- [ĐIỀN VÀO: thêm câu hỏi]

### Phần chính: Pain points (15 phút)

- "Phần khó nhất của việc luyện phỏng vấn với em là gì?"
- "Em đã thử cách nào? Cách nào hiệu quả, cách nào không?"
- "Nếu có 1 thứ thay đổi được, em muốn thay đổi gì?"
- [ĐIỀN VÀO]

### Phần chính: Tools \u0026 sources (10 phút)

- "Em dùng tools / website nào để chuẩn bị?"
- "Em đã từng nghe / dùng tool AI luyện phỏng vấn chưa?"
- [ĐIỀN VÀO]

### Phần concept test (10 phút)

- "Mình mô tả ngắn về một ý tưởng. Em nghe xem có thấy hữu ích không..."
- [Mô tả ngắn InterviewAI]
- "Em sẽ dùng cái này không? Trong tình huống nào?"
- "Em sẽ trả tiền cho cái này không? Bao nhiêu?"

### Kết (5 phút)

- "Còn gì em muốn chia sẻ thêm không?"
- Cảm ơn, gift card / quà cảm ơn

> ⚠️ **Tránh:**
> - Câu hỏi leading: "Em có thấy AI hữu ích không?" → bias yes
> - Câu hỏi yes/no: hỏi mở
> - Trình bày sản phẩm trước khi hỏi pain point → users sẽ tự align với sản phẩm

## Phụ lục C — Survey Questionnaire

[ĐIỀN VÀO: Bộ câu hỏi survey hoàn chỉnh]

> 💡 **Cấu trúc đề xuất:**
> 1. Screening (3-5 câu): xác nhận đúng target audience
> 2. Demographics (3-5 câu)
> 3. Behavior hiện tại (5-7 câu): dùng tool gì, tần suất, etc.
> 4. Pain points (5-7 câu): scale 1-5, ranking
> 5. Concept test (3-5 câu): nếu có sản phẩm như X, có dùng không, trả tiền không
> 6. Open-ended (1-2 câu): ý kiến tự do

## Phụ lục D — Expert Interview Guide

[ĐIỀN VÀO: Discussion guide cho HR / Recruiter]

> 💡 **Câu hỏi gợi ý cho HR:**
> - Anh/chị tuyển fresher CNTT theo tiêu chí nào?
> - Lỗi phổ biến nhất của fresher trong phỏng vấn?
> - Khác biệt giữa rubric công ty VN vs công ty MNC?
> - Anh/chị có nghĩ AI có thể giúp luyện phỏng vấn không? Ngại điều gì?

## Phụ lục E — Interview Summaries

> 💡 **Summary 1-2 trang/người**, không phải full transcript. Format thống nhất.

### Interview #1 — [Tên giả], [ngày]

**Profile:** [1-2 câu]

**Top 3 pain points:**
1. ...
2. ...
3. ...

**Top quotes:**
- "..."
- "..."

**Tools đang dùng:**
- ...

**Reaction với concept InterviewAI:**
- ...

**Implications cho sản phẩm:**
- ...

[Lặp lại cho mỗi interview]

## Phụ lục F — Survey Raw Data Summary

[ĐIỀN VÀO: Aggregate kết quả survey, charts]

## Phụ lục G — Competitive Screenshots \u0026 Notes

[ĐIỀN VÀO: Screenshot từ các đối thủ đã phân tích]

## Phụ lục H — References

[ĐIỀN VÀO: Citation chuẩn cho mọi nguồn đã trích]

---

# ✅ Ready to write SRS? — Checklist cuối

> Khi bạn có thể trả lời "Có, với data ủng hộ" cho cả 5 câu sau, tài liệu Discovery đã sẵn sàng để feed vào SRS.

- [ ] **1.** Tôi có thể mô tả persona chính trong 30 giây và mỗi đặc điểm có ít nhất 2 data point ủng hộ?
- [ ] **2.** Tôi có Problem Statement cụ thể (5-7 câu) với metric thành công đo được?
- [ ] **3.** Tôi đã liệt kê và rank ít nhất 6 insights, mỗi insight có evidence thật (không phải tưởng tượng)?
- [ ] **4.** Tôi đã consider ít nhất 3 hướng giải pháp khác nhau và justify lựa chọn?
- [ ] **5.** Tôi đã liệt kê assumptions và risks tường minh, có plan validate critical assumptions?

**Khi 5/5 ✅:** Bạn có thể bắt đầu viết SRS với confidence cao. Mọi requirement trong SRS giờ đây trace ngược được về một insight / pain point trong tài liệu này.

**Khi \u003c 5/5:** Quay lại research thêm trước khi viết SRS. Viết SRS dựa trên Discovery Doc yếu = SRS sẽ phải rework nhiều lần.

---

*Kết thúc Discovery Document Template — InterviewAI*

*Template này là tài liệu sống. Cập nhật khi gặp pattern mới hoặc khi domain thay đổi.*

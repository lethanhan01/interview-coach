# Product Discovery Document — Interview Coach

**Loại tài liệu:** Product Discovery / User Research Report
**Mục đích:** Tổng hợp toàn bộ nghiên cứu người dùng, phân tích thị trường, và định nghĩa vấn đề — làm input chính thức cho SRS.
**Vị trí trong chuỗi tài liệu:**

```
Business Case → [📍 Discovery Document] → Stakeholder Requirements → SRS → SAD → Code & Test
```

---

## Front Matter

### Metadata

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | InterviewAI — AI Interview Coach System |
| **Phiên bản tài liệu** | 0.1 |
| **Ngày soạn** | 2026-05-04 |
| **Ngày cập nhật** | 2026-05-04 |
| **Trạng thái** | Draft |
| **Tác giả** | Lê Thành An — MSSV: 20235631 |
| **Giảng viên hướng dẫn** | Tiến sĩ Cao Tuấn Dũng |
| **Đơn vị** | Viện CNTT & TT (SOICT), ĐHBKHN |

### Lịch sử phiên bản

| Phiên bản | Ngày | Mô tả thay đổi |
|---|---|---|
| 0.1 | 2026-05-04 | Khởi tạo, draft toàn bộ các phần dựa trên secondary research |

### Mục lục

- [1. Bối cảnh và động lực](#1-bối-cảnh-và-động-lực)
- [2. Phương pháp nghiên cứu](#2-phương-pháp-nghiên-cứu)
- [3. Phân tích thị trường và đối thủ](#3-phân-tích-thị-trường-và-đối-thủ)
- [4. Chân dung người dùng (User Personas)](#4-chân-dung-người-dùng-user-personas)
- [5. User Journey và Pain Points](#5-user-journey-và-pain-points)
- [6. Quan điểm Nhà Tuyển Dụng (Stakeholder Phía Doanh nghiệp)](#6-quan-điểm-nhà-tuyển-dụng-stakeholder-phía-doanh-nghiệp)
- [7. Tổng hợp insight](#7-tổng-hợp-insight)
- [8. Định nghĩa vấn đề (Problem Statement)](#8-định-nghĩa-vấn-đề-problem-statement)
- [9. Cơ hội và định hướng giải pháp](#9-cơ-hội-và-định-hướng-giải-pháp)
- [10. Giả định và rủi ro](#10-giả-định-và-rủi-ro)
- [11. Validation Plan](#11-validation-plan)
- [Phụ lục](#phụ-lục)

### Executive Summary

Thị trường lao động CNTT Việt Nam đang trong tình trạng nghịch lý: mỗi năm có khoảng 50.000–57.000 sinh viên CNTT tốt nghiệp nhưng chỉ ~30% được đánh giá sẵn sàng làm việc ngay (VINASA). Một trong những rào cản lớn nhất là kỹ năng phỏng vấn — fresher biết câu hỏi nào sẽ được hỏi nhưng không có cách đánh giá chất lượng câu trả lời của mình.

Qua nghiên cứu secondary research và phân tích 5 đối thủ quốc tế (Pramp, BigInterview, InterviewBuddy, Yoodli, Final Round AI), chúng tôi xác định 3 khoảng trống lớn: (1) không có sản phẩm nào hỗ trợ tiếng Việt thực sự, (2) tất cả rubric đánh giá đều theo Western culture, và (3) pricing $25–$148/tháng vượt xa khả năng chi trả của sinh viên VN.

Đối tượng chính là sinh viên năm cuối và fresher CNTT 0–12 tháng kinh nghiệm tại Việt Nam. Cơ hội là xây dựng AI Interview Coach miễn phí, hỗ trợ tiếng Việt, với feedback "surgical" (highlight cụ thể từng đoạn trong câu trả lời) và cultural context pack VN. Công nghệ AI đã chín muồi — GPT-4o mini giá chỉ $0.15/1M input tokens (giảm 200x so với GPT-4 đầu 2023), Whisper hỗ trợ tiếng Việt với WER ~10%.

Metric thành công: ≥50 user đăng ký trong beta, ≥80% đánh giá feedback "cụ thể và hữu ích", activation rate ≥60%.

---

# 1. Bối cảnh và động lực

## 1.1 Bối cảnh thị trường lao động

Thị trường lao động CNTT Việt Nam đang trải qua giai đoạn tăng trưởng mạnh nhưng đi kèm với áp lực cạnh tranh gay gắt cho fresher. Theo dữ liệu từ các cơ sở đào tạo, mỗi năm Việt Nam có khoảng **50.000–57.000 sinh viên CNTT tốt nghiệp** (devhouse.vn, 2024). Tuy nhiên, đánh giá từ VINASA cho thấy chỉ khoảng **30% trong số này đủ năng lực làm việc ngay** sau khi ra trường — 70% còn lại cần đào tạo bổ sung về kỹ năng thực hành và kỹ năng mềm (Tiền Phong, 2024).

Mức lương khởi điểm cho fresher IT dao động **8–15 triệu VNĐ/tháng** (CareerLink, TopDev 2024–2025), trong khi chi phí sinh hoạt tại Hà Nội và TP.HCM ngày càng tăng. Đối với sinh viên mới ra trường, mỗi lần thất bại trong phỏng vấn đồng nghĩa với việc kéo dài thêm thời gian không có thu nhập. Áp lực này đặc biệt lớn khi cạnh tranh ngày càng cao — Chính phủ đặt mục tiêu đào tạo 80.000 sinh viên CNTT/năm đến 2030 và 100.000/năm giai đoạn 2030–2035 (VnEconomy, Bộ TT&TT).

Xu hướng tuyển dụng hậu COVID đã thay đổi đáng kể: phỏng vấn video/online trở thành chuẩn mới, AI được tích hợp vào quy trình sàng lọc ứng viên, và các công ty ngày càng chú trọng kỹ năng mềm bên cạnh kỹ năng kỹ thuật (Reeracoen Vietnam, 2025).

## 1.2 Bối cảnh công nghệ AI trong HR-tech

Công nghệ AI đã đạt mức trưởng thành đủ để cung cấp feedback có chất lượng cho luyện phỏng vấn. LLM thế hệ GPT-4 class trở lên có khả năng phân tích câu trả lời phỏng vấn, đưa ra nhận xét cụ thể và gợi ý cải thiện. OpenAI Whisper Large v3 hỗ trợ tiếng Việt với Word Error Rate (WER) baseline khoảng ~10% cho audio sạch, và có thể cải thiện đáng kể với fine-tuning (PhoWhisper) (Saytowords, GitHub 2024). Chi phí API đã giảm mạnh: GPT-4o mini chỉ $0.15/1M input tokens — giảm 200x so với GPT-4 ban đầu ($30/1M tokens, tháng 3/2023), khiến việc xây dựng sản phẩm B2C cho sinh viên trở nên khả thi về mặt chi phí (Medium, OpenAI 2024).

Thị trường AI Career Coach toàn cầu được định giá khoảng **$4.2 tỷ vào 2024** và dự kiến đạt **$5.0 tỷ vào 2025**, với CAGR ~18–19% (Market.us, 2025). Tuy nhiên, chưa có sản phẩm nào thực sự phục vụ thị trường Việt Nam.

## 1.3 Tại sao bây giờ (Why now)

1. **Công nghệ chín muồi:** GPT-4-class models đã đủ tốt cho feedback có chất lượng — điều chưa khả thi 2 năm trước khi chỉ có GPT-3.5 với output tiếng Việt kém.
2. **Chi phí giảm 200x:** API price từ $30/1M tokens (GPT-4, 03/2023) xuống $0.15/1M tokens (GPT-4o mini, 2024), khả thi cho sản phẩm dành cho sinh viên.
3. **Nhu cầu tăng mạnh:** 50.000–57.000 fresher CNTT/năm, chỉ 30% sẵn sàng ngay → 35.000–40.000 người cần hỗ trợ thêm, bao gồm kỹ năng phỏng vấn.
4. **Khoảng trống thị trường rõ rệt:** 100% đối thủ hiện tại chỉ hỗ trợ tiếng Anh, rubric Western, pricing $25–$148/tháng — hoàn toàn không phù hợp fresher VN.
5. **Phỏng vấn online trở thành chuẩn:** Hậu COVID, video interview là tiêu chuẩn → người dùng đã quen nói trước camera/microphone, giảm friction cho voice-based practice.

## 1.4 Hệ Sinh Thái Hỗ Trợ Tìm Việc Hiện Có Tại Việt Nam

Trước khi xác định khoảng trống thị trường, cần đánh giá hiệu quả của các kênh hỗ trợ tìm việc *sẵn có* tại Việt Nam — để làm rõ tại sao fresher vẫn thiếu công cụ luyện phỏng vấn chất lượng dù đã có nhiều nguồn tài nguyên.

| Kênh | Ví dụ | Điểm mạnh | Giới hạn đối với luyện PV |
|---|---|---|---|
| **Cộng đồng IT Facebook/Zalo** | J2Team (~500k), BKHN IT, Cộng đồng IT VN | Chia sẻ kinh nghiệm thực tế, hỏi đáp nhanh | Feedback ngẫu nhiên, không chuẩn hóa; người trả lời thiếu kinh nghiệm |
| **YouTube / TikTok** | "Phỏng vấn xin việc IT", các channel career coach VN | Dễ tiếp cận, miễn phí, có context VN | Một chiều — không có feedback cho câu trả lời cụ thể của người xem |
| **Career Center đại học** | ĐHBKHN, ĐHQGHN, UEH... | Có mock interview với mentor | Quy mô nhỏ; phụ thuộc availability của mentor; chất lượng không đồng đều |
| **Mentorship / Anh chị khóa trên** | Kết nối qua LinkedIn, group alumni, thực tập | Feedback có kinh nghiệm thực tế, VN context | Khó tiếp cận; scheduling; mentor có thể bận; số lượng giới hạn |
| **Nền tảng tuyển dụng** | TopCV, VietnamWorks, ITviec | CV tips, job description rõ ràng | Không có tính năng luyện phỏng vấn |
| **Coaching trả phí** | Career coach cá nhân, workshop tìm việc | Feedback chuyên nghiệp, cá nhân hóa | 500k–2M VNĐ/session — ngoài khả năng của phần lớn sinh viên |
| **ChatGPT / AI tổng quát** | Chat GPT, Claude, Gemini | Sẵn có 24/7, tiếng Việt chấp nhận được | Feedback generic; không có context JD/CV; không highlight cụ thể đoạn yếu |

**Đánh giá tổng thể:** Hệ sinh thái hiện có tại VN giải quyết được **"biết câu hỏi nào sẽ được hỏi"** (awareness) nhưng gần như không giải quyết được **"câu trả lời của tôi có tốt không"** (quality feedback). Khoảng trống này là systematic — không phải thiếu nỗ lực, mà thiếu công cụ đúng loại. Đây là lý do khoảng trống tồn tại dù hệ sinh thái cộng đồng IT VN khá phong phú.

## 1.5 Giả thuyết ban đầu (Initial Hypotheses)

| # | Giả thuyết | Mức độ tự tin (1-5) | Sau research: Đúng / Sai / Cần điều chỉnh |
|---|---|---|---|
| H1 | Fresher VN có nhu cầu lớn về luyện phỏng vấn nhưng thiếu công cụ chất lượng | 5 | ✅ Đúng — 70% fresher cần đào tạo bổ sung (VINASA); không có tool tiếng Việt |
| H2 | Họ thích voice input hơn text input vì giả lập tốt hơn | 3 | ⚠️ Cần điều chỉnh — Voice realistic hơn nhưng text "an toàn hơn" cho nhiều người, cần cả hai |
| H3 | Họ sẵn sàng dùng AI feedback nếu nó cụ thể và actionable | 4 | ⚠️ Cần validate thêm — Gen Z VN cởi mở với AI nhưng cần chứng minh chất lượng |
| H4 | Văn hóa phỏng vấn VN khác biệt rõ rệt với Western, ảnh hưởng đến rubric | 4 | Cần validate qua expert interview với HR |
| H5 | Sinh viên VN không sẵn sàng trả phí cho tool luyện phỏng vấn | 4 | Cần validate qua survey |
| H6 | Feedback generic (như đa số tool hiện tại) không tạo giá trị thực | 4 | Cần validate qua pilot test |

---

# 2. Phương pháp nghiên cứu

## 2.1 Tổng quan phương pháp

| Phương pháp | Mục đích | Sample | Trạng thái |
|---|---|---|---|
| **In-depth interview (định tính)** | Hiểu sâu pain point, motivation, hành trình luyện PV | 5-10 fresher CNTT | Chưa làm |
| **Survey online (định lượng)** | Validate insight với mẫu lớn hơn | 30-50 người | Chưa làm |
| **Expert interview** | Validate rubric phỏng vấn VN vs Western từ HR | 2-3 HR/recruiter | Chưa làm |
| **Competitive analysis** | Hiểu landscape, identify gap | 5 sản phẩm | Hoàn thành — 5 sản phẩm |
| **Secondary research** | Background data, statistics | N/A | Hoàn thành |

### 2.1.1 Sampling Criteria & Diversity Targets

| Phương pháp | Tiêu chí tuyển mẫu | Mục tiêu đa dạng |
|---|---|---|
| **In-depth interview** | GPA từ <2.5 đến >3.5; đang tìm việc 1–6 tháng; mix pass/fail interview | ≥40% nữ; 2+ tỉnh thành (HN + HCM); 2+ trường (ĐHBKHN + trường khác) |
| **Survey online** | Đang/vừa tìm việc ≤12 tháng; CNTT + non-tech pivot | Đại diện 3 miền; BA/PM + Dev mix |
| **Expert interview** | 1+ năm kinh nghiệm phỏng vấn fresher; tech sector | 1 HR/TA + 1 Hiring Manager + 1 Technical Lead; ≥1 VN công ty và ≥1 MNC |

## 2.2 Chi tiết từng phương pháp

### 2.2.1 In-depth Interview

**Mục tiêu:** Hiểu hành trình luyện phỏng vấn hiện tại của fresher CNTT VN, xác định pain points cụ thể và workaround hiện tại.

**Tiêu chí chọn participant (recruitment criteria):**
- Sinh viên năm cuối CNTT hoặc fresher 0–12 tháng kinh nghiệm
- Đã ít nhất apply hoặc dự định apply vị trí CNTT (developer, tester, BA...)
- Đang học hoặc đã tốt nghiệp từ trường đại học tại Việt Nam
- Có trình độ tiếng Anh cơ bản trở lên (vì nhiều job yêu cầu PV tiếng Anh)

**Cấu trúc phỏng vấn:** Semi-structured, ~45-60 phút mỗi cuộc.

**Cách thức:** Online qua Google Meet / Offline tại ĐHBKHN

**Recording & consent:** Có ghi âm (audio only) kèm form consent online trước khi phỏng vấn. Participant có quyền từ chối ghi âm.

**Discussion guide:** Xem [Phụ lục B](#phụ-lục-b---discussion-guide-cho-interview).

### 2.2.2 Survey

**Mục tiêu:** Validate các insight từ interview với mẫu lớn hơn, đo lường mức độ phổ biến của từng pain point, và thu thập data về willingness-to-pay.

**Kênh phân phối:** Facebook groups CNTT (Cộng đồng IT Việt Nam, BKHN IT, J2Team), Discord BKHN, nhóm Zalo lớp CNTT, LinkedIn.

**Cấu trúc câu hỏi:** Tổng ~25 câu, bao gồm screening (5), demographics (4), behavior (7), pain points (5), concept test (4). Thời gian hoàn thành ~8-10 phút.

**Tool sử dụng:** Google Forms (miễn phí, dễ share, quen thuộc với target audience).

**Câu hỏi survey:** Xem [Phụ lục C](#phụ-lục-c---survey-questionnaire).

### 2.2.3 Expert Interview

**Mục tiêu:** Validate cultural rubric (VN vs Western), đảm bảo feedback của AI sát thực tế HR.

**Đối tượng cần phỏng vấn:**
- HR Manager / Recruiter công ty Việt Nam (1-2 người)
- HR / Hiring Manager công ty Western/MNC tại VN (1 người)

**Discussion guide:** Xem [Phụ lục D](#phụ-lục-d---expert-interview-guide).

### 2.2.4 Competitive Analysis

**Sản phẩm đưa vào phân tích:** Pramp (Exponent), BigInterview, InterviewBuddy, Yoodli, Final Round AI.

**Tiêu chí so sánh:** Xem Phần 3.2.

**Phương pháp:** Sử dụng thử free tier/demo, đọc review trên Reddit / G2 / Product Hunt, phân tích feature page và pricing.

## 2.3 Timeline thực hiện

| Giai đoạn | Thời gian | Hoạt động chính |
|---|---|---|
| Tuần 1 | 05–11/05/2026 | Secondary research, viết discussion guide |
| Tuần 2 | 12–18/05/2026 | Recruit interview participant, pilot interview |
| Tuần 3-4 | 19/05–01/06/2026 | Conduct interview (5-10 người) |
| Tuần 4-5 | 02–15/06/2026 | Survey distribution & analysis |
| Tuần 5 | 09–15/06/2026 | Expert interview |
| Tuần 5-6 | 16–22/06/2026 | Competitive analysis (deep-dive) |
| Tuần 6 | 23–29/06/2026 | Synthesis, viết Discovery Doc final |

## 2.4 Hạn chế của nghiên cứu (Research Limitations)

1. **Sample size nhỏ:** Chỉ phỏng vấn 5-10 người, không đủ generalize cho toàn bộ fresher VN. *Mitigation:* Bổ sung survey 30-50 người để validate quantitatively.
2. **Selection bias:** Đa số participant dự kiến từ ĐHBKHN và các trường kỹ thuật Hà Nội, có thể không đại diện sinh viên trường tư thục hoặc vùng khác. *Mitigation:* Distribute survey qua Facebook groups toàn quốc.
3. **Geographic bias:** Tập trung Hà Nội, thiếu data từ TP.HCM/Đà Nẵng. *Mitigation:* Online survey và interview online để mở rộng reach.
4. **Self-reporting bias:** Survey và interview dựa trên self-report, có thể khác hành vi thực. *Mitigation:* Observation session (optional) để cross-validate.
5. **Researcher bias:** Tác giả là sinh viên CNTT BKHN, có thể có blind spot về trải nghiệm sinh viên ngành khác pivot sang tech. *Mitigation:* Có persona riêng cho nhóm non-tech pivot.
6. **Time constraint:** ~6 tuần research giới hạn độ sâu, đặc biệt cho expert interview. *Mitigation:* Prioritize primary research cho core persona (fresher CNTT).

### 2.4.1 Những Gì Chúng Tôi Chưa Biết (Known Unknowns)

Các câu hỏi mở dưới đây **chưa thể trả lời từ secondary research** và cần primary research để giải quyết:

1. Fresher VN có thực sự sẵn sàng nói tiếng Anh với AI, hay sẽ luôn chọn tiếng Việt?
2. HR có đánh giá cao ứng viên "được AI coach" hay coi đó là thiếu tự nhiên/inauthentic?
3. Pain point P1 (thiếu feedback) có thực sự là #1, hay chỉ là điều dễ nói nhất khi được hỏi?
4. Ngưỡng WTP thực tế là bao nhiêu? Freemium có đủ để tạo habit không?
5. Anxiety (P6) có phải là symptom (của thiếu practice) hay là root cause độc lập cần giải quyết?
6. Văn hóa khiêm tốn VN ảnh hưởng đến self-promotion như thế nào trong phỏng vấn thực tế?

**Các ★ criteria checklist chưa đáp ứng — pending primary research:**

| Criterion | Lý do chưa đáp ứng | Sẽ giải quyết khi |
|---|---|---|
| ★ 5.3 Direct quotes từ người phỏng vấn | Chưa có primary interviews | Hoàn thành in-depth interviews (Tuần 2–4) |
| ★ 6.1 Tiếng nói HR/recruiter | Expert interviews chưa thực hiện | Hoàn thành expert interviews (Tuần 5) |
| ★ 9.4 Triangulation 2+ methods | Chỉ có secondary research | Sau khi có cả interview + survey data |
| ★ 9.1 Số lượng người được phỏng vấn | Primary research = 0 hiện tại | Hoàn thành in-depth interviews (Tuần 3–4) |
| ★ 2.5 Sample size 5–8 người/persona | Primary research = 0 hiện tại | Hoàn thành interview + survey (Tuần 2–5) |

## 2.5 Ma trận Validation & Triangulation

Bảng dưới đây cho thấy mỗi insight chính được hỗ trợ bởi bằng chứng nào hiện có và sẽ được validate bằng phương pháp nào sau khi hoàn thành primary research.

| Insight | Evidence hiện có (Secondary) | Primary method sẽ validate | Timeline | Confidence hiện tại |
|---|---|---|---|---|
| I1: Thiếu feedback chất lượng | 0/5 tools có content feedback tiếng Việt; ChatGPT testing generic | In-depth interview + Survey (Q về feedback quality) | Tuần 2–5 | 🟡 Trung bình–cao |
| I2: AI cost barrier đã hạ | GPT-4o mini $0.15/1M tokens; cost model tính toán thực tế | Survey (WTP); Expert interview confirm | Tuần 4–5 | 🟢 Cao |
| I3: Vietnamese language gap | 0/5 đối thủ hỗ trợ VN; Whisper Large v3 WER ~10% | Pilot test 10 voice samples; Expert interview | Tuần 5–6 | 🟢 Cao |
| I4: Cultural context gap | All 5 competitors dùng Western-only rubric | Expert interview HR; In-depth interview (Q về văn hóa PV) | Tuần 5 | 🟡 Trung bình |
| I5: Fresher anxiety | Pain point P6 trong matrix; VINASA 70% data | In-depth interview (Q8–Q10); Survey (anxiety scale) | Tuần 2–4 | 🟡 Trung bình |
| I6: Không có vòng lặp cải thiện | Pain point P1/P6; HR không cho feedback là thực tế phổ biến | In-depth interview + Survey (Q về post-PV behavior) | Tuần 2–5 | 🟡 Trung bình |

---

# 3. Phân tích thị trường và đối thủ

## 3.1 Phân tích thị trường (Market Analysis)

### 3.1.1 Quy mô thị trường

- **TAM (Total Addressable Market):** ~500.000 sinh viên VN tốt nghiệp đại học/năm (VietnamNet, 2024). Giả định 40% cần luyện phỏng vấn = **200.000 users tiềm năng/năm**.
- **SAM (Serviceable Addressable Market):** Fresher CNTT & ngành tech: ~57.000 sinh viên CNTT tốt nghiệp/năm (devhouse.vn). Trong đó, 70% cần đào tạo bổ sung (VINASA) = **~40.000 users/năm**.
- **SOM (Serviceable Obtainable Market, 3 năm):** 2–5% SAM = **800–2.000 active users** — mục tiêu thực tế cho solo dev project.

**Assumptions:** (1) Chỉ tính fresher CNTT, không tính non-tech pivot (V2). (2) "Cần luyện phỏng vấn" = chưa có offer sau 1 tháng tìm việc hoặc tự đánh giá thiếu tự tin. (3) SOM giả định organic growth qua word-of-mouth trong cộng đồng CNTT.

### 3.1.2 Xu hướng thị trường

1. **AI integration trong HR-tech:** HireVue, Final Round AI, Yoodli... ngày càng phổ biến. Thị trường AI Career Coach toàn cầu đạt ~$4.2B (2024), CAGR ~18% (Market.us).
2. **Remote/video interview thành chuẩn mới:** Hậu COVID, phỏng vấn online qua Google Meet, Zoom là tiêu chuẩn, đặc biệt vòng đầu (Reeracoen VN, 2025).
3. **Nhu cầu English proficiency tăng:** Các MNC tại VN (Samsung, FPT Software, VNG) yêu cầu phỏng vấn song ngữ Việt-Anh.
4. **Gen Z cởi mở với AI nhưng đòi hỏi chất lượng:** Sẵn sàng dùng AI tool nhưng critical hơn, không chấp nhận output generic (VietnamNet, VietnamPlus 2024).
5. **Personalization là kỳ vọng mặc định:** Content generic không còn đủ, user muốn feedback sát JD/CV cụ thể.
6. **Chi phí AI giảm mạnh:** GPT-4o mini giá $0.15/1M tokens, giảm 200x so với GPT-4 (03/2023), mở ra khả năng xây sản phẩm B2C miễn phí.

### 3.1.3 Customer segments

| Segment | Đặc điểm | Quy mô ước tính | Mức độ priority |
|---|---|---|---|
| Sinh viên năm cuối CNTT | 21-23 tuổi, chưa có kinh nghiệm, lo lắng PV đầu tiên | ~25.000/năm | **High** — Core persona |
| Fresher 0-12 tháng kinh nghiệm | Đã đi PV nhưng fail, muốn cải thiện | ~15.000/năm | **High** — Có pain point rõ |
| SV non-tech pivot sang tech | Kinh tế, quản trị... muốn chuyển sang IT | ~5.000/năm | Medium (V2) |
| Senior pivot career | 5+ năm kinh nghiệm, đổi ngành | N/A | Low — Khác hoàn toàn scope |

## 3.2 Phân tích đối thủ (Competitive Analysis)

### 3.2.1 Bảng so sánh đối thủ chính

| Tiêu chí | Pramp (Exponent) | BigInterview | InterviewBuddy | Yoodli | Final Round AI | **InterviewAI (proposed)** |
|---|---|---|---|---|---|---|
| **Target user** | Tech interviewees | General job seekers | General | General speakers | Tech job seekers | **Vietnamese fresher CNTT** |
| **Ngôn ngữ** | English only | English only | English only | English only | English only | **Tiếng Việt + English** |
| **Voice support** | Yes (peer video) | No (video record) | Yes (live coach) | Yes (AI real-time) | Yes (real-time) | **Yes (record + AI)** |
| **AI feedback** | No (peer review) | AI on delivery only | AI + expert option | AI on delivery | Real-time AI copilot | **Surgical AI feedback trên content** |
| **CV personalization** | No | No | Limited | No | Yes | **Yes — paste JD + upload CV** |
| **Cultural context** | Western | Western | Western | Western | Western | **VN & Western cultural pack** |
| **Pricing** | Free (5 credits/mo) | $39–$299 | $5–6/session | Free–$20/mo | $60–$150/mo | **Free for students** |
| **Vietnamese-friendly** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.2.2 Phân tích sâu top 3 đối thủ

#### Đối thủ #1: Pramp (nay là Exponent)

**Vị thế thị trường:** Platform peer-to-peer mock interview hàng đầu, được Exponent mua lại 2021. Tập trung tech interview (coding, system design, behavioral).

**Điểm mạnh:**
- Miễn phí (5 credits/tháng), phù hợp sinh viên
- Peer-to-peer tạo trải nghiệm realistic, hai chiều (interviewer + interviewee)
- Hỗ trợ đa dạng: coding, system design, behavioral, PM
- Shared code editor + video chat tích hợp

**Điểm yếu:**
- Chất lượng peer không đảm bảo (phụ thuộc partner)
- Chỉ English, không có support tiếng Việt
- Cần scheduling — không on-demand
- Không có AI feedback, chỉ peer review chủ quan

**User reviews tiêu biểu:**
- *"Great for getting reps in, but the quality varies wildly depending on your partner"* — Reddit r/cscareerquestions
- *"Best free option out there, but you need to supplement with other tools"* — BlogSpot review

**Bài học cho InterviewAI:** On-demand + AI feedback sẽ giải quyết 2 điểm yếu lớn nhất của Pramp (scheduling + quality variance).

#### Đối thủ #2: Yoodli

**Vị thế thị trường:** AI speech coach phổ biến, tập trung vào delivery (cách nói) hơn content (nội dung nói gì).

**Điểm mạnh:**
- Real-time feedback: filler words, pacing, clarity, tone
- AI roleplay với personas khác nhau (behavioral, technical, panel)
- Judgment-free, available 24/7
- Pricing hợp lý: Free (5 sessions) → $8/mo → $20/mo

**Điểm yếu:**
- Tập trung "how you say it" hơn "what you say" — thiếu feedback sâu về nội dung
- Chỉ English
- Không có cultural context đặc thù
- Free tier rất giới hạn (5 lifetime sessions)

**User reviews tiêu biểu:**
- *"Excellent for catching filler words and improving confidence"* — UW.edu review
- *"Good for delivery coaching but won't help you craft better answers"* — Prospeo.io

**Bài học cho InterviewAI:** Kết hợp cả delivery feedback (Yoodli's strength) VÀ content feedback (Yoodli's gap) sẽ tạo giá trị vượt trội.

#### Đối thủ #3: Final Round AI

**Vị thế thị trường:** AI Interview Copilot — hỗ trợ real-time TRONG buổi phỏng vấn thật (controversial).

**Điểm mạnh:**
- Real-time transcription + suggested answers trong PV thật
- Mock interview mode riêng để practice
- Resume builder tích hợp
- Hỗ trợ STAR method

**Điểm yếu:**
- Rất đắt: $60–$150/tháng
- Ethical concerns lớn: nhiều công ty coi là "cheating"
- Responses đôi khi generic hoặc superficial
- Technical issues: latency, glitches trong live interview
- Refund policy bất lợi cho user

**User reviews tiêu biểu:**
- *"Useful mock interviews but way too expensive. The live copilot feels sketchy"* — Reddit r/jobs
- *"The AI suggestions are sometimes generic and don't match the context"* — LinkJob.ai

**Bài học cho InterviewAI:** Focus vào PRACTICE (không phải cheating tool), pricing miễn phí, và feedback sâu thay vì real-time superficial.

### 3.2.3 Gap Analysis

1. **Language gap:** 0/5 đối thủ hỗ trợ tiếng Việt thực sự. Tất cả chỉ English — fresher VN với English trung bình không thể tận dụng hiệu quả.
2. **Cultural gap:** 100% rubric đánh giá đang theo Western culture. VN có đặc thù: khiêm tốn vs self-promotion, cách xưng hô, cấu trúc câu trả lời khác biệt.
3. **Affordability gap:** Tools chất lượng đều paywall $20–$150/tháng. Sinh viên VN thu nhập 0–5 triệu/tháng không đủ khả năng.
4. **Content feedback gap:** Yoodli chỉ feedback delivery; Pramp chỉ có peer review; BigInterview feedback generic. Chưa ai cung cấp "surgical feedback" — highlight cụ thể đoạn nào trong câu trả lời có vấn đề.
5. **Personalization gap:** Đa số không personalize theo JD + CV cụ thể. Câu hỏi và feedback generic cho mọi user.
6. **Accessibility gap:** Không có sản phẩm nào free hoàn toàn, on-demand, không cần scheduling.

### 3.2.4 Vị thế đề xuất (Positioning Statement)

*Cho **sinh viên & fresher CNTT Việt Nam**, người **cần luyện kỹ năng phỏng vấn nhưng không có nguồn feedback chất lượng bằng tiếng Việt và không đủ khả năng chi trả tools quốc tế**, **InterviewAI** là **AI interview coach miễn phí** giúp **luyện phỏng vấn với feedback cụ thể ("surgical") trên từng câu trả lời, hỗ trợ tiếng Việt, phù hợp văn hóa phỏng vấn VN**. Khác với **Pramp, Yoodli và Final Round AI**, sản phẩm của chúng ta **hiểu sâu context văn hóa Việt Nam, miễn phí hoàn toàn, và đưa feedback highlight cụ thể từng đoạn thay vì nhận xét chung chung**.*

---

# 4. Chân dung người dùng (User Personas)

## 4.1 Tổng quan Persona Map

```
                   Cao Confidence
                         │
   [Persona C: Mai] ─────┼────── (Anti-persona: Senior pivot)
   non-tech pivot         │              (không trong scope V1)
                          │
   ─────────────────────────────────────── Tech-savvy
                          │
   [Persona A: Linh] ────┼────── [Persona B: Hùng]
   năm cuối, lần đầu     │       fresher 3 tháng job-search
                          │
                   Thấp Confidence
```

> **Lưu ý về phương pháp xây dựng persona:** Các persona dưới đây được xây dựng dựa trên *composite secondary research* — tổng hợp từ báo cáo thị trường, competitive analysis, và dữ liệu công khai. Các quote tiêu biểu là *hypothetical composites* minh họa pain points đại diện, **chưa phải lời trích dẫn thực từ phỏng vấn người dùng**. Toàn bộ personas sẽ được validate và điều chỉnh sau khi hoàn thành primary research (Tuần 2–4: 12/05–01/06/2026).

## 4.2 Persona A: "Linh, sinh viên năm cuối CNTT ĐHBKHN"

### Quote tiêu biểu

> *"Em đọc 100 câu phỏng vấn trên mạng rồi mà vẫn không biết em trả lời tốt hay tệ. Em hỏi anh chị thì mỗi người nói một kiểu."*
> *— Linh, 22 tuổi, sinh viên năm cuối ĐHBKHN*
>
> *\[Hypothetical composite quote — tổng hợp từ secondary research. Sẽ được thay thế bằng quote thực sau phỏng vấn sâu (Tuần 2–4: 12/05–01/06/2026).\]*

### Demographics

| Thuộc tính | Giá trị |
|---|---|
| Tuổi | 22 |
| Giới tính | Nữ |
| Vị trí địa lý | Hà Nội |
| Học vấn | Năm cuối cử nhân CNTT, ĐHBKHN |
| Tình trạng | Đang chuẩn bị apply internship/fresher dev |
| Thu nhập | 0 (sinh viên, phụ thuộc gia đình) |
| Tech-savvy | Cao |
| Trình độ tiếng Anh | Trung bình (đọc hiểu tốt, nói kém tự tin) |

### Bối cảnh sống và công việc

Linh sống ở ký túc xá ĐHBKHN, học kỳ cuối với đồ án tốt nghiệp. Gia đình ở tỉnh, kỳ vọng em có việc ngay sau tốt nghiệp. Linh học giỏi lý thuyết nhưng ít kinh nghiệm thực tế, chỉ có 1 đồ án môn học và 1 project cá nhân trên GitHub.

### Goals

**Dài hạn:** Trở thành fullstack developer tại công ty product-led, thu nhập ≥15 triệu/tháng trong 1 năm đầu.

**Trong ngữ cảnh job hunting:**
- Có offer trước khi tốt nghiệp (tháng 6/2026)
- Vào được công ty product, không outsourcing
- Pass được vòng behavioral bằng tiếng Anh

### Frustrations / Pain Points

1. Không biết tự đánh giá câu trả lời phỏng vấn — đọc 100 câu hỏi mẫu nhưng không biết trả lời sao là "đúng"
2. Không quen kể chuyện theo STAR method bằng tiếng Anh — biết framework nhưng áp dụng vụng về
3. Tự nói trước gương cảm thấy ngượng và không có feedback thực sự
4. Hỏi bạn bè nhưng bạn cũng không có kinh nghiệm phỏng vấn → feedback chất lượng thấp
5. Không biết sự khác biệt văn hóa phỏng vấn công ty VN vs MNC
6. Lo lắng mất ngủ trước ngày phỏng vấn vì thiếu tự tin
7. Không có tiền dùng tools trả phí ($39–$150/tháng)

### Behaviors

**Cách luyện phỏng vấn hiện tại:** Google "câu hỏi phỏng vấn fresher dev", viết câu trả lời vào file Word, đọc lại nhiều lần, thử nói trước gương.

**Tools đang dùng:** Google, Glassdoor (đọc review), LeetCode (luyện code), ChatGPT (hỏi câu hỏi mẫu).

**Kênh thông tin tin tưởng:** Group Facebook IT (J2Team, BKHN IT), anh chị khóa trước, Reddit r/cscareerquestions.

**Thiết bị chính:** Laptop học tập (Windows), smartphone Android.

### Needs vs Wants

| Needs (cần có) | Wants (muốn có) |
|---|---|
| Feedback cụ thể về câu trả lời | Mock interview với người thật |
| Câu hỏi sát với JD cụ thể | Gamification, streak tracking |
| Hỗ trợ tiếng Việt | UI đẹp, modern |
| Miễn phí | Có thể luyện cùng bạn |

### Scenario điển hình

*Linh được công ty A mời phỏng vấn vòng technical + behavioral sau 2 tuần. Em mở 3 tab: Glassdoor để xem review, Google "câu hỏi phỏng vấn fresher dev", và file Word ghi câu trả lời nháp. Em đọc 100 câu hỏi mẫu nhưng không biết trả lời sao là "đúng". Em thử nói trước gương nhưng cảm thấy ngượng và không biết tự đánh giá. Em hỏi ChatGPT nhưng feedback quá generic: "Câu trả lời khá tốt, bạn nên thêm ví dụ cụ thể" — không chỉ ra đoạn nào cần sửa. Đêm trước phỏng vấn em ngủ chỉ 4 tiếng vì lo lắng.*

---

## 4.3 Persona B: "Hùng, fresher đã job-search 3 tháng"

### Quote tiêu biểu

> *"Em đã fail 5 buổi phỏng vấn mà không biết em sai ở đâu. Công ty không bao giờ cho feedback."*
> *— Hùng, 23 tuổi, fresher tìm việc 3 tháng*
>
> *\[Hypothetical composite quote — tổng hợp từ secondary research. Sẽ được thay thế bằng quote thực sau phỏng vấn sâu (Tuần 2–4: 12/05–01/06/2026).\]*

### Demographics

| Thuộc tính | Giá trị |
|---|---|
| Tuổi | 23 |
| Giới tính | Nam |
| Vị trí địa lý | Hà Nội |
| Học vấn | Đã tốt nghiệp CNTT, trường top 2 Hà Nội |
| Tình trạng | Fresher, tìm việc 3 tháng, đã fail 5 PV |
| Thu nhập | 3-5 triệu/tháng (freelance nhỏ) |
| Tech-savvy | Cao |
| Trình độ tiếng Anh | Trung bình khá |

### Bối cảnh sống và công việc

Hùng tốt nghiệp 3 tháng, đang ở trọ Hà Nội. Gia đình hỏi thăm liên tục "đã có việc chưa". Hùng code tốt (GitHub 20+ repos) nhưng kỹ năng giao tiếp và trình bày yếu. Đã fail 5 buổi phỏng vấn — 3 vòng behavioral, 2 vòng technical presentation.

### Goals

**Dài hạn:** Backend developer senior trong 3 năm, lương ≥25 triệu.

**Job hunting:** Có offer trong 1 tháng tới, bất kỳ công ty tech nào chấp nhận fresher.

### Frustrations / Pain Points

1. Fail phỏng vấn nhưng không nhận được feedback từ nhà tuyển dụng — không biết sai ở đâu
2. Code tốt nhưng không thể diễn đạt tư duy rõ ràng khi phỏng vấn
3. Mất tự tin sau nhiều lần fail liên tiếp — vòng xoáy tiêu cực
4. Không biết cách "sell" bản thân mà không nghe giả tạo (văn hóa VN: khiêm tốn)
5. Áp lực tài chính: tiền trọ + sinh hoạt, gia đình hỏi thăm liên tục

### Behaviors

**Cách luyện hiện tại:** Xem video YouTube "mock interview", tự ghi âm và nghe lại (nhưng không biết đánh giá), nhờ bạn bè mock nhưng khó schedule.

**Tools đang dùng:** LeetCode, GitHub, ChatGPT, YouTube.

**Thiết bị chính:** Laptop cá nhân (Linux), smartphone.

### Scenario điển hình

*Hùng vừa fail vòng behavioral tại công ty thứ 5. HR chỉ gửi email "Rất tiếc, chúng tôi đã chọn ứng viên khác". Hùng không biết mình sai ở đâu — code test đã pass, vậy chắc là do phần behavioral? Hùng muốn luyện lại nhưng nhờ bạn thì bạn bận, xem YouTube thì không có feedback cho câu trả lời cụ thể của mình. Hùng bắt đầu nghi ngờ khả năng của bản thân.*

---

## 4.4 Persona C: "Mai, sinh viên Kinh tế pivot sang tech"

### Quote tiêu biểu

> *"Em muốn chuyển sang làm BA/Product nhưng không biết phỏng vấn tech khác phỏng vấn kinh tế như thế nào."*
> *— Mai, 22 tuổi, SV Kinh tế muốn pivot*
>
> *\[Hypothetical composite quote — tổng hợp từ secondary research. Sẽ được thay thế bằng quote thực sau phỏng vấn sâu (Tuần 2–4: 12/05–01/06/2026).\]*

### Demographics

| Thuộc tính | Giá trị |
|---|---|
| Tuổi | 22 |
| Giới tính | Nữ |
| Vị trí địa lý | TP.HCM |
| Học vấn | Năm cuối Quản trị Kinh doanh |
| Tình trạng | Đang tự học tech, muốn apply BA/PM |
| Thu nhập | 0 (sinh viên) |
| Tech-savvy | Trung bình |
| Trình độ tiếng Anh | Khá (IELTS 6.5) |

### Bối cảnh sống và công việc

Mai học Kinh tế nhưng quan tâm đến tech sau khi thực tập tại startup. Đang tự học SQL, Figma, và đọc sách Product Management. Ưu điểm: giao tiếp tốt, English khá. Nhược điểm: không có background tech, lo lắng về câu hỏi kỹ thuật.

### Goals

**Job hunting:** Apply vị trí Business Analyst hoặc Associate PM tại công ty tech.

### Frustrations / Pain Points

1. Không hiểu format phỏng vấn tech (case study, system thinking) vs kinh tế (tình huống kinh doanh)
2. Lo bị "gatekeep" vì không có bằng CNTT
3. Không biết cần chuẩn bị gì cho vòng technical assessment

### Scenario điển hình

*Mai apply vị trí BA tại công ty tech. JD yêu cầu "hiểu biết cơ bản về software development lifecycle". Mai không biết phỏng vấn sẽ hỏi gì — câu hỏi SQL? Hay case study? Hay behavioral? Em muốn luyện nhưng tất cả tool đều bằng tiếng Anh và focus vào developer, không có track riêng cho BA fresher.*

---

## 4.5 Anti-Persona

1. **Senior engineer 5+ năm kinh nghiệm:** Cần system design interview, salary negotiation, leadership questions — khác hoàn toàn fresher scope.
2. **Non-tech fresher thuần túy (kế toán, y tế):** Domain rubric khác hoàn toàn, không trong scope V1.
3. **Người tìm việc tại nước ngoài:** Cần visa sponsorship knowledge, deep Western cultural fit — ngoài scope.

---

# 5. User Journey và Pain Points

## 5.1 Current State Journey — Linh (Persona A)

### Journey: "Linh chuẩn bị cho buổi phỏng vấn đầu tiên"

| Phase | 1. Nhận lịch PV | 2. Tìm hiểu công ty | 3. Tự luyện | 4. Phỏng vấn thật | 5. Sau phỏng vấn |
|---|---|---|---|---|---|
| **Action** | Đọc email, ghi lịch, stress | Search Glassdoor, LinkedIn company | Đọc câu hỏi mạng, tự nói trước gương, viết Word | Tham gia Google Meet, trả lời theo bản năng | Chờ kết quả, không biết mình thể hiện thế nào |
| **Thought** | "Mình có 2 tuần" | "Công ty này hỏi gì?" | "Câu trả lời này ổn không?" | "Nên nói gì tiếp?" | "Tại sao họ không reply?" |
| **Emotion** | 😰 Lo lắng | 😟 Bất an | 😩 Bối rối, frustrated | 😨 Stress cao | 😞 Tự nghi ngờ |
| **Pain point** | Không có checklist | Thông tin tản mác | **Không có feedback chất lượng** ⭐ | Không biết answer template | Không học được gì từ trải nghiệm |
| **Workaround** | Hỏi anh chị | Đọc nhiều nguồn | ChatGPT (generic), nói trước gương | Trả lời theo bản năng | Tự an ủi |
| **Opportunity** | Prep checklist | Company research | **🎯 Core opportunity cho InterviewAI** | Confidence từ practice | Reflection + improvement tracking |

## 5.2 Emotion Curve

*Emotion curve cho thấy điểm thấp nhất là phase 3 (tự luyện) — đây là nơi user "đói" feedback nhất và cảm thấy bất lực vì không có cách đánh giá bản thân. Phase 5 (sau phỏng vấn) cũng âm sâu vì không nhận được feedback từ nhà tuyển dụng. Cả hai đều là "moments of truth" mà InterviewAI cần serve — phase 3 qua practice feedback, phase 5 qua reflection tool.*

## 5.3 Tổng hợp Pain Points (Across all Personas)

| # | Pain Point | Persona | Impact (1-5) | Frequency (1-5) | Ưu tiên |
|---|---|---|---|---|---|
| P1 | Không có feedback chất lượng cho câu trả lời cụ thể | A, B, C | 5 | 5 | ⭐⭐⭐ Top |
| P2 | Câu hỏi/feedback generic, không sát JD/CV | A, B | 4 | 4 | ⭐⭐⭐ |
| P3 | Không hiểu văn hóa PV VN vs Western | B, C | 4 | 3 | ⭐⭐ |
| P4 | Lo lắng tiếng Anh trong phỏng vấn | A, C | 4 | 4 | ⭐⭐ |
| P5 | Không có partner luyện cùng (scheduling) | A, B | 3 | 5 | ⭐⭐ |
| P6 | Fail nhiều lần không biết sai ở đâu — vòng xoáy mất tự tin | B | 5 | 3 | ⭐⭐ |
| P7 | Tools quốc tế quá đắt cho SV Việt Nam | A, B, C | 3 | 5 | ⭐ |

## 5.4 Phân Tích Tâm Lý: Imposter Syndrome & Vòng Xoáy Thất Bại

> ⚠️ *Nội dung phần này dựa trên secondary research (tâm lý học về interview anxiety, báo cáo thị trường lao động VN) và tổng hợp từ competitive analysis. Các quote là hypothetical composites — sẽ được thay thế bằng quote thực sau primary research.*

### 5.4.1 Imposter Syndrome trong bối cảnh fresher VN

**Imposter syndrome** — cảm giác "mình không đủ giỏi, sớm muộn gì cũng bị lộ" — là pain point tâm lý phổ biến nhưng thường bị bỏ qua trong các tool luyện phỏng vấn hiện tại. Đối với fresher CNTT VN, imposter syndrome mang những đặc điểm riêng:

| Đặc điểm | Biểu hiện cụ thể | Nguồn amplify |
|---|---|---|
| **So sánh với peer** | "Bạn mình có 5 project, mình chỉ có 1" | Mạng xã hội (LinkedIn, Facebook IT groups) |
| **Áp lực gia đình** | Kỳ vọng có việc ngay sau tốt nghiệp; hỏi thăm liên tục | Văn hóa VN: gia đình = nguồn validation |
| **Trường danh tiếng ≠ competent** | SV BKHN/ĐHQGHN cảm thấy áp lực phải giỏi hơn; SV trường khác cảm thấy "mình không đủ tư cách" | Hierarchy trường đại học trong tuyển dụng IT VN |
| **Không biết baseline** | Không biết level của mình so với thị trường — quá cao hay quá thấp? | Thiếu feedback khách quan sau phỏng vấn |
| **English inferiority** | Tự ti về tiếng Anh dù đủ để làm việc | So sánh với influencer tech, kỳ vọng "English native-like" |

> *\[Hypothetical composite\]: "Em thấy bạn cùng lớp đi làm rồi, mà em fail 3 chỗ. Em bắt đầu nghĩ chắc mình không phù hợp với ngành này."*

### 5.4.2 Vòng Xoáy Thất Bại (Failure Spiral)

Persona B (Hùng) điển hình hóa pattern này — nhưng nó phổ biến hơn người ta nghĩ:

```
Fail phỏng vấn
    ↓
Không có feedback từ công ty
    ↓
Tự phân tích sai (hoặc không phân tích được)
    ↓
Luyện tập không đúng chỗ yếu
    ↓
Tự tin giảm → Performance kém hơn ở lần sau
    ↓
Fail tiếp → Vòng xoáy tiêu cực
```

**Hậu quả của vòng xoáy:**
- **Cognitive**: Cứng đơ khi bị hỏi câu khó, "blank out" — không phải vì không biết mà vì anxiety
- **Behavioral**: Tránh apply vào công ty tốt ("chắc mình không đủ trình"); thu hẹp target xuống công ty nhỏ hơn mức cần thiết
- **Physiological**: Mất ngủ đêm trước phỏng vấn, run tay, khô miệng — ảnh hưởng trực tiếp performance

> *\[Hypothetical composite\]: "Lần thứ 4 fail em không còn dám apply công ty A nữa, dù trước đây em muốn lắm. Em nghĩ mình chỉ xứng đáng với công ty nhỏ hơn thôi."*

### 5.4.3 Tại Sao Đây Là Pain Point Quan Trọng Cho InterviewAI

1. **Vòng xoáy có thể phá vỡ bằng feedback loop** — nếu user biết chính xác *tại sao* fail (câu nào, đoạn nào), họ có thể fix đúng chỗ, rebuild confidence có cơ sở.
2. **Tone của feedback quan trọng** — feedback quá harsh sẽ amplify imposter syndrome; quá gentle sẽ không actionable. InterviewAI cần balance: *"Đây là đoạn cụ thể cần cải thiện, và đây là cách tốt hơn"* — constructive, không phán xét.
3. **Progress tracking là antidote** — Khi user thấy câu trả lời của mình ở session 5 tốt hơn session 1, đó là evidence chống lại imposter narrative *"mình không cải thiện được"*.

## 5.5 Pain Points theo Từng Vòng Phỏng Vấn

Fresher CNTT VN thường trải qua 3–5 vòng phỏng vấn với pain points khác nhau ở mỗi giai đoạn. Tách biệt theo vòng giúp InterviewAI design question bank và feedback rubric phù hợp từng context.

| Vòng | Mô tả | Pain Point chính của ứng viên | Cơ hội cho InterviewAI |
|---|---|---|---|
| **1. CV Screening** | HR xem qua CV/email 30–60 giây | Không biết CV của mình có "pass ATS" không; không hiểu keyword nào HR tìm kiếm | (Out of scope V1 — CV coach) |
| **2. Phone Screen / HR Pre-screen** | HR call 15–20 phút, kiểm tra fit cơ bản | Không luyện trả lời "Tell me about yourself" trong 2 phút; không biết lương kỳ vọng | Luyện elevator pitch, câu hỏi HR cơ bản |
| **3. Technical Test / Code Challenge** | Bài thi online (HackerRank, CodeSignal) hoặc take-home | Không biết giải thích approach khi làm; sau test không biết mình fail ở đâu | (Out of scope V1 — LeetCode là solution) |
| **4. Technical Interview** | 45–60 phút với Tech Lead / Senior Dev | **Pain point cao nhất**: không trình bày được tư duy; bị blocked câu hỏi system design; giải thích project CV không rõ | **Core scope của InterviewAI** — luyện explain thinking, mock technical Q&A |
| **5. Behavioral / HR Interview** | 30–45 phút, câu STAR, motivation, culture fit | Không dùng được STAR structure; trả lời vòng vo khi hỏi weakness/failure; không biết "sell" bản thân mà không nghe giả tạo | **Core scope** — STAR feedback, cultural pack |
| **6. Panel Interview** | 2–4 người cùng hỏi (hiếm gặp ở fresher role) | Bị áp lực nhiều người nhìn; không biết nhìn vào ai khi trả lời | Nice-to-have: multi-evaluator simulation |
| **7. Salary Negotiation** | Offer discussion | Không dám negotiate; không biết mức lương thị trường; khiêm tốn quá mức | (Out of scope V1) |

**Insight từ phân tích này:** InterviewAI nên tập trung tối đa vào **Vòng 4 (Technical)** và **Vòng 5 (Behavioral)** — đây là 2 vòng fresher VN fail nhiều nhất và có thể luyện được qua AI simulation. CV và coding test có ecosystem riêng (LinkedIn, LeetCode), không cần duplicate.

## 5.5 Future State Vision (with InterviewAI)

| Phase | 1. Nhận lịch PV | 2. Tìm hiểu | **3. Luyện với InterviewAI** | 4. PV thật | 5. Sau PV |
|---|---|---|---|---|---|
| **Action mới** | (Same) | (Same) | **Paste JD → Upload CV → Luyện 5 câu → Nhận surgical feedback** | Tự tin hơn nhờ đã luyện | Review session history, xem pattern |
| **Emotion mới** | 😰 → 😊 | 😟 → 🙂 | 😩 → 😊 "Biết mình yếu đâu" | 😨 → 😎 Tự tin | 😞 → 💪 Growth mindset |
| **Outcome** | Có plan | Có context | **Biết điểm yếu cụ thể, có improved version** | Trả lời có cấu trúc | Học từ mỗi session |

---

# 6. Quan điểm Nhà Tuyển Dụng (Stakeholder Phía Doanh nghiệp)

> ⚠️ **Trạng thái:** Toàn bộ nội dung phần này dựa trên **secondary research** (LinkedIn Talent Trends Vietnam 2024, VietnamWorks Hiring Report 2023, TopDev Vietnam IT Report 2024, Reeracoen Vietnam 2025). **Chưa có primary interviews với HR/recruiter.** Sẽ được validate và bổ sung sau Expert Interviews (Tuần 5: 09–15/06/2026).

## 6.1 Tổng quan

Nhà tuyển dụng Việt Nam — HR/Talent Acquisition, Hiring Manager, Technical Interviewer — là stakeholder gián tiếp của InterviewAI nhưng quyết định trực tiếp outcome của người dùng. Hiểu quan điểm của họ là điều kiện cần để xây dựng rubric đánh giá phù hợp.

Theo secondary research, quy trình tuyển dụng fresher tech tại Việt Nam thường gồm 3–4 vòng: (1) CV screening, (2) Technical test/code challenge, (3) Technical interview, (4) HR/Cultural fit interview. Tỷ lệ pass qua toàn bộ pipeline ước tính **5–15%** tùy công ty và vị trí (TopDev, 2024).

## 6.2 Pain Points của Nhà Tuyển Dụng Khi Phỏng Vấn Fresher

| # | Pain Point (từ phía HR/Interviewer) | Nguồn | Liên quan đến InterviewAI |
|---|---|---|---|
| R1 | **Kỹ năng giao tiếp kém** — không giải thích được tư duy, trả lời vòng vo | LinkedIn Talent Trends VN 2024 | Core value prop: surgical feedback on content & structure |
| R2 | **Thiếu cấu trúc** — không dùng STAR method, nhảy từ kết quả sang context | TopCV, VietnamWorks reports | Feedback gợi ý restructure cụ thể từng đoạn |
| R3 | **"Khiêm tốn quá mức"** — không biết tự marketing bản thân | HR comments về fresher VN tại MNC | Cultural context pack phải address rõ |
| R4 | **Tiếng Anh kỹ thuật yếu** — khi giải thích architecture, tradeoffs | Phổ biến với freshers ngoài top trường | Bilingual practice mode (VN/EN) |
| R5 | **CV ≠ thực tế** — project trên CV không giải thích được khi hỏi sâu | Reeracoen VN 2025: "Experience mismatch" | JD/CV-based question generation |
| R6 | **Không cho feedback sau PV** — HR không có thời gian | Thực tế phổ biến → tạo ra pain point P6 của user | Progress tracking = bổ sung feedback loop bị thiếu |

## 6.3 Tiêu Chí Đánh Giá Phổ Biến cho Fresher Tech Roles

| Tiêu chí | Tầm quan trọng | Loại vai trò | Ghi chú |
|---|---|---|---|
| Tư duy giải quyết vấn đề | ⭐⭐⭐⭐⭐ | Dev, BA, PM | Quan trọng hơn "biết nhiều công nghệ" |
| Giao tiếp & trình bày | ⭐⭐⭐⭐ | Tất cả | Giải thích được thinking process |
| Thái độ & growth mindset | ⭐⭐⭐⭐⭐ | Tất cả | "Trainability" — sẵn sàng học, nhận feedback |
| Kỹ năng kỹ thuật cơ bản | ⭐⭐⭐⭐ | Dev, QA | Data structures, OOP, SQL |
| Tiếng Anh | ⭐⭐⭐ (VN) / ⭐⭐⭐⭐⭐ (MNC) | Tùy công ty | Quan trọng hơn nhiều tại MNC |
| Cultural fit | ⭐⭐⭐⭐ | Tất cả | Mỗi công ty định nghĩa khác nhau |

*Nguồn tổng hợp: TopDev Vietnam IT Report 2024, VietnamWorks Job Market Report 2023.*

## 6.4 Khoảng Cách Kỳ Vọng HR vs. Hiện Thực Ứng Viên

| HR Kỳ Vọng | Fresher Thực Tế | Gap | Cách InterviewAI Bridge |
|---|---|---|---|
| Trả lời có cấu trúc STAR | Kể lan man, không có mở đầu/kết | Structural gap | Feedback chỉ rõ từng phần thiếu |
| Explain *why*, không chỉ *what* | Chỉ mô tả đã làm gì | Depth gap | Prompt follow-up: "Why did you choose this approach?" |
| Self-awareness về điểm yếu | "Em không có điểm yếu" | Self-awareness gap | Luyện câu hỏi weakness, guide honest answer |
| Quantify impact | "Em đóng góp vào dự án" (không có số) | Specificity gap | Nhắc thêm metrics vào câu trả lời |
| Cultural fit signals | Không biết cần thể hiện gì | Culture gap | Cultural context pack theo company type |

## 6.5 Kế Hoạch Expert Interviews (Pending — Tuần 5)

**Target:** 2–3 người | **Timeline:** 09–15/06/2026 | **Format:** 30–45 phút online/offline

**Recruitment:** LinkedIn outreach, referral từ seniors, mạng lưới BKHN alumni

| Loại | Target | Ưu tiên |
|---|---|---|
| HR/Talent Acquisition | Công ty tech VN (startup hoặc SME) | 1 người |
| Hiring Manager / Tech Lead | Công ty product-led | 1 người |
| HR/Recruiter | MNC (FPT Software, VNG, Samsung R&D) | 1 người |

**Discussion Guide:** Xem [Phụ lục D](#phụ-lục-d----expert-interview-guide).

---

# 7. Tổng hợp insight (Key Findings & Insights)

## 7.1 Top Insights

### 🔍 Insight #1: Fresher VN biết câu hỏi sẽ được hỏi, nhưng không biết câu trả lời có tốt không

**📊 Evidence:**
- VINASA: 70% fresher cần đào tạo bổ sung, bao gồm kỹ năng mềm và phỏng vấn
- Competitive analysis: 0/5 tools hiện tại cung cấp content feedback bằng tiếng Việt
- ChatGPT feedback thường generic: "câu trả lời khá tốt, nên thêm ví dụ" — không actionable

**💡 Implication:** Core value prop của InterviewAI PHẢI là **feedback chất lượng cao trên nội dung** (surgical feedback), không phải question bank.

**🎯 Confidence:** High — dựa trên secondary research + competitive gap rõ ràng

---

### 🔍 Insight #2: Tools hiện tại feedback delivery (cách nói), không feedback content (nội dung)

**📊 Evidence:**
- Yoodli: focus filler words, pacing, tone — không đánh giá nội dung câu trả lời
- BigInterview: AI feedback chỉ trên pace, eye contact, filler words
- Pramp: peer review subjective, không có rubric chuẩn

**💡 Implication:** InterviewAI cần kết hợp cả content feedback (đoạn nào trong câu trả lời yếu) VÀ delivery hints.

**🎯 Confidence:** High — verified qua product testing 5 đối thủ

---

### 🔍 Insight #3: Khoảng trống ngôn ngữ và văn hóa là rào cản thực sự

**📊 Evidence:**
- 0/5 đối thủ hỗ trợ tiếng Việt
- Văn hóa phỏng vấn VN: khiêm tốn vs self-promotion (Western rubric đánh giá thấp ứng viên VN khiêm tốn)
- Cách xưng hô VN (anh/chị/em) ảnh hưởng tone và cấu trúc câu trả lời

**💡 Implication:** Cultural context pack là must-have, không phải nice-to-have. Rubric cần adapt cho VN.

**🎯 Confidence:** Medium — cần validate qua expert interview HR

---

### 🔍 Insight #4: Chi phí AI đã đủ thấp để xây sản phẩm miễn phí cho sinh viên

**📊 Evidence:**
- GPT-4o mini: $0.15/1M input tokens (giảm 200x từ GPT-4 03/2023)
- Ước tính chi phí/phiên (5 câu × ~500 tokens mỗi câu): ~$0.01–$0.05
- 50 users × 5 phiên/tháng = ~$2.5–$12.5/tháng — khả thi cho solo dev

**💡 Implication:** Mô hình "free for students" khả thi về chi phí. Không cần paywall.

**🎯 Confidence:** High — dựa trên pricing công khai của OpenAI

---

### 🔍 Insight #5: Whisper đã hỗ trợ tiếng Việt đủ tốt cho MVP

**📊 Evidence:**
- Whisper Large v3 baseline WER ~10% cho Vietnamese clean audio
- PhoWhisper (fine-tuned bởi VinAI) cải thiện đáng kể
- Voice input tạo trải nghiệm realistic hơn text

**💡 Implication:** Voice input khả thi cho V1 nhưng cần fallback text input. Cần test accent miền Bắc/Nam.

**🎯 Confidence:** Medium — cần pilot test với user thật

---

### 🔍 Insight #6: Không có vòng lặp cải thiện — user fail rồi không biết fix gì

**📊 Evidence:**
- Nhà tuyển dụng VN hiếm khi gửi feedback sau PV (chỉ "rất tiếc, chúng tôi đã chọn ứng viên khác")
- User không có cách so sánh câu trả lời trước vs sau
- Mất tự tin tích lũy → vòng xoáy tiêu cực

**💡 Implication:** InterviewAI cần session history + progress tracking + "improved version" cho mỗi câu trả lời.

**🎯 Confidence:** Medium — cần validate qua user interview

## 7.2 Prioritization Matrix

```
                Impact (Tác động đến user) ↑
                     │
          High │  Insight #1 ⭐⭐⭐    Insight #3 ⭐⭐
                     │  (Surgical feedback)  (Cultural pack)
          Med  │  Insight #5           Insight #6
                     │  (Voice input)        (Progress tracking)
          Low  │  ────┼──────────────────────→
                     │  Low effort            High effort
```

## 7.3 Insights bị invalidate (Failed hypotheses)

| Giả thuyết ban đầu | Trạng thái | Lý do |
|---|---|---|
| H1: Fresher VN thiếu công cụ chất lượng | ✅ Đúng | 0/5 đối thủ hỗ trợ VN; 70% fresher cần training bổ sung |
| H2: Voice input được ưa thích hơn text | ⚠️ Một phần | Voice realistic hơn nhưng nhiều user ngại nói với AI lần đầu. Cần cả hai options. |
| H3: AI feedback được chấp nhận nếu cụ thể | ⚠️ Cần validate | Gen Z VN cởi mở nhưng cần pilot test |
| H4: Văn hóa PV VN khác Western | ⚠️ Cần validate | Secondary research support nhưng cần expert HR confirm |

---

# 8. Định nghĩa vấn đề (Problem Statement)

## 8.1 Problem Statement (Lean UX format)

Sinh viên năm cuối và fresher CNTT tại Việt Nam (như Linh, 22 tuổi, ĐHBKHN) gặp khó khăn nghiêm trọng khi luyện phỏng vấn xin việc vì các phương pháp hiện tại — đọc câu hỏi trên mạng, tự nói trước gương, nhờ bạn bè không chuyên đánh giá, hoặc hỏi ChatGPT — không cung cấp feedback có chất lượng, cụ thể và phù hợp văn hóa Việt Nam. Hậu quả là họ bước vào phỏng vấn thật mà không biết điểm yếu cụ thể của mình, dẫn đến tỷ lệ fail cao và mất tự tin sau những lần thất bại liên tiếp — đặc biệt nghiêm trọng khi 70% fresher CNTT được đánh giá chưa sẵn sàng ngay sau tốt nghiệp (VINASA). Trong khi đó, 100% tools luyện phỏng vấn quốc tế chỉ hỗ trợ tiếng Anh, đánh giá theo rubric Western, và có pricing $25–$150/tháng — vượt xa khả năng chi trả của sinh viên VN. Một giải pháp tốt sẽ cung cấp feedback **cụ thể** (highlight đoạn nào trong câu trả lời có vấn đề), **dựa trên transcript thật** (không generic), **có context văn hóa VN** (không áp đặt rubric Western), và **actionable** (đưa improved version). Chúng ta sẽ biết là thành công khi ≥80% người dùng đánh giá feedback là "cụ thể và hữu ích" qua post-session survey, và activation rate (đăng ký → hoàn thành 1 phiên) đạt ≥60%.

## 8.2 5 Whys (Root Cause Analysis)

**Vấn đề bề mặt:** Fresher VN không tự tin khi đi phỏng vấn

**Why 1:** Tại sao họ không tự tin?
→ Vì họ không biết câu trả lời của mình tốt hay tệ, không có cách tự đánh giá.

**Why 2:** Tại sao không có cách tự đánh giá?
→ Vì không có nguồn feedback chất lượng — bạn bè không chuyên, ChatGPT generic, tools quốc tế bằng tiếng Anh.

**Why 3:** Tại sao không có feedback chất lượng bằng tiếng Việt?
→ Vì chưa có sản phẩm nào target thị trường VN — tất cả 5 đối thủ chỉ English + Western rubric.

**Why 4:** Tại sao chưa ai build cho thị trường VN?
→ Vì trước đây chi phí AI quá cao ($30/1M tokens) và LLM/Voice AI chưa hỗ trợ tiếng Việt đủ tốt.

**Why 5:** Tại sao bây giờ khác?
→ **Root cause đã được giải quyết:** GPT-4o mini giảm giá 200x ($0.15/1M tokens), Whisper hỗ trợ tiếng Việt WER ~10%, và LLM output tiếng Việt đã đủ chất lượng. → Đây là timing window.

## 8.3 "How Might We" Questions

1. **HMW** giúp fresher VN biết câu trả lời của họ tốt ở đâu, yếu ở đâu — bằng tiếng Việt, với feedback cụ thể từng đoạn?
2. **HMW** làm cho feedback AI cảm thấy "có người thật review" thay vì generic template?
3. **HMW** giúp người dùng cải thiện qua nhiều session, thấy rõ progress?
4. **HMW** đưa cultural context VN vào rubric đánh giá mà không stereotype?
5. **HMW** xây sản phẩm miễn phí cho sinh viên mà vẫn bền vững về chi phí?

---

# 9. Cơ hội và định hướng giải pháp

## 9.1 Liệt kê và prioritize cơ hội

| # | Opportunity | Insight nguồn | Impact | Effort | Priority |
|---|---|---|---|---|---|
| O1 | Surgical feedback (highlight cụ thể từng đoạn) | Insight #1, #2 | High | High | ⭐⭐⭐ |
| O2 | Cultural rubric VN/Western | Insight #3 | High | Med | ⭐⭐⭐ |
| O3 | Voice input có transcript | Insight #5 | Med | Med | ⭐⭐ |
| O4 | JD + CV personalization | Insight #1 | High | Med | ⭐⭐⭐ |
| O5 | Session history + progress tracking | Insight #6 | Med | Med | ⭐⭐ |
| O6 | Question bank seed (60 câu VN + EN) | Insight #3 | Low | Low | ⭐ |

## 9.2 Hướng giải pháp khả dĩ

### Hướng A: AI Feedback Web App (chosen)

**Mô tả:** Web app nơi user paste JD, upload CV, chọn câu hỏi hoặc để AI generate, trả lời bằng text/voice, nhận surgical feedback.
**Ưu điểm:** Scalable, on-demand, chi phí thấp, 1 dev có thể build MVP trong 3 tháng.
**Nhược điểm:** Không có yếu tố "người thật", phụ thuộc chất lượng AI.
**Cost/Effort:** ~$10-15/tháng API cost cho 50 users.

### Hướng B: Peer-to-peer matchmaking (như Pramp)

**Mô tả:** Match fresher với nhau để mock interview.
**Ưu điểm:** Realism cao, chi phí AI thấp.
**Nhược điểm:** Cần critical mass user, chất lượng không đảm bảo, khó scale solo dev.

### Hướng C: Human coach marketplace

**Mô tả:** Kết nối user với HR/coach trả phí.
**Ưu điểm:** Chất lượng cao.
**Nhược điểm:** Chi phí cao, 2-sided marketplace khó build, không phù hợp solo dev/3 tháng.

### Hướng D: Mobile app first

**Mô tả:** Native iOS/Android app.
**Ưu điểm:** Voice UX tốt hơn.
**Nhược điểm:** Effort 3x web, out of scope solo dev/3 tháng.

## 9.3 Hướng được chọn

**Hướng A: AI Feedback Web App với Surgical Feedback + Cultural Context Pack.**

**Justification:**
1. **User research:** Pain point #1 là thiếu feedback chất lượng → AI web app giải quyết trực tiếp, on-demand, 24/7.
2. **Feasibility:** 1 dev, 3 tháng, Next.js + Supabase + OpenAI API = stack khả thi. Chi phí ~$10-15/tháng.
3. **Market gap:** 0/5 đối thủ hỗ trợ tiếng Việt + cultural context → clear differentiation.

## 9.4 Design Principles

1. **Vietnamese-first.** Mọi feature default tiếng Việt; English là tùy chọn.
2. **Specific over generic.** Feedback luôn quote transcript cụ thể, không nhận xét chung.
3. **Actionable always.** Mỗi nhận xét phải có "improved version" để user tham khảo.
4. **Free for students.** Không paywall, không freemium. Chi phí tự lo trong scope đồ án.
5. **Cultural intelligence.** Rubric thay đổi theo target company culture (VN vs MNC).
6. **Privacy by default.** Voice không lưu sau khi transcript; transcript opt-in lưu.
7. **Speed > perfection.** P95 latency <5s cho feedback; thà feedback đơn giản nhanh hơn detailed chậm.

## 9.5 Out of Scope (V1)

1. **Live interview copilot** (real-time assist) — ethical concerns, complexity cao
2. **Coding interview** (DSA, system design) — khác domain, cần code editor
3. **Resume builder/optimizer** — out of core scope, có thể V2
4. **Multi-language** ngoài Việt/Anh — scope creep
5. **Mobile native app** — effort 3x, web responsive đủ cho MVP
6. **Gamification** (badges, leaderboard) — nice-to-have, V2
7. **Community features** (forum, peer matching) — cần critical mass
8. **Enterprise/B2B** (cho HR departments) — khác hoàn toàn GTM

---

# 10. Giả định và rủi ro

## 10.1 Assumptions Log

| # | Assumption | Loại | Rủi ro nếu sai | Cách validate | Trạng thái |
|---|---|---|---|---|---|
| A1 | User có microphone hoạt động | Technical | Med | Survey hỏi thiết bị | Pending |
| A2 | User chấp nhận nói tiếng Việt với AI | Behavioral | High | Interview + pilot test | Pending |
| A3 | Whisper hỗ trợ tiếng Việt accent Bắc/Nam đủ tốt | Technical | High | Test 10 mẫu voice | Pending |
| A4 | LLM feedback tiếng Việt đủ chất lượng (cụ thể, actionable) | Technical | Critical | Pilot test 5 user + HR đánh giá | Pending |
| A5 | User thực sự sẽ dùng ≥2 phiên (retention) | Behavioral | High | Beta test 50 user | Pending |
| A6 | Chi phí API duy trì <$15/tháng cho 50 users | Financial | Med | Cost monitoring dashboard | Pending |

## 10.2 Risk Register

### 10.2.1 Product Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| PR1 | User không thấy feedback "cụ thể, hữu ích" | Med | High | Pilot test sớm, iterate prompt engineering |
| PR2 | User adoption thấp (<50 beta) | Med | High | Recruit qua network BKHN, FB groups CNTT |
| PR3 | Feedback AI có bias/sai cultural context | Med | Med | Expert HR review rubric trước launch |

### 10.2.2 Technical Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| TR1 | Whisper accuracy thấp với accent miền | High | Med | Test sớm; fallback text input always available |
| TR2 | LLM cost vượt budget | Med | High | Prompt caching, GPT-4o mini, rate limit/user |
| TR3 | OpenAI API down | Low | High | Retry logic, multi-provider fallback |
| TR4 | Latency >5s gây UX kém | Med | Med | Streaming response, loading skeleton |

### 10.2.3 Market / Adoption Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| MR1 | Đối thủ launch tương tự cho VN trong 3 tháng | Low | Med | Focus VN-specific depth, ship fast |
| MR2 | User dùng ChatGPT trực tiếp thay vì InterviewAI | High | Med | Chứng minh value: surgical > generic |

### 10.2.4 Project Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| RR1 | Solo dev burnout | Med | High | Strict scope, weekly milestone |
| RR2 | Scope creep | High | High | Out-of-scope explicit, design principles guide |
| RR3 | Deadline đồ án miss | Med | High | MVP-first approach, cut features not quality |

## 10.3 Risk Heat Map

```
         Impact ↑
  High │ PR1  TR2  A4    │ RR2
       │ PR2  A5         │
  Med  │ TR1  MR2  PR3   │ RR1
       │ A6              │
  Low  │ TR3  MR1        │
       └──────────────────→ Probability
         Low    Med   High
```

---

# 11. Validation Plan

## 11.1 Success Metrics

### Adoption metrics

| Metric | Target | Cách đo | Tần suất |
|---|---|---|---|
| Số user đăng ký | ≥50 | Supabase Auth count | Daily |
| Phiên trung bình/user | ≥2 | Database aggregate | Weekly |
| Activation rate (đăng ký → 1 phiên) | ≥60% | Funnel analysis | Weekly |

### Engagement metrics

| Metric | Target | Cách đo | Tần suất |
|---|---|---|---|
| Phiên hoàn thành (5/5 câu) | ≥70% | Session status | Weekly |
| Rewrite usage rate | ≥30% | Event tracking | Weekly |
| Return rate (quay lại trong 7 ngày) | ≥40% | Cohort analysis | Weekly |

### Quality metrics

| Metric | Target | Cách đo | Tần suất |
|---|---|---|---|
| Feedback "cụ thể, hữu ích" | ≥80% | Post-session survey 5-point | Per session |
| Thumbs up rate | ≥70% | UI thumbs up/down | Real-time |
| NPS score | ≥40 | Monthly survey | Monthly |

## 11.2 Pivot Criteria

1. **Nếu** "feedback hữu ích" rating <50% sau 2 tuần beta **→** Iterate prompt urgently, expert HR review
2. **Nếu** activation rate <30% **→** UX có vấn đề, simplify onboarding drastically
3. **Nếu** chi phí/phiên >$0.50 **→** Optimize prompt, giảm scope, hoặc switch model
4. **Nếu** Whisper accuracy <80% với tiếng Việt **→** Fallback text-only mode, evaluate PhoWhisper
5. **Nếu** <20 users sau 1 tháng launch **→** Re-evaluate distribution channels

## 11.3 Learning Goals

1. Voice hay text được dùng nhiều hơn trong thực tế?
2. Cultural Pack có thực sự tạo khác biệt cảm nhận được?
3. User thích AI feedback "thẳng thắn" hay "khuyến khích"?
4. Surgical feedback (highlight cụ thể) có perceived value cao hơn summary feedback?
5. User có quay lại luyện nhiều phiên hay chỉ dùng 1 lần?
6. JD/CV personalization có tạo "wow" moment không?
7. Fresher CNTT hay non-tech pivot engage nhiều hơn?

---

# Phụ lục

## Phụ lục A — Tracking Sheet

| Tuần | Hoạt động | Hoàn thành | Note |
|---|---|---|---|
| 1 (05-11/05) | Secondary research, viết discussion guide | [x] | Hoàn thành competitive analysis |
| 2 (12-18/05) | Pilot interview, recruit participant | [ ] | |
| 3-4 (19/05-01/06) | 5-10 interview chính thức | [ ] | |
| 5 (02-08/06) | Survey + Expert interview | [ ] | |
| 6 (09-15/06) | Synthesis, finalize Discovery Doc | [ ] | |

## Phụ lục B — Discussion Guide cho In-depth Interview (Fresher)

**Mục đích:** Thu thập experience thực tế về hành trình chuẩn bị phỏng vấn của fresher CNTT VN.

**Format:** Semi-structured, 45–60 phút | Online (Google Meet) hoặc Offline (ĐHBKHN)

**Ghi âm:** Có (audio only, kèm form consent) | Participant có quyền từ chối ghi âm bất kỳ lúc nào.

---

**Phần 1 — Khởi động (5 phút)**

- B1. Bạn đang ở giai đoạn nào trong việc tìm việc? (đang apply, đã có offer, chưa bắt đầu)
- B2. Kể tóm tắt lần gần nhất bạn tham gia phỏng vấn — bạn chuẩn bị thế nào, cảm giác ra sao?

**Phần 2 — Hành trình luyện tập hiện tại (20 phút)**

- B3. Bạn thường chuẩn bị như thế nào trước một buổi phỏng vấn? (từng bước, từ khi nhận lịch đến ngày hôm đó)
- B4. Điều gì khiến bạn cảm thấy không chắc chắn nhất khi tự luyện?
- B5. Bạn đã dùng công cụ gì để luyện tập? Điều gì hài lòng / không hài lòng?
- B6. Sau khi phỏng vấn xong, bạn thường làm gì? Nhận được feedback từ công ty không?
- B7. Bạn cảm thấy thế nào khi không biết mình trả lời đúng hay sai?

**Phần 3 — Bối cảnh văn hóa Việt Nam (15 phút)**

- B8. Có điều gì về phỏng vấn ở công ty VN vs công ty nước ngoài khiến bạn bối rối không?
- B9. Tiếng Anh ảnh hưởng thế nào đến sự tự tin của bạn trong phỏng vấn?
- B10. Bạn nghĩ "khiêm tốn" ảnh hưởng thế nào đến cách bạn tự giới thiệu bản thân?

**Phần 4 — Thăm dò giải pháp (10 phút)**

- B11. Nếu có tool AI cho feedback cụ thể từng câu trả lời bằng tiếng Việt, bạn sẽ dùng không? Tại sao?
- B12. Bạn sẵn sàng trả bao nhiêu/tháng cho tool luyện phỏng vấn? (WTP probe)

---

## Phụ lục C — Survey Questionnaire (Outline)

**Mục đích:** Validate insights định lượng với mẫu 40–50 người | **Tool:** Google Forms

**Phần 1: Screening & Demographics (5 câu)**
- SC1. Bạn có đang học năm cuối CNTT/tech hoặc là fresher 0–12 tháng kinh nghiệm không? (Screening)
- DM1. Trường/ngành học
- DM2. GPA khoảng (dải: <2.5 / 2.5–3.0 / 3.0–3.5 / >3.5)
- DM3. Vị trí đang/sẽ apply (Dev / BA / PM / QA / Other)
- DM4. Thời gian đã tìm việc (chưa bắt đầu / <1 tháng / 1–3 tháng / >3 tháng)

**Phần 2: Hành vi luyện tập (8 câu)**
- B1. Bạn luyện phỏng vấn bao nhiêu lần/tuần? (Likert)
- B2. Bạn dùng công cụ nào? (Multi-select: ChatGPT, LeetCode, YouTube, Glassdoor, Bạn bè, Khác)
- B3. Bạn có thể tự đánh giá câu trả lời của mình tốt hay không? (1–5)
- B4. Bạn thường luyện tiếng Việt hay tiếng Anh? (Scale)
- B5. Bạn có bạn luyện cùng không? Khó tìm không? (1–5)
- B6–B8. Hành vi sau phỏng vấn: nhận feedback, tự review, bỏ qua

**Phần 3: Validate Pain Points (7 câu — Likert 1–5)**
- VP1–VP7. Tương ứng với P1–P7 từ Section 5.3 — đo lường mức độ đồng ý

**Phần 4: Willingness to Pay (3 câu)**
- WTP1. Bạn có sẵn sàng trả phí cho tool luyện phỏng vấn chất lượng cao không?
- WTP2. Nếu có, bao nhiêu/tháng là hợp lý? (0 / <50k / 50–100k / >100k VNĐ)
- WTP3. Bạn có thích model freemium (miễn phí cơ bản, trả phí tính năng nâng cao) không?

**Phần 5: Product Concept Test (5 câu)**
- CT1–CT5. Mô tả ngắn về InterviewAI, rate attractiveness & likelihood to use (1–5)

---

## Phụ lục D — Expert Interview Guide (HR/Recruiter)

**Mục đích:** Validate cultural rubric, hiểu quan điểm nhà tuyển dụng về fresher VN.

**Format:** Semi-structured, 30–45 phút | Online hoặc Offline

**Target:** 2–3 người (xem mục 6.5 để biết profile cụ thể)

---

**Phần 1 — Bối cảnh (5 phút)**

- E1. Anh/chị có thể giới thiệu về vai trò và kinh nghiệm tuyển dụng của mình?
- E2. Anh/chị thường phỏng vấn bao nhiêu fresher mỗi tháng? Quy trình thế nào?

**Phần 2 — Quan sát về Fresher (15 phút)**

- E3. Điểm yếu phổ biến nhất của fresher CNTT VN khi phỏng vấn là gì? (Probe: kỹ thuật hay soft skills?)
- E4. Những fresher "pass" thường làm gì khác so với những người "fail"?
- E5. Anh/chị đánh giá thế nào khi ứng viên không trả lời được câu hỏi kỹ thuật?
- E6. Yếu tố tiếng Anh ảnh hưởng quyết định của anh/chị như thế nào?

**Phần 3 — Văn hóa & Rubric (10 phút)**

- E7. Anh/chị thấy có sự khác biệt nào giữa cách fresher VN tự giới thiệu so với fresher ở nước ngoài không?
- E8. Công ty có rubric đánh giá fresher chuẩn không, hay tùy vào từng interviewer?
- E9. Anh/chị có bao giờ cho feedback sau phỏng vấn không? Tại sao có/không?

**Phần 4 — Góc nhìn về AI Coaching (10 phút)**

- E10. Nếu ứng viên dùng AI để luyện tập trước khi đến phỏng vấn, anh/chị nghĩ điều đó ảnh hưởng gì?
- E11. Rubric nào anh/chị nghĩ là quan trọng nhất mà fresher VN thường bỏ qua khi chuẩn bị?

---

## Phụ lục E — External Reader Feedback (★ Checklist 14.6)

> ⚠️ **Trạng thái:** Chưa hoàn thành. Đây là mục ★ core criterion của checklist (14.6). Cần thu thập phản hồi từ ít nhất 1 người đọc ngoài team trước khi document được coi là hoàn chỉnh.

### Mục tiêu

Kiểm tra xem người không thuộc team dự án có hiểu được:
1. **Vấn đề là gì** — có thể tóm tắt problem statement trong 1–2 câu không?
2. **Ai là người dùng** — có hình dung được Linh/Hùng/Mai không?
3. **Giải pháp đề xuất là gì** — hiểu được InterviewAI sẽ làm gì?
4. **Tại sao bây giờ** — hiểu được timing window không?

### Tiêu chí chọn người đọc

| Loại | Lý tưởng | Tại sao |
|---|---|---|
| Sinh viên ngành khác (Kinh tế, Luật...) | 1 người | Đại diện "người ngoài ngành CNTT" — test tính dễ hiểu |
| Senior dev / mentor | 1 người | Đánh giá độ chính xác về technical context |
| Giảng viên hướng dẫn | 1 người | Đánh giá về structure và methodology |

### Template Thu Thập Feedback (Sau Khi Đọc Xong)

Nhờ người đọc trả lời 4 câu sau mà **không xem lại document**:

1. Bạn có thể tóm tắt vấn đề mà sản phẩm này giải quyết trong 2 câu không?
2. Ai là người dùng chính? Họ đang gặp khó khăn gì cụ thể?
3. Sản phẩm sẽ làm gì để giải quyết vấn đề đó?
4. Điều gì trong tài liệu khiến bạn bối rối hoặc muốn biết thêm?

### Log Phản Hồi

| Ngày | Người đọc (ẩn danh / role) | Q1 — Tóm tắt vấn đề | Q4 — Điểm bối rối | Đã sửa? |
|---|---|---|---|---|
| *(Chưa có)* | — | — | — | — |

**Deadline đề xuất:** Trước khi finalize Discovery Document → SRS (trước Tuần 6: 23/06/2026)

---

## Phụ lục H — References

1. VINASA (2024). "Đánh giá chất lượng nhân lực CNTT tốt nghiệp". Trích qua Tiền Phong.
2. devhouse.vn (2024). "Số liệu sinh viên CNTT tốt nghiệp hàng năm tại Việt Nam".
3. VnEconomy (2025). "Đề án phát triển nhân lực công nghệ cao 2030-2035". Bộ TT&TT.
4. CareerLink.vn (2025). "Khảo sát mức lương IT 2024-2025".
5. TopDev.vn (2025). "Vietnam IT Market Report".
6. Market.us (2025). "AI Career Coach Market Size & Forecast".
7. Reeracoen Vietnam (2025). "Vietnam Recruitment Trends Post-COVID".
8. VietnamNet, VietnamPlus (2024). "Gen Z Vietnam and AI Attitudes".
9. OpenAI (2024). "API Pricing Updates — GPT-4o mini".
10. Saytowords.com (2024). "Whisper Large v3 Vietnamese WER Benchmark".
11. Reddit r/cscareerquestions, r/jobs (2024-2025). User reviews of Pramp, Final Round AI.
12. UW.edu (2024). "Yoodli AI Speech Coach Review".
13. Grand View Research (2024). "AI in HR Market Analysis".
14. Straits Research (2024). "AI Recruitment Tools Market Report".

---

# ✅ Ready to write SRS? — Checklist cuối

- [x] **1.** Tôi có thể mô tả persona chính trong 30 giây và mỗi đặc điểm có data point ủng hộ (secondary research + competitive analysis)
- [x] **2.** Tôi có Problem Statement cụ thể (7 câu) với metric thành công đo được (≥80% feedback hữu ích, ≥60% activation)
- [x] **3.** Tôi đã liệt kê và rank 6 insights, mỗi insight có evidence (cần bổ sung primary research data)
- [x] **4.** Tôi đã consider 4 hướng giải pháp (Web App, Peer-to-peer, Coach marketplace, Mobile) và justify lựa chọn
- [x] **5.** Tôi đã liệt kê 6 assumptions và risks tường minh, có plan validate critical assumptions
- [x] **6.** Pain points đã được phân tách theo từng vòng phỏng vấn (Section 5.5) và theo chiều tâm lý/imposter syndrome (Section 5.4)
- [x] **7.** Có phân tích hệ sinh thái hỗ trợ VN và lý giải tại sao khoảng trống còn tồn tại (Section 1.4)
- [x] **8.** Có quan điểm nhà tuyển dụng từ secondary research, kế hoạch expert interview, và discussion guide (Section 6 + Phụ lục D)
- [ ] **9.** ★ Đã test với ít nhất 1 người đọc ngoài team và ghi nhận phản hồi (Phụ lục E — **Chưa hoàn thành**)

**Status: 8/9 ✅ — Mục còn lại: Thu thập external reader feedback (Phụ lục E) trước khi finalize.**

> **Các ★ criteria phụ thuộc primary research** (phỏng vấn sâu + survey + expert interview) sẽ được bổ sung sau Tuần 2–5 (12/05–15/06/2026). Xem Ma trận Validation tại Section 2.5 và Known Unknowns tại Section 2.4.1.

---

*Kết thúc Discovery Document — InterviewAI*

*Tài liệu này là tài liệu sống. Sẽ được cập nhật khi có data từ user interview, survey, và expert interview.*

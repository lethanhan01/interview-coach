# Competitive Analysis — Product Deep Dives

Đánh giá chi tiết từng sản phẩm theo 6 chiều framework. Dữ liệu từ Discovery §3.2 + user reviews công khai.

---

## Final Round AI

### Target Audience

Tech professionals (English-speaking) đang trong quá trình job search. Không có Vietnamese support. Không phù hợp fresher thiếu kinh nghiệm vì tool giả định người dùng đã có đủ kiến thức để đánh giá gợi ý AI.

### Core Features

8 tính năng chính:

| Tính năng | Mô tả |
|-----------|-------|
| Live Interview Assistant | Real-time AI suggestions hiển thị trong khi đang phỏng vấn thật. AI nghe transcript và gợi ý key points, STAR examples, industry insights. |
| Resume & JD Context | Upload resume + JD để AI có context. Hỗ trợ 7 fields: Resume, Role, Language, AI Model, Answer Length, Tone, Other Materials. |
| Mock Interview Modes | Practice riêng với AI interviewer — 4 loại phỏng vấn (xem bên dưới). |
| AI Resume Builder | Tạo và tối ưu resume theo JD cụ thể. |
| AI Job Hunter | Tự động tìm kiếm và apply job phù hợp với profile. |
| Stealth Mode | Ẩn overlay AI khỏi screen share — dùng được trong video interview mà interviewer không thấy. |
| Multi-Model Support | Chọn AI model: GPT-4o, Claude, Gemini. |
| Simple Launch & Scheduling | Tạo phiên nhanh, có thể schedule trước. |

### Interview Modes

4 loại phỏng vấn trong Mock Interview:

- **General Interview** — Behavioral + situational questions. AI đóng vai interviewer, hỏi và đánh giá câu trả lời.
- **Coding Copilot** — Hỗ trợ coding interview. Screen-share safe: AI đọc code trên màn hình và gợi ý approach mà không hiển thị solution trực tiếp.
- **HireVue Interview** — Luyện one-way video interview (record câu trả lời, không có interviewer thật). AI đánh giá sau khi xem lại.
- **Phone Interview** — Luyện phỏng vấn qua điện thoại, không có video. AI chỉ dựa vào audio transcript.

### Interview Context Setup

Trước khi bắt đầu phiên, người dùng điền 7 fields:

1. Resume — upload file hoặc paste text
2. Role — vị trí đang apply
3. Language — ngôn ngữ phỏng vấn (English mặc định)
4. AI Model — GPT-4o / Claude / Gemini
5. Answer Length — Short / Medium / Detailed
6. Tone — Professional / Conversational / Formal
7. Other Materials — JD, company info, notes bổ sung

### Live Interview UI

Giao diện 3 màn hình khi dùng Live Interview Assistant:

```
[Interviewer Transcript] | [AI Suggestions] | [Interviewee Transcript]
       (trái)                   (giữa)                 (phải)
```

Panel giữa hiển thị real-time:
- Key points cần đề cập
- Relevant examples từ resume
- STAR framework gợi ý
- Industry insights liên quan

### Mock Interview Flow

**3 nền tảng cốt lõi (theo Final Round AI):**

1. **Realistic Practice** — Câu hỏi được generate từ JD + resume thực tế. AI đóng vai interviewer với persona cụ thể.
2. **Actionable Feedback** — Sau mỗi câu trả lời: điểm mạnh, điểm yếu, sample answer cải thiện, STAR alignment score.
3. **Maximum Impact** — Tập trung vào những câu hỏi có xác suất xuất hiện cao nhất cho role đó.

**Quy trình 3 bước:**
1. Setup context (7 fields) → chọn interview mode
2. Thực hiện phiên (AI hỏi → user trả lời → AI follow-up)
3. Review feedback + sample answers

**Thống kê hiệu quả (theo Final Round AI, self-reported, sau 5 phiên):**
- Stress giảm 80%
- Coherence tăng 200%
- Pass rate tăng 65%

### AI Quality

Có JD + Resume context (upload trước phiên), nhưng trong live mode suggestions vẫn có xu hướng generic — AI phản ứng theo câu hỏi nghe được, không phân tích sâu câu trả lời của user. Mock interview feedback chi tiết hơn: STAR alignment, điểm mạnh/yếu, sample answers. Không có surgical feedback — không highlight đoạn cụ thể trong câu trả lời của user.

### Pricing

$60–$150/tháng tùy gói. Không có free tier thực sự. Refund policy bất lợi cho user.

### UX/Accessibility

- Chrome extension yêu cầu cài đặt thêm
- Chỉ English — không có Vietnamese UI hay Vietnamese interview context
- Không có voice-only mode (cần màn hình để đọc gợi ý)
- Technical issues: latency và glitches trong live interview được báo cáo

### Ethical/Trust

Đây là điểm yếu lớn nhất. Final Round AI được thiết kế để dùng TRONG buổi phỏng vấn thật — nhiều công ty coi đây là gian lận và cấm sử dụng. Stealth Mode là tính năng được marketing rõ ràng để tránh bị phát hiện. User reviews: *"The live copilot feels sketchy"* (Reddit r/jobs). Không phù hợp mục đích học tập vì không giúp người dùng thực sự cải thiện kỹ năng.

### Bài học cho InterviewAI

| Chiều | Final Round AI | InterviewAI |
|-------|---------------|-------------|
| Mục đích | Live cheating tool + practice | Practice only — không hỗ trợ live interview thật |
| Ngôn ngữ | English only | Tiếng Việt + English |
| Cultural rubric | Không có | VN / Western (2 context packs) |
| Surgical feedback | Không có | Có — highlight từng đoạn cụ thể |
| JD context | Có (upload) | Có (paste/upload) |
| Interview Context fields | 7 fields đầy đủ | Hiện tại: JD + context pack + mode + difficulty (4 fields) |
| AI Job Hunter | Có | Không có (ngoài scope v1) |
| Stealth Mode | Có | Không có (không phù hợp mục đích) |
| Multi-model | GPT-4o / Claude / Gemini | GPT-4o (ADR-004, có thể mở rộng v2) |
| Pricing | $60–$150/tháng | Miễn phí |

**Điểm cần xem xét cho InterviewAI v1:**
- Interview Context fields: bổ sung Answer Length và Tone vào session config (hiện chỉ có mode + difficulty) — không cần thay đổi architecture, chỉ thêm fields vào SessionCreateDTO
- Mock interview personas: Final Round AI có persona interviewer cụ thể — InterviewAI có thể bổ sung vào session type spec nếu cần

---

## Pramp (Exponent)

### Target Audience

Software engineers chuẩn bị cho tech interview (coding, system design, behavioral). Được Exponent mua lại 2021. Phù hợp người đã có nền tảng kỹ thuật, muốn luyện với người thật.

### Core Features

- Live peer-to-peer mock interview qua video
- Shared code editor tích hợp cho coding interviews
- Hỗ trợ đa dạng: coding, system design, behavioral, PM
- Cả hai bên đều được luyện (interviewer + interviewee)

### AI Quality

Không có AI feedback — hoàn toàn dựa vào peer review. Chất lượng phụ thuộc vào partner được ghép cặp. User reviews: *"Great for getting reps in, but the quality varies wildly depending on your partner"* (Reddit r/cscareerquestions).

### Pricing

Free với 5 credits/tháng. Phù hợp sinh viên về mặt tài chính, nhưng giới hạn số lần luyện.

### UX/Accessibility

- Cần scheduling — không on-demand
- Chỉ English
- Phụ thuộc vào availability của partner

### Ethical/Trust

Không có vấn đề đạo đức — đây là practice tool hợp lệ.

**Bài học cho InterviewAI:** On-demand + AI feedback sẽ giải quyết 2 điểm yếu lớn nhất của Pramp (scheduling + quality variance).

---

## Yoodli

### Target Audience

General speakers muốn cải thiện kỹ năng giao tiếp và public speaking. Không chuyên về technical interview content.

### Core Features

- Real-time feedback: filler words, pacing, clarity, tone
- AI roleplay với personas khác nhau (behavioral, technical, panel)
- Speech analysis sau mỗi session
- Available 24/7, không cần scheduling

### AI Quality

Tốt cho communication coaching (delivery), yếu về content depth. Feedback tập trung vào "how you say it" hơn "what you say". Không có JD-based questions, không có follow-up contextual. User reviews: *"Good for delivery coaching but won't help you craft better answers"* (Prospeo.io).

### Pricing

Free (5 sessions lifetime) → $8/tháng → $20/tháng. Free tier rất giới hạn.

### UX/Accessibility

- Chỉ English
- Không có cultural context đặc thù
- Interface đơn giản, dễ dùng

### Ethical/Trust

Không có vấn đề đạo đức.

**Bài học cho InterviewAI:** Kết hợp cả delivery feedback (Yoodli's strength) VÀ content feedback (Yoodli's gap) sẽ tạo giá trị vượt trội.

---

## interviewing.io

### Target Audience

Senior engineers nhắm vào FAANG-level companies. Không phù hợp fresher — cả về pricing lẫn level của interviewer.

### Core Features

- Anonymous mock interviews với engineers thật từ Google, Facebook, Amazon, v.v.
- Feedback chi tiết từ người có kinh nghiệm thực tế tại top companies
- Có thể được refer nếu perform tốt

### AI Quality

Không có AI — hoàn toàn human interviewer. Chất lượng feedback cao nhất trong danh sách, nhưng không scalable và rất đắt.

### Pricing

$225–$300/session. Ngoài tầm với hoàn toàn của sinh viên Việt Nam.

### UX/Accessibility

- Không on-demand — cần booking trước
- Chỉ English
- Không phù hợp fresher về cả level lẫn pricing

### Ethical/Trust

Không có vấn đề đạo đức.

**Bài học cho InterviewAI:** Human-quality feedback ở mức giá accessible — đây là khoảng trống mà AI có thể lấp đầy cho fresher VN.

---

Xem ma trận định vị: [03_positioning_matrix.md](03_positioning_matrix.md).

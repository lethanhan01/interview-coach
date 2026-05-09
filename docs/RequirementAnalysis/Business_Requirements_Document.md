# Quy trình nghiệp vụ Interview AI Coach hoàn chỉnh

Dưới đây là quy trình đã được tái cấu trúc với các bổ sung quan trọng

### Phase 1 – Onboarding & Profile Setup

1. User đăng ký/đăng nhập (email, Google, GitHub OAuth).
2. Upload CV (PDF/DOCX) → AI parse tự động: học vấn, dự án, kỹ năng, kinh nghiệm. User có thể chỉnh sửa thủ công.
3. **Khai báo mục tiêu nghề nghiệp**: vị trí mong muốn (Backend/Frontend/Mobile/Data/AI), level mục tiêu (Intern/Fresher/Junior 1y), tech stack chính, ngôn ngữ phỏng vấn ưu tiên.
4. **Bài test định vị (placement test) tùy chọn**: 5–10 câu để đánh giá level hiện tại, hệ thống hiệu chuẩn độ khó cho các session sau.

### Phase 2 – Session Setup (Calibration)

1. User chọn loại session:
   - **HR / Behavioral Interview**
   - **Technical Knowledge Interview**
   - **Live Coding Round** (cần code editor) (optional- tính năng này có thể mở rộng trong tương lai)
   - **System Design Round** (cần drawing canvas) (optional- tính năng này có thể mở rộng trong tương lai)
   - **Mixed Interview** (mô phỏng full vòng) 
   - **Mock Final / Cultural Fit Round** (optional- tính năng này có thể mở rộng trong tương lai)
2. Upload JD (PDF/text/URL) HOẶC chọn từ thư viện công ty có sẵn (FPT, VNG, MoMo, Tiki, banks…). Nếu URL, hệ thống crawl và parse.
3. **Chọn cấp độ độ khó** (Easy / Medium / Hard) và **persona interviewer** (Friendly HR / Neutral Tech Lead / Strict Senior / Senior Manager).
4. Chọn thời lượng (15/30/45/60 phút) và **mode**: Practice (có pause, có hint) / Exam (mô phỏng thật, không pause).
5. Chọn ngôn ngữ: Vietnamese / English / Mixed.
6. **Pre-interview Prep Card** (tùy chọn, 2–3 phút): tóm tắt JD, gợi ý điểm research công ty, gợi ý câu STAR cần chuẩn bị.

### Phase 3 – Question Generation (AI Backend)

1. AI đọc JD + CV + level mục tiêu + loại session, sinh ra **Interview Plan**:
   - Số câu hỏi tối ưu cho thời lượng (tính dựa trên loại câu, ví dụ behavioral 5 phút/câu, coding 15–25 phút/câu).
   - Phân bổ theo competency (ví dụ: 30% behavioral, 40% technical, 20% problem-solving, 10% culture fit).
   - **Sequence theo độ khó tăng dần**: warm-up → core → stretch.
   - Câu hỏi được lấy từ **hybrid source**: 70% từ curated question bank + 30% LLM-generated được CV/JD context hóa.
2. Sinh **rubric** cho từng câu (tiêu chí chấm + mức điểm 1–5 + STAR component nếu là behavioral).
3. Lưu queue câu hỏi + rubric, hiển thị overview ngắn cho user (số câu, các competency sẽ test).

### Phase 4 – Opening Phase (1–2 phút)

1. **Avatar/voice của AI interviewer giới thiệu**: tên, vai trò (theo persona đã chọn), tên công ty đang đại diện, cấu trúc buổi phỏng vấn.
2. **Câu hỏi mở đầu cố định**: "Em hãy tự giới thiệu về bản thân và lý do em ứng tuyển vào vị trí này tại [Tên công ty]".
3. AI phản hồi tự nhiên (không chấm điểm hiển thị, nhưng vẫn lưu để feedback cuối).

### Phase 5 – Main Interview Loop

Với mỗi câu hỏi trong queue:

1. Hiển thị câu hỏi (text + TTS đọc theo persona).
2. Hiển thị timer mềm (đếm ngược nhưng không hard-cut).
3. User chọn input mode tùy câu:
   - Text answer / Voice answer (cho behavioral, technical Q&A).
   - **Code editor** (cho coding question – Python/Java/JS/SQL với syntax highlighting, optional run).
   - **Drawing canvas** (cho system design – Excalidraw-like với shapes + arrows).
4. **Silence detection**: nếu im lặng > 15s, AI nhẹ nhàng prompt ("Em cứ thoải mái suy nghĩ, hoặc cần anh/chị làm rõ câu hỏi không?").
5. Khi user submit / hết giờ mềm:
   - **STAR/Quality check**: AI phân tích câu trả lời có thiếu component nào không.
   - **Adaptive Follow-up trigger** dựa trên rule rõ ràng:
     - Trả lời dùng "we" quá nhiều → đào "Cụ thể em làm gì?"
     - Có claim định lượng đáng nghi → đào "Em đo lường thế nào?"
     - Thiếu Result trong STAR → đào "Kết quả cuối cùng ra sao?"
     - Trả lời chung chung không ví dụ → đào "Cho anh/chị một ví dụ cụ thể"
     - Câu technical trả lời đúng nông → đào sâu (ví dụ trả lời đúng "REST" thì hỏi tiếp về idempotency, status code).
   - Follow-up insert vào đầu queue, tối đa **2 follow-up/câu chính** để tránh sa lầy.
6. **Graceful timeout cảnh báo 30s** trước hết giờ session: "Còn 30 giây, em chốt ý chính nhé".
7. Lưu transcript + audio + metadata (thời gian, filler words, pace).

### Phase 6 – Reverse Question Phase (3–5 phút)

1. AI: "Buổi phỏng vấn đến đây kết thúc. Em có câu hỏi nào dành cho anh/chị không?"
2. User đặt câu hỏi (text/voice).
3. **AI trả lời TRONG VAI công ty** (không phải bot tra cứu) – ngắn gọn, nhân văn.
4. **Đồng thời chấm điểm câu hỏi của user** (insightful / generic / red-flag) – không hiển thị ngay.
5. User có thể đặt 1–3 câu, sau đó AI đóng phần này.

### Phase 7 – Closing

1. AI mô phỏng kết thúc lịch sự: cảm ơn, mô tả next step giả định ("Bên em sẽ phản hồi trong 5–7 ngày qua email"), chào tạm biệt.
2. **Optional**: User tự đánh giá nhanh trước khi xem feedback ("Em cảm thấy buổi phỏng vấn này thế nào? Câu nào em làm tốt nhất / chưa hài lòng nhất?") – để xây metacognition.

### Phase 8 – Comprehensive Feedback Report

Hệ thống tạo báo cáo gồm các phần:

1. **Executive Summary**: tổng điểm, recommendation (Strong Hire / Hire / Borderline / No Hire kèm giải thích đây là điểm mô phỏng).
2. **Per-question Surgical Feedback**:
   - Câu hỏi gốc.
   - Transcript câu trả lời của user (text + audio playback).
   - **STAR breakdown** (cho behavioral): từng component đạt/thiếu.
   - **Technical accuracy** (cho technical): đúng/sai/thiếu sót.
   - Điểm theo rubric + giải thích.
   - **Model answer** (câu trả lời mẫu).
   - Gợi ý cải thiện cụ thể.
3. **Communication Analysis**:
   - Tốc độ nói (WPM) và đánh giá so với chuẩn.
   - Filler words count + ví dụ.
   - Confidence score từ voice analysis.
   - Tỷ lệ thời gian nói vs im lặng.
4. **Competency Heatmap**: điểm từng competency (Problem-solving, Communication, Technical Depth, Behavioral Maturity, Culture Fit…).
5. **Reverse Questions Evaluation**: câu hỏi user đặt được chấm thế nào.
6. **Action Plan** (phần quan trọng nhất):
   - 3–5 việc cần luyện cụ thể trước session sau.
   - Tài liệu/khóa học gợi ý (link tới resource ngoài hoặc nội bộ).
   - Đề xuất topic cho session mock kế tiếp.

### Phase 9 – Long-term Progression

1. **Dashboard cá nhân**: lịch sử session, biểu đồ tiến bộ theo competency theo thời gian.
2. **Replay mode**: xem lại session cũ, đối chiếu feedback.
3. **Streak & gamification** (tùy chọn): khuyến khích luyện đều.
4. **Benchmarking**: so sánh ẩn danh với cohort cùng level (chỉ để motivate, không xếp hạng công khai).
5. **Recommendation engine**: gợi ý JD/loại session để luyện dựa trên điểm yếu.

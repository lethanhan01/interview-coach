# TASK 4.5: CƠ CHẾ HỎI XOÁY THÍCH ỨNG & ĐIỀU PHỐI KỊCH BẢN ĐÀM THOẠI
# (ADAPTIVE FOLLOW-UP PROBING, STAR GAP HEURISTICS, GUARDRAILS & MULTI-TURN SYNTHESIS)

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Conversational AI & Adaptive Probing Logic)  
> **Áp dụng cho**: `server/src/modules/interview-live/`, `ai-service/app/services/interview/probing.py`, vLLM  
> **Tài liệu cha**: [00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. PHÂN TÍCH THIẾT KẾ CŨ & NHỮNG ĐIỂM CHƯA CHẶT CHẼ CẦN KHẮC PHỤC

Ý tưởng về "Hỏi xoáy thích ứng (Adaptive Probing)" trong bản thảo ban đầu rất hấp dẫn nhưng thiếu các rào cản kỹ thuật cốt lõi, dễ dẫn tới **3 lỗi hệ thống nghiêm trọng**:

1. **Bẫy Vòng Lặp Hỏi Xoáy Vô Tận (Endless Probing Trap)**:
   * Nếu ứng viên trả lời yếu hoặc lúng túng, AI nếu không có giới hạn số lần sẽ liên tục hỏi dồn dập các câu hỏi xoáy tiếp theo, khiến ứng viên bị bế tắc tâm lý và phiên phỏng vấn bị "đóng băng" ở một chủ đề duy nhất mà không hoàn thành được các câu hỏi còn lại.
   * *Giải pháp khắc phục*: Thiết lập **Ngân sách Hỏi xoáy Nghiêm ngặt (Strict Probing Budget)**: Tối đa **1 lần** cho cấp độ Junior/Middle và tối đa **2 lần** cho cấp độ Senior/Lead.
2. **Ảo Giác và Lạc Đề (Hallucinated Off-Topic Probing)**:
   * Nếu để LLM tự do sinh câu hỏi phụ, mô hình có xu hướng hỏi lan man ra ngoài phạm vi kỹ năng (ví dụ: đang phỏng vấn về `NodeJS Event Loop` lại hỏi xoáy sang `Thiết kế Phần cứng CPU x86`).
   * *Giải pháp khắc phục*: Ràng buộc câu hỏi xoáy bắt buộc phải neo vào `sfiaSkillCode`, `targetLevel` và các từ khóa kỹ thuật đã nêu trong câu hỏi cha.
3. **Mất Dấu Văn Bản khi Đánh giá Điểm số ở Phase 3**:
   * Khi ứng viên trả lời bổ sung cho câu hỏi xoáy, nếu không có cơ chế nối ghép (stitching) các lượt đàm thoại thành một khối ngữ cảnh hoàn chỉnh, pipeline chấm điểm chuyên sâu ở Phase 3 sẽ chỉ đánh giá câu trả lời đầu tiên và bỏ quên phần giải thích bổ sung quan trọng của ứng viên.

---

## 2. BỘ QUY TẮC PHÁT HIỆN LỖ HỔNG TRẢ LỜI (PROBING TRIGGER HEURISTICS)

Sau khi ứng viên hoàn tất câu trả lời ban đầu, một mô hình phân tích nhanh (sử dụng prompt tối ưu trên vLLM với `max_tokens: 150`) kiểm tra 3 điều kiện kích hoạt:

```mermaid
graph TD
    Ans["Câu trả lời của Ứng viên"] --> CheckCount{"Số lần đã hỏi xoáy<br/>ở câu này < Ngân sách cho phép?"}
    
    CheckCount -->|Đã hết lượt (>= Max Budget)| FinishTurn["BỎ QUA HỎI XOÁY -> Chuyển sang Câu hỏi tiếp theo"]
    CheckCount -->|Còn lượt| EvalAnswers["Phân tích Lỗ hổng Trả lời (Gap Analysis)"]
    
    EvalAnswers --> C1{"1. Thiếu Result/Metric?<br/>(Không có số liệu đo lường cụ thể)"}
    EvalAnswers --> C2{"2. Mật độ Buzzwords quá cao?<br/>(Nêu tên công nghệ nhưng không giải thích cơ chế)"}
    EvalAnswers --> C3{"3. Lảng tránh hoặc quá ngắn?<br/>(Độ dài câu trả lời < 30 từ)"}
    
    C1 -->|Có vi phạm| TriggerProbe["KÍCH HOẠT HỎI XOÁY THÍCH ỨNG (Adaptive Probing)"]
    C2 -->|Có vi phạm| TriggerProbe
    C3 -->|Có vi phạm| TriggerProbe
    
    TriggerProbe --> GenProbe["Sinh câu hỏi xoáy sắc bén, neo chặt vào ngữ cảnh"]
```

---

## 3. PROMPT ĐẶC TẢ HỎI XOÁY CÓ HÀNG RÀO BẢO VỆ (GUARDRAILED PROMPT)

```json
{
  "system": "Bạn là chuyên gia phỏng vấn kỹ thuật cấp cao. Nhiệm vụ của bạn là kiểm tra câu trả lời của ứng viên và quyết định có cần đặt câu hỏi phụ (probing) để làm rõ năng lực thực tế hay không.\n\nQUY TẮC BẮT BUỘC:\n1. CHỈ đặt câu hỏi nếu ứng viên trả lời mơ hồ, chém gió từ khóa (buzzwords) mà không nói rõ cách làm, hoặc thiếu số liệu kết quả.\n2. Câu hỏi phụ PHẢI bám sát kỹ năng mục tiêu: {sfiaSkillCode} cấp độ {targetLevel}.\n3. Độ dài câu hỏi phụ không quá 30 từ. Giọng văn lịch sự, chuyên nghiệp, khích lệ.\n4. Trả về đúng định dạng JSON.",
  "response_format": {
    "type": "json_object"
  }
}
```

### Định dạng Schema JSON Trả về:
```json
{
  "shouldProbe": true,
  "probeReason": "Ứng viên nhắc đến việc tối ưu cơ sở dữ liệu bằng sharding nhưng không giải thích cách chọn shard key.",
  "probingQuestion": "Bạn vừa nhắc đến việc sharding cơ sở dữ liệu. Bạn có thể chia sẻ cụ thể bạn đã chọn tiêu chí nào làm Shard Key và giải quyết vấn đề cross-shard query như thế nào không?"
}
```

---

## 4. HỢP NHẤT HỘI THOẠI ĐA LƯỢT (TRANSCRIPT COMPACTION FOR PHASE 3)

Để Phase 3 có thể chấm điểm công bằng toàn bộ quá trình trả lời của thí sinh, dịch vụ lưu trữ cấu trúc transcript theo định dạng chuẩn:

```
[MAIN_QUESTION]: Thiết kế kiến trúc chịu tải cho hệ thống Notification với 1 triệu người dùng đồng thời.
[CANDIDATE_INITIAL]: Em sẽ dùng Redis Pub/Sub và RabbitMQ để bắn thông báo. Hệ thống xử lý rất nhanh và không bị nghẽn.
[INTERVIEWER_PROBE]: Bạn có thể chia sẻ cụ thể cách hệ thống xử lý khi RabbitMQ consumer bị sập hoặc gặp lỗi trùng thông điệp (duplicate message) không?
[CANDIDATE_FOLLOWUP]: Dạ trong trường hợp đó, em áp dụng mẫu Idempotent Consumer bằng cách lưu messageId vào Redis với TTL 24 giờ. Nếu messageId đã tồn tại, consumer sẽ bỏ qua không gửi thông báo lặp lại.
```

Khi đẩy job vào hàng đợi BullMQ `feedback.processor`, toàn bộ đoạn hội thoại nối ghép này được truyền nguyên vẹn vào `user_answers.transcriptText`, giúp thuật toán bóc tách STAR đánh giá được cả tư duy xử lý tình huống thực tế của ứng viên.

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Tuyệt Đối Tuân Thủ Ngân Sách**: Không bao giờ hỏi quá 1 lần (đối với Junior) hoặc quá 2 lần (đối với Senior) trên một câu hỏi đơn lẻ.
2. **Thời Gian Sinh Câu Hỏi Phụ Siêu Tốc**: Từ lúc ứng viên dứt lời trả lời ban đầu đến khi AI bắt đầu cất giọng hỏi xoáy $< 900\text{ ms}$ (Latency tổng từ vLLM $\to$ Kokoro TTS).
3. **Độ Chuẩn Xác Ngữ Nghĩa**: $100\%$ các câu hỏi xoáy sinh ra phải liên quan trực tiếp đến nội dung ứng viên vừa trình bày, không phát sinh câu hỏi lệch chủ đề.

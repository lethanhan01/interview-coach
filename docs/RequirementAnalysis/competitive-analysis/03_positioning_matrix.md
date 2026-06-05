# Competitive Analysis — Positioning Matrix

## Ma trận định vị

5 sản phẩm × 8 tiêu chí. Yes = có đầy đủ, Partial = có nhưng hạn chế, No = không có.

| Tiêu chí | Final Round AI | Pramp | Yoodli | interviewing.io | InterviewAI |
|----------|---------------|-------|--------|----------------|-------------|
| Vietnamese language | No | No | No | No | Yes |
| JD-based questions | Partial | No | No | No | Yes |
| AI follow-up contextual | No | No | No | No | Yes |
| Surgical feedback | No | No | No | No | Yes |
| Voice input | Yes | Yes (video) | Yes | Yes (video) | Yes |
| Cultural rubric VN/Western | No | No | No | No | Yes |
| Pricing < $10/tháng | No | Yes (free) | Partial ($8) | No | Yes (free) |
| On-demand (không cần schedule) | Yes | No | Yes | No | Yes |

Ghi chú:
- Final Round AI "JD-based": có resume builder nhưng câu hỏi không được generate từ JD cụ thể
- Yoodli "Pricing < $10": gói $8/tháng có nhưng free tier chỉ 5 sessions lifetime
- Pramp "Voice": peer video call, không phải AI voice analysis

## Gap Analysis

6 gaps thị trường mà InterviewAI lấp đầy (nguồn: Discovery §3.2.3):

1. **Language gap** — 0/4 đối thủ hỗ trợ tiếng Việt. Fresher VN với English trung bình không thể tận dụng hiệu quả các tool hiện có.

2. **Cultural gap** — 100% rubric đánh giá theo Western culture. VN có đặc thù: khiêm tốn vs self-promotion, cách xưng hô, cấu trúc câu trả lời khác biệt.

3. **Affordability gap** — Tools chất lượng đều paywall $20–$300. Sinh viên VN (0–5 triệu/tháng) không đủ khả năng chi trả.

4. **Content feedback gap** — Yoodli chỉ feedback delivery; Pramp chỉ peer review; Final Round AI generic. Chưa ai cung cấp surgical feedback — highlight cụ thể đoạn nào trong câu trả lời có vấn đề.

5. **Personalization gap** — Đa số không personalize theo JD + CV cụ thể. Câu hỏi và feedback generic cho mọi user.

6. **Accessibility gap** — Không có sản phẩm nào vừa free, vừa on-demand, vừa không cần scheduling.

## Differentiation Statement

Nguồn: Discovery §3.2.4 (positioning statement đã được validate trong SRS §1.2).

InterviewAI là công cụ AI Mock Interview duy nhất được thiết kế cho fresher CNTT Việt Nam: hỗ trợ tiếng Việt, miễn phí hoàn toàn, và cung cấp surgical feedback — highlight từng đoạn cụ thể trong câu trả lời kèm gợi ý cải thiện. Khác với Final Round AI (cheating tool, $60–$150/tháng) và Pramp (cần scheduling, không có AI), InterviewAI tập trung vào việc giúp người dùng thực sự cải thiện kỹ năng thông qua luyện tập on-demand với rubric phù hợp văn hóa phỏng vấn Việt Nam.

# Requirement Traceability Matrix (RTM)
## AI Interview Coach System — InterviewAI

---

| Thuộc tính | Giá trị |
|---|---|
| Tài liệu nguồn | [SRS_InterviewAI_Full.md](SRS_InterviewAI_Full.md) |
| Phiên bản tương ứng | SRS v1.6 |
| Ngày cập nhật | 06/05/2026 |
| Trạng thái | Draft |

---

# 1. Ma trận truy vết Use Case → NFR

Ma trận này liên kết các Use Case chức năng trong SRS với yêu cầu phi chức năng liên quan và Acceptance Criteria chính. Các ràng buộc vận hành AI chi tiết như token budget, chi phí, RPM, alert và fallback-rate được quản lý trong [SAD v1.0](../SAD/SAD_InterviewAI_v1.0.md), không còn là một nhóm NFR riêng trong SRS.

| Nhóm chức năng | Use Case | NFR liên quan | Tài liệu liên quan | Acceptance Criteria chính |
|---|---|---|---|---|
| Xác thực và phân quyền | UC-01 | S-01, S-02, S-03, S-13, R-01 | Không áp dụng | AC-01-1..AC-01-5 |
| Hồ sơ và CV | UC-02 | P-10, P-19, S-08, S-09, S-14, R-05 | SAD 4 (data retention) | AC-02-1..AC-02-4 |
| Tạo phiên và chọn context | UC-03, UC-03b | P-09, P-18, P-20, U-02, U-06, S-09, S-12, SC-03, AS-01, AS-04 | SAD 2.2.2, SAD 2.3.1, SAD 2.4.1 | AC-03-1..AC-03-5, AC-03b-1..AC-03b-3 |
| Phỏng vấn AI | UC-04 | P-03, P-04, P-06, P-08, P-16, P-17, U-06, U-10, R-04, R-05, S-04, S-07, S-10, S-11, AS-02, AS-03, Q-01, Q-06 | SAD 2.2.3, SAD 2.2.4, SAD 2.3.2, SAD 2.3.3 | AC-04-1..AC-04-9 |
| Sinh Surgical Feedback | UC-05 | P-06, R-06, R-08, M-03, S-04, S-10, S-11, AS-02, Q-02, Q-03, Q-05 | SAD 2.2.4, SAD 2.3.3, SAD 2.4 | AC-05-1..AC-05-7 |
| Hiển thị feedback chi tiết | UC-06 | U-03, U-08, U-09, U-12, P-01, S-04, Q-03, Q-07 | SAD 2.3.3 | AC-06-1..AC-06-5 |
| Rewrite và so sánh tiến bộ | UC-07 | P-07, P-21, U-04, U-11, S-04, Q-04, Q-07 | SAD 2.2.5, SAD 2.3.4, SAD 2.4.1 | AC-07-1..AC-07-8 |
| Lịch sử phiên | UC-08 | P-01, P-02, R-01, R-08, S-04 | SAD 4 (retention policy) | AC-08-1..AC-08-3 |
| Quản trị người dùng | UC-09 | S-03, M-03, R-01 | Không áp dụng | AC-09-1..AC-09-3 |
| Quản trị Question Bank | UC-10 | M-05, SC-03, SC-05, R-01 | SAD 2.3.1, SAD 2.4.1 | AC-10-1..AC-10-3 |
| An toàn nội dung AI | UC-03, UC-04, UC-05 | AS-01, AS-02, AS-03, AS-04, AS-05, AS-06 | SAD 2.4 | AC-03-2, AC-04-1..AC-04-4, AC-04-9, AC-05-4, AC-05-7 |
| Chất lượng AI output | UC-04, UC-05, UC-06, UC-07 | Q-01, Q-02, Q-03, Q-04, Q-05, Q-06, Q-07 | SAD 2.3, SAD 2.5 | AC-04-3, AC-04-8, AC-05-2, AC-05-6, AC-07-2, AC-07-7, AC-07-8 |
| Hạ tầng bảo mật | (Cross-cutting) | S-05, S-06 | SAD 2.5 | Network tab audit; tất cả requests dùng HTTPS trên staging/prod |

---

# 2. Ma trận truy vết Discovery Insight → SRS Requirement

Success metrics, pivot criteria và design principles là nội dung của Discovery Document/Product Strategy. Bảng dưới đây chỉ truy vết các insight đã chuyển hóa thành yêu cầu hệ thống trong SRS.

| DD Insight | Mô tả ngắn | Nguồn DD | UC/NFR tương ứng trong SRS | Ghi chú |
|---|---|---|---|---|
| I1: Thiếu feedback chất lượng | Fresher biết câu hỏi sẽ được hỏi, nhưng không biết câu trả lời có tốt không | DD §7.1 #1 | UC-05, UC-06, Q-02, Q-03 | Chuyển hóa thành Surgical Feedback và Annotated Transcript. |
| I2: Tools chỉ feedback delivery, không content | Một số công cụ chỉ tập trung delivery/filler words, chưa đánh giá nội dung câu trả lời | DD §7.1 #2 | UC-05, UC-06, Q-02, Q-03, Q-06 | Voice metrics chỉ là thông tin hỗ trợ, không thay thế đánh giá nội dung. |
| I3: Khoảng trống ngôn ngữ và văn hóa | Người dùng Việt Nam cần luyện phỏng vấn theo ngôn ngữ/văn hóa phù hợp | DD §7.1 #3 | UC-03b, UC-04, UC-05, G7, Q-01, Q-03 | Context Pack là yêu cầu chức năng chính. |
| I4: Chi phí AI đã hạ | Chi phí AI tạo điều kiện triển khai prototype | DD §7.1 #4 | Không truy vết vào SRS chính | Chi phí/token budget chuyển sang SAD và Discovery/Product Plan. |
| I5: Whisper hỗ trợ tiếng Việt đủ tốt | Voice input tiếng Việt có thể khả thi trong điều kiện audio sạch | DD §7.1 #5 | UC-04, P-04, P-16, P-17 | Text input là fallback bắt buộc khi STT thất bại. |
| I6: Không có vòng lặp cải thiện | User cần biết sửa câu trả lời như thế nào sau feedback | DD §7.1 #6 | UC-07, UC-08, Q-04, Q-07 | Rewrite & Compare tạo vòng lặp cải thiện sau feedback. |

---

# 3. Ghi chú duy trì

- Khi thêm/sửa/xóa Use Case trong SRS, cập nhật Section 1 của RTM.
- Khi đổi mã NFR trong Chương 4 của SRS, cập nhật toàn bộ tham chiếu NFR trong RTM.
- Các mã hoặc bảng liên quan vận hành AI chi tiết không đặt trong SRS; tham chiếu SAD khi cần truy vết kỹ thuật.

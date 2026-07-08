# Chương 5. Kết Quả Thu Được Và Đánh Giá

## 5.1 Môi Trường Thực Nghiệm Và Đánh Giá

> Cần bổ sung: mô tả môi trường chạy sản phẩm khi đánh giá.

| Hạng mục | Cấu hình/Phiên bản | Ghi chú |
| --- | --- | --- |
| Hệ điều hành | Cần bổ sung | Cần bổ sung |
| Node.js/npm | Cần bổ sung | Cần bổ sung |
| Backend | NestJS, port mặc định | Cần bổ sung |
| Frontend | Next.js, port mặc định | Cần bổ sung |
| Database | Supabase/PostgreSQL | Cần bổ sung |
| Redis | Docker Compose/local | Cần bổ sung |
| AI provider | OpenAI API | Cần bổ sung |

## 5.2 Kết Quả Chức Năng Đạt Được Trong GR1

> Cần bổ sung: tổng hợp ảnh chụp các chức năng đã hoàn thành. Cần đối chiếu code/demo thực tế, không chỉ dựa vào thiết kế.

| Chức năng | Kết quả hiện tại | Minh chứng | Đánh giá |
| --- | --- | --- | --- |
| Profile | Cần bổ sung | Ảnh/API/test | Cần bổ sung |
| Session setup | Cần bổ sung | Ảnh/API/test | Cần bổ sung |
| Question generation | Cần bổ sung | Log/API/demo | Cần bổ sung |
| Interview turn | Cần bổ sung | Ảnh/API/test | Cần bổ sung |
| Feedback/report | Cần bổ sung | Ảnh/API/test | Cần bổ sung |
| SSE/loading state | Cần bổ sung | Demo/log | Cần bổ sung |
| Fallback AI | Cần bổ sung | Test/log | Cần bổ sung |

## 5.3 Giao Diện Sản Phẩm

> Cần bổ sung: chèn ảnh màn hình và mô tả ngắn gọn từng màn hình.

Danh sách hình gợi ý:

- Hình 5.1: Trang giới thiệu/landing.
- Hình 5.2: Trang đăng nhập hoặc callback/auth state.
- Hình 5.3: Trang hồ sơ người dùng.
- Hình 5.4: Trang cấu hình phiên phỏng vấn.
- Hình 5.5: Trang danh sách/chi tiết session.
- Hình 5.6: Trang phỏng vấn và nhập câu trả lời.
- Hình 5.7: Trang báo cáo feedback.
- Hình 5.8: Trạng thái loading/error/fallback nếu có.

## 5.4 Kịch Bản Vận Hành Minh Họa

> Cần bổ sung: mô tả một happy path từ đầu đến cuối.

Kịch bản gợi ý:

1. Người dùng đăng nhập vào hệ thống.
2. Người dùng cập nhật hồ sơ/ngôn ngữ/vị trí mục tiêu.
3. Người dùng nhập JD và chọn loại phỏng vấn.
4. Hệ thống tạo session và sinh câu hỏi.
5. Người dùng trả lời từng câu.
6. Hệ thống sinh feedback/report.
7. Người dùng xem nội dung câu trả lời, điểm/nhận xét/action plan.

| Bước | Hành động | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- |
| 1 | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| 2 | Cần bổ sung | Cần bổ sung | Cần bổ sung |



## 5.12 Hạn Chế Của Sản Phẩm GR1

> Cần bổ sung: nêu rõ hạn chế một cách thẳng thắn.

Gợi ý hạn chế:

- Chất lượng AI phụ thuộc vào provider và prompt.
- Chưa đánh giá với số lượng lớn người dùng thực.
- Một số tính năng như rewrite, progress dashboard, reverse questions, admin có thể chưa hoàn thiện.
- Chưa phát triển tính năng trả lời bằng giọng nói, phiên âm hoặc phân tích cách trình bày.
- Triển khai local/prototype, chưa tối ưu production.
- Chi phí/hạn mức API ảnh hưởng khả năng demo liên tục.

## 5.14 Tổng Kết Chương

> Cần bổ sung: tóm tắt kết quả đạt được, mức độ đáp ứng mục tiêu GR1 và những nội dung sẽ tiếp tục phát triển.

---

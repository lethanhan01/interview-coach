# BÁO CÁO ĐỒ ÁN GR1

# Đề tài: InterviewAI - Hệ thống AI Mock Interview Coach cho sinh viên CNTT Việt Nam

> Ghi chú sử dụng khung: các đoạn bắt đầu bằng `Cần bổ sung:` là ghi chú nội dung cần viết sau này. Khi hoàn thiện báo cáo, thay các ghi chú này bằng nội dung văn phong học thuật, số liệu, hình ảnh, bảng biểu và trích dẫn phù hợp.

> Nguồn tài liệu nội bộ nên đối chiếu khi viết báo cáo: `docs/RequirementAnalysis/discovery-docs/Discovery_Document.md`, `docs/RequirementAnalysis/competitive-analysis/competitive_analysis.md`, `docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md`, `docs/Design/MVP_Scope.md`, `docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md`, `docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md`, `docs/Design/DetailedDesign/database-design/Database.md`, `docs/Design/DetailedDesign/api-design/API_design.md`, `docs/Design/DetailedDesign/uiux-design/UIUX_design.md`, `docs/Design/DetailedDesign/lld/LLD_design.md`, `docs/test-plan/strategy.md`, `README.md`, `server/README.md`, `client/README.md`, `CHANGELOG.md`.

---

## Thông Tin Chung

| Mục | Nội dung |
| --- | --- |
| Tên đề tài | InterviewAI - Hệ thống AI Mock Interview Coach cho sinh viên CNTT Việt Nam |
| Học phần | Đồ án GR1 |
| Sinh viên thực hiện | Cần bổ sung: họ tên, MSSV, lớp |
| Giảng viên hướng dẫn | Cần bổ sung: họ tên, học hàm/học vị nếu có |
| Đơn vị đào tạo | Cần bổ sung: khoa/viện/trường |
| Thời gian thực hiện | Cần bổ sung: học kỳ, năm học |

---

## Lời Cam Đoan

> Cần bổ sung: cam kết công trình do sinh viên thực hiện, các tài liệu tham khảo được trích dẫn đầy đủ, không sao chép kết quả của người khác. Nếu có sử dụng công cụ AI hỗ trợ trong quá trình phát triển hoặc viết tài liệu, cần nêu rõ phạm vi sử dụng theo quy định của đơn vị đào tạo.

## Lời Cảm Ơn

> Cần bổ sung: lời cảm ơn giảng viên hướng dẫn, thầy cô, bạn bè, người tham gia khảo sát/thử nghiệm, các nguồn tài liệu và cộng đồng hỗ trợ.

## Tóm Tắt

> Cần bổ sung: tóm tắt 250-400 từ về bài toán, đối tượng người dùng, cách tiếp cận, sản phẩm GR1 đã xây dựng, kết quả chính và hướng phát triển. Nên viết sau cùng khi các chương đã hoàn thiện.

Từ khóa gợi ý: AI mock interview, luyện phỏng vấn, fresher CNTT, surgical feedback, large language model, speech-to-text, Next.js, NestJS, Supabase, Prisma, BullMQ, Redis.

## Abstract

> Cần bổ sung: bản tóm tắt tiếng Anh tương ứng với mục `Tóm tắt`. Nếu nhà trường không yêu cầu abstract tiếng Anh, có thể bỏ mục này.

## Mục Lục

> Cần bổ sung: cập nhật tự động sau khi hoàn thiện nội dung nếu chuyển sang Word/LaTeX/PDF. Nếu giữ Markdown, có thể sinh mục lục bằng công cụ Markdown TOC.

## Danh Mục Hình Vẽ

> Cần bổ sung: danh sách các hình sẽ chèn vào báo cáo, ví dụ: sơ đồ tổng quan hệ thống, C4 context/container, luồng tạo phiên phỏng vấn, ERD, ảnh màn hình giao diện.

## Danh Mục Bảng

> Cần bổ sung: danh sách các bảng, ví dụ: bảng so sánh sản phẩm, bảng yêu cầu chức năng, bảng công nghệ sử dụng, bảng API, bảng kết quả kiểm thử.

## Danh Mục Từ Viết Tắt Và Thuật Ngữ

| Thuật ngữ | Ý nghĩa | Ghi chú |
| --- | --- | --- |
| AI | Artificial Intelligence | Trí tuệ nhân tạo |
| LLM | Large Language Model | Mô hình ngôn ngữ lớn |
| STT | Speech-to-Text | Chuyển giọng nói thành văn bản |
| TTS | Text-to-Speech | Chuyển văn bản thành giọng nói, nếu có sử dụng |
| JD | Job Description | Mô tả công việc |
| CV | Curriculum Vitae | Hồ sơ ứng viên |
| MVP | Minimum Viable Product | Sản phẩm khả dụng tối thiểu |
| SRS | Software Requirements Specification | Đặc tả yêu cầu phần mềm |
| HLD | High-Level Design | Thiết kế cấp cao |
| LLD | Low-Level Design | Thiết kế chi tiết |
| API | Application Programming Interface | Giao diện lập trình ứng dụng |
| SSE | Server-Sent Events | Cơ chế đẩy sự kiện từ server về client |
| ORM | Object-Relational Mapping | Ánh xạ đối tượng - quan hệ |
| PII | Personally Identifiable Information | Dữ liệu định danh cá nhân |

> Cần bổ sung: chuẩn hóa theo `docs/glossary.md` và các thuật ngữ xuất hiện thực sự trong báo cáo.

---






# Kết Luận Và Hướng Phát Triển

## 6.1 Kết Luận Chung

> Cần bổ sung: tổng kết ngắn gọn bài toán, cách tiếp cận và kết quả chính của GR1. Nên khẳng định theo đúng mức độ đã làm: đã xây dựng prototype/nền tảng/luồng chính, không nói quá mức là sản phẩm production-ready nếu chưa có bằng chứng.

## 6.2 Đóng Góp Chính Của Đề Tài

> Cần bổ sung: liệt kê các đóng góp về nghiên cứu bài toán, thiết kế hệ thống và sản phẩm.

Gợi ý:

- Tổng hợp bài toán luyện phỏng vấn cho sinh viên/fresher CNTT Việt Nam.
- Phân tích sản phẩm liên quan và xác định khoảng trống.
- Đề xuất thiết kế InterviewAI với workflow JD -> interview -> surgical feedback.
- Xây dựng prototype web app với frontend, backend, database, AI pipeline.
- Thiết lập tài liệu yêu cầu/thiết kế/kiểm thử làm nền tảng cho giai đoạn sau.

## 6.3 Hạn Chế Còn Tồn Tại

> Cần bổ sung: rút gọn từ mục 5.12, chỉ giữ các hạn chế quan trọng nhất.

## 6.4 Hướng Phát Triển Trong GR2 Và Đồ Án Tốt Nghiệp

> Cần bổ sung: nêu các hướng phát triển có thứ tự ưu tiên.

Gợi ý:

1. Hoàn thiện và ổn định luồng phỏng vấn end-to-end.
2. Nâng cao chất lượng question bank và rubric cho từng loại session.
3. Bổ sung/hoàn thiện voice analysis, transcription và delivery feedback.
4. Phát triển rewrite & compare, reverse questions, progress dashboard.
5. Bổ sung admin/question bank management nếu cần.
6. Cải thiện bảo mật, quyền riêng tư và rate limiting.
7. Triển khai staging/production và quan sát hệ thống.
8. Thực hiện pilot với người dùng thực và đánh giá chất lượng feedback.

## 6.5 Kế Hoạch Công Việc Tiếp Theo

> Cần bổ sung: lập bảng task thực tế cho giai đoạn kế tiếp.

| Ưu tiên | Công việc | Kết quả mong đợi | Thời gian dự kiến |
| --- | --- | --- | --- |
| Cao | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Trung bình | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Thấp | Cần bổ sung | Cần bổ sung | Cần bổ sung |

---

# Tài Liệu Tham Khảo

> Cần bổ sung: trích dẫn theo chuẩn nhà trường yêu cầu, ví dụ IEEE/APA. Tách nguồn nội bộ và nguồn ngoài nếu cần.

## Tài Liệu Nội Bộ Của Dự Án

1. `docs/RequirementAnalysis/discovery-docs/Discovery_Document.md` - Cần bổ sung mô tả/cách trích dẫn.
2. `docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md` - Cần bổ sung mô tả/cách trích dẫn.
3. `docs/RequirementAnalysis/competitive-analysis/competitive_analysis.md` - Cần bổ sung mô tả/cách trích dẫn.
4. `docs/Design/MVP_Scope.md` - Cần bổ sung mô tả/cách trích dẫn.
5. `docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md` - Cần bổ sung mô tả/cách trích dẫn.
6. `docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md` - Cần bổ sung mô tả/cách trích dẫn.
7. `docs/Design/DetailedDesign/database-design/Database.md` - Cần bổ sung mô tả/cách trích dẫn.
8. `docs/Design/DetailedDesign/api-design/API_design.md` - Cần bổ sung mô tả/cách trích dẫn.
9. `docs/Design/DetailedDesign/uiux-design/UIUX_design.md` - Cần bổ sung mô tả/cách trích dẫn.
10. `docs/test-plan/strategy.md` - Cần bổ sung mô tả/cách trích dẫn.

## Tài Liệu Ngoài

> Cần bổ sung: các báo cáo thị trường, tài liệu về HR-tech, tài liệu OpenAI/Whisper, tài liệu Next.js/NestJS/Prisma/Supabase/BullMQ/Redis, bài viết hoặc paper liên quan. Chỉ đưa vào những nguồn đã đọc và có trích dẫn trong báo cáo.

| STT | Tài liệu | Loại nguồn | Dùng ở mục nào | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| 2 | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |

---

# Phụ Lục

## Phụ Lục A. Bảng Yêu Cầu Chức Năng Và Phi Chức Năng

> Cần bổ sung: đưa bảng yêu cầu đầy đủ hơn nếu Chương 4 chỉ trình bày rút gọn.

## Phụ Lục B. Ma Trận Truy Vết Yêu Cầu

> Cần bổ sung: mapping giữa use case, user story, API/module, test case và trạng thái thực hiện. Có thể đưa từ `docs/RequirementAnalysis/SRS/RTM_InterviewAI.md`.

## Phụ Lục C. Thiết Kế Cơ Sở Dữ Liệu

> Cần bổ sung: ERD kích thước lớn, danh sách bảng/cột/ràng buộc nếu quá dài để đưa vào Chương 4.

## Phụ Lục D. Đặc Tả API

> Cần bổ sung: bảng API chi tiết hơn, request/response mẫu cho các endpoint chính. Có thể rút gọn từ `docs/Design/DetailedDesign/api-design/`.

## Phụ Lục E. Prompt Và Output Schema AI

> Cần bổ sung: prompt template rút gọn, output schema, ví dụ response hợp lệ. Không đưa API key, token hoặc dữ liệu nhạy cảm.

## Phụ Lục F. Test Case Và Kết Quả Kiểm Thử

> Cần bổ sung: danh sách test case, test data, kết quả pass/fail, ảnh chụp màn hình test report nếu có.

## Phụ Lục G. Hướng Dẫn Cài Đặt Và Chạy Demo

> Cần bổ sung: phiên bản rút gọn của runbook: yêu cầu môi trường, cấu hình biến môi trường, chạy Redis/backend/frontend, kiểm tra health, các lỗi thường gặp.

## Phụ Lục H. Ảnh Màn Hình Giao Diện

> Cần bổ sung: tập hợp screenshot kích thước lớn nếu Chương 5 chỉ chèn một số hình tiêu biểu.

## Phụ Lục I. Nhật Ký Phát Triển

> Cần bổ sung: tóm tắt milestone, thay đổi quan trọng, lỗi lớn đã xử lý, bài học theo từng giai đoạn. Có thể đối chiếu `CHANGELOG.md`.

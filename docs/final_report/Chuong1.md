# Chương 1. Đặt Vấn Đề

## 1.1 Giới Thiệu Đề Tài

> Cần bổ sung: giới thiệu ngắn gọn về InterviewAI. Nêu rõ đây là ứng dụng web hỗ trợ sinh viên năm cuối và fresher CNTT luyện phỏng vấn thông qua mô phỏng phiên phỏng vấn, nhận câu hỏi theo JD/ngữ cảnh, trả lời bằng text/voice và nhận feedback chi tiết.

Nội dung nên có:

- Tên đề tài và phạm vi GR1.
- Vấn đề trung tâm: người học biết câu hỏi phỏng vấn nhưng khó tự đánh giá chất lượng câu trả lời.
- Giá trị mong muốn: luyện tập on-demand, có feedback cụ thể, phù hợp bối cảnh sinh viên CNTT Việt Nam.

## 1.2 Bối Cảnh Bài Toán

> Cần bổ sung: trình bày bối cảnh thị trường lao động CNTT, áp lực cạnh tranh của sinh viên/fresher, xu hướng phỏng vấn online và nhu cầu luyện tập phỏng vấn có phản hồi chất lượng.

Gợi ý nội dung:

- Nhu cầu việc làm và năng lực phỏng vấn của sinh viên/fresher CNTT.
- Hạn chế của các cách luyện tập hiện tại: tự đọc câu hỏi, tự nói trước gương, hỏi bạn bè, dùng chatbot chung chung.
- Ranh giới bài toán: không giải quyết toàn bộ quá trình tìm việc, tập trung vào kỹ năng trả lời phỏng vấn và nhận feedback.

Nguồn nên đối chiếu: `docs/RequirementAnalysis/discovery-docs/Discovery_Document.md`, `docs/RequirementAnalysis/Business_Requirements_Document.md`.

## 1.3 Bối Cảnh Nghiên Cứu Và Công Nghệ

> Cần bổ sung: trình bày xu hướng phát triển khoa học công nghệ liên quan: AI trong HR-tech, LLM, speech-to-text, hệ thống feedback tự động, ứng dụng web thời gian thực/gần thời gian thực.

Gợi ý nội dung:

- Sự phát triển của mô hình ngôn ngữ lớn trong việc phân tích văn bản và sinh feedback.
- Khả năng nhận dạng giọng nói tiếng Việt và ứng dụng trong luyện phỏng vấn.
- Xu hướng cá nhân hóa học tập/luyện tập bằng AI.
- Các thách thức: độ tin cậy của AI, hallucination, bảo mật dữ liệu cá nhân, chi phí API, chất lượng feedback.

## 1.4 Tính Cấp Thiết Và Ý Nghĩa Thực Tiễn

> Cần bổ sung: giải thích vì sao bài toán quan trọng và có ý nghĩa, gắn với nhóm người dùng mục tiêu là sinh viên năm cuối/fresher CNTT Việt Nam.

Nội dung nên có:

- Lợi ích với sinh viên: luyện tập thường xuyên, nhận phản hồi cụ thể, giảm lo lắng khi phỏng vấn.
- Lợi ích với cơ sở đào tạo: có công cụ hỗ trợ kỹ năng nghề nghiệp.
- Lợi ích với nhà tuyển dụng: ứng viên có khả năng trình bày câu trả lời cấu trúc và rõ ràng hơn.
- Ý nghĩa kỹ thuật: kết hợp web app, AI pipeline, hàng đợi xử lý bất đồng bộ và đánh giá feedback.

## 1.5 Khoảng Trống Hiện Tại Và Tính Mới Của Đề Tài

> Cần bổ sung: nêu những khoảng trống mà các sản phẩm hiện có chưa đáp ứng tốt, từ đó làm rõ điểm mới hoặc điểm khác biệt của đề tài trong phạm vi GR1.

Gợi ý điểm khác biệt:

- Vietnamese-first: hỗ trợ người dùng Việt Nam và ngữ cảnh phỏng vấn Việt Nam.
- Feedback theo nội dung câu trả lời, không chỉ đánh giá tốc độ nói/filler words.
- Surgical feedback: highlight đoạn câu trả lời cần cải thiện và đưa gợi ý cụ thể.
- On-demand: người dùng có thể luyện mà không cần sắp lịch với mentor/peer.
- Có context pack và question bank để hỗ trợ khi AI bị lỗi hoặc hết quota.

Nguồn nên đối chiếu: `docs/RequirementAnalysis/competitive-analysis/competitive_analysis.md`, `docs/RequirementAnalysis/competitive-analysis/03_positioning_matrix.md`.

## 1.6 Lý Do Chọn Đề Tài

> Cần bổ sung: viết theo góc nhìn cá nhân của sinh viên. Trình bày mong muốn theo đuổi đề tài, mối liên hệ với ngành học, động lực giải quyết một vấn đề thực tế cho sinh viên CNTT, và mong muốn rèn luyện năng lực xây dựng hệ thống web/AI hoàn chỉnh.

Lưu ý:

- Tránh viết quá cảm tính hoặc chung chung.
- Không khẳng định sản phẩm đã giải quyết triệt để mọi vấn đề khi GR1 mới ở mức prototype/MVP.

## 1.7 Mục Tiêu Của Đề Tài

### 1.7.1 Mục Tiêu Tổng Quát

> Cần bổ sung: một câu mục tiêu tổng quát, ví dụ xây dựng prototype ứng dụng web InterviewAI hỗ trợ sinh viên CNTT luyện phỏng vấn và nhận feedback chi tiết dựa trên câu trả lời.

### 1.7.2 Mục Tiêu Cụ Thể Trong GR1

> Cần bổ sung: liệt kê 4-7 mục tiêu cụ thể, có thể đo được.

Gợi ý:

- Khảo sát nhu cầu người dùng và các sản phẩm liên quan.
- Phân tích yêu cầu và xác định phạm vi MVP/GR1.
- Thiết kế kiến trúc tổng thể, cơ sở dữ liệu, API và luồng AI pipeline.
- Xây dựng prototype gồm các luồng cốt lõi: cấu hình phiên, sinh câu hỏi, trả lời, feedback/báo cáo.
- Thiết lập kiểm thử cơ bản cho backend/frontend và kiểm tra vận hành local.
- Đánh giá hạn chế và đề xuất hướng phát triển cho GR2/Đồ án tốt nghiệp.

## 1.8 Nhiệm Vụ Nghiên Cứu Và Triển Khai

> Cần bổ sung: chuyển mục tiêu thành các nhiệm vụ có thể thực hiện.

Gợi ý nhóm nhiệm vụ:

1. Nghiên cứu bài toán và người dùng.
2. Khảo sát sản phẩm/cách tiếp cận liên quan.
3. Nghiên cứu cơ sở lý thuyết về phỏng vấn, feedback, LLM, STT và thiết kế web app.
4. Phân tích yêu cầu chức năng/phi chức năng.
5. Thiết kế kiến trúc và cơ sở dữ liệu.
6. Triển khai backend, frontend và tích hợp AI.
7. Kiểm thử, đánh giá và tổng hợp kết quả.

## 1.9 Đối Tượng Và Phạm Vi Nghiên Cứu

### 1.9.1 Đối Tượng Người Dùng

> Cần bổ sung: mô tả nhóm người dùng mục tiêu: sinh viên năm cuối CNTT, fresher 0-12 tháng kinh nghiệm, người cần luyện phỏng vấn HR/technical/mixed.

### 1.9.2 Đối Tượng Nghiên Cứu Kỹ Thuật

> Cần bổ sung: nêu các thành phần kỹ thuật được nghiên cứu: ứng dụng web, backend API, cơ sở dữ liệu, AI pipeline, question generation, feedback generation, SSE, job queue.

### 1.9.3 Phạm Vi Trong GR1

> Cần bổ sung: xác định các chức năng nằm trong GR1. Nên đối chiếu `docs/Design/MVP_Scope.md` và code hiện tại.

Gợi ý phạm vi:

- Hồ sơ người dùng cơ bản.
- Cấu hình phiên phỏng vấn từ JD, loại session và context pack.
- Sinh danh sách câu hỏi phỏng vấn.
- Trả lời câu hỏi bằng text/voice tùy theo khả năng hiện có.
- Tạo feedback và báo cáo tổng hợp.
- Giao diện luồng chính và kiểm thử cơ bản.

### 1.9.4 Ngoài Phạm Vi Trong GR1

> Cần bổ sung: nêu rõ các phần để sang GR2/Đồ án tốt nghiệp để báo cáo có ranh giới rõ ràng.

Gợi ý ngoài phạm vi:

- Live coding editor hoàn chỉnh.
- System design canvas.
- Marketplace mentor/peer interview.
- Mobile native app.
- Analytics/gamification đầy đủ.
- Pilot với số lượng lớn người dùng.

## 1.10 Phương Pháp Thực Hiện

> Cần bổ sung: trình bày phương pháp nghiên cứu và phát triển.

Gợi ý:

- Nghiên cứu tài liệu và secondary research.
- Khảo sát sản phẩm tương tự và phân tích đối thủ.
- Phân tích yêu cầu theo use case/user story.
- Thiết kế hệ thống theo kiến trúc module.
- Phát triển lặp: backend, frontend, tích hợp AI, kiểm thử.
- Đánh giá prototype bằng test case, smoke test, quan sát giao diện và một số ví dụ kết quả AI.

## 1.11 Lộ Trình GR1 - GR2 - Đồ Án Tốt Nghiệp

> Cần bổ sung: mô tả lộ trình dự kiến, không cần quá chi tiết. Mục đích là cho thấy GR1 là bước nền tảng hướng tới đồ án tốt nghiệp.

| Giai đoạn | Mục tiêu chính | Kết quả dự kiến |
| --- | --- | --- |
| GR1 | Xác định bài toán, khảo sát, thiết kế và xây dựng prototype cốt lõi | Tài liệu yêu cầu/thực tế/thiết kế, prototype luồng phỏng vấn và feedback cơ bản |
| GR2 | Hoàn thiện tính năng, nâng cao chất lượng AI, bổ sung kiểm thử và trải nghiệm người dùng | Sản phẩm ổn định hơn, báo cáo đánh giá sâu hơn, có demo đầy đủ |
| Đồ án tốt nghiệp | Hoàn chỉnh hệ thống, đánh giá với người dùng thực tế, tối ưu triển khai và bảo mật | Hệ thống hoàn thiện, kết quả thực nghiệm, tài liệu vận hành và báo cáo bảo vệ |

## 1.12 Bố Cục Báo Cáo

> Cần bổ sung: tóm tắt nội dung từng chương sau khi các chương đã ổn định.

Gợi ý:

- Chương 1 đặt vấn đề, mục tiêu, phạm vi và lộ trình.
- Chương 2 trình bày khảo sát thực tế, sản phẩm liên quan và yêu cầu rút ra.
- Chương 3 trình bày cơ sở lý thuyết và công nghệ nền tảng.
- Chương 4 trình bày phân tích, thiết kế và cách xây dựng sản phẩm GR1.
- Chương 5 trình bày kết quả, kiểm thử, đánh giá, hạn chế.
- Phần kết luận tổng hợp đóng góp và hướng phát triển.

---
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

# Chương 2. Khảo Sát Thực Tế Và Các Nghiên Cứu Liên Quan

## 2.1 Mục Tiêu Khảo Sát

> Cần bổ sung: nêu mục tiêu khảo sát là hiểu nhu cầu luyện phỏng vấn của sinh viên/fresher CNTT, đánh giá cách các sản phẩm hiện có giải quyết bài toán, và rút ra yêu cầu cho InterviewAI.

## 2.2 Phương Pháp Khảo Sát

> Cần bổ sung: mô tả các phương pháp đã/dự kiến sử dụng.

| Phương pháp | Mục đích | Đối tượng/nguồn | Kết quả cần rút ra |
| --- | --- | --- | --- |
| Secondary research | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Competitive analysis | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| User interview/survey | Cần bổ sung nếu có | Cần bổ sung | Cần bổ sung |

## 2.3 Khảo Sát Người Dùng Mục Tiêu

### 2.3.1 Chân Dung Người Dùng

> Cần bổ sung: trình bày 1-3 persona chính, ví dụ sinh viên năm cuối CNTT, fresher đã tìm việc vài tháng, người pivot sang tech.

| Persona | Bối cảnh | Mục tiêu | Khó khăn chính | Nhu cầu với hệ thống |
| --- | --- | --- | --- | --- |
| Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |

Nguồn nên đối chiếu: `docs/RequirementAnalysis/discovery-docs/Discovery_Document.md`.

### 2.3.2 Hành Trình Luyện Phỏng Vấn Hiện Tại

> Cần bổ sung: mô tả current journey từ lúc người dùng tìm JD, đọc câu hỏi mẫu, tập trả lời, nhận feedback, đi phỏng vấn thật. Đánh dấu các pain point.

Hình gợi ý:

- Hình 2.x: Current-state journey của sinh viên/fresher khi luyện phỏng vấn.
- Hình 2.y: Future-state journey khi sử dụng InterviewAI.

### 2.3.3 Các Khó Khăn Và Nhu Cầu Chính

> Cần bổ sung: tổng hợp pain point thành các nhóm.

Gợi ý:

- Thiếu feedback có chuyên môn.
- Không biết câu trả lời thiếu cấu trúc hay thiếu ví dụ.
- Khó luyện phỏng vấn bằng tiếng Việt với rubric phù hợp.
- Chi phí cao hoặc cần sắp lịch với người khác.
- Thiếu công cụ theo dõi tiến bộ sau mỗi lần luyện tập.

## 2.4 Khảo Sát Quy Trình Phỏng Vấn Fresher CNTT

> Cần bổ sung: trình bày các dạng phỏng vấn thường gặp và tiêu chí đánh giá ứng viên fresher.

Nội dung nên có:

- Các vòng phỏng vấn: HR, technical, mixed/cultural fit.
- Các dạng câu hỏi: tự giới thiệu, hành vi/STAR, kiến thức nền tảng, giải quyết vấn đề, câu hỏi về dự án.
- Tiêu chí đánh giá: độ rõ ràng, cấu trúc, tính chính xác kỹ thuật, khả năng giao tiếp, phù hợp văn hóa, thái độ học hỏi.

## 2.5 Khảo Sát Các Hệ Thống, Sản Phẩm Liên Quan

> Cần bổ sung: giới thiệu ngắn gọn các sản phẩm/cách tiếp cận đã khảo sát.

Các sản phẩm gợi ý:

- Final Round AI.
- Pramp/Exponent.
- Yoodli.
- interviewing.io.
- Các nền tảng/lớp coaching trong nước nếu có.
- ChatGPT hoặc chatbot tổng quát như một baseline cách người dùng tự học.

Nguồn nên đối chiếu: `docs/RequirementAnalysis/competitive-analysis/01_overview.md`, `02_product_deep_dives.md`, `03_positioning_matrix.md`.

## 2.6 Tiêu Chí So Sánh

> Cần bổ sung: nêu bộ tiêu chí dùng để so sánh sản phẩm. Tiêu chí nên gắn với quyết định thiết kế InterviewAI.

| Tiêu chí | Ý nghĩa với bài toán | Cách đánh giá |
| --- | --- | --- |
| Hỗ trợ tiếng Việt | Cần bổ sung | Có/không, chất lượng hỗ trợ |
| On-demand | Cần bổ sung | Có cần sắp lịch hay không |
| Feedback nội dung | Cần bổ sung | Có đánh giá câu trả lời hay chỉ delivery |
| Feedback cụ thể theo đoạn | Cần bổ sung | Có highlight/annotation hay không |
| Cá nhân hóa theo JD/CV | Cần bổ sung | Có dùng context người dùng hay không |
| Chi phí | Cần bổ sung | Phù hợp sinh viên hay không |
| Đạo đức sử dụng | Cần bổ sung | Luyện tập hay hỗ trợ gian lận trong phỏng vấn thật |
| Bảo mật dữ liệu | Cần bổ sung | Có công bố chính sách/kiểm soát dữ liệu hay không |

## 2.7 Đánh Giá Từng Sản Phẩm Tiêu Biểu

### 2.7.1 Final Round AI

> Cần bổ sung: tóm tắt đối tượng người dùng, tính năng chính, ưu điểm, hạn chế, bài học cho InterviewAI. Chú ý phân biệt giữa công cụ luyện tập và công cụ hỗ trợ real-time trong phỏng vấn thật.

### 2.7.2 Pramp/Exponent

> Cần bổ sung: tóm tắt mô hình peer-to-peer mock interview, ưu điểm về thực hành với người thật, hạn chế về scheduling và độ ổn định chất lượng feedback.

### 2.7.3 Yoodli

> Cần bổ sung: tóm tắt điểm mạnh về delivery/speech coaching, hạn chế về feedback nội dung câu trả lời phỏng vấn technical/HR.

### 2.7.4 interviewing.io

> Cần bổ sung: tóm tắt chất lượng phỏng vấn với engineer thật, hạn chế về chi phí và tính phù hợp với sinh viên/fresher Việt Nam.

### 2.7.5 Chatbot Tổng Quát Và Cách Tự Học Hiện Nay

> Cần bổ sung: đánh giá việc dùng ChatGPT/chatbot tổng quát để tự tạo câu hỏi và xin feedback. Ưu điểm là linh hoạt, hạn chế là thiếu quy trình, thiếu rubric, thiếu lưu vết tiến bộ và feedback có thể chung chung.

## 2.8 Ma Trận So Sánh Và Định Vị Sản Phẩm

> Cần bổ sung: đưa bảng so sánh tổng hợp. Có thể rút gọn từ tài liệu competitive analysis.

| Sản phẩm | Đối tượng | Tiếng Việt | On-demand | Feedback nội dung | Feedback theo đoạn | Chi phí | Nhận xét |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Final Round AI | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Pramp | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Yoodli | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| interviewing.io | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| InterviewAI | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |

Hình gợi ý:

- Hình 2.x: Ma trận định vị theo hai trục `mức độ cá nhân hóa/nội dung` và `khả năng tiếp cận với sinh viên Việt Nam`.

## 2.9 Kết Luận Khảo Sát Và Yêu Cầu Rút Ra

> Cần bổ sung: kết nối khảo sát với quyết định sản phẩm. Phần này là cầu nối sang yêu cầu và thiết kế.

Gợi ý kết luận:

- Sản phẩm cần hỗ trợ tiếng Việt và ngữ cảnh phỏng vấn Việt Nam.
- Cần có workflow luyện phỏng vấn rõ ràng từ JD -> câu hỏi -> trả lời -> feedback.
- Feedback cần cụ thể, có rubric, có giải thích và gợi ý hành động.
- Cần có cơ chế fallback khi AI lỗi/hết quota để prototype vẫn dùng được.
- Cần bảo vệ dữ liệu người dùng và hạn chế lưu trữ PII không cần thiết.

## 2.10 Phạm Vi Tính Năng Cơ Bản Cho GR1 Sau Khảo Sát

> Cần bổ sung: liệt kê phạm vi GR1 đã chọn sau khi khảo sát.

| Nhóm tính năng | Trong GR1 | Để sau GR1 | Lý do |
| --- | --- | --- | --- |
| Hồ sơ người dùng | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Cấu hình phiên phỏng vấn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Sinh câu hỏi | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Trả lời text/voice | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Feedback/báo cáo | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Rewrite & Compare | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Progress dashboard | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Admin/question bank | Cần bổ sung | Cần bổ sung | Cần bổ sung |

---

# Chương 3. Cơ Sở Lý Thuyết Và Công Nghệ Nền Tảng

## 3.1 Tổng Quan Bài Toán AI Mock Interview Coach

> Cần bổ sung: mô tả hệ thống AI mock interview coach dưới góc nhìn chức năng và kỹ thuật.

Gợi ý:

- Input: hồ sơ người dùng, JD, cấu hình session, câu trả lời text/voice.
- Processing: sinh câu hỏi, đánh giá câu trả lời, tạo follow-up, tạo feedback và report.
- Output: danh sách câu hỏi, feedback theo câu, report tổng hợp, action plan.

## 3.2 Cơ Sở Lý Thuyết Về Phỏng Vấn Tuyển Dụng

### 3.2.1 Các Loại Phỏng Vấn Trong Tuyển Dụng CNTT

> Cần bổ sung: phỏng vấn HR/behavioral, technical knowledge, mixed interview, coding/system design nếu chỉ nêu như hướng phát triển.

### 3.2.2 Tiêu Chí Đánh Giá Ứng Viên Fresher

> Cần bổ sung: các nhóm năng lực như communication, problem-solving, technical depth, behavioral maturity, culture fit.

### 3.2.3 Phương Pháp STAR Và Cấu Trúc Câu Trả Lời

> Cần bổ sung: giải thích STAR (Situation, Task, Action, Result) và vai trò trong feedback behavioral. Nếu có dùng rubric riêng, đưa vào phụ lục.

## 3.3 Xử Lý Ngôn Ngữ Tự Nhiên Và Mô Hình Ngôn Ngữ Lớn

### 3.3.1 Khái Niệm LLM Và Ứng Dụng Trong Phân Tích Câu Trả Lời

> Cần bổ sung: mô tả khả năng của LLM trong hiểu ngữ cảnh, sinh câu hỏi, phân tích câu trả lời và tạo gợi ý cải thiện.

### 3.3.2 Prompt Engineering

> Cần bổ sung: trình bày vai trò của system prompt, task instruction, context, output schema, few-shot nếu có. Đối chiếu `server/src/ai/prompts/`.

### 3.3.3 Structured Output Và Kiểm Soát Kết Quả AI

> Cần bổ sung: giải thích vì sao cần schema validation, JSON output, Zod validator, fallback khi output không hợp lệ.

## 3.4 Speech-to-Text Và Phân Tích Câu Trả Lời Bằng Giọng Nói

> Cần bổ sung: trình bày cơ sở STT, vai trò của Whisper/OpenAI transcription nếu hệ thống có dùng, các chỉ số có thể khai thác như thời lượng, tốc độ nói, khoảng lặng, filler words.

Lưu ý:

- Nếu GR1 chưa hoàn thiện tất cả voice metrics, ghi rõ phạm vi đã thực hiện và phần để phát triển.
- Nếu demo bằng text là chính, không nên khẳng định voice analysis đã đầy đủ.

## 3.5 Feedback Tự Động Và Surgical Feedback

> Cần bổ sung: trình bày khái niệm feedback chi tiết theo từng câu trả lời, annotated transcript, highlight mức tốt/cảnh báo/nghiêm trọng, model answer và action plan.

| Thành phần feedback | Ý nghĩa | Dữ liệu đầu vào | Đầu ra mong đợi |
| --- | --- | --- | --- |
| Điểm tổng | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Nhận xét theo rubric | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Annotated segment | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Model answer | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Action plan | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 3.6 Kiến Trúc Ứng Dụng Web Hiện Đại

### 3.6.1 Frontend Với Next.js Và React

> Cần bổ sung: lý do chọn Next.js/React/TypeScript, routing, server/client component nếu cần, quản lý giao diện và gọi API.

### 3.6.2 Backend Với NestJS

> Cần bổ sung: lý do chọn NestJS, kiến trúc module/controller/service, dependency injection, validation pipe, exception filter.

### 3.6.3 REST API Và Server-Sent Events

> Cần bổ sung: phân biệt REST cho request/response và SSE cho cập nhật trạng thái phiên/report. Đối chiếu `docs/Design/DetailedDesign/api-design/API_design.md`.

## 3.7 Xử Lý Bất Đồng Bộ Với Hàng Đợi

> Cần bổ sung: trình bày vì sao các tác vụ AI cần xử lý bất đồng bộ: sinh câu hỏi, feedback, report có thể mất thời gian và cần retry/fallback. Giới thiệu Redis và BullMQ trong hệ thống.

## 3.8 Cơ Sở Dữ Liệu Và ORM

> Cần bổ sung: trình bày PostgreSQL/Supabase, Prisma ORM, schema, relation, migration/db push, seed data/question bank.

Nội dung nên có:

- Các nhóm bảng chính: users/profile, sessions/questions/answers, feedback/report, ai quality log.
- Quan hệ quan trọng: session - questions - answers - feedback - annotated segments.
- Lý do cần question bank fallback.

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/database-design/Database.md` và `server/prisma/schema.prisma`.

## 3.9 Xác Thực, Bảo Mật Và Quyền Riêng Tư

> Cần bổ sung: trình bày các nguyên tắc bảo mật áp dụng cho hệ thống: JWT/Supabase Auth, validation input, rate limiting, bảo vệ PII, không lưu dữ liệu nhạy cảm không cần thiết, phân quyền truy cập dữ liệu.

## 3.10 Kiểm Thử Và Đánh Giá Chất Lượng Phần Mềm

> Cần bổ sung: trình bày các cấp kiểm thử cần có: unit, integration, e2e, smoke test, AI output schema test, manual review. Đối chiếu `docs/test-plan/strategy.md`.

## 3.11 Công Nghệ Và Công Cụ Sử Dụng

> Cần bổ sung: cập nhật chính xác theo `client/package.json`, `server/package.json` và tài liệu thiết kế.

| Nhóm | Công nghệ/công cụ | Vai trò trong dự án | Lý do lựa chọn |
| --- | --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Cần bổ sung | Cần bổ sung |
| UI | Tailwind CSS, lucide-react | Cần bổ sung | Cần bổ sung |
| Backend | NestJS, TypeScript | Cần bổ sung | Cần bổ sung |
| Cơ sở dữ liệu | PostgreSQL/Supabase | Cần bổ sung | Cần bổ sung |
| ORM | Prisma | Cần bổ sung | Cần bổ sung |
| AI | OpenAI API, prompt pipeline | Cần bổ sung | Cần bổ sung |
| Queue/SSE | BullMQ, Redis, SSE | Cần bổ sung | Cần bổ sung |
| Kiểm thử | Jest, Playwright, Supertest | Cần bổ sung | Cần bổ sung |
| DevOps/local | Docker Compose, npm scripts | Cần bổ sung | Cần bổ sung |

## 3.12 Tổng Kết Chương

> Cần bổ sung: tóm tắt các lý thuyết và công nghệ nền tảng đã chọn, đóng vai trò làm cơ sở cho phần thiết kế và xây dựng ở Chương 4.

---

# Chương 4. Phân Tích, Thiết Kế Và Xây Dựng Sản Phẩm GR1

## 4.1 Giới Thiệu Sản Phẩm GR1

> Cần bổ sung: giới thiệu prototype InterviewAI trong GR1: mục tiêu, người dùng, luồng chính, giá trị cốt lõi và kết quả có thể demo.

Luồng chính gợi ý:

1. Người dùng khai báo hồ sơ/cấu hình cơ bản.
2. Người dùng nhập JD và cấu hình session.
3. Hệ thống sinh câu hỏi phỏng vấn.
4. Người dùng trả lời từng câu.
5. Hệ thống sinh feedback/report.
6. Người dùng xem nhận xét và action plan.

## 4.2 Đối Tượng Sử Dụng Và Kịch Bản Sử Dụng

> Cần bổ sung: nêu role của hệ thống, tối thiểu có Candidate. Nếu có Admin trong thiết kế nhưng chưa trong GR1, ghi rõ trạng thái.

| Tác nhân | Mô tả | Kịch bản chính | Trạng thái trong GR1 |
| --- | --- | --- | --- |
| Candidate | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Admin | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| AI Engine | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.3 Yêu Cầu Chức Năng Trong GR1

> Cần bổ sung: rút gọn từ SRS và MVP scope. Chỉ giữ các yêu cầu thực sự liên quan GR1.

| Mã yêu cầu | Tên yêu cầu | Mô tả ngắn | Độ ưu tiên | Trạng thái GR1 |
| --- | --- | --- | --- | --- |
| FR-01 | Quản lý hồ sơ cơ bản | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-02 | Cấu hình phiên phỏng vấn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-03 | Sinh câu hỏi phỏng vấn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-04 | Trả lời câu hỏi | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-05 | Sinh feedback | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-06 | Xem báo cáo | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| FR-07 | Lưu lịch sử phiên | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.4 Yêu Cầu Phi Chức Năng

> Cần bổ sung: nêu các yêu cầu về hiệu năng, bảo mật, khả dụng, khả bảo trì, chất lượng AI, an toàn nội dung.

| Nhóm NFR | Yêu cầu | Cách đáp ứng trong GR1 | Cách đánh giá |
| --- | --- | --- | --- |
| Hiệu năng | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Bảo mật | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Độ tin cậy | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Bảo trì | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Chất lượng AI | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Riêng tư dữ liệu | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.5 Phạm Vi MVP/GR1 Và Các Chức Năng Để Sau

> Cần bổ sung: đưa bảng IN/OUT để tránh báo cáo mở rộng quá mức đã làm. Nên đối chiếu `docs/Design/MVP_Scope.md`, code hiện tại trong `client/` và `server/`.

| Hạng mục | Trong GR1 | Để GR2/Đồ án tốt nghiệp | Ghi chú |
| --- | --- | --- | --- |
| Session setup | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Question generation | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Interview turn | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Feedback/report | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Voice recording/transcription | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Reverse questions | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Rewrite & Compare | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Progress dashboard | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 4.6 Kiến Trúc Tổng Thể Hệ Thống

> Cần bổ sung: trình bày kiến trúc ở mức cao. Nên có hình C4 context/container hoặc sơ đồ frontend - backend - database - Redis - AI provider.

Hình cần bổ sung:

- Hình 4.1: Kiến trúc tổng thể InterviewAI.
- Hình 4.2: C4 Container Diagram.

Nội dung cần nêu:

- Client Next.js giao tiếp với backend qua `/api/v1`.
- Backend NestJS gồm các module nghiệp vụ.
- Prisma giao tiếp PostgreSQL/Supabase.
- BullMQ/Redis xử lý job AI bất đồng bộ và phát sự kiện SSE.
- OpenAI API được gọi qua gateway/processor có fallback.

## 4.7 Thiết Kế Module Backend

> Cần bổ sung: mô tả các module backend hiện có và trách nhiệm.

| Module | Thành phần chính | Trách nhiệm | Tệp code liên quan |
| --- | --- | --- | --- |
| AuthModule | Cần bổ sung | Cần bổ sung | `server/src/auth/` |
| UserModule/Profile | Cần bổ sung | Cần bổ sung | `server/src/user/` |
| SessionModule | Cần bổ sung | Cần bổ sung | `server/src/session/` |
| TurnModule | Cần bổ sung | Cần bổ sung | `server/src/turn/` |
| AIModule | Cần bổ sung | Cần bổ sung | `server/src/ai/` |
| ReportModule | Cần bổ sung | Cần bổ sung | `server/src/report/` |
| HealthModule | Cần bổ sung | Cần bổ sung | `server/src/health/` |
| SavedJobDescriptionModule | Cần bổ sung | Cần bổ sung | `server/src/saved-job-description/` |

## 4.8 Thiết Kế Giao Diện Frontend

> Cần bổ sung: mô tả các route/page/component chính. Nên có ảnh màn hình sau khi demo ổn định.

| Route | Mục đích | Component chính | Trạng thái GR1 |
| --- | --- | --- | --- |
| `/` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/login` hoặc auth callback | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/profile` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/setup` hoặc `/sessions/new` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions/[id]` | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| `/sessions/[id]/report` | Cần bổ sung | Cần bổ sung | Cần bổ sung |

Nội dung nên có:

- Nguyên tắc UI/UX.
- Luồng thao tác của người dùng.
- Trạng thái loading/error/empty.
- Responsive nếu có.

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/uiux-design/` và `client/app/`, `client/components/`.

## 4.9 Thiết Kế Cơ Sở Dữ Liệu

> Cần bổ sung: mô tả schema thực tế và các nhóm bảng chính. Nên chèn ERD.

| Nhóm bảng | Bảng | Vai trò |
| --- | --- | --- |
| Lookup/question | `context_packs`, `question_bank`, `question_usage` | Cần bổ sung |
| User/profile | `users`, `user_profiles`, `resume` nếu dùng | Cần bổ sung |
| Session | `interview_sessions`, `saved_job_descriptions`, `session_questions` | Cần bổ sung |
| Answer | `user_answers`, `follow_up_questions` | Cần bổ sung |
| Feedback/report | `ai_feedbacks`, `annotated_segments`, report JSON fields | Cần bổ sung |
| Audit | `ai_quality_log` | Cần bổ sung |

Nội dung cần nêu:

- Quan hệ giữa session, câu hỏi, câu trả lời và feedback.
- Các ràng buộc quan trọng: unique answer theo session/question, cascade delete, soft delete nếu có.
- Các điểm khác biệt giữa thiết kế ban đầu và schema thực tế nếu báo cáo cần minh bạch.

Nguồn nên đối chiếu: `server/prisma/schema.prisma` và `docs/Design/DetailedDesign/database-design/Database.md`.

## 4.10 Thiết Kế API

> Cần bổ sung: tổng hợp các API backend expose, không cần chép đầy đủ request/response nếu đã có phụ lục.

| Nhóm API | Endpoint tiêu biểu | Chức năng | Ghi chú |
| --- | --- | --- | --- |
| Health | `GET /api/v1/health` | Cần bổ sung | Cần bổ sung |
| Auth | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | Cần bổ sung | Cần bổ sung |
| Profile | `GET/PATCH /api/v1/profile` | Cần bổ sung | Cần bổ sung |
| Session | `POST/GET /api/v1/sessions` | Cần bổ sung | Cần bổ sung |
| Session events | `GET /api/v1/sessions/:id/events` | Cần bổ sung | SSE |
| Turn/answer | `POST /api/v1/sessions/:sessionId/turns` | Cần bổ sung | Cần bổ sung |
| Report | `GET /api/v1/sessions/:sessionId/report` | Cần bổ sung | Cần bổ sung |
| Saved JD | `GET/POST /api/v1/saved-job-descriptions` | Cần bổ sung | Cần bổ sung |

Nguồn nên đối chiếu: `docs/Design/DetailedDesign/api-design/API_design.md`, `server/src/*/*.controller.ts`.

## 4.11 Thiết Kế AI Pipeline

> Cần bổ sung: mô tả pipeline AI của hệ thống. Đây là phần trọng tâm kỹ thuật của đề tài.

### 4.11.1 Question Generation

> Cần bổ sung: mô tả cách hệ thống tạo câu hỏi từ JD, loại session, context pack, question bank/fallback.

### 4.11.2 Follow-up Generation

> Cần bổ sung: nếu có implement, mô tả điều kiện tạo câu hỏi phụ, giới hạn số follow-up và vai trò trong phỏng vấn.

### 4.11.3 Feedback Generation

> Cần bổ sung: mô tả cách đánh giá câu trả lời, sinh model answer, key takeaway, annotated segments.

### 4.11.4 Comprehensive Report

> Cần bổ sung: mô tả cách tổng hợp feedback thành báo cáo: overall score, executive summary, competency heatmap, action plan.

### 4.11.5 Fallback Và Degraded Mode

> Cần bổ sung: mô tả cách hệ thống xử lý khi AI lỗi, hết quota, output không hợp lệ hoặc job timeout. Ghi rõ không nên hiển thị điểm sai lệch nếu không có dữ liệu chấm điểm.

Hình gợi ý:

- Hình 4.x: Sequence diagram sinh câu hỏi.
- Hình 4.y: Sequence diagram submit câu trả lời -> feedback -> report.

Nguồn nên đối chiếu: `docs/Design/ArchitecturalDesign/SAD_InterviewAI_v1.0.md`, `docs/Design/ArchitecturalDesign/HLD_InterviewAI_v1.0.md`, `server/src/ai/`.

## 4.12 Thiết Kế Luồng Nghiệp Vụ Chính

### 4.12.1 Luồng Cấu Hình Và Tạo Phiên Phỏng Vấn

> Cần bổ sung: mô tả từ khi người dùng nhập JD/cấu hình đến khi session được tạo và câu hỏi sẵn sàng.

### 4.12.2 Luồng Thực Hiện Phiên Phỏng Vấn

> Cần bổ sung: mô tả hiển thị câu hỏi, người dùng trả lời, lưu answer, sinh feedback/follow-up, cập nhật trạng thái session.

### 4.12.3 Luồng Sinh Và Xem Báo Cáo

> Cần bổ sung: mô tả trạng thái completing/completed, job report, SSE `report.ready`, và màn hình report.

### 4.12.4 Luồng Xử Lý Lỗi

> Cần bổ sung: mô tả các lỗi dự kiến: lỗi network, validation, AI quota, Redis/queue, transcription, session state drift. Nêu rõ cách hiển thị cho người dùng.

## 4.13 Tổ Chức Mã Nguồn

> Cần bổ sung: mô tả cấu trúc repo để người đọc hiểu cách triển khai.

| Thư mục/tệp | Vai trò |
| --- | --- |
| `client/` | Ứng dụng frontend Next.js |
| `client/app/` | Routes/pages theo App Router |
| `client/components/` | Component UI, profile, interview, report, setup |
| `server/` | Ứng dụng backend NestJS |
| `server/src/` | Source code module backend |
| `server/prisma/` | Prisma schema, seed, migration/db scripts |
| `docs/RequirementAnalysis/` | Tài liệu yêu cầu, SRS, user stories |
| `docs/Design/` | Tài liệu thiết kế kiến trúc, UI/UX, API, DB, LLD |
| `docs/test-plan/` | Chiến lược kiểm thử |
| `compose.yaml` | Dịch vụ hạ tầng local, ví dụ Redis |

## 4.14 Cách Thức Xây Dựng Và Triển Khai Local

> Cần bổ sung: mô tả quy trình cài đặt/chạy hệ thống ở mức báo cáo, không cần chi tiết như runbook.

Nội dung nên có:

- Điều kiện môi trường: Node.js, npm, Docker, Supabase/PostgreSQL, Redis.
- Chạy Redis bằng Docker Compose.
- Chạy backend NestJS.
- Chạy frontend Next.js.
- Kiểm tra health/API.
- Biến môi trường quan trọng: database URL, Redis, OpenAI API key, auth.

Nguồn nên đối chiếu: `README.md`, `server/README.md`, `client/README.md`.

## 4.15 Kiểm Soát Chất Lượng Trong Quá Trình Xây Dựng

> Cần bổ sung: mô tả các biện pháp dùng trong phát triển: TypeScript, DTO validation, Zod output validation, Jest unit tests, Playwright e2e, lint/build, smoke check.

| Biện pháp | Áp dụng ở đâu | Mục đích |
| --- | --- | --- |
| TypeScript | Client/server | Cần bổ sung |
| DTO validation | Backend API | Cần bổ sung |
| Zod validation | AI output | Cần bổ sung |
| Unit test | Services/processors | Cần bổ sung |
| E2E test | Client luồng chính | Cần bổ sung |
| Runtime smoke check | Backend/local | Cần bổ sung |

## 4.16 Tổng Kết Chương

> Cần bổ sung: tóm tắt sản phẩm GR1 đã được phân tích và thiết kế như thế nào, nhấn mạnh các thành phần chính sẽ được đánh giá ở Chương 5.

---

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

> Cần bổ sung: tổng hợp các chức năng đã hoàn thành, đang hoàn thiện và chưa thực hiện. Cần đối chiếu code/demo thực tế, không chỉ dựa vào thiết kế.

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
7. Người dùng xem annotated transcript, điểm/nhận xét/action plan.

| Bước | Hành động | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- |
| 1 | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| 2 | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 5.5 Kết Quả Kiểm Thử

### 5.5.1 Kiểm Thử Backend

> Cần bổ sung: tổng hợp số lượng test, nhóm test, kết quả pass/fail, lệnh chạy test. Nếu chưa có kết quả cuối, để placeholder và cập nhật sau.

| Nhóm test | Tệp/Phạm vi | Số test | Kết quả | Ghi chú |
| --- | --- | --- | --- | --- |
| Unit service | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Processor AI | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Controller/API | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| E2E backend | Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |

### 5.5.2 Kiểm Thử Frontend

> Cần bổ sung: mô tả lint/build/e2e Playwright nếu có. Chèn ảnh kết quả test nếu phù hợp.

### 5.5.3 Kiểm Thử Tích Hợp Và Smoke Test

> Cần bổ sung: mô tả kiểm tra Redis, backend health, API root, tạo session, submit answer, report ready.

| Smoke check | Cách kiểm tra | Kết quả mong đợi | Kết quả thực tế |
| --- | --- | --- | --- |
| Backend health | `GET /api/v1/health` | Cần bổ sung | Cần bổ sung |
| API root | `GET /api/v1` | Cần bổ sung | Cần bổ sung |
| Redis | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Session flow | Cần bổ sung | Cần bổ sung | Cần bổ sung |

### 5.5.4 Kiểm Thử Chất Lượng AI

> Cần bổ sung: mô tả cách đánh giá output AI. Nên tách test schema/format với đánh giá nội dung.

Gợi ý:

- Test output có đúng schema JSON.
- Test fallback khi API lỗi/hết quota.
- Đánh giá thủ công một số câu trả lời mẫu.
- Đánh giá mức độ cụ thể/hữu ích của feedback.

## 5.6 Đánh Giá Mức Độ Đáp Ứng Yêu Cầu

> Cần bổ sung: lập ma trận đối chiếu yêu cầu - kết quả.

| Yêu cầu | Mô tả | Kết quả thực hiện | Mức độ đáp ứng | Minh chứng |
| --- | --- | --- | --- | --- |
| FR-01 | Cần bổ sung | Cần bổ sung | Đạt/Một phần/Chưa đạt | Cần bổ sung |
| FR-02 | Cần bổ sung | Cần bổ sung | Đạt/Một phần/Chưa đạt | Cần bổ sung |
| NFR-01 | Cần bổ sung | Cần bổ sung | Đạt/Một phần/Chưa đạt | Cần bổ sung |

Nguồn nên đối chiếu: `docs/RequirementAnalysis/SRS/SRS_InterviewAI_Full.md`, `docs/RequirementAnalysis/SRS/RTM_InterviewAI.md`.

## 5.7 Đánh Giá Giao Diện Và Trải Nghiệm Người Dùng

> Cần bổ sung: đánh giá UI theo các tiêu chí: dễ hiểu, rõ luồng thao tác, trạng thái loading/error, tính nhất quán, khả năng responsive, accessibility cơ bản.

Nếu có user feedback:

- Mô tả đối tượng tham gia.
- Kịch bản dùng thử.
- Câu hỏi đánh giá.
- Kết quả tổng hợp và nhận xét.

## 5.8 Đánh Giá Hiệu Năng Và Độ Ổn Định

> Cần bổ sung: nếu có đo đạc, trình bày latency tạo câu hỏi/feedback/report, thời gian load trang, khả năng xử lý job bất đồng bộ, độ ổn định Redis/SSE.

| Tiêu chí | Mục tiêu | Kết quả đo được | Nhận xét |
| --- | --- | --- | --- |
| Thời gian tạo session | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Thời gian sinh câu hỏi | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Thời gian tạo feedback | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Thời gian tạo report | Cần bổ sung | Cần bổ sung | Cần bổ sung |
| Khả năng fallback | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 5.9 Đánh Giá Bảo Mật Và Quyền Riêng Tư

> Cần bổ sung: nêu các cơ chế đã áp dụng và các phần còn hạn chế.

Nội dung nên có:

- Xác thực và authorization.
- Validation request/DTO.
- Rate limit nếu có.
- Xử lý token/cookie.
- Dữ liệu cá nhân nào được lưu.
- RLS/Supabase nếu có áp dụng.
- Các rủi ro còn lại và cách giảm thiểu.

## 5.10 Đánh Giá Chất Lượng AI Feedback

> Cần bổ sung: đánh giá feedback theo tiêu chí thực dụng thay vì chỉ nói AI "tốt".

| Tiêu chí | Mô tả | Cách đánh giá | Kết quả/nhận xét |
| --- | --- | --- | --- |
| Tính liên quan | Feedback bám câu hỏi và câu trả lời | Cần bổ sung | Cần bổ sung |
| Tính cụ thể | Có chỉ ra đoạn cần cải thiện | Cần bổ sung | Cần bổ sung |
| Tính hành động | Có gợi ý sửa cụ thể | Cần bổ sung | Cần bổ sung |
| Độ ổn định schema | Output đúng format | Cần bổ sung | Cần bổ sung |
| An toàn nội dung | Không sinh nội dung không phù hợp | Cần bổ sung | Cần bổ sung |

## 5.11 So Sánh Kết Quả Với Mục Tiêu Ban Đầu

> Cần bổ sung: quay lại các mục tiêu ở Chương 1 và đánh giá mức độ hoàn thành.

| Mục tiêu ban đầu | Kết quả đạt được | Mức độ hoàn thành | Ghi chú |
| --- | --- | --- | --- |
| Cần bổ sung | Cần bổ sung | Cần bổ sung | Cần bổ sung |

## 5.12 Hạn Chế Của Sản Phẩm GR1

> Cần bổ sung: nêu rõ hạn chế một cách thẳng thắn.

Gợi ý hạn chế:

- Chất lượng AI phụ thuộc vào provider và prompt.
- Chưa đánh giá với số lượng lớn người dùng thực.
- Một số tính năng như rewrite, progress dashboard, reverse questions, admin có thể chưa hoàn thiện.
- Voice analysis có thể mới ở mức transcription/metadata, chưa đánh giá delivery đầy đủ.
- Triển khai local/prototype, chưa tối ưu production.
- Chi phí/hạn mức API ảnh hưởng khả năng demo liên tục.

## 5.13 Bài Học Kinh Nghiệm

> Cần bổ sung: tổng kết kiến thức và kinh nghiệm thu được trong GR1.

Gợi ý:

- Kinh nghiệm phân tích yêu cầu và thu hẹp MVP.
- Kinh nghiệm thiết kế AI pipeline có fallback.
- Kinh nghiệm đồng bộ schema, backend, frontend và tài liệu.
- Kinh nghiệm kiểm thử các luồng bất đồng bộ.
- Kinh nghiệm cân bằng chất lượng AI, chi phí và trải nghiệm người dùng.

## 5.14 Tổng Kết Chương

> Cần bổ sung: tóm tắt kết quả đạt được, mức độ đáp ứng mục tiêu GR1 và những nội dung sẽ tiếp tục phát triển.

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

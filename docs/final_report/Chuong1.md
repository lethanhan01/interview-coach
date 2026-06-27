# Chương 1. Đặt Vấn Đề

## 1.1 Giới Thiệu Đề Tài

> Cần bổ sung: giới thiệu ngắn gọn về InterviewAI. Nêu rõ đây là ứng dụng web hỗ trợ sinh viên năm cuối và fresher CNTT luyện phỏng vấn thông qua mô phỏng phiên phỏng vấn, nhận câu hỏi theo JD/ngữ cảnh, trả lời bằng text/voice và nhận feedback chi tiết.

Nội dung nên có:

- Tên đề tài và phạm vi GR1.
- Vấn đề trung tâm: người học biết câu hỏi phỏng vấn nhưng khó tự đánh giá chất lượng câu trả lời.
- Giá trị mong muốn: luyện tập on-demand, có feedback cụ thể, phù hợp bối cảnh sinh viên CNTT Việt Nam.

## 1.2 Bối Cảnh Bài Toán

Trong quá trình tìm kiếm việc làm, đặc biệt với sinh viên IT mới ra trường, fresher hoặc người mới chuyển ngành, phỏng vấn là một bước rất quan trọng nhưng cũng gây nhiều khó khăn. Ứng viên không chỉ cần có kiến thức chuyên môn mà còn phải biết cách trình bày kinh nghiệm, giải thích dự án, trả lời câu hỏi tình huống và thể hiện thái độ phù hợp với vị trí ứng tuyển. 

Tuy nhiên, nhiều ứng viên thường gặp các vấn đề như: 

- Không biết nhà tuyển dụng thường hỏi những câu hỏi nào.  
- Thiếu kinh nghiệm trả lời phỏng vấn thực tế.  
- Khó tự đánh giá câu trả lời của bản thân.  
- Không có người luyện tập thường xuyên.  
- Không nhận được phản hồi cụ thể sau mỗi lần luyện phỏng vấn.  
- Chưa biết cách cải thiện kỹ năng giao tiếp, tư duy logic và trình bày dự án.  

Trong khi đó, các buổi mock interview truyền thống thường phụ thuộc vào mentor, giáo viên hoặc người có kinh nghiệm. Hình thức này có chất lượng tốt nhưng khó tổ chức thường xuyên, tốn thời gian và không phải ứng viên nào cũng có điều kiện tiếp cận. 

Vì vậy, việc xây dựng một hệ thống AI Mock Interview có khả năng mô phỏng buổi phỏng vấn, đặt câu hỏi phù hợp, ghi nhận câu trả lời và đưa ra phản hồi tự động là một hướng tiếp cận có ý nghĩa trong bối cảnh hiện nay. 

## 1.3 Bối Cảnh Nghiên Cứu Và Công Nghệ

> Cần bổ sung: trình bày xu hướng phát triển khoa học công nghệ liên quan: AI trong HR-tech, LLM, speech-to-text, hệ thống feedback tự động, ứng dụng web thời gian thực/gần thời gian thực.

Gợi ý nội dung:

- Sự phát triển của mô hình ngôn ngữ lớn trong việc phân tích văn bản và sinh feedback.
- Khả năng nhận dạng giọng nói tiếng Việt và ứng dụng trong luyện phỏng vấn.
- Xu hướng cá nhân hóa học tập/luyện tập bằng AI.
- Các thách thức: độ tin cậy của AI, hallucination, bảo mật dữ liệu cá nhân, chi phí API, chất lượng feedback.

## 1.4 Tính Cấp Thiết Và Ý Nghĩa Thực Tiễn
Hiện nay, nhu cầu luyện phỏng vấn ngày càng cao, đặc biệt trong lĩnh vực công nghệ thông tin. Sinh viên IT mới ra trường thường có kiến thức nền tảng nhưng thiếu kỹ năng thể hiện năng lực trong buổi phỏng vấn. Ngoài ra, khoảng cách giữa học tập và phỏng vấn thực tế vẫn còn lớn. Trong trường học, sinh viên thường học về lập trình, cơ sở dữ liệu, thuật toán, thiết kế hệ thống, nhưng ít có cơ hội luyện tập cách trình bày hoặc giải thích kiến thức đó trong một cuộc phỏng vấn thật. 

Đồng thời, phỏng vấn không chỉ kiểm tra kiến thức mà còn đánh giá cách tư duy và giao tiếp. Một ứng viên có thể biết câu trả lời nhưng nếu trình bày thiếu mạch lạc, không có ví dụ cụ thể hoặc không giải thích được dự án của mình thì vẫn có thể bị đánh giá thấp. 

Hơn nữa, việc luyện tập cần được thực hiện thường xuyên. Kỹ năng phỏng vấn không thể cải thiện chỉ sau một lần luyện tập. Ứng viên cần được hỏi nhiều dạng câu hỏi, trả lời nhiều lần, nhận phản hồi và theo dõi sự tiến bộ. 

Hệ thống giúp ứng viên có môi trường luyện phỏng vấn linh hoạt, có thể luyện tập mọi lúc mà không cần phụ thuộc vào mentor hoặc người phỏng vấn thật. Người dùng có thể luyện các dạng phỏng vấn khác nhau như: 

- Phỏng vấn giới thiệu bản thân.  
- Phỏng vấn hành vi.  
- Phỏng vấn kỹ thuật.  
- Phỏng vấn dự án cá nhân.  
- Phỏng vấn theo vị trí ứng tuyển.  
- Phỏng vấn bằng tiếng Việt, tiếng Anh hoặc tiếng Nhật nếu hệ thống hỗ trợ đa ngôn ngữ 

Sau mỗi lần luyện tập, hệ thống có thể đưa ra nhận xét về nội dung câu trả lời, cách trình bày, mức độ đầy đủ, điểm mạnh, điểm yếu và gợi ý cải thiện 

 
Đề tài hướng tới đối tượng chính là sinh viên IT mới ra trường hoặc fresher mới gia nhập thị trường lao động vì đối tượng này thường có nhiều dự án nhưng chưa biết cách trình bày dự án sao cho chuyên nghiệp.  
AI Mock Interview của em có thể giúp người dùng luyện trả lời các câu hỏi như: 

Bạn đã làm gì trong dự án này?  

Vì sao bạn chọn công nghệ đó?  

Bạn gặp khó khăn gì và giải quyết thế nào?  

Hệ thống của bạn có kiến trúc ra sao?  

Nếu có thêm thời gian, bạn sẽ cải thiện gì?  

Đây là những câu hỏi rất thường gặp nhưng nhiều sinh viên chưa chuẩn bị kỹ. 

 
Vì vậy, xây dựng hệ thống AI Mock Interview là cần thiết để hỗ trợ người dùng có sự chuẩn bị tốt hơn trước khi bước vào thị trường lao động. 

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

> Cần bổ sung: một câu mục tiêu tổng quát, ví dụ xây dựng prototype ứng dụng web InterviewAI hỗ trợ sinh viên CNTT luyện phỏng vấn và nhận feedback chi tiết dựa trên câu trả lời.


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

## 1.9 Phạm Vi Nghiên Cứu

> Cần bổ sung: xác định các chức năng nằm trong GR1. Nên đối chiếu `docs/Design/MVP_Scope.md` và code hiện tại.

Gợi ý phạm vi:

- Hồ sơ người dùng cơ bản.
- Cấu hình phiên phỏng vấn từ JD, loại session và context pack.
- Sinh danh sách câu hỏi phỏng vấn.
- Trả lời câu hỏi bằng text/voice tùy theo khả năng hiện có.
- Tạo feedback và báo cáo tổng hợp.
- Giao diện luồng chính và kiểm thử cơ bản.

## 1.10 Lộ Trình GR1 - GR2 - Đồ Án Tốt Nghiệp


| Giai đoạn | Mục tiêu chính |
| --- | --- |
| GR1 | Xác định bài toán, khảo sát, thiết kế và xây dựng prototype cốt lõi, demo được 1-2 tính năng quan trọng của sản phẩm |
| GR2 | Hoàn thiện tính năng, nâng cao chất lượng AI, bổ sung kiểm thử và trải nghiệm người dùng |
| Đồ án tốt nghiệp | Hoàn chỉnh hệ thống, đánh giá với người dùng thực tế, tối ưu triển khai và bảo mật |

---
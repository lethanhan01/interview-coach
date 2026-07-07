# Chương 1. Đặt Vấn Đề

## 1.1 Giới Thiệu Đề Tài

Đề tài AI Mock Interview là một ứng dụng web hỗ trợ sinh viên năm cuối và ứng viên fresher ngành Công nghệ thông tin luyện phỏng vấn với sự hỗ trợ của trí tuệ nhân tạo. Hệ thống hướng đến một quy trình luyện tập có cấu trúc: người dùng cung cấp thông tin về vị trí ứng tuyển, mô tả công việc hoặc hồ sơ cá nhân; hệ thống tạo câu hỏi phù hợp với ngữ cảnh; người dùng trả lời bằng văn bản; sau đó nhận phản hồi chi tiết và báo cáo tổng hợp sau phiên.

Vấn đề chính của đề tài không phải là thiếu nguồn câu hỏi phỏng vấn mẫu. Trên thực tế, người học có thể dễ dàng tìm thấy danh sách câu hỏi trên Internet hoặc hỏi chatbot tổng quát. Khó khăn lớn hơn nằm ở chỗ người học thường không biết câu trả lời của mình đã đúng trọng tâm hay chưa, có đủ bằng chứng thực tế hay chưa, cách trình bày có rõ ràng hay không và cần sửa ở đâu để tốt hơn. Với sinh viên CNTT và fresher, vấn đề này càng rõ vì nhiều bạn có dự án học tập, đồ án hoặc kinh nghiệm thực tập nhưng chưa quen chuyển các trải nghiệm đó thành câu trả lời phỏng vấn ngắn gọn, có cấu trúc và có sức thuyết phục.

Đề tài vì vậy tập trung vào việc xây dựng một môi trường luyện phỏng vấn chủ động, có thể sử dụng nhiều lần, có phản hồi sau từng câu trả lời và có báo cáo đánh giá phỏng vấn sau mỗi phiên. Giá trị thực tiễn của hệ thống nằm ở việc mô phỏng buổi luyện phỏng vấn sao cho giống thật nhất có thể nhằm giúp người dùng chuẩn bị tốt hơn trước khi bước vào phỏng vấn thật. Đặc biệt trong các tình huống cần giải thích dự án, trình bày lựa chọn kỹ thuật, trả lời câu hỏi hành vi, điều chỉnh cách diễn đạt và tự nhìn lại điểm cần cải thiện.

## 1.2 Bối Cảnh Bài Toán

Thị trường lao động trong lĩnh vực công nghệ đang thay đổi nhanh, nhưng cơ hội việc làm không tự động chuyển thành khả năng trúng tuyển của sinh viên mới ra trường. Theo dữ liệu World Bank/ILOSTAT, tỷ lệ thất nghiệp chung của Việt Nam năm 2025 theo ước tính mô hình là 1,523% [1.2-S1], trong khi tỷ lệ thất nghiệp thanh niên nhóm 15-24 tuổi cùng năm là 6,165% [1.2-S2]. Nếu dùng chỉ số quốc gia đã công bố gần nhất, tỷ lệ thất nghiệp thanh niên năm 2024 là 6,41% [1.2-S3]. Sự chênh lệch này cho thấy nhóm lao động trẻ chịu áp lực chuyển tiếp từ môi trường học tập sang thị trường việc làm lớn hơn mặt bằng chung. Đối với sinh viên CNTT, áp lực này không chỉ đến từ việc tìm một vị trí tuyển dụng, mà còn đến từ yêu cầu chứng minh năng lực trong thời gian phỏng vấn rất ngắn.

Ở chiều ngược lại, nhu cầu nhân lực công nghệ tại Việt Nam vẫn lớn. Báo cáo thị trường IT Việt Nam 2024-2025 của TopDev nêu rằng mức lương trung bình của lập trình viên tại Việt Nam năm 2024 ước tính khoảng 1.100-3.000 USD mỗi tháng tùy kỹ năng và kinh nghiệm, đồng thời thị trường cần bổ sung ít nhất 500.000 lao động công nghệ đến năm 2025 để đáp ứng nhu cầu [1.2-S4]. Báo cáo này cũng ghi nhận nền kinh tế số Việt Nam chiếm khoảng 16,5% GDP và được dự kiến tiếp tục tăng trưởng khoảng 20% mỗi năm [1.2-S4]. Các số liệu này cho thấy công nghệ thông tin vẫn là lĩnh vực có nhu cầu cao, nhưng nhu cầu cao đi kèm yêu cầu ngày càng rõ về kỹ năng thực hành, khả năng thích nghi và năng lực giao tiếp nghề nghiệp.

Với sinh viên năm cuối và fresher, phỏng vấn tuyển dụng là điểm giao giữa kiến thức học thuật và yêu cầu nghề nghiệp thực tế. Trong trường học, sinh viên thường được đánh giá bằng bài tập, đồ án, bài kiểm tra hoặc báo cáo kỹ thuật. Trong phỏng vấn, cách đánh giá thay đổi: ứng viên phải giải thích ngắn gọn mình đã làm gì, vì sao chọn cách làm đó, gặp khó khăn nào, xử lý ra sao và kết quả đạt được là gì. Một dự án có thể đã được triển khai đúng, nhưng nếu ứng viên không giải thích được vai trò cá nhân, kiến trúc tổng thể, lựa chọn công nghệ hoặc bài học sau lỗi kỹ thuật, nhà tuyển dụng vẫn có thể đánh giá ứng viên chưa sẵn sàng.

Khó khăn đầu tiên của nhóm người dùng mục tiêu là thiếu kinh nghiệm trả lời trong bối cảnh có áp lực. Nhiều sinh viên có thể đọc và hiểu khái niệm kỹ thuật, nhưng khi được hỏi trực tiếp lại trả lời quá ngắn, quá dài hoặc thiếu thứ tự. Với câu hỏi kỹ thuật, lỗi phổ biến là chỉ nêu định nghĩa mà không giải thích bằng ví dụ từ dự án. Với câu hỏi hành vi, lỗi phổ biến là kể chuyện chung chung, dùng nhiều cụm "nhóm em làm" nhưng không nói rõ bản thân đã đóng góp gì. Những lỗi này không phải lúc nào cũng xuất hiện khi tự học lý thuyết, mà thường chỉ lộ ra khi người học phải nói hoặc viết một câu trả lời hoàn chỉnh.

Khó khăn thứ hai là thiếu phản hồi cụ thể sau khi luyện tập. Một ứng viên có thể tự hỏi "câu trả lời này ổn chưa", nhưng rất khó tự đánh giá vì người trả lời thường đã quen với cách nghĩ của mình. Nếu chỉ đọc câu trả lời mẫu, người học biết được một đáp án tốt trông như thế nào, nhưng không biết câu trả lời hiện tại của mình đang thiếu bối cảnh, thiếu ví dụ, thiếu kết quả hay thiếu liên hệ với vị trí ứng tuyển. Phản hồi chung chung như "cần nói rõ hơn" hoặc "cần tự tin hơn" có giá trị hạn chế vì người học không biết cần sửa câu nào, thêm ý nào và nên viết lại theo hướng nào.

Khó khăn thứ ba là mock interview với người thật khó duy trì thường xuyên. Luyện với mentor, thầy cô, bạn bè hoặc người đã đi làm có chất lượng tốt, nhưng phụ thuộc vào lịch rảnh, kinh nghiệm của người hỗ trợ và mức độ sẵn sàng góp ý chi tiết. Sinh viên cũng có tâm lý ngại làm phiền người khác hoặc ngại bị đánh giá khi luyện nhiều lần. Trong khi đó, kỹ năng phỏng vấn cần lặp lại. Người học cần thử nhiều vị trí, nhiều mô tả công việc, nhiều loại câu hỏi và nhiều cách diễn đạt khác nhau trước khi hình thành phản xạ trả lời tự nhiên.

Khó khăn thứ tư là nội dung luyện tập thường chưa cá nhân hóa theo hồ sơ và vị trí ứng tuyển. Cùng là vị trí Backend Developer, một ứng viên dùng NestJS, PostgreSQL và triển khai xác thực người dùng sẽ cần luyện các câu hỏi khác với ứng viên làm Java Spring Boot hoặc chỉ mới làm frontend. Nếu câu hỏi không dựa trên mô tả công việc, hồ sơ luyện tập và loại phiên phỏng vấn, người học dễ rơi vào tình trạng học thuộc câu hỏi mẫu nhưng không chuẩn bị được cho tình huống thật. Đặc biệt với fresher, nhà tuyển dụng thường khai thác sâu vào đồ án, thực tập, vai trò trong nhóm và lý do lựa chọn kỹ thuật. Đây là những nội dung khó chuẩn bị bằng một danh sách câu hỏi cố định.

Khó khăn thứ năm là rào cản ngôn ngữ và bối cảnh. Nhiều công cụ luyện phỏng vấn quốc tế tập trung vào tiếng Anh và bối cảnh tuyển dụng phương Tây. Điều này hữu ích với một số nhóm ứng viên, nhưng chưa hoàn toàn phù hợp với sinh viên CNTT Việt Nam, những người có thể cần luyện bằng tiếng Việt trước, sau đó mới chuyển sang tiếng Anh hoặc tiếng Nhật tùy vị trí. Ngoài ngôn ngữ, phong cách trả lời trong môi trường Việt Nam cũng có những điểm riêng về cách xưng hô, mức độ tự quảng bá, cách trình bày điểm yếu và cách nói về đóng góp cá nhân. Vì vậy, một hệ thống luyện phỏng vấn cho nhóm người dùng này cần quan tâm đến ngữ cảnh chứ không chỉ dịch câu hỏi.

Khó khăn cuối cùng là việc theo dõi tiến bộ chưa có cấu trúc. Nếu người học luyện qua ghi chú cá nhân, trò chuyện rời rạc với chatbot hoặc luyện miệng với bạn bè, dữ liệu về câu hỏi, câu trả lời và nhận xét thường bị phân tán. Người học khó biết mình đang lặp lại lỗi nào qua nhiều phiên, ví dụ luôn thiếu kết quả cụ thể trong câu trả lời hành vi, luôn giải thích thiếu trade-off trong câu hỏi kỹ thuật hoặc thường không liên hệ câu trả lời với mô tả công việc. Một hệ thống có lưu phiên, lưu câu trả lời, tạo phản hồi và tổng hợp báo cáo sẽ giúp quá trình luyện tập chuyển từ cảm tính sang có căn cứ hơn.

Từ các yếu tố trên, bài toán đặt ra là cần một hệ thống luyện phỏng vấn có khả năng hoạt động theo phiên, cá nhân hóa theo thông tin ứng tuyển, cho phép người dùng trả lời như trong một tình huống thực tế và trả lại phản hồi đủ cụ thể để người học biết cần cải thiện điều gì. Đây là cơ sở trực tiếp cho đề tài AI Mock Interview.

## 1.3 Bối Cảnh Nghiên Cứu Và Công Nghệ

Sự phát triển của trí tuệ nhân tạo, đặc biệt là mô hình ngôn ngữ lớn, tạo điều kiện để xây dựng các hệ thống hỗ trợ luyện tập dựa trên ngôn ngữ tự nhiên. Báo cáo Future of Jobs 2025 của World Economic Forum dựa trên khảo sát hơn 1.000 nhà tuyển dụng, đại diện cho hơn 14 triệu lao động ở 22 nhóm ngành và 55 nền kinh tế, cho thấy các xu hướng công nghệ dự kiến tiếp tục làm thay đổi thị trường lao động đến năm 2030 [1.3-S1]. Báo cáo này ghi nhận 86% nhà tuyển dụng kỳ vọng AI và xử lý thông tin sẽ biến đổi hoạt động kinh doanh, đồng thời AI và dữ liệu lớn nằm trong nhóm kỹ năng tăng trưởng nhanh nhất [1.3-S1]. Điều này tạo ra nhu cầu kép: người học công nghệ phải hiểu công nghệ mới, nhưng cũng phải biết trình bày năng lực của mình trong một thị trường việc làm đang thay đổi.

Về kỹ năng nghề nghiệp, World Economic Forum dự báo 22% số việc làm hiện tại sẽ chịu tác động của chuyển đổi cấu trúc trong giai đoạn 2025-2030, với 170 triệu việc làm mới được tạo ra và 92 triệu việc làm bị thay thế, tương đương mức tăng ròng 78 triệu việc làm [1.3-S1]. Báo cáo cũng cho rằng trung bình 39% bộ kỹ năng hiện tại của người lao động sẽ thay đổi hoặc trở nên lỗi thời trong cùng giai đoạn, và 63% nhà tuyển dụng xem khoảng cách kỹ năng là rào cản lớn nhất đối với chuyển đổi doanh nghiệp [1.3-S1]. Trong bối cảnh đó, luyện phỏng vấn không thể chỉ là học thuộc câu hỏi. Người học cần thể hiện được khả năng phân tích, giao tiếp, học hỏi và thích nghi với công nghệ mới.

Các khung năng lực nghề nghiệp cũng nhấn mạnh điều này. NACE định nghĩa career readiness là nền tảng để sinh viên tốt nghiệp thể hiện các năng lực cốt lõi cần thiết cho thành công trong công việc và quản lý sự nghiệp dài hạn [1.3-S2]. Trong tám nhóm năng lực của NACE có giao tiếp, tư duy phản biện, làm việc nhóm, chuyên nghiệp và công nghệ [1.3-S2]. Đây đều là các tiêu chí thường được nhà tuyển dụng đánh giá gián tiếp trong phỏng vấn. Vì vậy, một hệ thống AI Mock Interview cần đánh giá cả nội dung chuyên môn và cách người dùng diễn đạt, thay vì chỉ kiểm tra câu trả lời đúng hay sai.

Về công nghệ xử lý ngôn ngữ tự nhiên, các mô hình hiện đại cho phép hệ thống phân tích câu trả lời dạng văn bản, sinh nhận xét theo ngữ cảnh và đề xuất cách cải thiện cụ thể hơn so với danh sách câu hỏi mẫu. Trong phạm vi hiện tại, đề tài tập trung vào câu trả lời văn bản để ổn định luồng sinh câu hỏi, chấm câu trả lời và tạo báo cáo. Các công nghệ nhận dạng giọng nói như Whisper có thể được xem xét ở giai đoạn sau nếu hệ thống mở rộng sang trả lời bằng giọng nói.

Tuy nhiên, ứng dụng AI vào luyện phỏng vấn cũng có giới hạn cần được nhìn nhận rõ. Mô hình AI có thể sinh câu hỏi, phân tích câu trả lời và gợi ý cải thiện, nhưng vẫn có rủi ro đưa ra nhận xét chưa chính xác, đánh giá thiếu bối cảnh hoặc tạo nội dung quá chung chung nếu đầu vào không đủ thông tin. Ngoài ra, hệ thống phải xử lý dữ liệu nhạy cảm như CV, mô tả kinh nghiệm và câu trả lời cá nhân. Vì vậy, đề tài cần tiếp cận AI như một công cụ hỗ trợ luyện tập, không phải người tuyển dụng thật, và cần thiết kế quy trình có cấu trúc để giảm rủi ro phản hồi tùy tiện.

Trong phạm vi GR1, đề tài tận dụng các hướng công nghệ chính gồm ứng dụng web hiện đại, mô hình ngôn ngữ lớn để sinh câu hỏi và phản hồi, hệ thống hàng đợi để xử lý tác vụ AI bất đồng bộ, cùng cơ sở dữ liệu để lưu phiên luyện tập và báo cáo. Các công nghệ này không được sử dụng riêng lẻ, mà được kết hợp thành một quy trình học tập: cấu hình phiên, tạo câu hỏi, trả lời, nhận feedback và xem báo cáo.

## 1.4 Tính Cấp Thiết Và Ý Nghĩa Thực Tiễn

Tính cấp thiết của đề tài đến từ khoảng cách giữa nhu cầu tuyển dụng nhân lực công nghệ và mức độ sẵn sàng phỏng vấn của sinh viên mới ra trường. TopDev ghi nhận nhu cầu bổ sung ít nhất 500.000 lao động công nghệ đến năm 2025 [1.2-S4], trong khi World Economic Forum cho thấy kỹ năng công nghệ, AI, an ninh mạng, tư duy phân tích và khả năng học hỏi sẽ tiếp tục tăng tầm quan trọng trong giai đoạn 2025-2030 [1.3-S1]. Điều đó có nghĩa là sinh viên CNTT không chỉ cần học công nghệ, mà còn phải chứng minh được khả năng học, khả năng giải thích và khả năng áp dụng công nghệ vào bài toán cụ thể.

Phỏng vấn là nơi các năng lực này được kiểm chứng trong thời gian ngắn. University of Michigan Career Center mô tả phỏng vấn là cuộc trao đổi trong đó người phỏng vấn đặt câu hỏi về kinh nghiệm và chuyên môn của ứng viên liên quan đến vị trí hoặc chương trình ứng tuyển [1.4-S1]. Harvard FAS Mignone Center for Career Success cũng nêu rằng với các vai trò kỹ thuật như software engineer, data scientist hoặc product manager, ứng viên thường gặp cả đánh giá kỹ thuật và câu hỏi hành vi; câu hỏi kỹ thuật có thể ở dạng coding challenge, brain teaser hoặc tình huống sản phẩm [1.4-S2]. Như vậy, một buổi phỏng vấn CNTT không chỉ kiểm tra kiến thức lập trình, mà còn kiểm tra cách ứng viên giải thích, phân tích và trình bày.

Đối với sinh viên và fresher, đây là vấn đề nan giải vì kinh nghiệm của họ thường nằm ở đồ án, bài tập lớn, dự án cá nhân hoặc thực tập ngắn hạn. Những kinh nghiệm này có giá trị, nhưng chỉ thuyết phục khi được trình bày rõ vai trò cá nhân, vấn đề đã giải quyết, lựa chọn kỹ thuật, kết quả và bài học. Nếu trả lời theo kiểu liệt kê công nghệ đã dùng, ứng viên khó tạo được niềm tin. Nếu trả lời quá chung chung, nhà tuyển dụng không có đủ bằng chứng để đánh giá. Nếu trả lời quá dài, câu trả lời mất trọng tâm. Do đó, nhu cầu luyện tập có phản hồi cụ thể là nhu cầu thực tế, không chỉ là một tính năng phụ.

Ý nghĩa thực tiễn của AI Mock Interview là cung cấp một môi trường luyện tập có thể dùng mọi lúc, không phụ thuộc vào lịch của mentor hoặc bạn bè. Người dùng có thể thử nhiều mô tả công việc khác nhau, luyện nhiều loại phỏng vấn khác nhau, trả lời bằng văn bản, sau đó xem lại phản hồi và báo cáo. Điều này giúp quá trình luyện phỏng vấn trở thành một hoạt động có thể lặp lại, có dữ liệu và có định hướng cải thiện.

Hệ thống cũng có ý nghĩa về khả năng tiếp cận. Các dịch vụ mock interview với chuyên gia thường có chi phí cao hoặc yêu cầu đặt lịch, trong khi sinh viên Việt Nam thường cần giải pháp rẻ, linh hoạt và hỗ trợ tiếng Việt. Một hệ thống AI Mock Interview miễn phí trong phạm vi đề tài có thể giúp người dùng chuẩn bị trước khi tìm đến mentor hoặc phỏng vấn thật. Khi đã luyện trước bằng hệ thống, người học có thể sử dụng thời gian với người hướng dẫn hiệu quả hơn vì đã nhận diện được điểm yếu cơ bản.

Ngoài giá trị cho người dùng, đề tài còn có ý nghĩa học thuật và kỹ thuật đối với quá trình xây dựng hệ thống phần mềm có tích hợp AI. Bài toán yêu cầu kết hợp nhiều thành phần: giao diện web, xác thực người dùng, quản lý hồ sơ, xử lý phiên phỏng vấn, tạo câu hỏi, nhận câu trả lời, sinh phản hồi, xử lý bất đồng bộ và lưu báo cáo. Đây là một bài toán đủ thực tế để rèn luyện tư duy thiết kế hệ thống, nhưng vẫn có phạm vi phù hợp với giai đoạn GR1.

## 1.5 Khoảng Trống Hiện Tại Và Tính Mới Của Đề Tài

Qua khảo sát ở Chương 2, có thể thấy các cách luyện phỏng vấn hiện nay thường rơi vào một trong ba nhóm: tự học bằng câu hỏi mẫu hoặc chatbot tổng quát, luyện với người thật qua mentor/bạn bè/nền tảng mock interview, hoặc dùng các công cụ quốc tế tập trung vào tiếng Anh. Mỗi nhóm đều có giá trị, nhưng chưa giải quyết tốt đồng thời các yêu cầu của sinh viên CNTT Việt Nam: chi phí thấp, dùng được theo nhu cầu, hỗ trợ tiếng Việt, cá nhân hóa theo JD/CV, có phản hồi cụ thể theo câu trả lời và có lưu vết tiến bộ sau phiên.

Khoảng trống thứ nhất là khoảng trống về quy trình. Chatbot tổng quát có thể sinh câu hỏi và góp ý, nhưng người dùng phải tự thiết kế toàn bộ luồng luyện tập. Nếu hôm nay người dùng yêu cầu một kiểu feedback và ngày mai yêu cầu kiểu khác, tiêu chí đánh giá dễ thiếu nhất quán. AI Mock Interview khắc phục bằng cách tổ chức luyện tập theo phiên: người dùng cấu hình thông tin đầu vào, hệ thống tạo câu hỏi, người dùng trả lời, phản hồi được sinh theo tiêu chí đã xác định và báo cáo được tổng hợp sau phiên.

Khoảng trống thứ hai là khoảng trống về cá nhân hóa. Danh sách câu hỏi mẫu thường không biết người dùng đang ứng tuyển vị trí nào, đã làm dự án gì, dùng công nghệ nào và muốn luyện trong bối cảnh Việt Nam hay bối cảnh quốc tế. Trong đề tài này, câu hỏi được định hướng bởi mô tả công việc, loại phỏng vấn, hồ sơ luyện tập và ngữ cảnh phỏng vấn. Điều này giúp câu hỏi và phản hồi gần với nhu cầu thật hơn, đặc biệt khi người dùng cần giải thích dự án cá nhân hoặc chuẩn bị cho một vị trí cụ thể.

Khoảng trống thứ ba là khoảng trống về phản hồi cụ thể. Nhiều công cụ chỉ đưa ra nhận xét tổng quát, ví dụ câu trả lời còn thiếu chi tiết hoặc cần tự tin hơn. Cách góp ý đó chưa đủ để người học sửa ngay. Tính mới của đề tài nằm ở việc hệ thống hướng đến phản hồi theo từng câu trả lời, chỉ ra điểm mạnh, điểm cần cải thiện, gợi ý cách viết hoặc nói lại và tổng hợp thành báo cáo sau phiên. Trọng tâm không phải là cho điểm để xếp hạng người dùng, mà là giúp người dùng hiểu lỗi của mình và biết bước cải thiện tiếp theo.

Khoảng trống thứ tư là khoảng trống về trải nghiệm luyện tập có cấu trúc. University of Michigan xem mock interviewing như một buổi tập dượt có phản hồi ngay sau đó [1.4-S1], còn Harvard FAS liệt kê công cụ luyện phỏng vấn ảo có AI feedback và mock interview với alumni như tài nguyên chuẩn bị phỏng vấn kỹ thuật [1.4-S2]. Tuy nhiên, trong bối cảnh sinh viên Việt Nam, việc tiếp cận người hỗ trợ phù hợp không phải lúc nào cũng dễ. Trong phạm vi GR1, hệ thống ưu tiên câu trả lời văn bản để người dùng tập trung chỉnh nội dung, lập luận và bằng chứng trước khi mở rộng sang luyện nói.

Khoảng trống thứ năm là ranh giới đạo đức của công cụ AI. Một số công cụ thị trường hướng đến việc hỗ trợ ứng viên trong lúc phỏng vấn thật, thậm chí tạo gợi ý theo thời gian thực. Đề tài này chọn hướng khác: hệ thống chỉ phục vụ luyện tập trước phỏng vấn, phản hồi sau câu trả lời và báo cáo sau phiên. Cách tiếp cận này phù hợp với mục tiêu giáo dục, giúp người dùng tự cải thiện năng lực thay vì phụ thuộc vào gợi ý trực tiếp trong một buổi phỏng vấn thật.

Từ các khoảng trống trên, tính mới của AI Mock Interview trong phạm vi đề tài không nằm ở việc tạo ra một chatbot hỏi đáp đơn giản, mà nằm ở việc kết hợp AI với một quy trình luyện phỏng vấn có cấu trúc, có ngữ cảnh, có phản hồi cụ thể và có báo cáo sau phiên. Hệ thống hướng đến nhóm người dùng rõ ràng là sinh viên năm cuối và fresher CNTT Việt Nam, do đó các quyết định thiết kế đều xoay quanh khả năng tiếp cận, tính thực tế và khả năng cải thiện qua nhiều lần luyện.

## 1.6 Lý Do Chọn Đề Tài

Người thực hiện đề tài chọn AI Mock Interview vì trong quá trình học tập và hỗ trợ bạn bè chuẩn bị phỏng vấn, có thể thấy nhiều sinh viên không thiếu hoàn toàn kiến thức, nhưng gặp khó khăn khi phải trình bày câu trả lời sao cho rõ ràng, đúng trọng tâm và thuyết phục. Có bạn làm được dự án, nhưng khi được hỏi về kiến trúc, lý do chọn công nghệ hoặc lỗi đã xử lý thì trả lời còn rời rạc. Có bạn hiểu câu hỏi hành vi, nhưng chưa biết kể tình huống theo cấu trúc, chưa nêu rõ vai trò cá nhân và kết quả đạt được.

Việc luyện tập với người khác có hiệu quả, nhưng không phải lúc nào cũng thực hiện được thường xuyên. Một công cụ phần mềm có thể giúp người học luyện trước, nhận phản hồi cơ bản và tự cải thiện từng bước sẽ có giá trị thực tế đối với sinh viên. Đề tài cũng phù hợp với định hướng học tập của người thực hiện vì kết hợp phát triển ứng dụng web, thiết kế cơ sở dữ liệu, xây dựng backend API, xử lý bất đồng bộ và tích hợp trí tuệ nhân tạo vào một sản phẩm hoàn chỉnh.

Ngoài ra, đề tài có phạm vi đủ gần với nhu cầu thật để kiểm chứng bằng demo. Người dùng có thể tạo hồ sơ, cấu hình phiên, nhận câu hỏi, trả lời, xem feedback và báo cáo. Đây là chuỗi chức năng có thể quan sát trực tiếp, không chỉ dừng ở mô hình lý thuyết. Vì vậy, AI Mock Interview được lựa chọn như một đề tài vừa có ý nghĩa thực tiễn, vừa phù hợp để rèn luyện năng lực xây dựng hệ thống phần mềm.

## 1.7 Mục Tiêu Của Đề Tài

Mục tiêu tổng quát của đề tài là xây dựng một ứng dụng web hỗ trợ sinh viên năm cuối và ứng viên fresher ngành Công nghệ thông tin luyện phỏng vấn bằng trí tuệ nhân tạo theo một quy trình có cấu trúc, có phản hồi và có báo cáo sau phiên.

Mục tiêu chức năng của hệ thống tập trung vào các tính năng đã triển khai trong phạm vi GR1. Trước hết, hệ thống cho phép người dùng đăng ký, đăng nhập và quản lý hồ sơ luyện tập, bao gồm các thông tin giúp cá nhân hóa nội dung phỏng vấn như kỹ năng, kinh nghiệm, học vấn hoặc dự án đã thực hiện. Tiếp theo, hệ thống cho phép người dùng cấu hình phiên phỏng vấn dựa trên mô tả công việc, loại phỏng vấn, thời lượng và ngữ cảnh phỏng vấn. Các thông tin này được sử dụng để định hướng câu hỏi và tiêu chí phản hồi.

Hệ thống cần sinh danh sách câu hỏi phù hợp với vị trí ứng tuyển và loại phiên phỏng vấn. Câu hỏi có thể khai thác từ ngân hàng câu hỏi có sẵn kết hợp với khả năng tạo nội dung của AI để đảm bảo vừa ổn định, vừa có mức độ cá nhân hóa theo ngữ cảnh. Sau khi phiên bắt đầu, người dùng trả lời bằng văn bản để hệ thống tiếp tục phân tích và lưu trữ.

Một mục tiêu quan trọng khác là tạo phản hồi tự động cho từng câu trả lời. Phản hồi cần chỉ ra điểm mạnh, điểm còn thiếu, gợi ý cải thiện và cung cấp ví dụ trả lời tốt hơn khi phù hợp. Sau khi phiên kết thúc, hệ thống tạo báo cáo tổng hợp để người dùng nhìn lại chất lượng trả lời, các năng lực cần cải thiện và định hướng luyện tập tiếp theo. Trong toàn bộ quy trình, hệ thống cần xử lý các tác vụ AI theo cơ chế bất đồng bộ để tránh chặn trải nghiệm người dùng khi tác vụ sinh câu hỏi, tạo feedback hoặc tạo báo cáo mất nhiều thời gian.

Mục tiêu chất lượng của đề tài là tạo ra một prototype có thể demo được luồng luyện phỏng vấn từ đầu đến cuối, giao diện dễ sử dụng, dữ liệu phiên được lưu lại có cấu trúc và phản hồi đủ cụ thể để người dùng có thể hành động. Hệ thống không đặt mục tiêu thay thế nhà tuyển dụng hoặc mentor, mà đóng vai trò công cụ luyện tập trước phỏng vấn thật.

## 1.8 Nhiệm Vụ Và Phạm Vi Nghiên Cứu

Trong phạm vi GR1, đề tài tập trung vào việc xây dựng một prototype có thể chạy được luồng luyện phỏng vấn chính từ lúc người dùng chuẩn bị hồ sơ đến lúc nhận báo cáo sau phiên. Phạm vi người dùng chính là sinh viên năm cuối và ứng viên fresher ngành Công nghệ thông tin. Phạm vi loại phỏng vấn tập trung vào phỏng vấn kỹ thuật, phỏng vấn hành vi và phiên phỏng vấn tổng hợp.

| Nhóm tính năng | Phạm vi đã phát triển trong GR1 | Mục đích trong hệ thống |
| --- | --- | --- |
| Tài khoản và hồ sơ luyện tập | Cho phép người dùng đăng ký, đăng nhập và quản lý thông tin hồ sơ phục vụ luyện phỏng vấn, bao gồm kỹ năng, kinh nghiệm, học vấn, dự án và CV. | Làm dữ liệu nền để cá nhân hóa câu hỏi và phản hồi theo năng lực thực tế của người dùng. |
| Cấu hình phiên phỏng vấn | Cho phép người dùng tạo phiên luyện tập với mô tả công việc, vị trí mục tiêu, loại phỏng vấn, thời lượng và ngữ cảnh phỏng vấn. | Xác định phạm vi buổi luyện tập để hệ thống sinh câu hỏi và đánh giá theo đúng mục tiêu ứng tuyển. |
| Sinh câu hỏi phỏng vấn | Hệ thống tạo danh sách câu hỏi dựa trên thông tin phiên, kết hợp khả năng sinh nội dung của AI với ngân hàng câu hỏi có sẵn. | Tạo bộ câu hỏi phù hợp với vị trí ứng tuyển, giảm phụ thuộc vào danh sách câu hỏi mẫu chung chung. |
| Thực hiện phiên phỏng vấn | Người dùng trả lời câu hỏi bằng văn bản trong giao diện phỏng vấn. | Mô phỏng luồng luyện phỏng vấn có cấu trúc và tạo dữ liệu ổn định cho bước phản hồi. |
| Phản hồi cho từng câu trả lời | Hệ thống phân tích từng câu trả lời và đưa ra nhận xét về điểm mạnh, điểm còn thiếu, gợi ý cải thiện và ví dụ trả lời tốt hơn khi phù hợp. | Giúp người dùng biết cụ thể mình cần sửa nội dung nào thay vì chỉ nhận đánh giá chung chung. |
| Báo cáo tổng hợp sau phiên | Sau khi phiên kết thúc, hệ thống tạo báo cáo tổng hợp về chất lượng trả lời, mức độ phù hợp với phiên phỏng vấn và định hướng cải thiện. | Giúp người dùng nhìn lại toàn bộ phiên luyện tập và có cơ sở tiếp tục rèn luyện. |
| Lịch sử phiên và xem lại kết quả | Người dùng có thể xem lại các phiên đã thực hiện, câu hỏi, câu trả lời, phản hồi và báo cáo tương ứng. | Hỗ trợ theo dõi quá trình luyện tập thay vì để kết quả bị phân tán trong ghi chú hoặc hội thoại rời rạc. |
| Xử lý tác vụ AI bất đồng bộ | Các tác vụ tốn thời gian như sinh câu hỏi, tạo phản hồi và tạo báo cáo được xử lý nền; giao diện nhận cập nhật trạng thái khi kết quả sẵn sàng. | Giảm tình trạng chờ lâu trên một yêu cầu duy nhất và giúp hệ thống ổn định hơn khi tác vụ AI mất nhiều thời gian. |
| Cơ chế dự phòng khi AI lỗi | Khi tác vụ AI gặp lỗi hoặc không trả về kết quả như mong muốn, hệ thống có hướng xử lý dự phòng ở các bước quan trọng như sinh câu hỏi hoặc phản hồi. | Giúp prototype vẫn có thể sử dụng được trong điều kiện API AI không ổn định hoặc bị giới hạn. |

Về giới hạn, hệ thống không được thiết kế để hỗ trợ ứng viên gian lận trong buổi phỏng vấn thật. Hệ thống không đưa gợi ý theo thời gian thực trong lúc người dùng đang phỏng vấn với nhà tuyển dụng, mà chỉ phục vụ luyện tập trước phỏng vấn. Kết quả đánh giá của AI chỉ được xem là phản hồi tham khảo phục vụ học tập, không phải kết luận tuyển dụng chính thức.

## 1.9 Lộ Trình GR1 - GR2 - Đồ Án Tốt Nghiệp

Lộ trình phát triển sau GR1 được chia thành hai giai đoạn tiếp theo. GR2 tập trung hoàn thiện chất lượng sản phẩm, cải thiện trải nghiệm người dùng và bổ sung các tính năng còn để mở. Đồ án tốt nghiệp hướng đến phiên bản hoàn chỉnh hơn, có thể đánh giá với người dùng thực tế và xem xét các vấn đề triển khai dài hạn.

Bảng 1.x trình bày các tính năng dự kiến bổ sung và hoàn thiện trong giai đoạn GR2.

| Nhóm tính năng | GR2: Dự kiến bổ sung và hoàn thiện |
| --- | --- |
| Tài khoản và hồ sơ luyện tập | Bổ sung nhập CV thuận tiện hơn, chuẩn hóa thông tin kỹ năng/dự án và cải thiện trải nghiệm cập nhật hồ sơ. |
| Cấu hình phiên phỏng vấn | Bổ sung các tùy chọn như mức độ khó, phong cách phỏng vấn, độ dài câu trả lời mong muốn và mục tiêu luyện tập cụ thể. |
| Sinh câu hỏi phỏng vấn | Mở rộng ngân hàng câu hỏi, cải thiện độ đa dạng câu hỏi và bổ sung công cụ quản trị nội dung câu hỏi. |
| Thực hiện phiên phỏng vấn | Cải thiện giao diện trả lời văn bản, bổ sung chế độ nháp/chỉnh sửa câu trả lời và cân nhắc voice input nếu phạm vi GR2 cho phép. |
| Phản hồi cho từng câu trả lời | Tinh chỉnh tiêu chí đánh giá theo từng loại phỏng vấn, cải thiện chất lượng tiếng Việt và giảm phản hồi quá chung chung. |
| Báo cáo tổng hợp sau phiên | Cải thiện bố cục báo cáo, bổ sung so sánh giữa các phiên và làm rõ mức độ tiến bộ theo từng nhóm năng lực. |
| Lịch sử phiên và xem lại kết quả | Bổ sung bộ lọc, tìm kiếm, phân loại phiên theo vị trí hoặc loại phỏng vấn để người dùng xem lại thuận tiện hơn. |
| Xử lý bất đồng bộ và cập nhật trạng thái | Tăng độ ổn định khi tác vụ AI chậm, bổ sung thông báo tiến độ rõ ràng hơn và kiểm thử các tình huống lỗi. |
| Bảo mật và dữ liệu cá nhân | Rà soát quyền truy cập dữ liệu, chuẩn hóa thông báo lỗi và giảm lưu trữ dữ liệu không cần thiết. |

Bảng 1.x trình bày định hướng hoàn thiện hệ thống trong giai đoạn đồ án tốt nghiệp.

| Nhóm tính năng | Đồ án tốt nghiệp: Hướng hoàn chỉnh |
| --- | --- |
| Tài khoản và hồ sơ luyện tập | Hướng đến hồ sơ năng lực đầy đủ hơn, có thể phân tích CV tự động và gợi ý điểm cần chuẩn bị trước phỏng vấn. |
| Cấu hình phiên phỏng vấn | Cho phép tạo kế hoạch luyện tập cá nhân hóa theo mục tiêu nghề nghiệp, lịch sử phiên và vị trí ứng tuyển. |
| Sinh câu hỏi phỏng vấn | Đánh giá chất lượng câu hỏi bằng dữ liệu người dùng thực tế và tối ưu khả năng cá nhân hóa theo từng nhóm vị trí. |
| Thực hiện phiên phỏng vấn | Xây dựng trải nghiệm luyện nói đầy đủ hơn, có phân tích cách diễn đạt và so sánh tiến bộ qua nhiều lần luyện. |
| Phản hồi cho từng câu trả lời | Đánh giá độ hữu ích của phản hồi với người dùng thật và tối ưu để phản hồi ngày càng cụ thể, dễ hành động hơn. |
| Báo cáo tổng hợp sau phiên | Xây dựng hệ thống theo dõi tiến bộ dài hạn, gợi ý kế hoạch luyện tập tiếp theo dựa trên lịch sử của người dùng. |
| Lịch sử phiên và xem lại kết quả | Hình thành dashboard cá nhân giúp người dùng theo dõi xu hướng điểm mạnh, điểm yếu và mức độ sẵn sàng phỏng vấn. |
| Xử lý bất đồng bộ và cập nhật trạng thái | Tối ưu khả năng mở rộng, giám sát lỗi và đảm bảo hệ thống vận hành ổn định khi có nhiều người dùng. |
| Bảo mật và dữ liệu cá nhân | Hoàn thiện chính sách bảo vệ dữ liệu cá nhân, cơ chế xóa dữ liệu và đánh giá an toàn trước khi triển khai rộng hơn. |

---

*Nguồn tham khảo cho Chương 1:*

*[1.2-S1] World Bank. "Unemployment, total (% of total labor force) (modeled ILO estimate) - Viet Nam." https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS?locations=VN*

*[1.2-S2] World Bank. "Unemployment, youth total (% of total labor force ages 15-24) (modeled ILO estimate) - Viet Nam." https://data.worldbank.org/indicator/SL.UEM.1524.ZS?locations=VN*

*[1.2-S3] World Bank. "Unemployment, youth total (% of total labor force ages 15-24) (national estimate) - Viet Nam." https://data.worldbank.org/indicator/SL.UEM.1524.NE.ZS?locations=VN*

*[1.2-S4] TopDev. "Ra mắt Báo cáo Thị trường IT Việt Nam 2024-2025: Cơ hội, Thách thức và Động lực Mới cho Ngành Công nghệ." https://topdev.vn/blog/bao-cao-thi-truong-it-viet-nam-2024/*

*[1.3-S1] World Economic Forum. "The Future of Jobs Report 2025." https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/*

*[1.3-S2] National Association of Colleges and Employers (NACE). "What is Career Readiness?" https://www.naceweb.org/career-readiness/competencies/career-readiness-defined*

*[1.4-S1] University of Michigan Career Center. "Interviewing Resources." https://careercenter.umich.edu/content/interviewing-resources*

*[1.4-S2] Harvard FAS Mignone Center for Career Success. "Technical Interviews." https://careerservices.fas.harvard.edu/resources/technical-interviews/*

*[1.5-S1] AI Mock Interview internal final report survey: `docs/final_report/Chuong2.md`.*

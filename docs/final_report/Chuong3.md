# Chương 3. Cơ Sở Lý Thuyết Và Công Nghệ Nền Tảng

## 3.1 Tổng Quan Bài Toán AI Mock Interview Coach

InterviewAI là hệ thống luyện phỏng vấn xin việc dựa trên trí tuệ nhân tạo, được thiết kế để phục vụ sinh viên năm cuối và fresher CNTT Việt Nam. Hệ thống mô phỏng một buổi phỏng vấn thực tế: người dùng cung cấp thông tin về vị trí ứng tuyển, trả lời câu hỏi bằng văn bản hoặc giọng nói, và nhận phản hồi chi tiết từ AI sau mỗi câu trả lời.

### 3.1.1 Luồng dữ liệu tổng quan

**Đầu vào (Input)**

| Dữ liệu đầu vào | Nguồn | Vai trò trong hệ thống |
| --- | --- | --- |
| Job Description (JD) | Người dùng nhập thủ công | Cơ sở để AI sinh câu hỏi phù hợp với vị trí ứng tuyển |
| Cấu hình phiên phỏng vấn | Người dùng chọn trước khi bắt đầu | Xác định loại phỏng vấn (HR / Technical / Mixed), ngôn ngữ phản hồi, bộ rubric chấm điểm (Context Pack: VN hoặc Western) |
| Câu trả lời văn bản | Người dùng nhập qua giao diện | Được gửi trực tiếp đến pipeline đánh giá |
| Câu trả lời giọng nói | Người dùng ghi âm qua trình duyệt | Được chuyển thành văn bản qua Speech-to-Text trước khi đánh giá |

**Xử lý (Processing)**

Hệ thống thực hiện bốn tác vụ chính, tất cả đều chạy bất đồng bộ qua hàng đợi BullMQ:

1. **Sinh câu hỏi**: Khi phiên được tạo, hệ thống kết hợp hai nguồn — AI sinh 1 trong 5 câu dựa trên JD, phần còn lại lấy từ question bank sẵn có. Cách tiếp cận lai này đảm bảo câu hỏi vừa cá nhân hóa theo JD vừa ổn định về chất lượng.

2. **Chuyển giọng nói thành văn bản**: Câu trả lời giọng nói được tải lên Supabase Storage, sau đó TranscriptionProcessor gọi OpenAI Whisper API để phiên âm thành văn bản.

3. **Đánh giá câu trả lời và sinh Surgical Feedback**: Với mỗi câu trả lời, FeedbackProcessor gọi LLM với câu hỏi, câu trả lời nguyên văn, và rubric chấm điểm. LLM trả về điểm số tổng hợp (1–100), câu trả lời mẫu, nhận xét tổng quát, và danh sách các đoạn được highlight trong câu trả lời gốc kèm chú thích cụ thể.

4. **Tổng hợp báo cáo phiên**: Khi người dùng kết thúc phiên, ComprehensiveReportProcessor tổng hợp tất cả feedbacks thành báo cáo gồm 4 phần: tóm tắt tổng quan, phân tích giao tiếp, heatmap năng lực theo domain, và kế hoạch hành động.

**Đầu ra (Output)**

| Đầu ra | Thời điểm xuất hiện | Nội dung |
| --- | --- | --- |
| Danh sách câu hỏi | Ngay sau khi tạo phiên | Câu hỏi có thứ tự, phân loại theo competency domain và độ khó |
| Surgical Feedback theo câu | Sau khi nộp từng câu trả lời | Điểm số, câu trả lời mẫu, nhận xét tổng quát, đoạn highlight kèm gợi ý cải thiện |
| Báo cáo tổng hợp | Sau khi kết thúc phiên | Executive summary, phân tích giao tiếp, heatmap năng lực, kế hoạch hành động |
| Lịch sử phiên | Lưu trữ lâu dài | Danh sách phiên đã luyện, điểm số, ngày thực hiện |

### 3.1.2 Đặc điểm kỹ thuật nổi bật

Hệ thống được thiết kế theo kiến trúc event-driven: mỗi hành động của người dùng (tạo phiên, nộp câu trả lời, kết thúc phiên) enqueue một job vào BullMQ. Giao diện người dùng nhận cập nhật trạng thái qua Server-Sent Events thay vì polling. Toàn bộ đầu ra của AI được kiểm soát qua JSON schema validation để đảm bảo tính nhất quán.

## 3.2 Cơ sở lý thuyết về phỏng vấn tuyển dụng và Mock Interview

### 3.2.1 Tổng quan về phỏng vấn tuyển dụng trong ngành Công nghệ thông tin

Phần này giới thiệu khái niệm phỏng vấn tuyển dụng và vai trò của phỏng vấn trong quá trình đánh giá ứng viên CNTT. Trong lĩnh vực này, phỏng vấn không chỉ kiểm tra kiến thức chuyên môn mà còn đánh giá khả năng tư duy, giao tiếp, giải quyết vấn đề, làm việc nhóm và mức độ phù hợp với môi trường làm việc.

Nội dung chính:

* Khái niệm phỏng vấn tuyển dụng.
* Vai trò của phỏng vấn trong tuyển dụng CNTT.
* Đặc điểm của phỏng vấn đối với sinh viên năm cuối và fresher.
* Sự khác biệt giữa đánh giá kiến thức kỹ thuật và đánh giá hành vi, thái độ.

---

### 3.2.2. Các loại hình phỏng vấn chính trong tuyển dụng CNTT

Phần này giới thiệu hai loại phỏng vấn chính mà đề tài tập trung hỗ trợ: **Technical Interview** và **Behavioral Interview**.

| Loại phỏng vấn       | Mục đích chính                                                       | Nội dung đánh giá                                                |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Technical Interview  | Đánh giá kiến thức chuyên môn và khả năng giải quyết vấn đề kỹ thuật | Lập trình, database, API, thuật toán, hệ thống, dự án            |
| Behavioral Interview | Đánh giá thái độ, kỹ năng mềm và cách ứng viên xử lý tình huống      | Giao tiếp, teamwork, trách nhiệm, tư duy học hỏi, xử lý khó khăn |

Hai loại phỏng vấn này có mục tiêu khác nhau nên quy trình, nhóm câu hỏi và tiêu chí đánh giá cũng cần được phân tích riêng.

---

### 3.2.3. Technical Interview

#### a. Khái niệm và mục đích

Technical Interview là hình thức phỏng vấn tập trung vào năng lực chuyên môn của ứng viên. Với ứng viên CNTT, nội dung thường xoay quanh kiến thức lập trình, cơ sở dữ liệu, thuật toán, framework, thiết kế hệ thống và các dự án đã thực hiện.

Mục đích chính là đánh giá xem ứng viên có đủ kiến thức nền tảng, khả năng tư duy kỹ thuật và năng lực giải quyết vấn đề phù hợp với vị trí ứng tuyển hay không.

#### b. Quy trình cơ bản của Technical Interview

Một buổi Technical Interview thường có quy trình như sau:

1. Ứng viên giới thiệu ngắn gọn về bản thân và định hướng kỹ thuật.
2. Người phỏng vấn hỏi về công nghệ, ngôn ngữ lập trình hoặc framework ứng viên đã sử dụng.
3. Ứng viên trình bày một hoặc một số dự án đã thực hiện.
4. Người phỏng vấn đặt câu hỏi chuyên sâu về kiến trúc, database, API, authentication, testing hoặc xử lý lỗi trong dự án.
5. Có thể có câu hỏi giải quyết vấn đề, thuật toán hoặc tình huống kỹ thuật.
6. Người phỏng vấn đánh giá cách ứng viên tư duy, giải thích và bảo vệ lựa chọn kỹ thuật.

#### c. Các nhóm câu hỏi thường gặp trong Technical Interview

* Câu hỏi về ngôn ngữ lập trình.
* Câu hỏi về cơ sở dữ liệu.
* Câu hỏi về API và backend.
* Câu hỏi về frontend nếu ứng tuyển vị trí frontend/fullstack.
* Câu hỏi về thuật toán và cấu trúc dữ liệu.
* Câu hỏi về kiến trúc hệ thống.
* Câu hỏi về bảo mật, authentication, authorization.
* Câu hỏi về testing, debugging và xử lý lỗi.
* Câu hỏi về dự án cá nhân hoặc dự án học tập.

Ví dụ:

* Vì sao bạn chọn NestJS cho backend?
* REST API là gì?
* JWT hoạt động như thế nào?
* Bạn thiết kế database cho hệ thống này ra sao?
* Trong dự án, bạn gặp lỗi kỹ thuật nào và đã xử lý thế nào?

#### d. Tiêu chí đánh giá trong Technical Interview

| Tiêu chí                     | Ý nghĩa                                     |
| ---------------------------- | ------------------------------------------- |
| Kiến thức chuyên môn         | Ứng viên hiểu đúng các khái niệm kỹ thuật   |
| Tư duy giải quyết vấn đề     | Biết phân tích vấn đề và đưa ra hướng xử lý |
| Khả năng giải thích kỹ thuật | Trình bày rõ ràng, dễ hiểu                  |
| Kinh nghiệm dự án            | Hiểu rõ vai trò và phần việc đã làm         |
| Tính logic                   | Câu trả lời có cấu trúc và hợp lý           |
| Khả năng học hỏi             | Biết nhìn nhận hạn chế và hướng cải thiện   |

---

### 3.2.4. Behavioral Interview

#### a. Khái niệm và mục đích

Behavioral Interview là hình thức phỏng vấn tập trung vào hành vi, thái độ và cách ứng viên xử lý các tình huống trong học tập hoặc công việc. Nhà tuyển dụng thường dựa vào những trải nghiệm trong quá khứ để đánh giá cách ứng viên có thể phản ứng trong tương lai.

Đối với sinh viên và fresher, Behavioral Interview thường không yêu cầu kinh nghiệm làm việc nhiều, mà tập trung vào dự án học tập, làm việc nhóm, xử lý mâu thuẫn, vượt qua khó khăn và tinh thần học hỏi.

#### b. Quy trình cơ bản của Behavioral Interview

Một buổi Behavioral Interview thường có quy trình như sau:

1. Ứng viên giới thiệu bản thân.
2. Người phỏng vấn hỏi về kinh nghiệm học tập, làm việc nhóm hoặc dự án.
3. Ứng viên kể lại các tình huống cụ thể đã từng trải qua.
4. Người phỏng vấn hỏi sâu về vai trò cá nhân, hành động đã thực hiện và kết quả đạt được.
5. Ứng viên trình bày bài học rút ra hoặc cách cải thiện trong tương lai.
6. Người phỏng vấn đánh giá thái độ, kỹ năng giao tiếp và mức độ phù hợp với môi trường làm việc.

#### c. Các nhóm câu hỏi thường gặp trong Behavioral Interview

* Câu hỏi về giới thiệu bản thân.
* Câu hỏi về điểm mạnh, điểm yếu.
* Câu hỏi về làm việc nhóm.
* Câu hỏi về mâu thuẫn trong nhóm.
* Câu hỏi về khó khăn trong dự án.
* Câu hỏi về áp lực thời gian.
* Câu hỏi về thất bại hoặc lỗi sai đã từng gặp.
* Câu hỏi về mục tiêu nghề nghiệp.
* Câu hỏi về lý do ứng tuyển.

Ví dụ:

* Hãy kể về một lần bạn gặp khó khăn trong dự án.
* Bạn đã từng mâu thuẫn với thành viên trong nhóm chưa?
* Điểm yếu của bạn là gì?
* Bạn học được gì sau một lần thất bại?
* Vì sao bạn muốn ứng tuyển vị trí này?

#### d. Tiêu chí đánh giá trong Behavioral Interview

| Tiêu chí              | Ý nghĩa                                   |
| --------------------- | ----------------------------------------- |
| Đúng trọng tâm        | Trả lời đúng câu hỏi, không lan man       |
| Ví dụ cụ thể          | Có tình huống thực tế để minh họa         |
| Vai trò cá nhân       | Nêu rõ bản thân đã làm gì                 |
| Khả năng tự nhìn nhận | Biết đánh giá điểm mạnh, điểm yếu         |
| Kỹ năng giao tiếp     | Diễn đạt rõ ràng, tự nhiên                |
| Thái độ học hỏi       | Thể hiện tinh thần cầu tiến               |
| Mức độ phù hợp        | Phù hợp với vị trí và môi trường làm việc |

Trong Behavioral Interview, ứng viên thường nên trả lời theo cấu trúc **STAR**:

* Situation: Tình huống
* Task: Nhiệm vụ
* Action: Hành động
* Result: Kết quả

Cấu trúc này giúp câu trả lời rõ ràng, có dẫn chứng và dễ đánh giá hơn.

---

### 3.2.5. So sánh Technical Interview và Behavioral Interview

Phần này giúp làm rõ sự khác biệt giữa hai loại phỏng vấn, từ đó giải thích vì sao hệ thống InterviewAI cần hỗ trợ các kiểu câu hỏi và tiêu chí đánh giá khác nhau.

| Nội dung                  | Technical Interview                                  | Behavioral Interview                                      |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Mục tiêu                  | Đánh giá năng lực kỹ thuật                           | Đánh giá thái độ, hành vi và kỹ năng mềm                  |
| Trọng tâm                 | Kiến thức, tư duy kỹ thuật, dự án                    | Tình huống, cách ứng xử, kinh nghiệm cá nhân              |
| Câu hỏi thường gặp        | API, database, framework, thuật toán, kiến trúc      | Teamwork, khó khăn, mâu thuẫn, điểm mạnh, mục tiêu        |
| Cách trả lời tốt          | Chính xác, logic, có ví dụ kỹ thuật                  | Cụ thể, chân thật, có cấu trúc STAR                       |
| Tiêu chí đánh giá         | Độ đúng kỹ thuật, khả năng phân tích, giải thích     | Sự rõ ràng, thái độ, vai trò cá nhân, bài học rút ra      |
| Vai trò trong InterviewAI | Tạo câu hỏi kỹ thuật và đánh giá nội dung chuyên môn | Tạo câu hỏi hành vi và đánh giá cách trình bày/tình huống |

---

### 3.2.6. Khó khăn của sinh viên và fresher trong từng loại phỏng vấn

Phần này phân tích vấn đề thực tế mà người dùng mục tiêu thường gặp.

Với Technical Interview, sinh viên và fresher thường gặp khó khăn như:

* Hiểu lý thuyết nhưng khó giải thích rõ ràng.
* Không biết trình bày dự án theo góc nhìn kỹ thuật.
* Không nêu được lý do chọn công nghệ.
* Thiếu kinh nghiệm xử lý câu hỏi chuyên sâu.
* Dễ trả lời chung chung, thiếu ví dụ cụ thể.

Với Behavioral Interview, các khó khăn thường gặp là:

* Không biết chọn tình huống phù hợp để kể.
* Trả lời lan man, thiếu cấu trúc.
* Không nêu rõ vai trò cá nhân.
* Khó trình bày điểm yếu hoặc thất bại một cách tích cực.
* Chưa biết liên hệ kinh nghiệm cá nhân với vị trí ứng tuyển.

---

### 3.2.7. Mock Interview và vai trò trong luyện phỏng vấn

Mock Interview là hình thức phỏng vấn giả lập, giúp ứng viên luyện tập trước khi tham gia phỏng vấn thật. Người luyện có thể làm quen với câu hỏi, áp lực phỏng vấn, cách trình bày và cách phản hồi sau khi nhận góp ý.

Mock Interview có thể được chia theo mục tiêu luyện tập:

* Mock Technical Interview: luyện trả lời câu hỏi kỹ thuật, giải thích dự án, xử lý vấn đề chuyên môn.
* Mock Behavioral Interview: luyện trả lời câu hỏi hành vi, tình huống, giới thiệu bản thân và trình bày kinh nghiệm cá nhân.

Giá trị chính của Mock Interview không chỉ nằm ở việc luyện câu hỏi, mà còn ở việc nhận feedback để biết câu trả lời còn thiếu gì và cần cải thiện ở đâu.

---

### 3.2.8. Hạn chế của Mock Interview truyền thống

Mock Interview truyền thống thường đem lại hiệu quả tốt khi có người hướng dẫn phù hợp, nhưng vẫn tồn tại một số hạn chế:

* Phụ thuộc vào mentor, bạn bè hoặc người có kinh nghiệm.
* Khó luyện tập thường xuyên.
* Chất lượng feedback không đồng đều.
* Khó cá nhân hóa theo nhiều JD hoặc vị trí ứng tuyển.
* Khó lưu lại lịch sử luyện tập và theo dõi tiến bộ.
* Sinh viên không phải lúc nào cũng có người hỗ trợ luyện phỏng vấn.

Vì vậy, cần có một công cụ hỗ trợ giúp người học có thể luyện tập chủ động hơn, đặc biệt trong giai đoạn chuẩn bị ban đầu.

---

### 3.2.9. Ứng dụng vào hệ thống InterviewAI

Từ cơ sở lý thuyết trên, hệ thống InterviewAI cần hỗ trợ hai hướng luyện phỏng vấn chính: Technical Interview và Behavioral Interview.

Với Technical Interview, hệ thống có thể:

* Tạo câu hỏi kỹ thuật theo vị trí ứng tuyển hoặc JD.
* Hỏi về công nghệ, dự án, database, API, testing, bảo mật.
* Đánh giá mức độ đúng kỹ thuật, logic và khả năng giải thích.
* Gợi ý cách trả lời rõ ràng và đầy đủ hơn.

Với Behavioral Interview, hệ thống có thể:

* Tạo câu hỏi về tình huống, teamwork, khó khăn, điểm mạnh, điểm yếu.
* Gợi ý người dùng trả lời theo cấu trúc STAR.
* Đánh giá mức độ cụ thể, vai trò cá nhân, cách trình bày và bài học rút ra.
* Đưa ra feedback giúp câu trả lời tự nhiên và thuyết phục hơn.

## 3.3 Xử Lý Ngôn Ngữ Tự Nhiên Và Mô Hình Ngôn Ngữ Lớn

### 3.3.1 Khái Niệm LLM Và Ứng Dụng Trong Phân Tích Câu Trả Lời

#### a. Khái niệm Mô hình Ngôn ngữ Lớn

Mô hình ngôn ngữ lớn (Large Language Model — LLM) là một loại mô hình học sâu được huấn luyện trên tập dữ liệu văn bản khổng lồ để thực hiện các tác vụ xử lý ngôn ngữ tự nhiên. Theo Elastic, "A large language model (LLM) is a model trained using deep learning algorithms and capable of a broad range of natural language processing (NLP) tasks, such as sentiment analysis, conversational question answering, text translation, classification, and generation." [1]

Về kiến trúc, LLM dựa trên mạng nơ-ron transformer — "neural networks designed to detect dependencies between different parts of a sequence of data, regardless of their distance from each other." [1] Cơ chế attention cho phép mô hình đặt trọng số vào các phần của văn bản đầu vào có liên quan nhất đến ngữ cảnh hiện tại, từ đó hiểu được các mối quan hệ xa trong đoạn văn dài mà các kiến trúc trước đó (RNN, LSTM) gặp khó khăn.

Theo tài liệu chính thức của OpenAI, "GPT models are trained to understand natural and formal language" và "can be used across a great variety of tasks including content or code generation, summarization, conversation, creative writing, and more." [2] Một đặc điểm kỹ thuật quan trọng là mô hình xử lý văn bản theo đơn vị token — "1 token is approximately 4 characters or 0.75 words for English text" [2] — thay vì từng từ hay ký tự riêng lẻ.

Trong InterviewAI, GPT-4o (OpenAI) được sử dụng là mô hình chính thông qua Chat Completions API, với tham số cấu hình khác nhau cho từng loại tác vụ (temperature, max_tokens).

#### b. Ứng dụng LLM trong hệ thống InterviewAI

LLM đóng vai trò trung tâm trong bốn tác vụ chính của hệ thống:

**Sinh câu hỏi phỏng vấn**: Dựa trên nội dung JD và loại phỏng vấn được chọn (HR / Technical / Mixed), LLM phân tích các yêu cầu công việc, xác định các năng lực cần đánh giá, và sinh ra câu hỏi phù hợp với từng competency domain. Mô hình có khả năng hiểu ngữ cảnh đủ để phân biệt câu hỏi cho vị trí Backend Developer với Frontend Developer, hay cho fresher với mid-level engineer.

**Đánh giá câu trả lời**: LLM nhận đầu vào là câu hỏi, câu trả lời của ứng viên, và rubric chấm điểm theo context pack. Khả năng hiểu ngữ nghĩa cho phép mô hình đánh giá câu trả lời không chỉ theo nghĩa từ ngữ mà còn theo chất lượng lập luận, tính đầy đủ của nội dung và cấu trúc trình bày.

**Sinh Surgical Feedback**: Đây là tác vụ phức tạp nhất — LLM cần xác định các đoạn văn bản cụ thể trong câu trả lời (theo vị trí ký tự `start_index`, `end_index`), phân loại mỗi đoạn là điểm mạnh hay điểm cần cải thiện, và viết gợi ý cải thiện cụ thể kèm phiên bản cải viết.

**Tổng hợp báo cáo**: Sau khi thu thập feedback từ tất cả câu trả lời trong phiên, LLM tổng hợp thành kế hoạch hành động dài hạn phù hợp với điểm yếu cụ thể của từng người dùng.

---
*[1] Elastic. "What is a Large Language Model?" https://www.elastic.co/what-is/large-language-models*
*[2] OpenAI. "API Concepts." https://developers.openai.com/api/docs/concepts*

### 3.3.2 Prompt Engineering

#### a. Khái niệm

Theo tài liệu chính thức của OpenAI, "Prompt engineering is the process of writing effective instructions for a model, such that it consistently generates content that meets your requirements." [3] Đây là kỹ năng thiết kế đầu vào cho LLM để mô hình tạo ra đầu ra đúng ý muốn — không phải lập trình truyền thống mà là điều hướng hành vi của mô hình thông qua ngôn ngữ tự nhiên.

Microsoft Azure mô tả bản chất thực tế của công việc này: "In practice, the prompt acts to help the model complete the desired task, but it's more of an art than a science, often requiring experience and intuition to craft a successful prompt." [4]

Chat Completions API của OpenAI tổ chức cuộc hội thoại theo ba vai (roles):

- **system**: "Provides context and instructions for how the model should behave" [5]
- **user**: "Represents messages from the person interacting with the model" [5]
- **assistant**: "Messages sent by the model in response to user messages" [5]

Theo tài liệu OpenAI, "Developer messages provide the system's rules and business logic like a function definition, while user messages provide inputs and configuration to which the developer message instructions are applied, like arguments to a function." [6]

#### b. Cấu trúc prompt trong InterviewAI

Mỗi lần gọi AI trong hệ thống cấu trúc prompt theo bốn thành phần:

**1. System prompt (định nghĩa vai trò và ràng buộc đầu ra)**

System prompt thiết lập danh tính và quy tắc hành vi của mô hình. Ví dụ từ `prompt-builder.service.ts` — system prompt cho sinh câu hỏi:

```
You are an expert interviewer. Generate relevant, thoughtful interview questions
based on the job description and interview strategy.

Return ONLY a compact valid JSON object with exactly this shape, no markdown
fences, no explanation, no analysis, no prose before or after the JSON.
```

System prompt cho Surgical Feedback bổ sung ràng buộc cụ thể hơn về chất lượng đầu ra:

```
You are an expert interview coach. Evaluate the candidate's answer and provide
surgical, actionable feedback.

CRITICAL: model_answer must be a complete, concrete example answer of 3-4
concise sentences written as if a strong candidate is actually speaking. It
must directly answer the question using specific details, demonstrate best
practices, and read like a real spoken response — NOT a list of improvement
tips, NOT meta-advice about what to say.
```

**2. Output schema (đặc tả cấu trúc JSON bắt buộc)**

Schema được nhúng trực tiếp vào prompt thay vì dùng riêng, buộc mô hình tuân thủ cấu trúc cụ thể. Ví dụ schema cho Surgical Feedback:

```json
{
  "overall_score": <integer 1-100>,
  "model_answer": "<complete 3-4 sentence example answer>",
  "key_takeaway": "<one concise insight>",
  "annotated_segments": [
    {
      "segment_text": "<exact substring from candidate answer>",
      "start_index": <integer>,
      "end_index": <integer>,
      "highlight_level": "strength" | "improvement",
      "annotation": "<why>",
      "suggestion": "<optional>",
      "improved_version": "<optional>"
    }
  ]
}
```

**3. Context (dữ liệu runtime được inject)**

Context được truyền qua user message và thay đổi theo từng request: nội dung JD, loại phỏng vấn, câu hỏi cụ thể, câu trả lời của ứng viên, và context pack (rubric VN hoặc Western).

**4. Versioning prompt**

Prompt config được tách thành các file riêng theo quy ước `<purpose>-v<major>.<minor>.ts` (ví dụ: `surgical-feedback-v1.1.ts`). Mỗi file lưu version, temperature và max_tokens. Khi cần thay đổi hành vi, tạo file version mới thay vì sửa file cũ — đảm bảo khả năng rollback và theo dõi lịch sử thay đổi. Phiên bản hiện tại: `question-gen-v1.0`, `surgical-feedback-v1.1`, `comprehensive-report-v1.0`.

---
*[3] OpenAI. "Prompt Engineering." https://developers.openai.com/api/docs/guides/prompt-engineering*
*[4] Microsoft Azure. "Prompt Engineering Techniques." https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/prompt-engineering*
*[5] OpenAI. "Chat Completions API Reference." https://developers.openai.com/api/docs/api-reference/chat*
*[6] OpenAI. "Prompt Guidance." https://developers.openai.com/api/docs/guides/prompt-guidance*

### 3.3.3 Structured Output Và Kiểm Soát Kết Quả AI

#### a. Vấn đề với đầu ra tự do của LLM

LLM về bản chất sinh ra văn bản tự do — mô hình không có cơ chế bảo đảm nội sinh nào buộc đầu ra phải theo cấu trúc cụ thể. Khi ứng dụng cần xử lý đầu ra của AI theo chương trình (parse JSON, truy cập các trường cụ thể), đầu ra không nhất quán gây ra lỗi runtime. Các vấn đề thường gặp: thiếu trường bắt buộc, sai kiểu dữ liệu, giá trị enum không hợp lệ, hoặc mô hình trả về văn bản giải thích thay vì JSON thuần.

#### b. Structured Outputs

Theo tài liệu chính thức của OpenAI, Structured Outputs đảm bảo "the model will always generate responses that adhere to your supplied JSON Schema." [7] Lợi ích trực tiếp: "No need to validate or retry incorrectly formatted responses" và "No need for strongly worded prompts to achieve consistent formatting." [7]

OpenAI phân biệt hai chế độ:
- **JSON mode** (`response_format: { type: "json_object" }`): đảm bảo đầu ra là JSON hợp lệ, nhưng không đảm bảo schema cụ thể.
- **Structured Outputs** (`response_format: { type: "json_schema", json_schema: {...} }`): đảm bảo đầu ra khớp chính xác với JSON Schema được cung cấp.

#### c. Chiến lược kiểm soát đầu ra trong InterviewAI

Hệ thống áp dụng ba lớp kiểm soát:

**Lớp 1 — Schema trong prompt**: Cấu trúc JSON được mô tả chi tiết ngay trong system prompt, kèm ghi chú về kiểu dữ liệu (integer, string) và ràng buộc (ví dụ: `overall_score` từ 1–100, `highlight_level` chỉ nhận `"strength"` hoặc `"improvement"`). Phương pháp này hoạt động tốt với các model mạnh như GPT-4o.

**Lớp 2 — JSON extraction fallback trong OpenAIGateway**: Trước khi validate, `OpenAIGateway` thử trích xuất JSON từ đầu ra thô theo nhiều pattern: code block có markdown fence (```json ... ```), object literal đứng độc lập, hoặc raw string. Đây là lớp bảo vệ khi model bao quanh JSON bằng văn bản giải thích.

**Lớp 3 — Runtime validation bằng Zod**: `ZodValidatorService` validate object đã parse theo Zod schema được định nghĩa trong `pipeline.schemas.ts`. Nếu validation thất bại (thiếu trường, sai kiểu), hệ thống không crash mà chuyển sang sử dụng fallback content được định nghĩa trước trong `fallback-content.ts`.

Ví dụ Zod schema cho Surgical Feedback:

```typescript
const AnnotatedSegmentSchema = z.object({
  segment_text: z.string(),
  start_index: z.number().int(),
  end_index: z.number().int(),
  highlight_level: z.enum(['strength', 'improvement']),
  annotation: z.string(),
  suggestion: z.string().optional(),
  improved_version: z.string().optional(),
});

const SurgicalFeedbackSchema = z.object({
  overall_score: z.number().int().min(1).max(100),
  model_answer: z.string(),
  key_takeaway: z.string(),
  annotated_segments: z.array(AnnotatedSegmentSchema).max(2),
});
```

---
*[7] OpenAI. "Structured Outputs." https://developers.openai.com/api/docs/guides/structured-outputs*

## 3.4 Speech-to-Text Và Phân Tích Câu Trả Lời Bằng Giọng Nói

### 3.4.1 Cơ sở lý thuyết Speech-to-Text

Speech-to-Text (STT) là công nghệ chuyển đổi tín hiệu âm thanh giọng nói thành văn bản. Trong bối cảnh phỏng vấn, câu trả lời bằng giọng nói là dạng tự nhiên nhất — người dùng không cần gõ phím, có thể tập trung vào nội dung trình bày.

OpenAI cung cấp Whisper — hệ thống nhận dạng giọng nói tự động (Automatic Speech Recognition — ASR) được mô tả trên blog chính thức là "trained on 680,000 hours of multilingual and multitask supervised data collected from the web." [8] Quy mô dữ liệu huấn luyện này giúp Whisper đạt độ chính xác cao trên nhiều ngôn ngữ, bao gồm tiếng Việt và tiếng Anh — hai ngôn ngữ mà InterviewAI hỗ trợ.

Theo tài liệu Audio API của OpenAI, "The Audio API provides two speech to text endpoints: transcriptions and translations" [9] và hỗ trợ các định dạng file âm thanh phổ biến: "mp3, mp4, mpeg, mpga, m4a, wav, and webm." [9]

### 3.4.2 Tích hợp trong InterviewAI

Luồng xử lý câu trả lời giọng nói trong hệ thống:

1. Người dùng ghi âm câu trả lời qua trình duyệt (Web Audio API), file được lưu ở định dạng WebM.
2. File audio được tải lên Supabase Storage. URL file, thời lượng (giây) và kích thước (byte) được lưu vào bản ghi `UserAnswer`.
3. Một job được enqueue vào queue `transcription` với thông tin session, question và URL file.
4. `TranscriptionProcessor` xử lý job: tải file từ URL, gọi OpenAI Whisper API (`whisper-1`), nhận văn bản phiên âm.
5. Văn bản phiên âm được lưu vào `UserAnswer.answerText`. Flag `feedbackGenerated = false` kích hoạt một job tiếp theo trong queue `feedback`.

Việc tách transcription và feedback thành hai job độc lập cho phép retry từng bước nếu một trong hai thất bại, không ảnh hưởng đến bước còn lại.

### 3.4.3 Phạm vi triển khai trong GR1

Trong phiên bản GR1, hệ thống đã triển khai đầy đủ tính năng ghi âm, upload và phiên âm giọng nói. Các chỉ số giọng nói mở rộng — tốc độ nói (words per minute), tỷ lệ khoảng lặng, tần suất filler words (ừm, ừ, like) — được dự kiến cho phiên bản tiếp theo. Dữ liệu thô (audio duration, file size) đã được thu thập sẵn qua trường `voiceMetricsJson` trong schema, chuẩn bị cho việc tích hợp các chỉ số này trong tương lai.

---
*[8] OpenAI. "Introducing Whisper." https://openai.com/index/whisper/*
*[9] OpenAI. "Speech to Text — Audio API." https://developers.openai.com/api/docs/guides/speech-to-text*

## 3.5 Feedback Tự Động Và Surgical Feedback

### 3.5.1 Khái niệm Surgical Feedback

Surgical Feedback là cơ chế phản hồi cốt lõi của InterviewAI, lấy tên từ tính chính xác của nó: thay vì nhận xét tổng quát ("câu trả lời còn thiếu ví dụ"), hệ thống chỉ ra đúng đoạn văn bản cụ thể trong câu trả lời của ứng viên cần cải thiện hoặc đáng ghi nhận.

Cách tiếp cận này giải quyết hạn chế của feedback truyền thống trong mock interview — người hướng dẫn thường đưa ra nhận xét chung chung do thiếu thời gian hoặc không phân tích kỹ từng câu trả lời. Bằng cách highlight chính xác vị trí ký tự (`start_index`, `end_index`) trong câu trả lời gốc, người dùng hiểu ngay đoạn nào cần sửa và sửa thế nào, không cần suy đoán.

### 3.5.2 Các thành phần của Surgical Feedback

| Thành phần feedback | Ý nghĩa | Dữ liệu đầu vào | Đầu ra mong đợi |
| --- | --- | --- | --- |
| Điểm tổng (`overall_score`) | Điểm số tổng hợp chất lượng câu trả lời, cho phép so sánh giữa các câu và theo dõi tiến bộ qua thời gian | Câu hỏi, câu trả lời nguyên văn, rubric chấm điểm theo context pack (VN hoặc Western) | Số nguyên từ 1 đến 100 |
| Câu trả lời mẫu (`model_answer`) | Ví dụ cụ thể về câu trả lời tốt, viết như lời một ứng viên thực sự đang trả lời, không phải gợi ý trừu tượng | Câu hỏi, loại phỏng vấn, vị trí ứng tuyển từ JD | Đoạn văn 3–4 câu, viết ở ngôi thứ nhất, có nội dung cụ thể và thực tế (không phải danh sách gạch đầu dòng hay meta-advice) |
| Nhận xét tổng quát (`key_takeaway`) | Điểm mấu chốt nhất về chất lượng câu trả lời — điều người dùng cần nhớ nhất | Câu trả lời và điểm tổng | Một câu nhận xét súc tích, chỉ ra vấn đề hoặc điểm mạnh nổi bật nhất |
| Đoạn được annotate (`annotated_segments`) | Highlight đoạn văn cụ thể trong câu trả lời gốc, phân loại là điểm mạnh (strength) hoặc cần cải thiện (improvement), kèm giải thích và gợi ý viết lại | Câu trả lời nguyên văn (để xác định offset ký tự chính xác) | Tối đa 2 đoạn; mỗi đoạn gồm `segment_text`, `start_index`, `end_index`, `highlight_level`, `annotation`, và tùy chọn `suggestion` + `improved_version` |
| Kế hoạch hành động (`action_plan`) | Danh sách hành động cụ thể người dùng có thể thực hiện để cải thiện kỹ năng phỏng vấn, tổng hợp từ toàn bộ phiên | Tất cả feedbacks trong session và điểm trung bình theo competency domain | Danh sách 3–5 hành động có thể thực hiện ngay, không phải lời khuyên chung chung |

### 3.5.3 Annotated Transcript

Tính năng annotated transcript hiển thị câu trả lời của ứng viên với các đoạn được highlight bằng màu sắc:

- Màu xanh lá (`strength`): đoạn trả lời tốt, đúng trọng tâm, có ví dụ cụ thể.
- Màu vàng/cam (`improvement`): đoạn cần cải thiện — có thể là quá chung chung, thiếu ví dụ, hoặc không trả lời đúng câu hỏi.

Mỗi đoạn highlight có thể click để xem annotation chi tiết và phiên bản được cải viết (`improved_version`). Cách trình bày này giúp người dùng thấy ngay sự tương phản giữa cách mình viết và cách tốt hơn mà không cần đọc toàn bộ nhận xét từng dòng.

## 3.6 Kiến Trúc Ứng Dụng Web Hiện Đại

### 3.6.1 Frontend Với Next.js Và React

#### a. Tổng quan về Next.js

Next.js là framework xây dựng ứng dụng web dựa trên React. Theo tài liệu chính thức, "Next.js is a React framework for building full-stack web applications." [10] Next.js bổ sung cho React các khả năng cần thiết cho ứng dụng production: routing, data fetching, caching, và tối ưu hiệu năng — theo mô tả: "You can use React to build your UI, then incrementally adopt Next.js features to solve common application requirements such as routing, data fetching, and caching - all while improving the developer and end-user experience." [10]

InterviewAI sử dụng Next.js 16.2 với React 19 và TypeScript 5.7.

#### b. App Router

App Router là hệ thống routing mới của Next.js, được mô tả là "a file-system based router that uses React's latest features such as Server Components, Suspense, and Server Functions." [11] Routing dựa trên cấu trúc thư mục: mỗi thư mục trong `app/` ánh xạ thành một route URL, không cần cấu hình thêm.

Theo tài liệu Next.js, "By default, layouts and pages are Server Components, which lets you fetch data and render parts of your UI on the server, optionally cache the result, and stream it to the client." [11] Khi cần tương tác hoặc truy cập browser API, "you can use Client Components to layer in functionality." [11]

Trong InterviewAI, sự phân tách Server/Client Component được áp dụng theo nguyên tắc: trang danh sách phiên và trang báo cáo là Server Components (fetch dữ liệu ở server, giảm waterfall request); AudioRecorder và giao diện interview real-time là Client Components (cần Web Audio API và state management).

#### c. TypeScript và Tailwind CSS v4

TypeScript cung cấp kiểm tra kiểu tĩnh tại compile time: kiểu dữ liệu của API response được định nghĩa trong `client/lib/types.ts` và được dùng xuyên suốt tất cả component. Lỗi sai kiểu dữ liệu được phát hiện sớm thay vì ở runtime.

Tailwind CSS v4 với utility-first approach cho phép styling trực tiếp trong JSX mà không cần tạo file CSS riêng, giảm context switching khi phát triển component.

---
*[10] Next.js. "React Foundations." https://nextjs.org/learn/react-foundations/what-is-react-and-nextjs*
*[11] Next.js. "App Router Getting Started." https://nextjs.org/docs/app/getting-started*

### 3.6.2 Backend Với NestJS

#### a. Tổng quan về NestJS

Theo tài liệu chính thức, "Nest is a framework for building efficient, scalable Node.js server-side applications. It uses progressive JavaScript, is built with and fully supports TypeScript [...] and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming)." [12]

Lý do chính NestJS được chọn cho InterviewAI là vấn đề kiến trúc mà framework giải quyết: "Node.js [...] none of them effectively solve the main problem of — Architecture. Nest provides an out-of-the-box application architecture which allows developers and teams to create highly testable, scalable, loosely coupled, and easily maintainable applications. The architecture is heavily inspired by Angular." [12]

InterviewAI sử dụng NestJS 11 với TypeScript 5.7.

#### b. Ba thành phần kiến trúc cốt lõi

**Module**

Theo NestJS docs, "A module is a class annotated with the @Module() decorator. The @Module() decorator provides metadata that Nest uses to organize the application structure." [13] Mỗi module đóng gói một domain nghiệp vụ. InterviewAI có 8 module chính: AuthModule, SessionModule, TurnModule, AiModule, ReportModule, QuestionBankModule, UserModule, CommonModule.

**Controller**

"Controllers are responsible for handling incoming requests and returning responses to the client." [14] Controller định nghĩa route handler bằng decorators (`@Get`, `@Post`, `@Patch`), áp dụng Guard để xác thực, và ủy thác logic nghiệp vụ sang Service. Controller không chứa business logic.

**Provider (Service)**

"Providers are a fundamental concept in Nest. [...] The main idea of a provider is that it can be injected as a dependency; this means objects can create various relationships with each other." [15] Dependency injection được NestJS runtime quản lý: "Nest will either create an instance of [CatsService], cache it, and return it, or if one is already cached, return the existing instance." [15] Theo đó mọi service đều là singleton trong phạm vi module.

Khai báo service là injectable: `@Injectable()` decorator "declares the [class] as a class that can be managed by the Nest IoC container." [15]

#### c. Các cơ chế bổ sung trong InterviewAI

**ValidationPipe**: Pipe toàn cục validate DTO đầu vào bằng `class-validator` decorators trước khi request đến controller. Request không hợp lệ (thiếu trường, sai kiểu) bị từ chối với HTTP 400 trước khi đến business logic.

**Exception Filter**: Global exception filter bắt tất cả exception trong ứng dụng và trả về response chuẩn hóa với `ErrorCode` enum. Mỗi loại lỗi domain (session không tồn tại, quota AI hết, file quá lớn) có code riêng, giúp client xử lý lỗi có cấu trúc thay vì chỉ dựa vào HTTP status code.

**Guards**: JWT Guard xác thực token trên mọi endpoint được bảo vệ. Admin Guard giới hạn quyền truy cập một số endpoint quản trị. Guard chạy trước controller, request bị từ chối với HTTP 401/403 nếu không pass.

---
*[12] NestJS. "Introduction." https://docs.nestjs.com/*
*[13] NestJS. "Modules." https://docs.nestjs.com/modules*
*[14] NestJS. "Controllers." https://docs.nestjs.com/controllers*
*[15] NestJS. "Providers." https://docs.nestjs.com/providers*

### 3.6.3 REST API Và Server-Sent Events

#### a. REST API cho request/response đồng bộ

REST (Representational State Transfer) là kiến trúc API dựa trên HTTP, phù hợp cho các thao tác CRUD có kết quả ngay lập tức. InterviewAI dùng REST cho:

- Tạo phiên phỏng vấn (`POST /api/v1/sessions`)
- Nộp câu trả lời (`POST /api/v1/turns`)
- Lấy danh sách phiên, chi tiết báo cáo, lịch sử câu hỏi

Mỗi request HTTP trả về response hoàn chỉnh trong một roundtrip. Phù hợp khi dữ liệu có sẵn ngay hoặc thao tác hoàn thành nhanh.

#### b. Server-Sent Events cho cập nhật trạng thái

SSE là cơ chế truyền dữ liệu một chiều từ server đến client qua kết nối HTTP duy trì lâu dài. Theo MDN Web Docs, "Traditionally, a web page has to send a request to the server to receive new data; that is, the page requests data from the server. With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page. These incoming messages can be treated as Events + data inside the web page." [16]

W3C đã chuẩn hóa SSE thành Recommendation vào năm 2015. Giao thức dựa trên HTTP với MIME type `text/event-stream`; mỗi event là một khối text theo format:

```
event: session_status
data: {"status":"active","sessionId":"abc123"}

```

So sánh SSE và WebSocket:

| Thuộc tính | SSE | WebSocket |
| --- | --- | --- |
| Chiều truyền | Một chiều (server → client) | Hai chiều |
| Protocol | HTTP thông thường | WS/WSS (protocol riêng) |
| Tự động reconnect | Có (built-in trong EventSource API) | Phải tự implement |
| Browser API | `EventSource` | `WebSocket` |
| Kiểu dữ liệu | Text only | Text + Binary |

#### c. Ứng dụng SSE trong InterviewAI

SSE được dùng cho hai trường hợp cần cập nhật trạng thái từ server:

**Session status update**: Sau khi tạo phiên, client subscribe vào `/api/v1/sessions/:id/events`. Khi `QuestionGenerationProcessor` hoàn thành (trạng thái `generating` → `active`), server publish event qua Redis Pub/Sub. `SseService` nhận event từ Redis và forward đến client đang subscribe. Client nhận được event thì điều hướng đến trang phỏng vấn tự động mà không cần reload trang.

**Report generation completion**: Tương tự, khi `ComprehensiveReportProcessor` hoàn thành, client đang đợi trên trang report nhận event và hiển thị báo cáo mà không cần polling.

Lý do chọn SSE thay vì WebSocket: giao tiếp chỉ cần một chiều (server → client), SSE đơn giản hơn, không cần upgrade protocol, và tự động reconnect khi mất kết nối.

---
*[16] MDN Web Docs. "Server-sent events." https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events*

## 3.7 Xử Lý Bất Đồng Bộ Với Hàng Đợi

### 3.7.1 Tại sao cần xử lý bất đồng bộ

Các tác vụ AI trong InterviewAI có đặc điểm chung: thời gian thực thi không xác định, phụ thuộc vào mạng và mô hình bên ngoài, và có thể thất bại tạm thời (rate limit, timeout).

Thời gian thực thi ước tính cho từng tác vụ:

| Tác vụ | Thời gian tối thiểu | Thời gian tối đa |
| --- | --- | --- |
| Sinh câu hỏi | 30 giây | 2 phút |
| Phiên âm giọng nói | 15 giây | 1 phút |
| Sinh Surgical Feedback | 15 giây | 5 phút |
| Sinh báo cáo tổng hợp | 30 giây | 1 phút |

Nếu xử lý đồng bộ (block HTTP request cho đến khi AI trả về), hệ thống gặp hai vấn đề:
- **Timeout**: Server và browser đều có timeout mặc định (30 giây); các tác vụ dài hơn sẽ bị cắt giữa chừng.
- **Không có retry**: Nếu AI trả về lỗi tạm thời (rate limit, network), không có cơ chế thử lại tự động.

Xử lý bất đồng bộ qua hàng đợi giải quyết cả hai vấn đề: HTTP request trả về ngay (202 Accepted), tác vụ nặng được xử lý nền, kết quả được đẩy đến client khi sẵn sàng.

### 3.7.2 BullMQ và Redis

Theo tài liệu chính thức, "BullMQ is a Node.js library that implements a fast and robust queue system built on top of Redis that helps in resolving many modern age micro-services architectures." [17]

BullMQ sử dụng Redis làm backend lưu trữ job. Redis đảm bảo tính bền vững: ngay cả khi server NestJS restart, job chưa xử lý vẫn còn trong queue và sẽ được tiếp tục. Về Worker, tài liệu BullMQ mô tả: "Workers are instances capable of processing jobs. More specifically, a worker is equivalent to a 'message' receiver in a traditional message queue." [17]

### 3.7.3 Cấu hình hàng đợi trong InterviewAI

InterviewAI có 4 queue độc lập:

| Queue | Trigger | Processor | Số lần retry tối đa |
| --- | --- | --- | --- |
| `question-generation` | POST /sessions (tạo phiên mới) | `QuestionGenerationProcessor` | 2 |
| `transcription` | POST /turns với audio | `TranscriptionProcessor` | 2 |
| `feedback` | Sau khi có answer text (trực tiếp hoặc từ transcription) | `FeedbackProcessor` | 2 |
| `comprehensive-report` | PATCH session status = completed | `ComprehensiveReportProcessor` | 3 |

Tất cả queue kết nối vào Redis qua cấu hình toàn cục trong `BullModule.forRootAsync()`, lấy host/port từ environment variables `REDIS_HOST` và `REDIS_PORT`.

### 3.7.4 Cơ chế retry và fallback

Khi một job thất bại (processor throw exception), BullMQ tự động retry theo số lần được cấu hình. Nếu vượt quá số lần retry, job chuyển sang trạng thái `failed`.

Hệ thống xử lý hai loại lỗi AI:
- **Rate limit tạm thời**: Processor nhận biết lỗi 429 từ OpenAI và retry với exponential backoff (1 giây, 2 giây).
- **Quota hết**: `OpenAIGateway` đặt cooldown 60 giây; trong thời gian này mọi request AI đều bị từ chối ngay, tránh lãng phí retry.

Khi tất cả retry thất bại, hệ thống dùng fallback:
- Sinh câu hỏi thất bại → lấy câu hỏi từ question bank
- Sinh feedback thất bại → lưu pre-written feedback message từ `fallback-content.ts`
- Sinh report thất bại → báo lỗi qua SSE event

---
*[17] BullMQ. "Introduction." https://docs.bullmq.io/guide/introduction*

## 3.8 Cơ Sở Dữ Liệu Và ORM

### 3.8.1 PostgreSQL và Supabase

InterviewAI sử dụng PostgreSQL 15 làm hệ quản trị cơ sở dữ liệu quan hệ, được host trên Supabase. Supabase cung cấp PostgreSQL như một dịch vụ (Database-as-a-Service) kèm authentication JWT và object storage — giúp giảm effort infrastructure trong giai đoạn prototype.

PostgreSQL được chọn vì hỗ trợ JSONB native (lưu rubricJson, contentJson, voiceMetricsJson dưới dạng JSON có thể query), ACID transactions đảm bảo tính nhất quán khi nhiều processor cùng cập nhật session, và partial indexes (được dùng qua `previewFeatures = ["partialIndexes"]` trong Prisma schema).

### 3.8.2 Prisma ORM

Theo tài liệu chính thức, "Prisma ORM is open-source and consists of: Prisma Client: Auto-generated, type-safe ORM interface · Prisma Migrate: Database migration system · Prisma Studio: GUI to view and edit your data." [18]

Đặc điểm quan trọng nhất: "Prisma Client is Prisma ORM's generated, type-safe query builder for Node.js [...] It is tailored to your schema, fully typed, and designed to make common database work feel like ordinary application code." [18] Mỗi khi schema thay đổi, Prisma tái sinh TypeScript types tương ứng — mọi query sai cấu trúc được phát hiện tại compile time thay vì runtime.

InterviewAI dùng `prisma db push` thay vì `prisma migrate dev` để đồng bộ schema vào database (theo ADR-008). Phương pháp này phù hợp với giai đoạn phát triển nhanh khi schema còn thay đổi thường xuyên.

### 3.8.3 Các nhóm bảng chính

**Nhóm người dùng**

`UserProfile` lưu thông tin mở rộng của người dùng (tên, mục tiêu nghề nghiệp) ngoài dữ liệu authentication do Supabase Auth quản lý.

**Nhóm phiên phỏng vấn**

Chuỗi quan hệ chính của hệ thống: `InterviewSession` → `SessionQuestion[]` → `UserAnswer`.

- `InterviewSession`: metadata phiên — loại phỏng vấn (`hr` / `technical` / `mixed`), JD, ngôn ngữ, context pack, trạng thái (`generating` / `active` / `completed` / `error`), điểm tổng phiên.
- `SessionQuestion`: câu hỏi trong phiên — nội dung, thứ tự, competency domain, rubric chấm điểm. Trường `questionBankId` null nếu câu hỏi được AI sinh ra, không null nếu lấy từ question bank.
- `UserAnswer`: câu trả lời của ứng viên — chế độ (`text` / `voice`), nội dung văn bản, URL audio, trạng thái phiên âm.

**Nhóm feedback và báo cáo**

- `AiFeedback`: kết quả đánh giá của AI cho mỗi `UserAnswer` — điểm số, câu trả lời mẫu, nhận xét tổng quát, version prompt đã dùng, cờ fallback.
- `AnnotatedSegment`: danh sách đoạn được highlight trong câu trả lời — vị trí ký tự, loại (strength/improvement), annotation, gợi ý cải thiện.
- `SessionReport`: báo cáo tổng hợp phiên — 4 loại độc lập (`executive_summary`, `comm_analysis`, `competency_heatmap`, `action_plan`), lưu dưới dạng JSONB.

**Nhóm question bank và AI quality log**

- `QuestionBank`: kho câu hỏi dự phòng phân loại theo session type, competency domain và độ khó (1–5).
- `QuestionUsage`: theo dõi câu hỏi nào đã được hiển thị cho người dùng nào, tránh lặp lại.
- `AiQualityLog`: ghi lại mỗi lần gọi AI — model, số token, latency, có dùng fallback không. Phục vụ monitoring và phân tích chi phí.

### 3.8.4 Quan hệ trung tâm

```
InterviewSession (1) ──> SessionQuestion[] (n)
                                │
                                ▼
                         UserAnswer (0..1)
                                │
                    ┌──────────┘
                    ▼
              AiFeedback (0..1)
                    │
                    ▼
           AnnotatedSegment[] (0..n)

InterviewSession (1) ──> SessionReport[] (n)
```

Quan hệ `UserAnswer` → `AiFeedback` có unique constraint, đảm bảo mỗi câu trả lời chỉ có một feedback. Quan hệ `AiFeedback` → `AnnotatedSegment` là one-to-many, tối đa 2 đoạn trong thực tế (giới hạn ở prompt).

### 3.8.5 Question Bank và chiến lược fallback

Question bank đóng vai trò hai lớp:
1. **Hybrid generation**: 4 trong 5 câu hỏi được lấy từ bank theo competency domain phù hợp với JD — nhanh hơn và ổn định hơn so với AI sinh toàn bộ.
2. **Fallback hoàn toàn**: Khi AI generation thất bại sau tất cả retry, toàn bộ câu hỏi lấy từ bank, phiên vẫn hoạt động bình thường.

`QuestionUsage` tracking ngăn người dùng gặp lại câu hỏi đã làm trong phiên trước, dù lấy từ cùng một bank.

---
*[18] Prisma. "What is Prisma ORM?" https://www.prisma.io/docs/orm*
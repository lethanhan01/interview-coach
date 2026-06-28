# Chương 3. Cơ Sở Lý Thuyết Và Công Nghệ Nền Tảng

## 3.1 Tổng Quan Bài Toán AI Mock Interview Coach

> Cần bổ sung: mô tả hệ thống AI mock interview coach dưới góc nhìn chức năng và kỹ thuật.

Gợi ý:

- Input: hồ sơ người dùng, JD, cấu hình session, câu trả lời text/voice.
- Processing: sinh câu hỏi, đánh giá câu trả lời, tạo follow-up, tạo feedback và report.
- Output: danh sách câu hỏi, feedback theo câu, report tổng hợp, action plan.

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

 
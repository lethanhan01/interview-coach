# Chương 3. Cơ Sở Lý Thuyết Và Công Nghệ Nền Tảng

## 3.1 Tổng Quan Bài Toán AI Mock Interview

AI Mock Interview là bài toán xây dựng một hệ thống luyện phỏng vấn xin việc có sự hỗ trợ của trí tuệ nhân tạo. Thay vì chỉ cung cấp danh sách câu hỏi mẫu, hệ thống tổ chức một quy trình luyện tập gần với một buổi phỏng vấn thực tế: người dùng cung cấp thông tin về vị trí ứng tuyển, hệ thống tạo câu hỏi phù hợp, người dùng trả lời bằng văn bản, sau đó nhận phản hồi và báo cáo tổng hợp.

Trong phạm vi đề tài AI Mock Interview, đối tượng chính là sinh viên năm cuối và ứng viên fresher ngành Công nghệ thông tin tại Việt Nam. Đây là nhóm người dùng thường có kiến thức nền tảng và dự án học tập, nhưng chưa có nhiều kinh nghiệm trình bày năng lực trong phỏng vấn. Vì vậy, hệ thống không chỉ kiểm tra "biết hay không biết", mà còn giúp người dùng luyện cách giải thích dự án, trình bày lựa chọn kỹ thuật, trả lời câu hỏi hành vi và tự nhìn lại điểm cần cải thiện [3.2-S5].

Đầu vào chính của bài toán gồm:

- Job Description (JD) hoặc mô tả vị trí ứng tuyển.
- Loại phiên phỏng vấn: HR/Behavioral, Technical hoặc Mixed.
- Hồ sơ luyện tập của người dùng, bao gồm thông tin học vấn, kỹ năng, kinh nghiệm và dự án đã làm.
- Ngôn ngữ và ngữ cảnh phỏng vấn, ví dụ context pack Việt Nam hoặc Western.

Đầu ra chính của hệ thống gồm:

- Danh sách câu hỏi phỏng vấn phù hợp với JD và loại phiên.
- Bản ghi câu trả lời văn bản của người dùng.
- Feedback chi tiết cho từng câu trả lời, bao gồm điểm mạnh, điểm yếu và gợi ý cải thiện.
- Báo cáo tổng hợp sau phiên, giúp người dùng thấy xu hướng năng lực và kế hoạch luyện tập tiếp theo.

Về bản chất, AI Mock Interview là sự kết hợp của ba nhóm bài toán: phỏng vấn tuyển dụng, hệ thống luyện tập có phản hồi và xử lý ngôn ngữ tự nhiên. Phần phỏng vấn tuyển dụng giúp xác định loại câu hỏi và tiêu chí đánh giá. Phần luyện tập có phản hồi giúp người dùng cải thiện qua nhiều lần thực hành. Phần AI/NLP giúp hệ thống phân tích câu trả lời tự nhiên, sinh nhận xét và cá nhân hóa nội dung theo ngữ cảnh.

Một yêu cầu quan trọng của bài toán là hệ thống phải phục vụ mục tiêu học tập, không phải hỗ trợ gian lận trong buổi phỏng vấn thật. AI Mock Interview được thiết kế để người dùng luyện tập trước phỏng vấn, nhận phản hồi sau câu trả lời và tự cải thiện kỹ năng. Hệ thống không hướng đến việc cung cấp đáp án real-time trong một buổi phỏng vấn thật.

## 3.2 Cơ sở lý thuyết về phỏng vấn tuyển dụng và Mock Interview

### 3.2.1 Tổng quan về phỏng vấn tuyển dụng trong ngành Công nghệ thông tin

Phỏng vấn tuyển dụng là cuộc trao đổi giữa ứng viên và đại diện nhà tuyển dụng sau khi ứng viên đã nộp hồ sơ. Theo University of Michigan Career Center, người phỏng vấn đặt câu hỏi về kinh nghiệm và chuyên môn của ứng viên để đánh giá mức độ liên quan với vị trí hoặc chương trình ứng tuyển [3.2-S1]. Như vậy, phỏng vấn không chỉ là hoạt động hỏi đáp, mà là một phương pháp thu thập bằng chứng về năng lực, kinh nghiệm và mức độ phù hợp của ứng viên.

Trong tuyển dụng hiện đại, đặc biệt với các vị trí cần kỹ năng rõ ràng, phỏng vấn thường được tổ chức theo hướng có cấu trúc. U.S. Office of Personnel Management (OPM) định nghĩa structured interview là phương pháp đánh giá năng lực liên quan đến công việc thông qua câu hỏi về hành vi trong quá khứ hoặc cách xử lý tình huống giả định. OPM cũng nhấn mạnh rằng phỏng vấn có cấu trúc giúp ứng viên có cơ hội trả lời công bằng hơn vì cùng được hỏi các câu hỏi đã xác định trước và được đánh giá bằng cùng thang điểm [3.2-S2].

Đối với ngành Công nghệ thông tin, phỏng vấn tuyển dụng thường có phạm vi rộng hơn nhiều ngành khác. Ứng viên có thể phải giải thích kiến thức lập trình, cơ sở dữ liệu, API, thuật toán, hệ thống, bảo mật, testing, đồng thời vẫn phải thể hiện khả năng giao tiếp và làm việc nhóm. Harvard FAS Mignone Center for Career Success mô tả phỏng vấn cho vai trò kỹ thuật như software engineer, data scientist hoặc product manager thường bao gồm cả đánh giá kỹ thuật và câu hỏi hành vi; câu hỏi kỹ thuật có thể ở dạng coding challenge, brain teaser hoặc product case scenario [3.2-S3].

Với sinh viên năm cuối và fresher CNTT, phỏng vấn còn có một đặc điểm riêng: ứng viên thường chưa có nhiều kinh nghiệm đi làm chính thức. Vì vậy, nhà tuyển dụng thường khai thác dự án học tập, đồ án, internship, hoạt động nhóm, kinh nghiệm tự học và khả năng giải thích quyết định kỹ thuật. Các năng lực như giao tiếp, tư duy phản biện, teamwork, professionalism và khả năng sử dụng công nghệ cũng là các năng lực nghề nghiệp quan trọng mà NACE đưa vào khung career readiness cho sinh viên tốt nghiệp đại học [3.2-S4].

Từ đó, có thể xem phỏng vấn CNTT là hoạt động đánh giá đồng thời hai nhóm năng lực:

- Năng lực kỹ thuật: kiến thức chuyên môn, tư duy giải quyết vấn đề, khả năng thiết kế và triển khai giải pháp.
- Năng lực hành vi: giao tiếp, thái độ học hỏi, làm việc nhóm, trách nhiệm, khả năng tự nhìn nhận và phù hợp với môi trường làm việc.

---

### 3.2.2. Các loại hình phỏng vấn chính trong tuyển dụng CNTT

Trong thực tế tuyển dụng CNTT, quy trình phỏng vấn không chỉ gồm một buổi hỏi đáp chung. Tùy công ty, cấp độ ứng viên và vị trí ứng tuyển, nhà tuyển dụng có thể kết hợp nhiều vòng như screening call, HR interview, technical knowledge interview, live coding, system design, take-home assignment, portfolio/project review, behavioral interview, culture fit interview hoặc final interview. Các vòng này có thể được tách riêng ở công ty lớn, hoặc được gộp thành một buổi combined screening ở startup và doanh nghiệp vừa/nhỏ.

Nếu xét theo nhóm vị trí trong ngành CNTT, các hình thức phỏng vấn thường gặp có thể khái quát như sau:

| Nhóm vị trí | Loại phỏng vấn thường gặp | Nội dung đánh giá chính |
| --- | --- | --- |
| Backend, Frontend, Fullstack, Mobile | Technical knowledge, coding/live coding, review dự án, behavioral | Ngôn ngữ lập trình, framework, API, database, UI, debugging, testing, khả năng giải thích lựa chọn kỹ thuật |
| Data Analyst, Data Engineer, AI/ML Engineer | SQL/Python test, data case, ML/system scenario, technical knowledge, behavioral | Xử lý dữ liệu, thống kê, pipeline, mô hình học máy, đánh giá kết quả, diễn giải insight |
| QA/Tester/Automation Test | Technical knowledge, test case design, bug analysis, automation scenario, behavioral | Tư duy kiểm thử, thiết kế test case, phân loại lỗi, công cụ automation, giao tiếp với developer/product |
| DevOps/Cloud/SRE | Technical knowledge, system operation scenario, troubleshooting, system design cơ bản, behavioral | Linux, network, CI/CD, container, cloud, monitoring, incident handling, reliability |
| Security Engineer | Technical knowledge, security scenario, threat modeling, incident response, behavioral | Web security, authentication, authorization, vulnerability analysis, risk awareness |
| Product Manager, Business Analyst | Product/case interview, requirement analysis, stakeholder scenario, behavioral | Tư duy sản phẩm, phân tích yêu cầu, ưu tiên backlog, giao tiếp với kỹ thuật và nghiệp vụ |
| UI/UX Designer | Portfolio review, design critique, product case, behavioral | Quy trình thiết kế, user research, wireframe/prototype, usability, khả năng bảo vệ quyết định thiết kế |
| Intern/Fresher CNTT nói chung | HR/behavioral, technical fundamentals, project review, mixed interview | Nền tảng chuyên môn, dự án học tập, khả năng học hỏi, teamwork, động lực và mức độ phù hợp với vị trí |

Như vậy, nếu mô tả đầy đủ thực tế tuyển dụng CNTT thì cần thừa nhận nhiều dạng phỏng vấn khác nhau. Tuy nhiên, trong phạm vi đề tài AI Mock Interview, hệ thống không hướng đến mô phỏng toàn bộ mọi vòng phỏng vấn nói trên. Trọng tâm của đề tài là mô phỏng hai loại phỏng vấn cốt lõi: **Technical Interview** và **Behavioral Interview**. Đây là hai nhóm có tính nền tảng, xuất hiện trong hầu hết các quy trình tuyển dụng CNTT và phù hợp nhất với mục tiêu luyện tập cho sinh viên, fresher thông qua câu hỏi - câu trả lời - feedback bằng ngôn ngữ tự nhiên [3.2-S5].

Các dạng như live coding, system design chuyên sâu, take-home assignment, portfolio review hoặc product case có thể xuất hiện trong tuyển dụng thực tế, nhưng chưa phải phạm vi mô phỏng chính của đề tài. Trong hệ thống hiện tại, phiên **Mixed Interview** được hiểu là phiên kết hợp câu hỏi kỹ thuật và hành vi trong cùng một buổi luyện tập, không phải một loại phỏng vấn độc lập ngang hàng với Technical và Behavioral [3.2-S5].

| Loại phỏng vấn | Mục đích chính | Nội dung đánh giá | Ví dụ câu hỏi |
| --- | --- | --- | --- |
| Technical Interview | Đánh giá kiến thức chuyên môn và quá trình giải quyết vấn đề kỹ thuật | Lập trình, database, API, thuật toán, kiến trúc, testing, bảo mật, dự án cá nhân | "JWT hoạt động như thế nào?", "Vì sao bạn thiết kế database như vậy?" |
| Behavioral Interview | Đánh giá hành vi, thái độ và cách ứng viên xử lý tình huống | Giao tiếp, teamwork, trách nhiệm, xử lý khó khăn, học hỏi, mục tiêu nghề nghiệp | "Hãy kể về một lần bạn gặp khó khăn trong dự án nhóm." |

Hai loại phỏng vấn này có mục tiêu khác nhau nên cách trả lời tốt cũng khác nhau. Technical Interview yêu cầu câu trả lời chính xác, có logic kỹ thuật và có khả năng giải thích lựa chọn. Behavioral Interview yêu cầu câu trả lời cụ thể, có bối cảnh, thể hiện vai trò cá nhân và bài học rút ra. Vì vậy, hệ thống AI Mock Interview cần tách rõ loại câu hỏi, rubric đánh giá và cách sinh feedback cho từng nhóm.

---

### 3.2.3. Technical Interview

#### a. Khái niệm và mục đích

Technical Interview là hình thức phỏng vấn tập trung vào năng lực chuyên môn của ứng viên. University of Michigan Career Center mô tả technical interview là dạng phỏng vấn phổ biến trong STEM/Software, dùng để đánh giá kiến thức chuyên ngành và quá trình giải quyết vấn đề [3.2-S1]. Với ứng viên CNTT, nội dung thường xoay quanh lập trình, cơ sở dữ liệu, API, thuật toán, framework, thiết kế hệ thống, testing, bảo mật và các dự án đã thực hiện.

Mục đích của Technical Interview không chỉ là kiểm tra đáp án đúng hay sai. Nhà tuyển dụng còn quan tâm đến cách ứng viên phân tích vấn đề, đặt giả định, giải thích trade-off, xử lý lỗi và bảo vệ lựa chọn kỹ thuật. Với fresher, một câu trả lời tốt không nhất thiết phải quá nâng cao, nhưng cần cho thấy ứng viên hiểu phần mình đã làm và có khả năng học thêm khi gặp giới hạn.

Trong ngành CNTT, Technical Interview có thể xuất hiện dưới nhiều biến thể. Với vị trí backend, câu hỏi thường tập trung vào API, cơ sở dữ liệu, authentication, transaction, caching và thiết kế service. Với frontend, trọng tâm chuyển sang HTML/CSS/JavaScript, framework, state management, hiệu năng giao diện và giao tiếp với API. Với mobile, câu hỏi thường xoay quanh vòng đời ứng dụng, lưu trữ cục bộ, networking, permission và tối ưu tài nguyên. Với data/AI, nội dung thường gồm SQL, Python, thống kê, pipeline dữ liệu, machine learning và cách đánh giá mô hình. Với QA/Tester, DevOps hoặc Security, câu hỏi kỹ thuật sẽ nghiêng về test case, automation, CI/CD, cloud, monitoring, network hoặc bảo mật. Vì vậy, Technical Interview cần được hiểu là một nhóm phỏng vấn chuyên môn theo vai trò, không phải một bộ câu hỏi cố định dùng chung cho mọi vị trí.

#### b. Quy trình cơ bản của Technical Interview

Một buổi Technical Interview thường có quy trình như sau:

1. Ứng viên giới thiệu ngắn gọn về bản thân và định hướng kỹ thuật.
2. Người phỏng vấn hỏi về công nghệ, ngôn ngữ lập trình hoặc framework ứng viên đã sử dụng.
3. Ứng viên trình bày một hoặc một số dự án đã thực hiện.
4. Người phỏng vấn đặt câu hỏi chuyên sâu về kiến trúc, database, API, authentication, testing hoặc xử lý lỗi trong dự án.
5. Có thể có câu hỏi giải quyết vấn đề, thuật toán hoặc tình huống kỹ thuật.
6. Ứng viên giải thích cách tiếp cận, nêu giả định, phân tích ưu nhược điểm và thừa nhận giới hạn nếu chưa biết.
7. Người phỏng vấn đánh giá độ đúng kỹ thuật, cách tư duy và khả năng giao tiếp kỹ thuật.

Không phải mọi công ty đều dùng đầy đủ các bước trên. Với fresher, nhiều buổi phỏng vấn tập trung nhiều hơn vào dự án học tập, kiến thức nền tảng và khả năng giải thích code đã viết. Với vị trí khó hơn, phỏng vấn có thể bổ sung live coding, system design hoặc bài tập take-home.

Trong phạm vi AI Mock Interview, Technical Interview được mô phỏng chủ yếu ở dạng hỏi đáp kiến thức, giải thích dự án, phân tích tình huống kỹ thuật và phản biện trade-off. Hệ thống hiện tại chưa đặt trọng tâm vào live coding có editor, system design chuyên sâu với sơ đồ kiến trúc, hoặc chấm bài take-home như một quy trình riêng. Cách giới hạn này phù hợp với mục tiêu luyện tập bằng hội thoại và feedback văn bản cho sinh viên/fresher [3.2-S5].

#### c. Các nhóm câu hỏi thường gặp trong Technical Interview

Các câu hỏi trong Technical Interview không nên chỉ được chia theo tên công nghệ cụ thể như backend, frontend, database hay framework. Cách chia đó dễ đúng với một vị trí nhất định nhưng không đủ tổng quát khi hệ thống cần hỗ trợ nhiều vai trò, nhiều mức kinh nghiệm và nhiều mô tả công việc khác nhau. Một cách phân loại phù hợp hơn là xem câu hỏi kỹ thuật theo hai lớp: lớp nội dung chuyên môn được hỏi và lớp năng lực tư duy mà câu hỏi muốn đánh giá.

Xét theo nội dung chuyên môn, câu hỏi kỹ thuật thường bao phủ các nhóm sau. Các nhóm này được tách theo trọng tâm đánh giá chính, nhờ đó có thể áp dụng cho nhiều vị trí như backend, frontend, mobile, data/AI, QA, DevOps hoặc security mà không phụ thuộc vào một công nghệ cụ thể.

| Nhóm nội dung | Trọng tâm chính | Ranh giới phân biệt |
| --- | --- | --- |
| Nền tảng kỹ thuật | Kiểm tra nguyên lý, khái niệm và kiến thức cốt lõi mà ứng viên cần có để làm việc trong vai trò đã chọn | Tập trung vào kiến thức nền như ngôn ngữ lập trình, cấu trúc dữ liệu, hệ điều hành, mạng, HTTP, OOP, concurrency; chưa đi vào framework hay cách thiết kế một chức năng cụ thể |
| Công nghệ và công cụ theo vị trí | Kiểm tra mức độ hiểu và sử dụng công cụ, framework, nền tảng hoặc thư viện đặc thù của công việc | Tập trung vào cách dùng React/Vue, NestJS/Spring, Android/iOS SDK, Docker, cloud service, test automation tool, ML framework; khác với nhóm nền tảng vì câu hỏi gắn với công cụ cụ thể |
| Thiết kế và triển khai chức năng | Kiểm tra cách ứng viên chuyển một yêu cầu thành cấu trúc xử lý, luồng nghiệp vụ và mã nguồn có thể chạy được | Tập trung vào API behavior, UI flow, service flow, component/module, validation logic, job xử lý; không lấy dữ liệu, bảo mật hay hiệu năng làm trọng tâm chính trừ khi chúng là ràng buộc của chức năng |
| Dữ liệu và tích hợp hệ thống | Kiểm tra cách ứng viên mô hình hóa, lưu trữ, trao đổi và đồng bộ dữ liệu giữa các thành phần | Tập trung vào SQL/NoSQL, schema, transaction, cache, message queue, API contract, third-party integration, data validation; khác với nhóm thiết kế chức năng vì trọng tâm là trạng thái dữ liệu và giao tiếp giữa hệ thống |
| Kiểm thử, debugging và bảo trì | Kiểm tra khả năng chứng minh phần mềm chạy đúng, tìm nguyên nhân lỗi và giữ mã nguồn dễ phát triển lâu dài | Tập trung vào test case, unit/integration test, debugging, logging phục vụ tìm lỗi, refactoring, code review, maintainability, documentation; khác với nhóm vận hành vì trọng tâm là độ đúng và khả năng bảo trì ở mức code/module |
| Hiệu năng, khả năng mở rộng và vận hành tin cậy | Kiểm tra khả năng phân tích giới hạn khi hệ thống chạy trong điều kiện thực tế và đề xuất cải thiện phù hợp | Tập trung vào latency, throughput, memory, scalability, availability, monitoring, fault tolerance, resource optimization; khác với nhóm kiểm thử vì trọng tâm là hành vi của hệ thống khi có tải, sự cố hoặc yêu cầu vận hành |
| Bảo mật và an toàn hệ thống | Kiểm tra nhận thức về rủi ro bảo mật, quyền truy cập và cách giảm thiểu rủi ro trong thiết kế cũng như triển khai | Tập trung vào authentication, authorization, input validation, secrets, permission, secure coding, privacy; được tách riêng vì tiêu chí đánh giá là kiểm soát rủi ro, không chỉ làm chức năng chạy đúng |

Kinh nghiệm dự án, lý do chọn công nghệ và bài học kỹ thuật không được xem là một nhóm nội dung tách biệt hoàn toàn, vì chúng có thể xuất hiện trong mọi nhóm trên. Ví dụ, người phỏng vấn có thể hỏi ứng viên về nền tảng kỹ thuật thông qua một dự án đã làm, hỏi về bảo mật thông qua cách ứng viên xử lý phân quyền, hoặc hỏi về hiệu năng thông qua một lỗi chậm hệ thống từng gặp. Vì vậy, phần dự án nên được hiểu là nguồn bằng chứng để kiểm tra mức độ hiểu thật, vai trò cá nhân và khả năng ra quyết định kỹ thuật của ứng viên.

Xét theo dạng năng lực được đánh giá, cùng một nhóm nội dung có thể được hỏi bằng nhiều dạng câu hỏi khác nhau:

| Dạng câu hỏi | Mục tiêu đánh giá | Ví dụ ngắn |
| --- | --- | --- |
| Khái niệm và định nghĩa | Kiểm tra ứng viên có hiểu đúng thuật ngữ, nguyên lý và giới hạn của khái niệm hay không | "REST API là gì?" |
| Cơ chế hoạt động | Kiểm tra khả năng giải thích một quy trình kỹ thuật từ đầu đến cuối | "JWT được tạo, gửi và xác thực như thế nào?" |
| So sánh và trade-off | Kiểm tra khả năng phân biệt phương án, nêu ưu nhược điểm và chọn giải pháp theo bối cảnh | "Khi nào nên dùng cache, khi nào không nên?" |
| Thiết kế giải pháp | Kiểm tra khả năng đề xuất cấu trúc xử lý cho một yêu cầu mới | "Bạn thiết kế chức năng đặt lịch phỏng vấn như thế nào?" |
| Tình huống và áp dụng thực tế | Kiểm tra khả năng áp dụng kiến thức vào một bối cảnh cụ thể | "Nếu API phản hồi chậm, bạn kiểm tra từ đâu?" |
| Debugging và xử lý sự cố | Kiểm tra tư duy khoanh vùng lỗi, đọc tín hiệu hệ thống và lựa chọn bước xử lý | "Một request trả về 401 dù token còn hạn, bạn xử lý thế nào?" |
| Review và cải thiện | Kiểm tra khả năng đọc hiểu, đánh giá và nâng cấp một thiết kế hoặc đoạn mã đã có | "Bạn sẽ refactor đoạn xử lý này theo hướng nào?" |
| Project deep-dive | Kiểm tra mức độ thật sự hiểu dự án, vai trò cá nhân và bài học kỹ thuật | "Trong dự án, phần nào do bạn trực tiếp thiết kế?" |

Do đó, cùng một câu hỏi kỹ thuật có thể nằm ở giao điểm của hai lớp phân loại. Ví dụ, câu hỏi "Vì sao bạn chọn PostgreSQL thay vì MongoDB cho chức năng này?" thuộc nhóm nội dung dữ liệu, đồng thời là dạng so sánh và trade-off. Câu hỏi "Nếu màn hình tải dữ liệu quá chậm, bạn kiểm tra những bước nào?" có thể thuộc frontend, mobile hoặc fullstack tùy vị trí, nhưng về bản chất là dạng tình huống kết hợp debugging và hiệu năng.

Mức độ khó của câu hỏi cũng thay đổi theo level. Với intern hoặc fresher, câu hỏi thường tập trung vào khái niệm nền tảng, thao tác triển khai đơn giản, dự án học tập và khả năng giải thích phần mình đã làm. Với junior/middle, câu hỏi bắt đầu yêu cầu áp dụng trong tình huống thực tế, debugging, testing, đọc hiểu code và phân tích trade-off ở phạm vi module hoặc tính năng. Với senior trở lên, trọng tâm thường chuyển sang thiết kế hệ thống, khả năng mở rộng, độ tin cậy, bảo mật, vận hành, mentoring và quyết định kỹ thuật có ảnh hưởng đến nhiều thành phần.

#### d. Tiêu chí đánh giá trong Technical Interview

| Tiêu chí | Ý nghĩa |
| --- | --- |
| Kiến thức chuyên môn | Hiểu đúng khái niệm kỹ thuật, không chỉ nhớ thuật ngữ |
| Tư duy giải quyết vấn đề | Biết chia nhỏ vấn đề, nêu giả định và chọn hướng xử lý hợp lý |
| Khả năng giải thích kỹ thuật | Trình bày rõ ràng, có ví dụ, tránh trả lời quá chung chung |
| Kinh nghiệm dự án | Nắm được vai trò cá nhân, kiến trúc, dữ liệu, API và lỗi đã xử lý |
| Tính logic | Câu trả lời có trình tự, không nhảy ý hoặc mâu thuẫn |
| Nhận thức về trade-off | Biết giải thích vì sao chọn một công nghệ/cách làm thay vì lựa chọn khác |
| Khả năng áp dụng thực tế | Biết liên hệ khái niệm với dự án, bug, dữ liệu, người dùng hoặc ràng buộc triển khai |
| Chất lượng kỹ thuật | Có ý thức về clean code, testing, bảo mật, hiệu năng và khả năng bảo trì |
| Khả năng học hỏi | Biết thừa nhận phần chưa chắc và nêu cách kiểm chứng hoặc tìm hiểu thêm |

Một câu trả lời kỹ thuật tốt thường nên đi theo trình tự: nêu khái niệm chính, giải thích cơ chế hoặc luồng xử lý, đưa ví dụ từ dự án hoặc tình huống thực tế, phân tích trade-off nếu có, sau đó kết luận ngắn gọn. Với câu hỏi debugging, ứng viên nên trình bày các bước kiểm tra theo thứ tự từ triệu chứng, giả thuyết, cách xác minh, nguyên nhân có thể xảy ra đến hướng khắc phục. Với câu hỏi thiết kế hoặc tối ưu, ứng viên nên nêu giả định, ràng buộc, phương án chọn, phương án thay thế và lý do đánh đổi.

Đối với AI Mock Interview, các tiêu chí này là cơ sở để xây dựng rubric cho câu hỏi kỹ thuật. Feedback của hệ thống cần chỉ ra cụ thể: câu trả lời sai ở kiến thức nào, thiếu bước giải thích nào, hoặc cần bổ sung ví dụ dự án nào để thuyết phục hơn.

---

### 3.2.4. Behavioral Interview

#### a. Khái niệm và mục đích

Behavioral Interview là hình thức phỏng vấn tập trung vào hành vi, thái độ và cách ứng viên xử lý tình huống trong học tập hoặc công việc. University of Michigan Career Center mô tả behavioral interview là dạng phỏng vấn đánh giá kinh nghiệm quá khứ thông qua storytelling, thường bắt đầu bằng các câu như "Tell me about a time when..." [3.2-S1]. Cách tiếp cận này phù hợp với quan điểm của structured interview: câu hỏi có thể yêu cầu ứng viên kể lại hành vi trong quá khứ hoặc nêu cách xử lý một tình huống giả định liên quan đến công việc [3.2-S2].

Đối với sinh viên và fresher, Behavioral Interview thường không yêu cầu kinh nghiệm làm việc nhiều, mà tập trung vào dự án học tập, làm việc nhóm, xử lý mâu thuẫn, vượt qua khó khăn và tinh thần học hỏi.

Behavioral Interview khác với câu hỏi "kể chung về bản thân" ở chỗ người phỏng vấn cần bằng chứng hành vi cụ thể. Một câu trả lời thuyết phục không chỉ nói ứng viên "có trách nhiệm" hoặc "làm việc nhóm tốt", mà phải chỉ ra một tình huống thật, vai trò cá nhân, hành động đã thực hiện, kết quả và điều rút ra. Vì vậy, loại phỏng vấn này liên quan trực tiếp đến các năng lực career readiness như communication, critical thinking, teamwork, professionalism, leadership và self-development [3.2-S4].

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
* Câu hỏi về chủ động nhận trách nhiệm hoặc đề xuất cải tiến.
* Câu hỏi về học công nghệ mới hoặc thích nghi với thay đổi.
* Câu hỏi về giao tiếp với người không cùng chuyên môn.
* Câu hỏi về tình huống đạo đức, cam kết hoặc lựa chọn khó.
* Câu hỏi về mục tiêu nghề nghiệp.
* Câu hỏi về lý do ứng tuyển.

Ví dụ:

* Hãy kể về một lần bạn gặp khó khăn trong dự án.
* Bạn đã từng mâu thuẫn với thành viên trong nhóm chưa?
* Điểm yếu của bạn là gì?
* Bạn học được gì sau một lần thất bại?
* Vì sao bạn muốn ứng tuyển vị trí này?

#### d. Tiêu chí đánh giá trong Behavioral Interview

| Tiêu chí | Ý nghĩa |
| --- | --- |
| Đúng trọng tâm | Trả lời đúng câu hỏi, không chuyển sang câu chuyện khác |
| Ví dụ cụ thể | Có tình huống thực tế, có bối cảnh rõ ràng |
| Vai trò cá nhân | Nêu rõ bản thân đã làm gì, tránh chỉ nói "nhóm em" |
| Hành động rõ ràng | Mô tả được bước xử lý cụ thể, không chỉ nói chung chung |
| Kết quả và bài học | Có kết quả, tác động hoặc điều rút ra sau tình huống |
| Tính xác thực | Câu chuyện hợp lý, có chi tiết thật, không chỉ là khẩu hiệu hoặc tuyên bố chung |
| Kỹ năng giao tiếp | Diễn đạt rõ ràng, có trình tự và dễ theo dõi |
| Thái độ học hỏi | Thể hiện tinh thần cầu tiến và biết nhận trách nhiệm |
| Tự nhận thức | Nhìn ra điểm mạnh, điểm yếu, giới hạn và cách cải thiện của bản thân |
| Mức độ phù hợp | Liên hệ được trải nghiệm với vị trí và môi trường ứng tuyển |

Trong Behavioral Interview, ứng viên thường nên trả lời theo cấu trúc **STAR**:

* Situation: Tình huống
* Task: Nhiệm vụ
* Action: Hành động
* Result: Kết quả

University of Michigan Career Center mô tả STAR là cách trả lời có cấu trúc cho câu hỏi hành vi bằng việc trình bày Situation, Task, Action và Result của tình huống được kể [3.2-S1]. Với sinh viên, STAR giúp tránh hai lỗi phổ biến: kể chuyện lan man và không nêu rõ vai trò cá nhân. Trong AI Mock Interview, STAR là một cơ sở quan trọng để hệ thống phát hiện câu trả lời thiếu bối cảnh, thiếu hành động hoặc thiếu kết quả.

Ngoài STAR, có thể dùng một số cấu trúc rút gọn hoặc biến thể tùy loại câu hỏi:

| Cấu trúc | Thành phần | Khi nên dùng | Lưu ý đánh giá |
| --- | --- | --- | --- |
| STAR | Situation - Task - Action - Result | Câu hỏi hành vi yêu cầu kể lại một trải nghiệm cụ thể | Phù hợp nhất với teamwork, conflict, failure, pressure, leadership |
| STAR-L | Situation - Task - Action - Result - Learning | Câu hỏi về thất bại, lỗi sai, khó khăn hoặc trải nghiệm chưa thành công | Nhấn mạnh bài học và cách cải thiện sau tình huống |
| CAR | Context/Challenge - Action - Result | Câu hỏi cần trả lời ngắn hơn nhưng vẫn có bối cảnh, hành động, kết quả | Tránh bỏ mất vai trò cá nhân trong phần Action |
| PAR | Problem - Action - Result | Câu hỏi về xử lý vấn đề, bug, deadline hoặc mâu thuẫn cụ thể | Phù hợp khi tình huống không cần giải thích dài |
| PREP | Point - Reason - Example - Point | Câu hỏi về điểm mạnh, điểm yếu, quan điểm hoặc lý do ứng tuyển | Cần có ví dụ thật; không thay thế STAR cho câu hỏi kể trải nghiệm |

Các cấu trúc trên đều phục vụ cùng một mục tiêu: giúp câu trả lời có bằng chứng cụ thể, có trình tự và thể hiện được đóng góp cá nhân. Với sinh viên/fresher, STAR và STAR-L nên được ưu tiên cho phần lớn câu hỏi hành vi; CAR/PAR phù hợp khi cần trả lời ngắn; PREP phù hợp hơn với câu hỏi tự nhận thức hoặc động lực ứng tuyển. Trong hệ thống AI Mock Interview, feedback hành vi có thể dựa vào các cấu trúc này để chỉ ra câu trả lời đang thiếu bối cảnh, thiếu hành động cá nhân, thiếu kết quả, thiếu bài học hoặc thiếu liên hệ với vị trí ứng tuyển [3.2-S5].

---

### 3.2.5. So sánh Technical Interview và Behavioral Interview

Technical Interview và Behavioral Interview đều nhằm đánh giá mức độ phù hợp của ứng viên, nhưng tập trung vào các loại bằng chứng khác nhau. Technical Interview chủ yếu dùng bằng chứng về kiến thức, cách giải quyết vấn đề và kinh nghiệm kỹ thuật. Behavioral Interview chủ yếu dùng bằng chứng về hành vi, thái độ, cách giao tiếp và khả năng phản ứng trong tình huống.

| Nội dung | Technical Interview | Behavioral Interview |
| --- | --- | --- |
| Mục tiêu | Đánh giá năng lực kỹ thuật | Đánh giá hành vi, thái độ và kỹ năng mềm |
| Trọng tâm | Kiến thức, tư duy kỹ thuật, dự án, trade-off | Tình huống, cách ứng xử, vai trò cá nhân, bài học |
| Câu hỏi thường gặp | API, database, framework, thuật toán, kiến trúc, testing | Teamwork, khó khăn, mâu thuẫn, điểm mạnh, mục tiêu |
| Cách trả lời tốt | Chính xác, logic, có ví dụ kỹ thuật, biết giải thích lý do | Cụ thể, chân thật, có cấu trúc STAR |
| Tiêu chí đánh giá | Độ đúng kỹ thuật, khả năng phân tích, giải thích và bảo vệ lựa chọn | Sự rõ ràng, thái độ, trách nhiệm, vai trò cá nhân, kết quả |
| Rủi ro khi trả lời kém | Nói sai khái niệm, không hiểu dự án, không nêu được trade-off | Kể chuyện lan man, thiếu ví dụ, không nêu hành động/kết quả |
| Vai trò trong AI Mock Interview | Sinh câu hỏi kỹ thuật và đánh giá nội dung chuyên môn | Sinh câu hỏi hành vi và đánh giá cấu trúc/trải nghiệm |

Sự khác biệt này cho thấy một hệ thống luyện phỏng vấn không nên dùng một rubric chung cho mọi câu hỏi. Nếu dùng cùng tiêu chí cho cả câu hỏi kỹ thuật và hành vi, feedback có thể thiếu chính xác. Ví dụ, một câu hỏi về JWT cần đánh giá kiến thức authentication và security; trong khi một câu hỏi về mâu thuẫn nhóm cần đánh giá cách ứng viên nêu bối cảnh, vai trò cá nhân, hành động và kết quả.

---

### 3.2.6. Khó khăn của sinh viên và fresher trong từng loại phỏng vấn

Sinh viên và fresher thường gặp khó khăn không phải vì hoàn toàn thiếu năng lực, mà vì chưa quen biến kinh nghiệm học tập thành câu trả lời phỏng vấn có cấu trúc. Trong môi trường học, người học thường quen nộp code, báo cáo hoặc demo sản phẩm. Trong phỏng vấn, họ phải giải thích ngắn gọn: vấn đề là gì, bản thân đã làm gì, tại sao chọn cách đó và kết quả ra sao.

Với Technical Interview, sinh viên và fresher thường gặp khó khăn như:

* Hiểu lý thuyết nhưng khó giải thích rõ ràng.
* Không biết trình bày dự án theo góc nhìn kỹ thuật.
* Không nêu được lý do chọn công nghệ.
* Thiếu kinh nghiệm xử lý câu hỏi chuyên sâu.
* Dễ trả lời chung chung, thiếu ví dụ cụ thể.
* Lẫn lộn giữa phần mình làm và phần do framework/thư viện hỗ trợ.
* Chưa quen nói về trade-off, bảo mật, testing và khả năng mở rộng.
* Ngại thừa nhận phần chưa biết nên dễ trả lời đoán.

Với Behavioral Interview, các khó khăn thường gặp là:

* Không biết chọn tình huống phù hợp để kể.
* Trả lời lan man, thiếu cấu trúc.
* Không nêu rõ vai trò cá nhân.
* Khó trình bày điểm yếu hoặc thất bại một cách tích cực.
* Chưa biết liên hệ kinh nghiệm cá nhân với vị trí ứng tuyển.
* Thiếu kết quả cụ thể nên câu trả lời chưa thuyết phục.
* Dùng nhiều câu "chúng em đã..." nhưng không làm rõ đóng góp cá nhân.
* Chưa quen phản ánh bài học rút ra sau một lỗi hoặc khó khăn.

Các khó khăn này liên quan trực tiếp đến các năng lực nghề nghiệp mà NACE nêu trong khung career readiness, đặc biệt là communication, critical thinking, teamwork, professionalism và technology [3.2-S4]. Vì vậy, hệ thống luyện phỏng vấn cần giúp người dùng cải thiện cả nội dung chuyên môn và cách trình bày, không chỉ chấm điểm đúng/sai.

---

### 3.2.7. Mock Interview và vai trò trong luyện phỏng vấn

Mock Interview là hình thức phỏng vấn giả lập, trong đó ứng viên luyện tập với bối cảnh, câu hỏi và cách trả lời gần giống một buổi phỏng vấn thật. Điểm quan trọng của hình thức này không chỉ là tạo cơ hội thử trả lời trước, mà còn tạo một vòng luyện tập có phản hồi: người học trả lời, nhận nhận xét, điều chỉnh cách trình bày, rồi tiếp tục luyện ở những lần sau. Vì vậy, mock interview có thể được xem như bước diễn tập trước phỏng vấn chính thức, đặc biệt hữu ích khi ứng viên cần chuẩn bị cho cả câu hỏi kỹ thuật lẫn câu hỏi hành vi [3.2-S1][3.2-S3].

Mock Interview có thể được chia theo mục tiêu luyện tập:

* Mock Technical Interview: luyện trả lời câu hỏi kỹ thuật, giải thích dự án, xử lý vấn đề chuyên môn.
* Mock Behavioral Interview: luyện trả lời câu hỏi hành vi, tình huống, giới thiệu bản thân và trình bày kinh nghiệm cá nhân.
* Mock Mixed Interview: kết hợp câu hỏi kỹ thuật, hành vi và tình huống để mô phỏng buổi phỏng vấn tổng hợp.

Giá trị chính của Mock Interview không nằm ở việc học thuộc một tập câu hỏi mẫu. Quan trọng hơn, người luyện được đặt vào áp lực phải diễn đạt suy nghĩ thành câu trả lời hoàn chỉnh, sau đó nhìn lại câu trả lời đó qua phản hồi cụ thể. Với sinh viên CNTT và ứng viên fresher, quá trình này giúp rèn luyện ba năng lực cốt lõi:

- Chuyển kiến thức kỹ thuật thành lời giải thích dễ hiểu.
- Chuyển kinh nghiệm học tập/dự án thành bằng chứng năng lực.
- Nhận diện lỗi trả lời lặp lại qua nhiều lần luyện, ví dụ thiếu kết quả, thiếu ví dụ, trả lời lan man hoặc chưa liên hệ với vị trí ứng tuyển.

Trong hệ thống AI Mock Interview, vai trò của AI là mở rộng quá trình luyện tập này thành một môi trường có thể sử dụng theo nhu cầu. Hệ thống sinh câu hỏi theo JD và loại phiên, ghi nhận câu trả lời, đưa ra feedback theo rubric, sau đó tổng hợp kết quả để người dùng nhìn thấy điểm mạnh, điểm yếu và hướng cải thiện. Nhờ đó, người dùng có thể luyện nhiều lần với các bối cảnh khác nhau trước khi bước vào phỏng vấn thật hoặc trước khi luyện sâu hơn với mentor/người có kinh nghiệm [3.2-S5].

---

### 3.2.8. Hạn chế của Mock Interview truyền thống

Mock Interview truyền thống thường đem lại hiệu quả tốt khi có người hướng dẫn phù hợp, nhưng vẫn tồn tại một số hạn chế:

* Phụ thuộc vào mentor, bạn bè hoặc người có kinh nghiệm.
* Khó luyện tập thường xuyên.
* Chất lượng feedback không đồng đều.
* Khó cá nhân hóa theo nhiều JD hoặc vị trí ứng tuyển.
* Khó lưu lại lịch sử luyện tập và theo dõi tiến bộ.
* Sinh viên không phải lúc nào cũng có người hỗ trợ luyện phỏng vấn.
* Người hướng dẫn có thể mạnh ở một mảng nhất định nhưng không bao phủ hết nhiều JD/công nghệ khác nhau.
* Sinh viên có thể ngại luyện nhiều lần vì sợ làm phiền người khác hoặc sợ bị đánh giá.
* Feedback sau buổi luyện có thể bị mất nếu không được ghi lại thành dữ liệu có cấu trúc.

Các hạn chế trên không có nghĩa mock interview truyền thống không còn giá trị. Ngược lại, luyện với mentor hoặc người có kinh nghiệm vẫn rất hữu ích. Tuy nhiên, với nhóm sinh viên cần luyện thường xuyên, cần thử nhiều JD và cần phản hồi lặp lại, một hệ thống AI Mock Interview có thể bổ sung tốt cho hình thức truyền thống. Hệ thống giúp người dùng luyện nhiều lần trước khi tìm đến mentor, nhờ đó buổi luyện với người thật cũng hiệu quả hơn.

---

### 3.2.9. Ứng dụng vào hệ thống AI Mock Interview

Từ cơ sở lý thuyết trên, hệ thống AI Mock Interview được thiết kế xoay quanh hai hướng luyện phỏng vấn chính: Technical Interview và Behavioral Interview. Ngoài ra, hệ thống hỗ trợ Mixed Interview để mô phỏng buổi phỏng vấn tổng hợp, trong đó ứng viên vừa phải trả lời câu hỏi kỹ thuật vừa phải thể hiện cách giao tiếp và xử lý tình huống [3.2-S5].

Với Technical Interview, hệ thống có thể:

* Tạo câu hỏi kỹ thuật theo vị trí ứng tuyển hoặc JD.
* Hỏi về công nghệ, dự án, database, API, testing, bảo mật.
* Đánh giá mức độ đúng kỹ thuật, logic và khả năng giải thích.
* Gợi ý cách trả lời rõ ràng và đầy đủ hơn.
* Nhắc người dùng bổ sung trade-off, ví dụ thực tế hoặc phần đã trực tiếp triển khai.

Với Behavioral Interview, hệ thống có thể:

* Tạo câu hỏi về tình huống, teamwork, khó khăn, điểm mạnh, điểm yếu.
* Gợi ý người dùng trả lời theo cấu trúc STAR.
* Đánh giá mức độ cụ thể, vai trò cá nhân, cách trình bày và bài học rút ra.
* Đưa ra feedback giúp câu trả lời tự nhiên và thuyết phục hơn.
* Phát hiện câu trả lời thiếu Situation, Task, Action hoặc Result.

Trong thiết kế của AI Mock Interview, các lý thuyết này được ánh xạ thành các thành phần cụ thể:

| Cơ sở lý thuyết | Ứng dụng trong AI Mock Interview |
| --- | --- |
| Structured interview | Câu hỏi và rubric được chuẩn hóa theo loại phiên, giúp feedback nhất quán hơn |
| Technical Interview | Session type `technical`, ngân hàng câu hỏi kỹ thuật, rubric đánh giá technical depth |
| Behavioral Interview | Session type `hr`, câu hỏi tình huống, context pack có quy tắc STAR |
| Mock Interview | Quy trình luyện tập theo phiên: cấu hình JD -> nhận câu hỏi -> trả lời -> nhận feedback -> xem báo cáo |
| Career readiness | Feedback không chỉ chấm kiến thức mà còn chạm đến giao tiếp, teamwork, professionalism và khả năng học hỏi |

Về mặt trải nghiệm người dùng, AI Mock Interview cần đảm bảo người dùng không chỉ nhận điểm số mà còn hiểu mình cần sửa gì. Vì vậy, hệ thống tập trung vào feedback cụ thể theo từng câu trả lời, phản hồi theo đoạn và báo cáo tổng hợp. Cách làm này phù hợp với mục tiêu của mock interview: luyện tập, nhận phản hồi và cải thiện qua nhiều lần.

---

*Nguồn tham khảo cho mục 3.1-3.2:*

*[3.2-S1] University of Michigan Career Center. "Interviewing Resources." https://careercenter.umich.edu/content/interviewing-resources*
*[3.2-S2] U.S. Office of Personnel Management. "Structured Interviews." https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/*
*[3.2-S3] Harvard FAS Mignone Center for Career Success. "Technical Interviews." https://careerservices.fas.harvard.edu/resources/technical-interviews/*
*[3.2-S4] National Association of Colleges and Employers (NACE). "What is Career Readiness?" https://www.naceweb.org/career-readiness/competencies/career-readiness-defined*
*[3.2-S5] AI Mock Interview internal design and implementation sources: `docs/Design/ArchitecturalDesign/interview_ai_coach_session_type_spec.md`, `server/prisma/schema.prisma`, `server/src/ai/pipelines/interview-pipeline.interface.ts`.*

## 3.3 Mô Hình Ngôn Ngữ Lớn Và Kỹ Thuật Điều Khiển Đầu Ra AI

### 3.3.1 Mô hình ngôn ngữ lớn trong bài toán phỏng vấn thử

Mô hình ngôn ngữ lớn (Large Language Model - LLM) là nhóm mô hình học máy được huấn luyện trên lượng lớn dữ liệu văn bản để xử lý và sinh ngôn ngữ tự nhiên. Nhờ khả năng nhận diện ngữ cảnh, tổng hợp thông tin và tạo câu trả lời theo yêu cầu, LLM phù hợp với các bài toán cần phân tích nội dung tự do như câu trả lời phỏng vấn, mô tả công việc và phản hồi luyện tập [1][2].

Trong hệ thống AI Mock Interview, LLM không được dùng như một thành phần thay thế toàn bộ quy trình phỏng vấn của con người. Vai trò của nó là hỗ trợ các tác vụ ngôn ngữ: tạo câu hỏi luyện tập theo bối cảnh, đánh giá câu trả lời dựa trên tiêu chí có sẵn, viết nhận xét cải thiện và tổng hợp báo cáo sau phiên. Các tác vụ này đều có điểm chung là đầu vào thường là văn bản tự do, khó xử lý hiệu quả bằng các luật cố định.

Hệ thống sử dụng hướng tiếp cận tương thích với Chat Completions của OpenAI. Điều này có nghĩa là phần backend gửi yêu cầu dưới dạng các thông điệp hội thoại, kèm chỉ dẫn và dữ liệu ngữ cảnh, sau đó nhận lại kết quả dạng văn bản hoặc JSON. Mô hình cụ thể được cấu hình qua môi trường chạy, giúp hệ thống có thể dùng nhà cung cấp OpenAI hoặc một dịch vụ tương thích trong quá trình phát triển [2][3-T1].

### 3.3.2 Prompt engineering

Prompt engineering là kỹ thuật viết chỉ dẫn cho mô hình để đầu ra bám sát mục tiêu của ứng dụng. Với LLM, cùng một dữ liệu đầu vào có thể tạo ra nhiều kiểu phản hồi khác nhau. Vì vậy, prompt cần nêu rõ vai trò của mô hình, nhiệm vụ cần thực hiện, ngữ cảnh được cung cấp, tiêu chí đánh giá và định dạng đầu ra mong muốn [3].

Trong AI Mock Interview, prompt được dùng để giữ cho phản hồi của AI nhất quán với mục tiêu luyện phỏng vấn. Ví dụ, khi tạo câu hỏi, prompt cần làm rõ loại phiên phỏng vấn, vị trí ứng tuyển, cấp độ ứng viên và tiêu chí năng lực cần đánh giá. Khi tạo nhận xét, prompt cần nhấn mạnh rằng phản hồi phải cụ thể, có thể hành động được và phù hợp với câu hỏi ban đầu.

Một điểm quan trọng là prompt trong hệ thống được quản lý theo mục đích sử dụng. Các prompt cho sinh câu hỏi, đánh giá câu trả lời và tổng hợp báo cáo được tách riêng, vì mỗi tác vụ có dữ liệu đầu vào và tiêu chí đầu ra khác nhau. Cách tổ chức này giúp việc điều chỉnh chất lượng AI rõ ràng hơn: khi cần cải thiện một tác vụ, nhóm phát triển có thể tập trung vào prompt của tác vụ đó thay vì thay đổi toàn bộ hệ thống [3-T1].

### 3.3.3 Kiểm soát đầu ra bằng JSON và schema

Nếu chỉ yêu cầu LLM trả lời tự do, kết quả có thể đúng về nội dung nhưng khó xử lý bằng chương trình. Ứng dụng cần biết điểm số nằm ở đâu, phần nhận xét nằm ở đâu, danh sách gợi ý có cấu trúc như thế nào và trường nào là bắt buộc. Vì vậy, hệ thống cần cơ chế kiểm soát đầu ra thay vì chỉ dựa vào văn bản tự nhiên.

OpenAI cung cấp các cơ chế như JSON mode và Structured Outputs để định hướng mô hình trả về dữ liệu có cấu trúc. JSON mode giúp đầu ra là JSON hợp lệ, còn Structured Outputs hướng đến việc ràng buộc đầu ra theo schema cụ thể [4]. Trong dự án hiện tại, hệ thống sử dụng hướng tiếp cận JSON có kiểm tra bổ sung ở backend: AI được yêu cầu trả về JSON, sau đó kết quả được phân tích và kiểm tra lại trước khi lưu hoặc hiển thị.

Lớp kiểm tra này có vai trò quan trọng trong hệ thống phỏng vấn thử. Nếu AI trả về thiếu trường, sai kiểu dữ liệu hoặc cấu trúc không đúng, backend có thể phát hiện và chuyển sang nội dung dự phòng thay vì để lỗi lan ra giao diện. Nhờ đó, các tác vụ như sinh câu hỏi, tạo feedback và tạo báo cáo có tính ổn định cao hơn khi phụ thuộc vào mô hình bên ngoài [3-T1].

---
*[1] Elastic. "What is a Large Language Model?" https://www.elastic.co/what-is/large-language-models*
*[2] OpenAI. "Text generation." https://developers.openai.com/api/docs/guides/text*
*[3] OpenAI. "Prompt Engineering." https://developers.openai.com/api/docs/guides/prompt-engineering*
*[4] OpenAI. "Structured Outputs." https://developers.openai.com/api/docs/guides/structured-outputs*
*[3-T1] AI Mock Interview implementation sources: `client/package.json`, `server/package.json`, `server/src/config/env.validation.ts`, `server/src/ai/openai.gateway.ts`, `server/src/ai/prompt-builder.service.ts`, `server/src/ai/pipelines/pipeline.schemas.ts`.*

## 3.4 Công Nghệ Xử Lý Ngôn Ngữ Trong Hệ Thống AI Mock Interview

### 3.4.1 Xử lý câu trả lời dạng văn bản

Trong phạm vi Chương 3, xử lý ngôn ngữ cần được hiểu là nền tảng công nghệ cho việc tiếp nhận, biểu diễn và đánh giá câu trả lời bằng văn bản. Đầu vào chính của hệ thống là câu trả lời tự nhiên của người dùng, không phải lựa chọn trắc nghiệm hay biểu mẫu cố định. Vì vậy, hệ thống cần một lớp AI có khả năng hiểu nội dung, ý định, mức độ đầy đủ và cách trình bày của câu trả lời.

Cách tiếp cận text-first phù hợp với mục tiêu GR1 vì trọng tâm của đề tài là luyện tư duy trả lời phỏng vấn và nhận phản hồi. Văn bản giúp hệ thống kiểm soát rõ hơn các phần như câu hỏi, câu trả lời, tiêu chí đánh giá, điểm số và báo cáo. Đây cũng là dạng dữ liệu phù hợp để lưu lịch sử phiên, so sánh kết quả giữa các lần luyện tập và tổng hợp nhận xét sau phiên.

### 3.4.2 Token, ngữ cảnh và giới hạn đầu vào

LLM không xử lý văn bản theo đúng cách con người nhìn thấy từng câu hay từng từ. Mô hình thường chia văn bản thành các đơn vị nhỏ hơn gọi là token. Vì vậy, khi đưa mô tả công việc, câu hỏi, câu trả lời và rubric vào cùng một yêu cầu, hệ thống phải quan tâm đến độ dài ngữ cảnh và lượng nội dung cần gửi cho mô hình [2].

Trong AI Mock Interview, dữ liệu đưa vào AI được chọn theo mục tiêu của từng tác vụ. Với sinh câu hỏi, phần quan trọng là mô tả công việc, loại phỏng vấn và tiêu chí năng lực. Với đánh giá câu trả lời, phần quan trọng là câu hỏi, câu trả lời của ứng viên và rubric. Với báo cáo tổng hợp, hệ thống cần dùng kết quả của cả phiên ở mức vừa đủ để tạo nhận xét có ý nghĩa. Cách chọn ngữ cảnh này giúp giảm nhiễu và tránh gửi quá nhiều dữ liệu không cần thiết cho mô hình.

### 3.4.3 Rubric và ngôn ngữ đầu ra

Rubric là cơ sở để phản hồi của AI không chỉ dựa trên cảm nhận chung. Trong hệ thống, rubric giúp xác định những tiêu chí cần đánh giá, ví dụ mức độ đúng trọng tâm, tính cụ thể, logic trình bày, ví dụ minh họa hoặc khả năng liên hệ với vị trí ứng tuyển. Khi có rubric, cùng một câu trả lời có thể được đánh giá theo tiêu chí rõ ràng hơn.

Hệ thống cũng hỗ trợ định hướng ngôn ngữ đầu ra để phản hồi phù hợp với người dùng. Với bối cảnh sinh viên và fresher tại Việt Nam, phản hồi bằng tiếng Việt rõ ràng, trực tiếp và có ví dụ cụ thể giúp người dùng dễ hiểu điểm cần sửa hơn so với phản hồi chung chung. Đây là lý do phần xử lý ngôn ngữ không chỉ quan tâm đến việc AI "hiểu" câu trả lời, mà còn quan tâm đến cách AI diễn đạt kết quả cho người học.

### 3.4.4 Giới hạn giọng nói trong phạm vi Chương 3

Trả lời bằng giọng nói là một hướng mở rộng tự nhiên của hệ thống phỏng vấn thử, vì phỏng vấn thực tế thường diễn ra bằng lời nói. Tuy nhiên, trong Chương 3 này, giọng nói không được trình bày như công nghệ trọng tâm của GR1. Các công nghệ như ghi âm, lưu trữ tệp âm thanh, nhận dạng giọng nói hoặc phân tích tốc độ nói chỉ nên được xem là hướng phát triển tiếp theo nếu hệ thống mở rộng sang luyện nói.

Với phạm vi hiện tại của phần cơ sở công nghệ, trọng tâm vẫn là xử lý câu trả lời văn bản, LLM, prompt, kiểm soát đầu ra và hạ tầng web phục vụ quá trình luyện phỏng vấn.

## 3.5 Công Nghệ Frontend Cho Ứng Dụng Web

### 3.5.1 Next.js và React

Frontend của AI Mock Interview được xây dựng bằng Next.js 16.2 và React 19.2. Next.js là framework dựa trên React, cung cấp các khả năng cần thiết cho ứng dụng web hiện đại như routing, rendering phía server, tối ưu tải trang và tổ chức mã nguồn theo cấu trúc ứng dụng [5]. React đảm nhiệm phần xây dựng giao diện theo component, giúp các màn hình như cấu hình phiên, trả lời phỏng vấn, xem lịch sử và đọc báo cáo có thể được chia nhỏ thành các phần dễ quản lý.

Next.js phù hợp với dự án vì hệ thống vừa có các trang cần tương tác mạnh, vừa có các trang cần tải dữ liệu rõ ràng từ backend. Ví dụ, màn hình phỏng vấn cần phản ứng với thao tác của người dùng, trong khi trang báo cáo cần hiển thị dữ liệu đã tổng hợp một cách ổn định. Việc dùng cùng một nền tảng frontend giúp trải nghiệm người dùng nhất quán từ lúc tạo phiên đến lúc xem kết quả.

### 3.5.2 App Router và phân tách Server/Client Components

App Router của Next.js tổ chức định tuyến dựa trên cấu trúc thư mục trong ứng dụng. Cách này giúp mỗi trang, layout và nhóm route có vị trí rõ ràng. Tài liệu Next.js cũng phân biệt Server Components và Client Components: phần không cần tương tác trực tiếp với trình duyệt có thể xử lý ở server, còn phần cần trạng thái giao diện, sự kiện người dùng hoặc API trình duyệt sẽ chạy ở client [6].

Trong AI Mock Interview, cách phân tách này phù hợp với đặc điểm của từng màn hình. Các trang đọc dữ liệu như danh sách phiên hoặc báo cáo có thể ưu tiên tải dữ liệu ổn định. Các phần như form cấu hình, màn hình trả lời và trạng thái chờ kết quả cần tương tác trực tiếp nên được xử lý ở phía client. Nhờ đó, giao diện vừa giữ được tính phản hồi nhanh, vừa không phải dồn toàn bộ logic vào trình duyệt.

### 3.5.3 TypeScript và Tailwind CSS

TypeScript được sử dụng ở cả frontend và backend để giảm lỗi kiểu dữ liệu. Với một hệ thống có nhiều dữ liệu trao đổi như phiên phỏng vấn, câu hỏi, câu trả lời, feedback và báo cáo, kiểm tra kiểu tĩnh giúp phát hiện sớm các sai lệch giữa giao diện và API trong quá trình phát triển.

Tailwind CSS v4 được dùng để xây dựng giao diện theo hướng utility-first. Thay vì tạo nhiều lớp CSS riêng cho từng thành phần, lập trình viên có thể dùng các lớp tiện ích để mô tả khoảng cách, màu sắc, bố cục và trạng thái ngay trong component. Cách này phù hợp với giai đoạn phát triển nhanh của dự án, đồng thời vẫn giữ được tính nhất quán về giao diện nếu các quy ước thiết kế được dùng thống nhất [3-T2].

---
*[5] Next.js. "What is Next.js?" https://nextjs.org/docs*
*[6] Next.js. "Server and Client Components." https://nextjs.org/docs/app/getting-started/server-and-client-components*
*[3-T2] Frontend implementation sources: `client/package.json`, `client/app`, `client/components`, `client/lib/types.ts`.*

## 3.6 Công Nghệ Backend Và Giao Tiếp API

### 3.6.1 NestJS

Backend của AI Mock Interview được xây dựng bằng NestJS 11. NestJS là framework Node.js hỗ trợ TypeScript và cung cấp kiến trúc ứng dụng có tổ chức, phù hợp với các hệ thống có nhiều module, nhiều luồng dữ liệu và nhiều lớp xử lý [7].

NestJS phù hợp với dự án vì backend không chỉ trả về dữ liệu đơn giản. Hệ thống cần xác thực người dùng, quản lý phiên phỏng vấn, nhận câu trả lời, gọi AI, tạo báo cáo, xử lý hàng đợi và gửi cập nhật trạng thái. Nếu không có cấu trúc rõ ràng, các phần này dễ bị trộn lẫn. NestJS giúp chia hệ thống thành các nhóm chức năng, mỗi nhóm có trách nhiệm riêng và có thể kiểm thử độc lập hơn.

### 3.6.2 Module, controller, service và dependency injection

Ba khái niệm quan trọng trong NestJS là module, controller và service. Module dùng để gom các thành phần cùng phạm vi trách nhiệm. Controller tiếp nhận request từ client và trả response. Service chứa phần xử lý chính và có thể được tái sử dụng bởi nhiều controller hoặc thành phần khác [8][9][10].

Dependency injection là cơ chế giúp một thành phần nhận các phụ thuộc cần thiết mà không phải tự khởi tạo trực tiếp. Với AI Mock Interview, điều này giúp backend dễ thay thế hoặc kiểm thử các phần như truy cập cơ sở dữ liệu, gọi AI, gửi sự kiện trạng thái và xử lý hàng đợi. Đây là lý do NestJS phù hợp với hệ thống có nhiều tích hợp như Prisma, BullMQ, Redis, Supabase và OpenAI-compatible API [3-T3].

### 3.6.3 Validation, guard và exception filter

Backend cần kiểm soát dữ liệu đầu vào trước khi xử lý. Validation giúp từ chối sớm các request thiếu trường, sai kiểu dữ liệu hoặc không đúng ràng buộc. Guard giúp kiểm tra quyền truy cập, ví dụ chỉ người dùng hợp lệ mới được thao tác với phiên của mình. Exception filter giúp chuẩn hóa lỗi trả về để frontend có thể hiển thị thông báo ổn định thay vì phụ thuộc vào lỗi kỹ thuật thô.

Các cơ chế này là nền tảng của backend chứ không phải logic nghiệp vụ riêng lẻ. Chúng giúp hệ thống an toàn hơn, dễ bảo trì hơn và giảm khả năng một lỗi nhỏ ở dữ liệu đầu vào làm hỏng toàn bộ luồng luyện phỏng vấn.

### 3.6.4 REST API và Server-Sent Events

REST API được dùng cho các thao tác request-response thông thường, ví dụ tạo phiên, lấy dữ liệu phiên, gửi câu trả lời hoặc tải báo cáo. Mô hình này phù hợp khi client gửi một yêu cầu rõ ràng và nhận một kết quả phản hồi sau đó.

Tuy nhiên, một số kết quả trong hệ thống không có ngay lập tức vì phụ thuộc vào AI hoặc xử lý nền. Với các trường hợp cần báo cho client biết trạng thái mới, hệ thống sử dụng Server-Sent Events (SSE). SSE là cơ chế cho phép server đẩy sự kiện một chiều đến trình duyệt qua kết nối HTTP đang mở [11]. So với WebSocket, SSE đơn giản hơn khi hệ thống chỉ cần gửi cập nhật từ server về client, chẳng hạn thông báo phiên đã sẵn sàng hoặc báo cáo đã tạo xong.

---
*[7] NestJS. "Introduction." https://docs.nestjs.com/*
*[8] NestJS. "Modules." https://docs.nestjs.com/modules*
*[9] NestJS. "Controllers." https://docs.nestjs.com/controllers*
*[10] NestJS. "Providers." https://docs.nestjs.com/providers*
*[11] MDN Web Docs. "Server-sent events." https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events*
*[3-T3] Backend implementation sources: `server/package.json`, `server/src/app.module.ts`, `server/src/main.ts`, `server/src/common`, `server/src/auth`, `server/src/session`, `server/src/turn`, `server/src/report`.*

## 3.7 Công Nghệ Xử Lý Bất Đồng Bộ Và Cập Nhật Trạng Thái

### 3.7.1 Nhu cầu xử lý bất đồng bộ

Các tác vụ liên quan đến AI thường có thời gian xử lý không ổn định. Thời gian này phụ thuộc vào độ dài đầu vào, mô hình được dùng, tình trạng mạng và giới hạn của nhà cung cấp AI. Nếu giữ request HTTP mở cho đến khi AI trả về, người dùng có thể gặp timeout hoặc giao diện bị chờ lâu.

Vì vậy, hệ thống cần xử lý bất đồng bộ cho các tác vụ nặng. Request ban đầu chỉ cần ghi nhận yêu cầu và trả về trạng thái phù hợp; phần xử lý AI được chuyển sang hàng đợi nền. Khi có kết quả, hệ thống cập nhật trạng thái và gửi thông báo cho client. Cách tiếp cận này giúp giao diện phản hồi nhanh hơn và backend kiểm soát lỗi tốt hơn.

### 3.7.2 BullMQ và Redis

AI Mock Interview sử dụng BullMQ 5 làm thư viện hàng đợi trên nền Redis. Theo tài liệu BullMQ, thư viện này được thiết kế cho hệ thống hàng đợi nhanh, có khả năng xử lý job phân tán và hỗ trợ các tính năng như retry, delayed jobs, concurrency và phục hồi sau lỗi tiến trình [12].

Redis đóng vai trò lưu trạng thái hàng đợi và job. Khi backend thêm một tác vụ vào hàng đợi, worker có thể lấy job đó để xử lý ở nền. Cách này phù hợp với các tác vụ như sinh câu hỏi, tạo feedback, tạo báo cáo hoặc các bước xử lý kéo dài khác. Điểm quan trọng trong Chương 3 là công nghệ hàng đợi giúp tách request ngắn của người dùng khỏi công việc nền có thời gian xử lý dài, không phải mô tả từng bước xử lý nội bộ.

### 3.7.3 Retry, backoff và fallback

Một lợi ích chính của hàng đợi là khả năng thử lại khi lỗi tạm thời xảy ra. Ví dụ, lỗi mạng hoặc giới hạn tốc độ từ dịch vụ bên ngoài có thể được xử lý bằng retry và backoff. Thay vì bắt người dùng gửi lại thao tác thủ công, hệ thống có thể tự thử lại trong giới hạn đã cấu hình.

Fallback là lớp bảo vệ cuối cùng khi một tác vụ AI không thể hoàn thành như mong muốn. Trong hệ thống phỏng vấn thử, fallback giúp giảm rủi ro một lỗi từ dịch vụ AI làm ngắt toàn bộ phiên luyện tập. Ví dụ, hệ thống có thể dùng nội dung dự phòng hoặc câu hỏi có sẵn để tiếp tục trải nghiệm ở mức chấp nhận được. Đây là một quyết định kỹ thuật quan trọng vì ứng dụng AI cần tính ổn định, không chỉ cần chất lượng đầu ra tốt trong điều kiện lý tưởng [3-T4].

### 3.7.4 Kết hợp hàng đợi và cập nhật trạng thái

Hàng đợi giải quyết phần xử lý nền, còn SSE giải quyết phần thông báo trạng thái cho giao diện. Hai công nghệ này bổ sung cho nhau: BullMQ và Redis giúp backend xử lý tác vụ dài ở nền; SSE giúp frontend biết khi nào trạng thái phiên hoặc báo cáo đã thay đổi. Nhờ đó, người dùng không cần liên tục tải lại trang để kiểm tra kết quả.

---
*[12] BullMQ. "What is BullMQ." https://docs.bullmq.io/*
*[3-T4] Async processing implementation sources: `server/package.json`, `server/src/common/constants/queue.constants.ts`, `server/src/ai/ai.module.ts`, `server/src/ai/processors`, `server/src/common/services/sse.service.ts`.*

## 3.8 Công Nghệ Lưu Trữ Dữ Liệu Và Truy Cập Cơ Sở Dữ Liệu

### 3.8.1 PostgreSQL và Supabase

AI Mock Interview sử dụng PostgreSQL làm hệ quản trị cơ sở dữ liệu quan hệ, được triển khai thông qua Supabase. Supabase cung cấp nền tảng backend-as-a-service trên PostgreSQL, kèm các thành phần như xác thực, lưu trữ và công cụ quản trị dữ liệu [13].

PostgreSQL phù hợp với hệ thống vì dữ liệu của dự án có nhiều quan hệ rõ ràng: người dùng, hồ sơ, phiên phỏng vấn, câu hỏi, câu trả lời, feedback và báo cáo. Cơ sở dữ liệu quan hệ giúp biểu diễn các liên kết này chặt chẽ hơn so với chỉ lưu dữ liệu rời rạc. Ngoài ra, PostgreSQL hỗ trợ kiểu JSON/JSONB, phù hợp với các phần dữ liệu bán cấu trúc như rubric, nội dung báo cáo hoặc điểm theo nhóm năng lực [14].

### 3.8.2 Prisma ORM

Prisma ORM 7.8 được dùng làm lớp truy cập cơ sở dữ liệu trong backend. Prisma cung cấp Prisma Client, một bộ truy vấn được sinh tự động từ schema và có kiểm tra kiểu cho TypeScript [15]. Điều này giúp lập trình viên thao tác với dữ liệu an toàn hơn, vì nhiều sai lệch về tên trường hoặc kiểu dữ liệu có thể được phát hiện trong quá trình phát triển.

Trong dự án, Prisma đóng vai trò cầu nối giữa NestJS và PostgreSQL. Schema Prisma mô tả các bảng, quan hệ, chỉ mục và một số ràng buộc dữ liệu. Từ schema đó, backend có thể truy vấn dữ liệu theo cách rõ ràng hơn so với viết toàn bộ SQL thủ công. Với một hệ thống có nhiều nhóm dữ liệu như phỏng vấn, feedback và báo cáo, Prisma giúp giảm lỗi lặp lại và giữ mô hình dữ liệu nhất quán hơn [3-T5].

### 3.8.3 JSONB, giao dịch và ràng buộc dữ liệu

Không phải mọi dữ liệu trong hệ thống đều có cấu trúc cố định hoàn toàn. Rubric, điểm theo năng lực, nội dung báo cáo và một số metadata có thể thay đổi theo loại phiên hoặc phiên bản prompt. PostgreSQL JSONB phù hợp với các phần này vì cho phép lưu dữ liệu dạng JSON trong cơ sở dữ liệu quan hệ, đồng thời vẫn giữ được các bảng và quan hệ chính của hệ thống [14].

Bên cạnh JSONB, hệ thống cũng cần giao dịch và ràng buộc dữ liệu để bảo vệ tính nhất quán. Ví dụ, một câu trả lời cần gắn với đúng phiên và đúng câu hỏi; một báo cáo cần thuộc về một phiên cụ thể; điểm số và trạng thái cần nằm trong phạm vi hợp lệ. Các ràng buộc này giúp cơ sở dữ liệu trở thành lớp bảo vệ bổ sung, không chỉ dựa vào kiểm tra ở backend.

### 3.8.4 Đồng bộ schema và phần SQL bổ sung

Trong giai đoạn phát triển hiện tại, dự án dùng Prisma để đồng bộ phần schema chính với cơ sở dữ liệu. Tuy nhiên, một số ràng buộc nâng cao của PostgreSQL không phải lúc nào cũng được biểu diễn đầy đủ bằng Prisma. Vì vậy, dự án có thêm quy trình áp dụng SQL bổ sung cho các thành phần như chính sách bảo vệ dữ liệu, trigger, ràng buộc kiểm tra và chỉ mục đặc thù [3-T6].

Điểm cần nhấn mạnh ở Chương 3 là đây là lựa chọn công nghệ để cân bằng giữa tốc độ phát triển và an toàn dữ liệu. Prisma giúp mô hình dữ liệu dễ đọc, dễ dùng trong TypeScript; SQL bổ sung giúp tận dụng các khả năng mạnh của PostgreSQL khi cần bảo vệ dữ liệu ở tầng cơ sở dữ liệu.

### 3.8.5 Các nhóm dữ liệu chính trong hệ thống

Ở mức tổng quan công nghệ, dữ liệu của AI Mock Interview có thể chia thành bốn nhóm chính:

| Nhóm dữ liệu | Vai trò trong hệ thống |
| --- | --- |
| Người dùng và hồ sơ | Lưu thông tin tài khoản, hồ sơ cá nhân và định hướng nghề nghiệp |
| Phiên phỏng vấn | Lưu cấu hình phiên, loại phỏng vấn, câu hỏi và câu trả lời |
| Feedback và báo cáo | Lưu kết quả đánh giá, nhận xét, điểm số và nội dung tổng hợp sau phiên |
| Kho câu hỏi | Lưu câu hỏi có sẵn để hỗ trợ sinh câu hỏi và đảm bảo hệ thống có phương án dự phòng |

Cách chia này chỉ nhằm giải thích nền tảng lưu trữ dữ liệu. Thiết kế chi tiết từng bảng, quan hệ và thuật toán chọn dữ liệu phù hợp hơn với Chương 4, nơi trình bày kiến trúc và thiết kế triển khai của hệ thống.

---
*[13] Supabase. "Database." https://supabase.com/docs/guides/database/overview*
*[14] PostgreSQL. "JSON Types." https://www.postgresql.org/docs/current/datatype-json.html*
*[15] Prisma. "Prisma ORM." https://www.prisma.io/docs/orm*
*[3-T5] Database implementation sources: `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/src/prisma`, `server/package.json`.*
*[3-T6] Raw SQL synchronization sources: `docs/Design/ArchitecturalDesign/ADRs/ADR-008_raw-sql-outside-prisma-db-push.md`, `server/prisma/migrations/migration.sql`, `server/prisma/verify-db-hardening.ts`.*

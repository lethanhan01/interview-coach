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

### 3.3.1 Mô hình ngôn ngữ lớn và OpenAI-compatible API

#### Lý thuyết

Mô hình ngôn ngữ lớn (Large Language Model - LLM) là nhóm mô hình AI có khả năng xử lý và sinh văn bản tự nhiên dựa trên ngữ cảnh đầu vào. Trong các API sinh văn bản hiện nay, ứng dụng thường gửi yêu cầu dưới dạng một chuỗi thông điệp, trong đó có chỉ dẫn hệ thống, dữ liệu người dùng và yêu cầu đầu ra. Tài liệu OpenAI mô tả text generation là năng lực tạo phản hồi từ đầu vào văn bản hoặc đa phương thức, đồng thời cho phép nhà phát triển điều khiển mô hình bằng chỉ dẫn, ngữ cảnh và tham số sinh kết quả [3.3-S1].

OpenAI-compatible API là cách gọi những dịch vụ cung cấp giao diện tương thích với API của OpenAI. Về mặt ứng dụng, điều này giúp backend giữ cùng một cách gửi thông điệp và nhận kết quả, trong khi nhà cung cấp hoặc mô hình cụ thể có thể được thay đổi bằng cấu hình triển khai. Cần lưu ý rằng mức độ tương thích giữa các nhà cung cấp có thể khác nhau, đặc biệt ở các tính năng như JSON mode, structured output hoặc audio transcription. Nếu một tính năng không được nhà cung cấp xác nhận chính thức, báo cáo chỉ nên mô tả ở mức hệ thống có cơ chế cấu hình và kiểm tra bổ sung, không khẳng định tương thích hoàn toàn.

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, LLM được dùng cho các tác vụ cốt lõi có đầu vào là ngôn ngữ tự nhiên: sinh câu hỏi theo mô tả công việc, đánh giá câu trả lời, tạo phản hồi cải thiện và tổng hợp báo cáo sau phiên. Người dùng có thể nhập mô tả vị trí ứng tuyển, chọn loại phiên phỏng vấn và trả lời bằng văn bản; backend chuyển các dữ liệu này thành yêu cầu gửi tới mô hình, sau đó xử lý kết quả để lưu vào cơ sở dữ liệu và hiển thị trên giao diện. Ở phía chat completion, backend hỗ trợ cấu hình OpenAI-compatible base URL; riêng speech-to-text hiện được gọi qua client audio của OpenAI trong luồng voice mode [3.3-T1].

LLM không được dùng như một hệ thống ra quyết định tuyển dụng, mà đóng vai trò trợ lý luyện tập. Kết quả AI được đặt trong luồng nghiệp vụ có kiểm soát: câu hỏi được gắn với phiên phỏng vấn, phản hồi được gắn với câu trả lời, báo cáo được tạo sau khi có đủ dữ liệu phiên, và khi dịch vụ AI gặp lỗi hệ thống có thể dùng nội dung dự phòng để phiên luyện tập không bị gián đoạn hoàn toàn [3.3-T1].

#### Lý do chọn

LLM phù hợp với bài toán phỏng vấn thử vì dữ liệu chính của hệ thống là văn bản tự do. Nếu chỉ dùng luật cố định, hệ thống khó đánh giá một câu trả lời có nhiều cách diễn đạt khác nhau, khó tạo nhận xét theo ngữ cảnh và khó sinh câu hỏi mới từ từng mô tả công việc. LLM giúp hệ thống xử lý linh hoạt hơn các trường hợp như câu trả lời thiếu ví dụ, trả lời lan man, chưa liên hệ với vị trí ứng tuyển hoặc cần gợi ý cách diễn đạt tốt hơn.

So với việc xây dựng mô hình NLP riêng, sử dụng API LLM giúp giảm đáng kể chi phí dữ liệu huấn luyện, hạ tầng tính toán và thời gian phát triển. So với danh sách câu hỏi cố định, LLM hỗ trợ cá nhân hóa theo vị trí, cấp độ và loại phỏng vấn. Cách dùng OpenAI-compatible API cũng phù hợp với năng lực nhóm phát triển vì nhóm có thể tập trung vào thiết kế luồng luyện tập, kiểm soát đầu ra và giao diện phản hồi thay vì tự vận hành mô hình nền tảng.

### 3.3.2 Prompt engineering

#### Lý thuyết

Prompt engineering là kỹ thuật thiết kế chỉ dẫn cho mô hình để đầu ra bám sát nhiệm vụ của ứng dụng. Tài liệu OpenAI khuyến nghị nhà phát triển cung cấp hướng dẫn rõ ràng, chia nhiệm vụ phức tạp thành các bước hợp lý, đưa ngữ cảnh cần thiết và nêu định dạng đầu ra mong muốn khi cần kết quả có cấu trúc [3.3-S2]. Trong ứng dụng dùng LLM, prompt không chỉ là câu hỏi gửi cho mô hình, mà là phần mô tả vai trò, mục tiêu, dữ liệu đầu vào, tiêu chí đánh giá và ràng buộc đầu ra.

Một prompt tốt cần giảm mơ hồ. Ví dụ, nếu chỉ yêu cầu "đánh giá câu trả lời", mô hình có thể trả lời bằng nhận xét chung. Nếu prompt nêu rõ loại phỏng vấn, tiêu chí đánh giá, mức điểm, cách viết nhận xét và định dạng trả về, kết quả sẽ dễ dùng hơn trong hệ thống phần mềm. Tuy nhiên, prompt không thay thế hoàn toàn kiểm thử và kiểm tra dữ liệu ở backend, vì mô hình vẫn có thể trả về kết quả thiếu hoặc sai cấu trúc.

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, prompt được tách theo từng tác vụ: sinh câu hỏi, phản hồi từng câu trả lời và tổng hợp báo cáo. Mỗi nhóm prompt nhận dữ liệu khác nhau. Sinh câu hỏi cần mô tả công việc, loại phiên và số lượng câu hỏi. Phản hồi câu trả lời cần câu hỏi, câu trả lời của ứng viên, loại năng lực đang đánh giá và rubric tương ứng. Báo cáo cần dữ liệu tổng hợp của phiên để nhận xét điểm mạnh, điểm yếu và hướng cải thiện.

Hệ thống cũng đưa ngữ cảnh văn hóa và nhóm năng lực vào prompt để phản hồi phù hợp hơn với người dùng mục tiêu. Với phiên kỹ thuật, prompt ưu tiên tiêu chí chuyên môn và khả năng giải thích lựa chọn kỹ thuật. Với phiên hành vi, prompt ưu tiên bối cảnh, hành động cá nhân, kết quả và bài học. Cách tách prompt theo nhiệm vụ giúp nhóm phát triển điều chỉnh chất lượng từng luồng mà không phải thay đổi toàn bộ pipeline AI [3.3-T1].

#### Lý do chọn

Prompt engineering được chọn vì đây là lớp điều khiển phù hợp nhất trong giai đoạn GR1. Hệ thống cần thay đổi hành vi AI theo loại phiên, vị trí ứng tuyển và mục tiêu feedback, nhưng chưa có nhu cầu hoặc nguồn lực để huấn luyện mô hình riêng. Việc quản lý prompt theo tác vụ giúp tăng khả năng bảo trì: khi feedback còn chung chung, nhóm có thể sửa prompt phản hồi; khi câu hỏi chưa đúng loại phỏng vấn, nhóm có thể sửa prompt sinh câu hỏi.

So với fine-tuning, prompt engineering có chi phí thấp hơn, triển khai nhanh hơn và dễ thử nghiệm hơn. So với hard-code câu trả lời mẫu, prompt cho phép hệ thống phản ứng với nội dung người dùng nhập vào. Nhược điểm là chất lượng vẫn phụ thuộc vào mô hình và có thể dao động, vì vậy hệ thống cần kết hợp prompt với kiểm tra JSON, schema, fallback và lưu vết phiên bản prompt.

### 3.3.3 Kiểm soát đầu ra bằng JSON, structured output và schema

#### Lý thuyết

Khi ứng dụng cần xử lý kết quả AI bằng chương trình, đầu ra dạng văn bản tự do thường không đủ ổn định. OpenAI cung cấp JSON mode để khuyến khích mô hình trả về JSON hợp lệ và Structured Outputs để ràng buộc đầu ra theo JSON Schema trong các trường hợp được hỗ trợ [3.3-S3]. Điểm khác biệt quan trọng là JSON hợp lệ chưa chắc đã đúng cấu trúc nghiệp vụ. Một phản hồi có thể là JSON đúng cú pháp nhưng vẫn thiếu trường, sai kiểu dữ liệu hoặc chứa giá trị ngoài miền cho phép.

Vì vậy, trong ứng dụng thực tế, kiểm soát đầu ra nên gồm nhiều lớp: yêu cầu mô hình trả về dữ liệu có cấu trúc, phân tích JSON ở backend, kiểm tra schema và có phương án xử lý khi kết quả không đạt yêu cầu. Đây là cách tiếp cận thận trọng vì LLM là thành phần xác suất, không phải hàm xử lý luôn trả về cùng một kết quả.

#### Ứng dụng trong hệ thống

AI Mock Interview yêu cầu đầu ra có cấu trúc cho nhiều tác vụ. Khi sinh câu hỏi, hệ thống cần danh sách câu hỏi, loại câu hỏi, nhóm năng lực và độ khó. Khi tạo feedback, hệ thống cần điểm theo tiêu chí, câu trả lời mẫu, nhận xét chính và các đoạn được đánh dấu. Khi tạo báo cáo, hệ thống cần nội dung có thể lưu, hiển thị và tổng hợp theo các phần rõ ràng.

Backend yêu cầu AI trả về JSON, sau đó phân tích và kiểm tra kết quả trước khi lưu hoặc hiển thị. Nếu kết quả thiếu dữ liệu, sai kiểu hoặc không thể phân tích, hệ thống có thể chuyển sang nội dung dự phòng hoặc báo lỗi có kiểm soát. Cơ chế này đặc biệt quan trọng với báo cáo và điểm số, vì giao diện người dùng không nên phải xử lý trực tiếp các phản hồi AI không ổn định [3.3-T1].

#### Lý do chọn

Kiểm soát đầu ra bằng JSON và schema phù hợp vì hệ thống không chỉ hiển thị văn bản AI, mà còn lưu dữ liệu, tính điểm, vẽ biểu đồ và theo dõi tiến độ phiên. Nếu dùng văn bản tự do, backend phải suy đoán vị trí điểm số hoặc nhận xét, dễ gây lỗi và khó kiểm thử. JSON giúp dữ liệu đi qua các lớp backend, cơ sở dữ liệu và frontend theo hợp đồng rõ ràng hơn.

So với việc chỉ yêu cầu mô hình "trả lời theo mẫu", schema validation an toàn hơn vì hệ thống có thể phát hiện sai lệch trước khi người dùng nhìn thấy. So với phụ thuộc hoàn toàn vào Structured Outputs, cách kiểm tra bổ sung ở backend linh hoạt hơn với môi trường dùng API tương thích, nơi một số tính năng chính thức của OpenAI có thể chưa được hỗ trợ đầy đủ.

---
*Nguồn tham khảo mục 3.3:*

*[3.3-S1] OpenAI. "Text generation." https://developers.openai.com/api/docs/guides/text*

*[3.3-S2] OpenAI. "Prompt engineering." https://developers.openai.com/api/docs/guides/prompt-engineering*

*[3.3-S3] OpenAI. "Structured Outputs." https://developers.openai.com/api/docs/guides/structured-outputs*

*[3.3-T1] AI Mock Interview implementation sources: `server/package.json`, `server/src/config/env.validation.ts`, `server/src/ai/openai.gateway.ts`, `server/src/ai/prompt-builder.service.ts`, `server/src/ai/pipelines/pipeline.schemas.ts`, `server/src/ai/processors`.*

## 3.4 Công Nghệ Xử Lý Ngôn Ngữ Trong Hệ Thống AI Mock Interview

### 3.4.1 Xử lý câu trả lời dạng văn bản

#### Lý thuyết

Xử lý ngôn ngữ trong phạm vi hệ thống này tập trung vào việc tiếp nhận, biểu diễn và đánh giá câu trả lời tự nhiên của người dùng. Khác với câu hỏi trắc nghiệm, câu trả lời phỏng vấn có thể dài, thiếu cấu trúc, dùng nhiều cách diễn đạt khác nhau và chứa cả thông tin chuyên môn lẫn cách trình bày. LLM phù hợp với dạng dữ liệu này vì API sinh văn bản có thể nhận ngữ cảnh, chỉ dẫn và nội dung người dùng để tạo phản hồi dựa trên nhiệm vụ cụ thể [3.4-S1].

Tuy nhiên, xử lý ngôn ngữ bằng LLM không đồng nghĩa với việc hệ thống hiểu câu trả lời giống con người. Kết quả cần được đặt trong phạm vi luyện tập, có tiêu chí đánh giá rõ ràng và có bước kiểm tra đầu ra. Vì vậy, báo cáo chỉ nên xem LLM là công nghệ hỗ trợ phân tích và sinh phản hồi, không khẳng định hệ thống có khả năng đánh giá tuyển dụng thay cho chuyên gia.

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, đầu vào chính của phiên luyện tập là văn bản: mô tả công việc, cấu hình phiên, câu hỏi và câu trả lời của ứng viên. Backend đưa câu hỏi, câu trả lời và rubric vào yêu cầu AI để tạo feedback. Kết quả sau đó được lưu cùng phiên phỏng vấn và dùng để hiển thị nhận xét, câu trả lời mẫu, đoạn cần cải thiện và báo cáo tổng hợp.

Cách tiếp cận text-first giúp hệ thống giữ được một luồng xử lý thống nhất. Dù người dùng trả lời trực tiếp bằng văn bản hay trả lời bằng giọng nói rồi chuyển thành transcript, phần đánh giá chính vẫn dựa trên nội dung văn bản cuối cùng. Điều này giúp hệ thống lưu lịch sử phiên, so sánh câu trả lời và tạo báo cáo mà không phụ thuộc hoàn toàn vào dữ liệu âm thanh.

#### Lý do chọn

Text-first phù hợp với mục tiêu GR1 vì trọng tâm của đề tài là luyện cách trả lời phỏng vấn và nhận phản hồi có thể đọc lại. Văn bản dễ lưu trữ, dễ kiểm tra, dễ hiển thị trên giao diện và phù hợp với việc tạo báo cáo sau phiên. Với nhóm sinh viên và fresher, phản hồi bằng văn bản cũng giúp người dùng xem lại lỗi diễn đạt, thiếu ý hoặc thiếu ví dụ cụ thể sau khi luyện tập.

So với việc ưu tiên xử lý giọng nói ngay từ đầu, xử lý văn bản có chi phí triển khai thấp hơn và ít phụ thuộc vào chất lượng micro, môi trường ghi âm hoặc lỗi nhận dạng giọng nói. Voice mode vẫn có giá trị cho trải nghiệm phỏng vấn gần thực tế hơn, nhưng văn bản là lớp dữ liệu ổn định hơn để hệ thống đánh giá và tổng hợp trong phạm vi hiện tại.

### 3.4.2 Token, ngữ cảnh và giới hạn đầu vào

#### Lý thuyết

LLM thường không xử lý văn bản theo từng từ như cách người đọc nhìn thấy, mà chia dữ liệu thành các đơn vị gọi là token. Tài liệu OpenAI về text generation và prompt engineering nhấn mạnh việc cung cấp ngữ cảnh phù hợp cho mô hình, đồng thời tránh đưa quá nhiều thông tin không cần thiết vì điều này làm tăng chi phí, độ trễ và nguy cơ mô hình tập trung sai trọng tâm [3.4-S1][3.4-S2].

Khái niệm ngữ cảnh trong LLM bao gồm dữ liệu đầu vào mà mô hình được phép dùng để tạo phản hồi. Với một tác vụ phỏng vấn thử, ngữ cảnh có thể gồm mô tả công việc, loại phiên, câu hỏi, câu trả lời, rubric và lịch sử một phần của phiên. Nếu ngữ cảnh thiếu, phản hồi dễ chung chung. Nếu ngữ cảnh quá rộng, phản hồi có thể bị nhiễu hoặc vượt giới hạn đầu vào của mô hình.

#### Ứng dụng trong hệ thống

AI Mock Interview chọn dữ liệu gửi vào AI theo từng mục tiêu. Khi sinh câu hỏi, phần quan trọng là mô tả công việc, loại phỏng vấn, số lượng câu hỏi và nhóm năng lực cần đánh giá. Khi chấm câu trả lời, hệ thống ưu tiên câu hỏi hiện tại, câu trả lời của người dùng và rubric liên quan. Khi tạo báo cáo, hệ thống dùng dữ liệu tổng hợp của phiên ở mức đủ để nhận xét, thay vì gửi toàn bộ dữ liệu không cần thiết.

Việc chọn ngữ cảnh còn giúp phân tách trách nhiệm giữa các tác vụ AI. Sinh câu hỏi không cần toàn bộ chi tiết báo cáo; chấm câu trả lời không cần tái tạo toàn bộ lịch sử người dùng nếu câu hỏi hiện tại đã đủ ngữ cảnh; báo cáo sau phiên cần dữ liệu tổng hợp hơn là từng chi tiết kỹ thuật nhỏ. Cách tổ chức này giúp giảm lỗi, giảm chi phí gọi AI và giữ phản hồi tập trung vào mục tiêu luyện tập [3.4-T1].

#### Lý do chọn

Quản lý token và ngữ cảnh phù hợp với hệ thống vì các phiên phỏng vấn có thể khác nhau về độ dài, số câu hỏi và nội dung mô tả công việc. Nếu gửi toàn bộ dữ liệu vào mọi yêu cầu AI, hệ thống sẽ tốn chi phí hơn và khó kiểm soát chất lượng phản hồi. Nếu gửi quá ít dữ liệu, AI có thể tạo nhận xét chung chung, không gắn với câu trả lời thực tế.

So với một pipeline chỉ ghép tất cả dữ liệu vào prompt, cách chọn ngữ cảnh theo tác vụ dễ bảo trì hơn. Nhóm phát triển có thể điều chỉnh riêng dữ liệu cho sinh câu hỏi, feedback hoặc báo cáo. Điều này cũng giúp hệ thống mở rộng sau này, ví dụ bổ sung hồ sơ ứng viên hoặc dữ liệu luyện tập trước đó, mà không làm mọi prompt trở nên quá dài.

### 3.4.3 Rubric và ngôn ngữ đầu ra

#### Lý thuyết

Rubric là tập tiêu chí dùng để đánh giá một câu trả lời theo các khía cạnh cụ thể. Trong hệ thống có LLM, rubric giúp chuyển yêu cầu "nhận xét câu trả lời" thành một nhiệm vụ có tiêu chí rõ ràng hơn. Prompt engineering khuyến nghị cung cấp tiêu chí, ví dụ và định dạng đầu ra để mô hình tạo phản hồi phù hợp với mục tiêu của ứng dụng [3.4-S2].

Ngôn ngữ đầu ra cũng là một phần của xử lý ngôn ngữ. Cùng một đánh giá có thể được viết bằng nhiều phong cách khác nhau. Với ứng dụng luyện tập, phản hồi cần dễ hiểu, cụ thể và có khả năng hành động. Nếu phản hồi dùng ngôn ngữ quá chung chung hoặc quá kỹ thuật, người dùng khó biết cần sửa gì trong lần trả lời tiếp theo.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng rubric theo loại phiên và context pack để định hướng việc đánh giá. Với câu hỏi hành vi, hệ thống quan tâm đến bối cảnh, nhiệm vụ, hành động, kết quả, mức độ tự nhận thức và khả năng liên hệ với vị trí ứng tuyển. Với câu hỏi kỹ thuật, hệ thống quan tâm đến độ chính xác, khả năng giải thích, ví dụ thực tế, tư duy xử lý vấn đề và trade-off kỹ thuật.

Hệ thống cũng định hướng phản hồi bằng tiếng Việt cho nhóm người dùng chính là sinh viên và fresher tại Việt Nam. Phản hồi không chỉ nêu điểm số, mà còn chỉ ra ý mạnh, điểm cần cải thiện và gợi ý cách trả lời tốt hơn. Nhờ vậy, chức năng feedback và báo cáo phục vụ mục tiêu học tập thay vì chỉ đóng vai trò chấm điểm [3.4-T1].

#### Lý do chọn

Rubric được chọn vì nó giúp phản hồi của AI nhất quán hơn giữa các phiên. Nếu không có rubric, mô hình có thể đánh giá dựa trên cảm nhận chung, dẫn đến cùng một câu trả lời nhưng nhận xét khác nhau theo từng lần gọi. Rubric cũng giúp hệ thống giải thích điểm số tốt hơn, vì người dùng biết câu trả lời đang thiếu ở tiêu chí nào.

So với phản hồi tự do, phản hồi theo rubric phù hợp hơn với báo cáo học thuật và sản phẩm luyện tập. So với chỉ hiển thị điểm số, nhận xét theo rubric có giá trị thực tế hơn vì người dùng nhận được hướng sửa cụ thể. Việc dùng tiếng Việt làm ngôn ngữ phản hồi chính cũng phù hợp với đối tượng sử dụng, trong khi vẫn có thể mở rộng sang ngôn ngữ khác nếu hệ thống cần phục vụ bối cảnh quốc tế.

### 3.4.4 Ghi âm, speech-to-text và giới hạn của voice mode

#### Lý thuyết

Voice mode trong ứng dụng web thường gồm hai phần: ghi âm ở trình duyệt và chuyển âm thanh thành văn bản. MediaRecorder là API của trình duyệt cho phép ghi lại dữ liệu âm thanh hoặc video từ thiết bị người dùng [3.4-S3]. Speech-to-text là quá trình chuyển dữ liệu âm thanh thành transcript. Tài liệu OpenAI mô tả speech-to-text như nhóm API nhận file âm thanh và trả về văn bản được nhận dạng [3.4-S4].

Speech-to-text giúp hệ thống nhận câu trả lời nói ở dạng có thể xử lý tiếp bằng LLM. Tuy nhiên, transcript có thể bị ảnh hưởng bởi chất lượng âm thanh, tiếng ồn, phát âm, ngôn ngữ trộn lẫn và giới hạn của mô hình nhận dạng. Vì vậy, nếu transcript được dùng để chấm câu trả lời, hệ thống nên cho người dùng kiểm tra hoặc chỉnh sửa trước khi nộp chính thức.

#### Ứng dụng trong hệ thống

AI Mock Interview có hỗ trợ luồng trả lời bằng giọng nói ở mức phục vụ luyện tập. Trình duyệt ghi âm câu trả lời, gửi tệp âm thanh lên backend, backend lưu tệp qua dịch vụ lưu trữ và gọi speech-to-text để tạo transcript nháp. Người dùng có thể xem lại hoặc chỉnh sửa transcript trước khi gửi câu trả lời để hệ thống chấm. Sau bước này, nội dung văn bản vẫn là dữ liệu chính dùng cho feedback và báo cáo [3.4-T2].

Voice mode vì vậy không thay thế text-first pipeline, mà bổ sung một cách nhập câu trả lời gần với phỏng vấn thật hơn. Các thông tin như đường dẫn tệp âm thanh, thời lượng và trạng thái nhận dạng được lưu như metadata hỗ trợ. Phần đánh giá chính vẫn dựa trên transcript và rubric, giúp hệ thống giữ cùng một pipeline feedback cho cả text mode và voice mode.

#### Lý do chọn

Voice mode phù hợp vì phỏng vấn thực tế thường diễn ra bằng lời nói. Việc cho phép ghi âm giúp người dùng luyện phản xạ trả lời, sau đó đọc lại transcript để phát hiện câu trả lời thiếu mạch lạc hoặc diễn đạt chưa tốt. Đây là lợi ích mà text-only khó mô phỏng đầy đủ.

Tuy nhiên, voice mode được triển khai như phần hỗ trợ thay vì công nghệ lõi của chấm điểm. Cách này giúp hệ thống cân bằng giữa trải nghiệm và độ ổn định: người dùng có thể luyện nói, nhưng backend vẫn xử lý nội dung cuối cùng ở dạng văn bản. So với việc phân tích trực tiếp giọng nói để chấm điểm toàn diện, cách dùng speech-to-text đơn giản hơn, ít rủi ro hơn và phù hợp hơn với phạm vi GR1.

---
*Nguồn tham khảo mục 3.4:*

*[3.4-S1] OpenAI. "Text generation." https://developers.openai.com/api/docs/guides/text*

*[3.4-S2] OpenAI. "Prompt engineering." https://developers.openai.com/api/docs/guides/prompt-engineering*

*[3.4-S3] MDN Web Docs. "MediaRecorder." https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder*

*[3.4-S4] OpenAI. "Speech to text." https://developers.openai.com/api/docs/guides/speech-to-text*

*[3.4-T1] AI Mock Interview implementation sources: `server/src/ai/prompt-builder.service.ts`, `server/src/ai/context-pack.service.ts`, `server/src/ai/pipelines`, `server/src/turn`, `server/src/report`.*

*[3.4-T2] Voice mode implementation sources: `client/components/interview/VoiceRecorder.tsx`, `server/src/turn/whisper.service.ts`, `server/src/ai/processors/transcription.processor.ts`, `server/prisma/schema.prisma`.*

## 3.5 Công Nghệ Frontend Cho Ứng Dụng Web

### 3.5.1 Next.js và React

#### Lý thuyết

React là thư viện JavaScript dùng để xây dựng giao diện theo component. Tài liệu React mô tả component là các phần giao diện có thể tái sử dụng, giúp chia màn hình phức tạp thành những khối nhỏ hơn và dễ quản lý hơn [3.5-S1]. Next.js là framework dựa trên React, cung cấp các khả năng ở cấp ứng dụng như routing, rendering, cải thiện quá trình tải trang và tổ chức dự án web [3.5-S2].

Sự kết hợp giữa React và Next.js phù hợp với ứng dụng web có nhiều màn hình và trạng thái giao diện. React giúp xây dựng các thành phần như form, thẻ câu hỏi, bộ đếm thời gian và trang báo cáo. Next.js cung cấp cấu trúc ứng dụng, cơ chế định tuyến và cách tổ chức frontend theo các trang rõ ràng.

#### Ứng dụng trong hệ thống

Frontend của AI Mock Interview được xây dựng bằng Next.js 16.2 và React 19.2. Các màn hình chính gồm trang thiết lập phiên, thư viện mô tả công việc, hồ sơ người dùng, danh sách phiên, màn hình trả lời phỏng vấn và trang báo cáo. Những màn hình này có nhiều trạng thái khác nhau: nhập dữ liệu, tải câu hỏi, đếm thời gian, gửi câu trả lời, chờ feedback và đọc báo cáo.

React giúp tách giao diện thành các component có trách nhiệm rõ ràng, ví dụ nhóm nhập cấu hình, hiển thị câu hỏi, nhập câu trả lời văn bản, ghi âm và hiển thị biểu đồ báo cáo. Next.js giúp tổ chức các trang theo luồng sử dụng của sản phẩm, từ đăng nhập, thiết lập phiên, thực hiện phỏng vấn đến xem kết quả [3.5-T1].

#### Lý do chọn

Next.js và React phù hợp vì hệ thống cần một giao diện web tương tác, dễ mở rộng và dễ bảo trì. Luồng phỏng vấn không phải trang tĩnh: người dùng nhập dữ liệu, gửi câu trả lời, nhận cập nhật trạng thái và xem báo cáo sau khi xử lý nền hoàn tất. Component hóa giúp nhóm phát triển sửa từng phần giao diện mà không ảnh hưởng toàn bộ ứng dụng.

So với xây dựng bằng HTML, CSS và JavaScript thuần, React giúp quản lý trạng thái giao diện tốt hơn. So với một framework frontend ít phổ biến hơn, Next.js có tài liệu chính thức đầy đủ, hệ sinh thái lớn và phù hợp với năng lực phát triển của nhóm. Việc dùng cùng nền tảng React cho nhiều màn hình cũng giúp trải nghiệm người dùng nhất quán hơn.

### 3.5.2 App Router và phân tách Server/Client Components

#### Lý thuyết

App Router là cơ chế định tuyến của Next.js dựa trên cấu trúc thư mục trong ứng dụng. Tài liệu Next.js mô tả Server Components và Client Components là hai cách tổ chức component theo nơi xử lý: Server Components phù hợp với phần không cần tương tác trực tiếp trên trình duyệt, còn Client Components dùng cho phần cần state, event handler hoặc API trình duyệt [3.5-S3].

Phân tách này giúp ứng dụng tránh đưa toàn bộ logic lên trình duyệt. Những phần chỉ cần đọc dữ liệu hoặc dựng giao diện ổn định có thể xử lý ở phía server. Những phần cần thao tác người dùng, ghi âm, bộ đếm thời gian hoặc cập nhật trạng thái thời gian thực sẽ chạy ở client.

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, các trang như danh sách phiên, trang báo cáo và layout ứng dụng có thể tận dụng cấu trúc App Router để tổ chức đường dẫn rõ ràng. Các phần tương tác mạnh như form thiết lập, màn hình trả lời, ghi âm, kết nối nhận cập nhật trạng thái và xử lý token truy cập cần chạy ở client vì phụ thuộc vào sự kiện người dùng hoặc API của trình duyệt.

Cách phân tách này giúp giao diện phù hợp với đặc điểm từng màn hình. Trang báo cáo ưu tiên hiển thị dữ liệu đã tổng hợp một cách ổn định. Màn hình phỏng vấn cần phản ứng nhanh với thao tác nhập câu trả lời, bộ đếm thời gian và trạng thái phiên. Màn hình ghi âm cần truy cập thiết bị âm thanh của trình duyệt, nên thuộc phần client [3.5-T1].

#### Lý do chọn

App Router được chọn vì nó giúp cấu trúc frontend bám sát luồng nghiệp vụ: đăng nhập, thiết lập phiên, luyện phỏng vấn, xem lịch sử và xem báo cáo. Điều này giúp người phát triển dễ tìm đúng màn hình cần sửa, đồng thời giảm khả năng trộn lẫn logic của các trang khác nhau.

So với mô hình chỉ dùng client-side rendering, phân tách Server/Client Components giúp ứng dụng xử lý phù hợp hơn giữa các trang ít tương tác và các phần cần chạy trực tiếp trên trình duyệt. So với việc tự xây dựng router, App Router là cơ chế có sẵn trong Next.js, giảm mã hạ tầng và phù hợp với dự án cần tập trung vào chức năng luyện phỏng vấn.

### 3.5.3 TypeScript và Tailwind CSS

#### Lý thuyết

TypeScript là ngôn ngữ mở rộng JavaScript bằng hệ thống kiểu tĩnh. Tài liệu TypeScript mô tả mục tiêu của TypeScript là bổ sung kiểu dữ liệu để phát hiện lỗi sớm hơn trong quá trình phát triển, đồng thời vẫn biên dịch về JavaScript để chạy trên môi trường web hoặc Node.js [3.5-S4].

Tailwind CSS là framework CSS theo hướng utility-first. Thay vì viết nhiều lớp CSS riêng cho từng thành phần, nhà phát triển sử dụng các lớp tiện ích để mô tả khoảng cách, màu sắc, kích thước, bố cục và trạng thái giao diện ngay trong component [3.5-S5]. Cách này phù hợp với ứng dụng có nhiều màn hình cần giao diện nhất quán nhưng vẫn cần phát triển nhanh.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng TypeScript ở frontend và backend để giảm sai lệch khi trao đổi dữ liệu. Các kiểu dữ liệu liên quan đến phiên, câu hỏi, câu trả lời, feedback và báo cáo giúp frontend hiểu cấu trúc dữ liệu nhận từ API. Khi cấu trúc dữ liệu thay đổi, TypeScript hỗ trợ phát hiện lỗi tại thời điểm phát triển thay vì chỉ phát hiện khi người dùng thao tác.

Tailwind CSS được dùng để xây dựng giao diện các form, thẻ thông tin, nút thao tác, vùng nhập câu trả lời, trạng thái tải và trang báo cáo. Với một ứng dụng có nhiều màn hình nghiệp vụ, utility class giúp nhóm phát triển duy trì khoảng cách, màu sắc và trạng thái giao diện nhất quán hơn mà không cần tạo quá nhiều file CSS riêng [3.5-T1].

#### Lý do chọn

TypeScript phù hợp vì hệ thống có nhiều hợp đồng dữ liệu giữa frontend và backend. Nếu dùng JavaScript thuần, các lỗi như thiếu trường, sai kiểu hoặc thay đổi cấu trúc response dễ chỉ xuất hiện khi chạy ứng dụng. TypeScript giúp giảm rủi ro này, đặc biệt với các màn hình báo cáo và feedback có cấu trúc dữ liệu nhiều lớp.

Tailwind CSS phù hợp với giai đoạn phát triển sản phẩm vì tốc độ triển khai nhanh và dễ giữ thống nhất giao diện. So với CSS viết tay hoàn toàn, Tailwind giảm số lượng quy ước riêng mà nhóm phải tự duy trì. So với thư viện giao diện đóng gói sẵn, Tailwind linh hoạt hơn khi cần thiết kế các màn hình đặc thù như phỏng vấn, ghi âm và báo cáo năng lực.

---
*Nguồn tham khảo mục 3.5:*

*[3.5-S1] React. "Describing the UI." https://react.dev/learn/describing-the-ui*

*[3.5-S2] Next.js. "Docs." https://nextjs.org/docs*

*[3.5-S3] Next.js. "Server and Client Components." https://nextjs.org/docs/app/getting-started/server-and-client-components*

*[3.5-S4] TypeScript. "Documentation." https://www.typescriptlang.org/docs/*

*[3.5-S5] Tailwind CSS. "Styling with utility classes." https://tailwindcss.com/docs/styling-with-utility-classes*

*[3.5-T1] Frontend implementation sources: `client/package.json`, `client/app`, `client/components`, `client/lib/api-client.ts`, `client/lib/types.ts`, `client/lib/supabase.ts`.*

## 3.6 Công Nghệ Backend Và Giao Tiếp API

### 3.6.1 NestJS

#### Lý thuyết

NestJS là framework Node.js dùng để xây dựng ứng dụng server-side. Tài liệu NestJS mô tả framework này hỗ trợ TypeScript, kết hợp các nguyên tắc lập trình hướng đối tượng, lập trình hàm và lập trình phản ứng, đồng thời cung cấp kiến trúc ứng dụng có tổ chức [3.6-S1]. NestJS chạy trên các HTTP server framework phổ biến như Express hoặc Fastify, nhưng cung cấp một lớp kiến trúc cao hơn để tổ chức module, controller, provider và các cơ chế cross-cutting.

Điểm quan trọng của NestJS không chỉ là xử lý HTTP request, mà là cách framework chuẩn hóa cấu trúc backend. Với hệ thống có nhiều nhóm chức năng, kiến trúc module giúp tách trách nhiệm và giảm tình trạng tất cả logic nằm trong một file hoặc một lớp xử lý lớn.

#### Ứng dụng trong hệ thống

Backend của AI Mock Interview được xây dựng bằng NestJS 11. Các chức năng chính được chia thành các nhóm như xác thực, phiên phỏng vấn, câu trả lời, AI processing, báo cáo, người dùng, mô tả công việc đã lưu, health check và hạ tầng dùng chung. Backend cũng cấu hình validation toàn cục, CORS, cookie parsing, tiền tố API và bộ lọc lỗi thống nhất [3.6-T1].

NestJS đóng vai trò trung tâm kết nối các công nghệ khác: cơ sở dữ liệu qua Prisma, hàng đợi qua BullMQ, Redis cho queue và SSE, Supabase cho xác thực/lưu trữ và API AI cho sinh nội dung. Nhờ cấu trúc module, các luồng như tạo phiên, gửi câu trả lời, xử lý feedback và tạo báo cáo được tổ chức theo nghiệp vụ thay vì trộn trực tiếp vào tầng HTTP.

#### Lý do chọn

NestJS phù hợp vì backend của hệ thống có nhiều luồng xử lý liên quan nhau. Một request tạo phiên có thể dẫn tới tạo dữ liệu phiên, đưa job vào hàng đợi, sinh câu hỏi và cập nhật trạng thái cho frontend. Một câu trả lời có thể dẫn tới lưu dữ liệu, xử lý feedback, kiểm tra điều kiện tạo báo cáo và phát sự kiện trạng thái. Các luồng này cần cấu trúc rõ ràng để dễ kiểm thử và bảo trì.

So với Express thuần, NestJS cung cấp sẵn kiến trúc module, dependency injection, guard, pipe và filter, giảm khối lượng mã hạ tầng nhóm phải tự thiết kế. So với framework quá tối giản, NestJS phù hợp hơn với dự án có nhiều tích hợp và cần mở rộng sau GR1. Chi phí đánh đổi là framework có nhiều khái niệm hơn, nhưng điều này chấp nhận được vì dự án cần một backend có tổ chức.

### 3.6.2 Module, controller, service và dependency injection

#### Lý thuyết

Trong NestJS, module là đơn vị tổ chức các thành phần có liên quan. Tài liệu NestJS mô tả module là lớp được đánh dấu bằng decorator để framework dùng metadata tổ chức cấu trúc ứng dụng [3.6-S2]. Controller chịu trách nhiệm tiếp nhận request và trả response [3.6-S3]. Provider, thường là service, chứa logic có thể được inject vào controller hoặc provider khác [3.6-S4].

Dependency injection là cơ chế để một thành phần nhận phụ thuộc từ framework thay vì tự khởi tạo trực tiếp. Cơ chế này giúp giảm phụ thuộc cứng giữa các lớp và giúp kiểm thử dễ hơn, vì khi test có thể thay thế phụ thuộc thật bằng bản giả lập.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng module để gom các nhóm chức năng theo miền nghiệp vụ. Controller tiếp nhận yêu cầu như tạo phiên, lấy danh sách phiên, gửi câu trả lời, tải báo cáo hoặc cập nhật hồ sơ. Service xử lý nghiệp vụ như kiểm tra quyền sở hữu phiên, truy vấn dữ liệu, đưa tác vụ vào hàng đợi, gọi AI hoặc tổng hợp báo cáo.

Dependency injection được dùng để kết nối các thành phần như service truy cập cơ sở dữ liệu, service phát sự kiện trạng thái, hàng đợi xử lý nền và lớp tích hợp AI. Nhờ đó, khi viết test, hệ thống có thể giả lập phụ thuộc bên ngoài thay vì gọi cơ sở dữ liệu, Redis hoặc API AI thật. Điều này đặc biệt quan trọng với hệ thống AI vì các dịch vụ bên ngoài có độ trễ, chi phí và khả năng lỗi cao hơn xử lý nội bộ [3.6-T1].

#### Lý do chọn

Mô hình module-controller-service phù hợp vì hệ thống cần phân biệt rõ tầng API và tầng nghiệp vụ. Nếu controller chứa quá nhiều logic, backend sẽ khó kiểm thử và khó thay đổi khi yêu cầu sản phẩm thay đổi. Nếu service tự khởi tạo phụ thuộc, hệ thống sẽ khó thay thế thành phần AI, queue hoặc database trong môi trường test.

So với tổ chức mã nguồn theo file rời rạc, module của NestJS tạo ra ranh giới dễ hiểu hơn. So với tự viết cơ chế dependency injection, dùng cơ chế có sẵn của NestJS giảm rủi ro thiết kế sai và phù hợp với hệ sinh thái NestJS.

### 3.6.3 Validation, guard và exception filter

#### Lý thuyết

Validation là quá trình kiểm tra dữ liệu đầu vào trước khi xử lý nghiệp vụ. NestJS cung cấp validation pipe để chuyển đổi và kiểm tra request dựa trên DTO, giúp từ chối sớm dữ liệu thiếu trường hoặc sai kiểu [3.6-S5]. Guard là cơ chế quyết định một request có được tiếp tục xử lý hay không, thường dùng cho xác thực và phân quyền. Exception filter giúp bắt lỗi và chuẩn hóa response lỗi thay vì để lỗi kỹ thuật thô đi thẳng ra client.

Các cơ chế này thuộc nhóm cross-cutting concerns, nghĩa là chúng không phải một nghiệp vụ riêng lẻ nhưng ảnh hưởng đến toàn bộ hệ thống. Nếu thiếu validation, guard và xử lý lỗi thống nhất, backend dễ phát sinh lỗi khó hiểu, response không nhất quán và rủi ro truy cập sai dữ liệu.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng validation để kiểm soát dữ liệu như cấu hình phiên, câu trả lời, URL âm thanh và thông tin hồ sơ. Guard được dùng để bảo vệ API yêu cầu người dùng hợp lệ, đồng thời có cơ chế riêng cho kết nối SSE vì EventSource không gửi header xác thực theo cách giống request thông thường. Exception filter chuẩn hóa lỗi nghiệp vụ để frontend nhận được mã lỗi và thông điệp ổn định [3.6-T1].

Trong luồng phỏng vấn, các cơ chế này giúp ngăn nhiều lỗi từ sớm. Ví dụ, người dùng không hợp lệ không được truy cập phiên của người khác; request thiếu dữ liệu không được đưa vào hàng đợi AI; lỗi từ AI, cơ sở dữ liệu hoặc Redis được chuyển thành response có cấu trúc thay vì làm giao diện nhận lỗi không dự đoán được.

#### Lý do chọn

Validation, guard và exception filter phù hợp vì hệ thống xử lý dữ liệu người dùng và gọi nhiều dịch vụ bên ngoài. Một lỗi đầu vào nhỏ có thể dẫn tới lỗi hàng đợi, lỗi cơ sở dữ liệu hoặc lỗi AI nếu không được chặn ở biên hệ thống. Chuẩn hóa lỗi cũng giúp frontend hiển thị trạng thái rõ ràng hơn, đặc biệt trong các luồng chờ sinh câu hỏi hoặc tạo báo cáo.

So với kiểm tra thủ công rải rác trong từng controller, cơ chế toàn cục của NestJS giúp giảm lặp lại và dễ bảo trì hơn. So với chỉ dựa vào kiểm tra ở frontend, validation ở backend an toàn hơn vì backend là nơi bảo vệ dữ liệu thật và xử lý nghiệp vụ chính.

### 3.6.4 REST API và Server-Sent Events

#### Lý thuyết

REST API phù hợp với mô hình request-response: client gửi một yêu cầu rõ ràng và server trả về kết quả. Đây là cách giao tiếp phổ biến cho các thao tác như tạo dữ liệu, lấy dữ liệu, cập nhật trạng thái hoặc gửi biểu mẫu. Tuy nhiên, một số tác vụ không hoàn thành ngay trong một request, đặc biệt khi phụ thuộc vào xử lý nền hoặc dịch vụ AI.

Server-Sent Events (SSE) là cơ chế cho phép server gửi sự kiện một chiều về trình duyệt qua kết nối HTTP đang mở [3.6-S6]. Trên trình duyệt, EventSource là API dùng để mở kết nối SSE và nhận sự kiện từ server [3.6-S7]. SSE phù hợp khi ứng dụng chủ yếu cần server đẩy trạng thái về client, không cần giao tiếp hai chiều liên tục như WebSocket.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng REST API cho các thao tác chính: đăng nhập/refresh, tạo phiên, lấy câu hỏi, gửi câu trả lời, upload audio, lấy báo cáo và quản lý hồ sơ. Các thao tác này có điểm bắt đầu và kết quả rõ ràng, nên phù hợp với request-response.

SSE được dùng cho các trạng thái phát sinh sau khi backend xử lý nền, ví dụ phiên đã có câu hỏi, feedback đã sẵn sàng, transcript đã tạo xong hoặc báo cáo đã hoàn thành. Frontend mở kết nối theo phiên để nhận sự kiện và cập nhật giao diện mà không yêu cầu người dùng tải lại trang. Backend dùng Redis Pub/Sub để phát sự kiện đến kênh tương ứng với phiên, sau đó SSE chuyển sự kiện về client [3.6-T2].

#### Lý do chọn

Kết hợp REST API và SSE phù hợp vì hệ thống có cả thao tác tức thời và thao tác nền. REST API giữ cho các hành động như gửi câu trả lời hoặc lấy báo cáo rõ ràng, dễ kiểm thử và dễ tài liệu hóa. SSE giải quyết phần cập nhật trạng thái khi AI hoặc worker xử lý lâu hơn thời gian người dùng mong đợi.

So với polling liên tục, SSE giảm số lần client phải hỏi lại server và giúp giao diện phản hồi tự nhiên hơn. So với WebSocket, SSE đơn giản hơn cho nhu cầu hiện tại vì hệ thống chủ yếu gửi trạng thái từ server về client. Nếu sau này cần giao tiếp hai chiều thời gian thực phức tạp hơn, WebSocket có thể được xem xét, nhưng trong phạm vi hiện tại SSE là lựa chọn vừa đủ.

---
*Nguồn tham khảo mục 3.6:*

*[3.6-S1] NestJS. "Introduction." https://docs.nestjs.com/*

*[3.6-S2] NestJS. "Modules." https://docs.nestjs.com/modules*

*[3.6-S3] NestJS. "Controllers." https://docs.nestjs.com/controllers*

*[3.6-S4] NestJS. "Providers." https://docs.nestjs.com/providers*

*[3.6-S5] NestJS. "Validation." https://docs.nestjs.com/techniques/validation*

*[3.6-S6] MDN Web Docs. "Server-sent events." https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events*

*[3.6-S7] MDN Web Docs. "EventSource." https://developer.mozilla.org/en-US/docs/Web/API/EventSource*

*[3.6-T1] Backend implementation sources: `server/package.json`, `server/src/app.module.ts`, `server/src/main.ts`, `server/src/common`, `server/src/auth`, `server/src/session`, `server/src/turn`, `server/src/report`.*

*[3.6-T2] SSE implementation sources: `server/src/common/services/sse.service.ts`, `server/src/session/session.controller.ts`, `client/app/(app)/sessions/[sessionId]/page.tsx`, `client/app/(app)/sessions/[sessionId]/report/page.tsx`.*

## 3.7 Công Nghệ Xử Lý Bất Đồng Bộ Và Cập Nhật Trạng Thái

### 3.7.1 Xử lý bất đồng bộ cho tác vụ AI

#### Lý thuyết

Xử lý bất đồng bộ là cách tách những tác vụ kéo dài khỏi request HTTP trực tiếp. Với tác vụ AI, thời gian xử lý có thể thay đổi theo độ dài đầu vào, mô hình được dùng, tình trạng mạng và giới hạn của nhà cung cấp. Nếu giữ request mở cho đến khi AI trả về, người dùng có thể gặp timeout, giao diện bị chờ lâu và backend khó kiểm soát lỗi.

Trong kiến trúc có hàng đợi, request ban đầu chỉ ghi nhận yêu cầu và đưa job vào queue. Worker xử lý job ở nền, sau đó cập nhật cơ sở dữ liệu hoặc phát sự kiện trạng thái. Cách này giúp hệ thống phản hồi nhanh hơn ở biên API và tách phần xử lý nặng ra khỏi luồng request-response.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng xử lý bất đồng bộ cho các tác vụ như sinh câu hỏi, tạo feedback từng câu trả lời, chuyển âm thanh thành transcript và tạo báo cáo tổng hợp. Khi người dùng tạo phiên hoặc gửi câu trả lời, backend không nhất thiết phải chờ toàn bộ AI xử lý xong trong cùng một request. Thay vào đó, hệ thống lưu trạng thái, đưa tác vụ vào hàng đợi và cập nhật giao diện khi kết quả sẵn sàng [3.7-T1].

Cách này phù hợp với trải nghiệm người dùng của hệ thống. Người dùng có thể thấy phiên đang tạo câu hỏi, feedback đang được xử lý hoặc báo cáo đang được tổng hợp. Khi worker hoàn thành, trạng thái được lưu và sự kiện được gửi về frontend để cập nhật màn hình.

#### Lý do chọn

Xử lý bất đồng bộ được chọn vì các tác vụ AI có độ trễ không ổn định và có thể thất bại vì lý do ngoài hệ thống, như quota hoặc lỗi mạng. Nếu xử lý đồng bộ trong request, một lỗi AI có thể làm hỏng toàn bộ thao tác của người dùng và làm API khó đáp ứng ổn định.

So với cách xử lý đồng bộ đơn giản, hàng đợi giúp hệ thống chịu lỗi tốt hơn và dễ thêm retry, backoff hoặc fallback. So với việc yêu cầu người dùng tự bấm lại khi lỗi, xử lý nền giúp trải nghiệm mượt hơn và giảm thao tác thủ công. Đây là lựa chọn quan trọng với ứng dụng AI, nơi độ ổn định của sản phẩm không thể phụ thuộc hoàn toàn vào thời gian phản hồi của mô hình.

### 3.7.2 BullMQ và Redis

#### Lý thuyết

BullMQ là thư viện hàng đợi cho Node.js, được xây dựng trên Redis. Tài liệu BullMQ mô tả thư viện này dùng để tạo queue, thêm job, xử lý job bằng worker và hỗ trợ các tính năng như retry, delayed jobs, concurrency và quản lý trạng thái job [3.7-S1]. Redis là kho dữ liệu in-memory thường được dùng cho cache, hàng đợi, pub/sub và các cấu trúc dữ liệu tốc độ cao [3.7-S2].

Trong mô hình BullMQ, Redis giữ trạng thái queue và job. Producer thêm job vào queue, worker lấy job ra xử lý, và hệ thống có thể theo dõi trạng thái job như chờ, đang chạy, hoàn thành hoặc thất bại. Điều này phù hợp với các tác vụ nền cần độ tin cậy cao hơn một lời gọi hàm trực tiếp.

#### Ứng dụng trong hệ thống

AI Mock Interview sử dụng BullMQ 5 trên Redis để quản lý các queue liên quan đến AI. Các queue phục vụ sinh câu hỏi, feedback, báo cáo và transcription. Với câu trả lời văn bản hoặc voice transcript đã được người dùng xác nhận, backend enqueue job feedback; với đường voice audio-only hoặc retry transcription, backend enqueue job transcription để worker gọi speech-to-text, lưu transcript và tiếp tục enqueue feedback [3.7-T1].

Redis còn được dùng cho Pub/Sub trong luồng SSE. Vì BullMQ đã cần Redis làm hạ tầng hàng đợi, hệ thống tận dụng cùng loại hạ tầng này để truyền sự kiện trạng thái giữa worker và kết nối SSE. Cần phân biệt hai vai trò này: BullMQ dùng Redis để lưu và điều phối job; SSE dùng Redis Pub/Sub để phát sự kiện cập nhật đến đúng phiên [3.7-T2].

#### Lý do chọn

BullMQ và Redis phù hợp vì hệ thống cần xử lý nhiều tác vụ nền có thể thất bại tạm thời. BullMQ cung cấp sẵn mô hình queue, worker, retry và cấu hình số lần thử lại, giúp nhóm không phải tự xây dựng cơ chế điều phối job. Redis có tốc độ cao và là backend được BullMQ hỗ trợ trực tiếp.

So với lưu job thủ công trong PostgreSQL rồi tự viết worker polling, BullMQ giảm đáng kể mã hạ tầng và có sẵn các khái niệm phù hợp với job nền. So với dùng một hệ thống message broker phức tạp hơn, Redis/BullMQ nhẹ hơn và phù hợp với quy mô GR1. Nếu hệ thống mở rộng lớn hơn nhiều, có thể cần đánh giá lại hạ tầng queue, nhưng hiện tại BullMQ đáp ứng tốt nhu cầu sinh câu hỏi, feedback và báo cáo.

### 3.7.3 Retry, backoff và fallback

#### Lý thuyết

Retry là cơ chế thử lại khi tác vụ thất bại. Backoff là cách tăng hoặc điều chỉnh khoảng thời gian giữa các lần thử lại để tránh gửi yêu cầu liên tục vào dịch vụ đang lỗi hoặc đang giới hạn tốc độ. Trong hệ thống dùng dịch vụ bên ngoài, retry phù hợp với lỗi tạm thời như mạng chập chờn hoặc rate limit ngắn hạn. Tuy nhiên, không phải lỗi nào cũng nên retry. Ví dụ, lỗi hết quota thường cần chuyển sang trạng thái suy giảm hoặc fallback thay vì lặp lại vô ích.

Fallback là phương án dự phòng khi hệ thống không thể hoàn thành tác vụ theo cách lý tưởng. Với ứng dụng AI, fallback có thể là câu hỏi có sẵn, phản hồi mặc định hoặc báo cáo giới hạn. Fallback không nhằm thay thế chất lượng AI, mà nhằm giữ luồng sử dụng không bị sập hoàn toàn.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng retry và fallback trong các luồng phụ thuộc vào AI. Khi lỗi có khả năng tạm thời, job có thể được thử lại theo cấu hình. Khi nhà cung cấp AI không thể trả kết quả hợp lệ hoặc gặp tình trạng không nên retry, hệ thống chuyển sang nội dung dự phòng để người dùng vẫn có thể tiếp tục phiên ở mức chấp nhận được [3.7-T1].

Ví dụ, trong sinh câu hỏi, hệ thống có thể dùng kho câu hỏi để hỗ trợ khi AI không tạo được đủ câu hỏi. Trong feedback hoặc báo cáo, hệ thống có thể lưu trạng thái fallback để giao diện hiển thị rõ rằng kết quả không phải đánh giá AI đầy đủ. Cách xử lý này giúp phân biệt lỗi kỹ thuật với trải nghiệm người dùng, đồng thời tránh để một lỗi từ dịch vụ bên ngoài làm mất toàn bộ phiên luyện tập.

#### Lý do chọn

Retry, backoff và fallback phù hợp vì hệ thống AI không thể giả định dịch vụ bên ngoài luôn ổn định. Người dùng vẫn cần một trải nghiệm có kiểm soát khi gặp lỗi mạng, timeout, JSON sai định dạng hoặc quota AI. Nếu không có fallback, hệ thống dễ rơi vào trạng thái phiên lỗi và người dùng phải bắt đầu lại.

So với chỉ báo lỗi ngay khi AI thất bại, fallback giúp sản phẩm hữu dụng hơn trong điều kiện không lý tưởng. So với retry không giới hạn, retry có kiểm soát an toàn hơn vì tránh lặp lại tác vụ tốn chi phí và làm tăng tải hệ thống. Cách này phù hợp với mục tiêu của ứng dụng luyện tập: ưu tiên trải nghiệm ổn định, minh bạch và có thể phục hồi.

### 3.7.4 Kết hợp hàng đợi và cập nhật trạng thái

#### Lý thuyết

Hàng đợi và cập nhật trạng thái giải quyết hai vấn đề khác nhau. Hàng đợi xử lý phần công việc nền, còn cơ chế cập nhật trạng thái giúp frontend biết khi nào kết quả đã thay đổi. Nếu chỉ có hàng đợi mà không có cập nhật trạng thái, người dùng phải tải lại hoặc hệ thống phải polling liên tục. Nếu chỉ có SSE mà không có queue, tác vụ dài vẫn có thể làm request chính bị chờ lâu.

Mô hình thường gặp là request tạo job, worker xử lý job, cơ sở dữ liệu lưu kết quả, sau đó server phát sự kiện để client cập nhật giao diện. SSE là một lựa chọn phù hợp khi luồng cập nhật chủ yếu đi từ server về client [3.7-S3].

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, BullMQ xử lý tác vụ nền, Redis lưu và điều phối job, Redis Pub/Sub truyền sự kiện nội bộ, còn SSE đưa sự kiện đến trình duyệt. Khi câu hỏi đã sẵn sàng, feedback hoàn tất, transcript tạo xong hoặc báo cáo đã được sinh, frontend nhận sự kiện và cập nhật màn hình tương ứng [3.7-T2].

Cách kết hợp này giúp trải nghiệm phỏng vấn rõ ràng hơn. Người dùng không phải tự đoán liệu hệ thống đang xử lý hay đã bị lỗi. Giao diện có thể hiển thị trạng thái chờ, tiến độ feedback hoặc trạng thái báo cáo, trong khi backend vẫn giữ công việc nặng ở worker nền.

#### Lý do chọn

Kết hợp queue và SSE phù hợp vì hệ thống có nhiều trạng thái chuyển tiếp. Một phiên có thể đang sinh câu hỏi, đang chờ câu trả lời, đang xử lý feedback, đang tạo báo cáo hoặc đã hoàn tất. Nếu không cập nhật trạng thái kịp thời, người dùng sẽ có cảm giác hệ thống bị treo dù backend vẫn đang xử lý.

So với polling, SSE giúp giảm request lặp lại và phản hồi gần thời gian thực hơn. So với WebSocket, SSE đơn giản hơn cho nhu cầu gửi trạng thái một chiều. Việc dùng Redis cho cả BullMQ và Pub/Sub cũng giảm số loại hạ tầng phải vận hành trong phạm vi dự án.

---
*Nguồn tham khảo mục 3.7:*

*[3.7-S1] BullMQ. "What is BullMQ." https://docs.bullmq.io/*

*[3.7-S2] Redis. "Develop with Redis." https://redis.io/docs/latest/develop/*

*[3.7-S3] MDN Web Docs. "Server-sent events." https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events*

*[3.7-T1] Async processing implementation sources: `server/package.json`, `server/src/ai/ai.module.ts`, `server/src/ai/processors`, `server/src/common/constants/queue.constants.ts`, `server/src/question-bank`.*

*[3.7-T2] Status update implementation sources: `server/src/common/services/sse.service.ts`, `docs/Design/ArchitecturalDesign/ADRs/ADR-006_sse-redis-pubsub.md`, `docs/Design/ArchitecturalDesign/ADRs/ADR-007_bullmq-upgrade.md`.*

## 3.8 Công Nghệ Lưu Trữ Dữ Liệu Và Truy Cập Cơ Sở Dữ Liệu

### 3.8.1 PostgreSQL và Supabase

#### Lý thuyết

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở. Trong mô hình quan hệ, dữ liệu được tổ chức thành bảng, quan hệ, khóa và ràng buộc, phù hợp với các hệ thống cần bảo đảm tính nhất quán giữa nhiều nhóm dữ liệu. Supabase cung cấp mỗi dự án một cơ sở dữ liệu PostgreSQL đầy đủ, kèm các thành phần như Auth, Storage, Realtime, công cụ quản trị, backup và extension [3.8-S1].

Supabase không phải một lớp dữ liệu tách khỏi PostgreSQL, mà xây dựng nhiều dịch vụ xung quanh PostgreSQL. Điều này có nghĩa ứng dụng vẫn có thể dùng các khả năng quen thuộc của PostgreSQL như bảng, quan hệ, ràng buộc, chỉ mục và SQL, đồng thời tận dụng dịch vụ được quản lý để giảm công vận hành.

#### Ứng dụng trong hệ thống

AI Mock Interview sử dụng PostgreSQL qua Supabase để lưu dữ liệu người dùng, hồ sơ, mô tả công việc đã lưu, phiên phỏng vấn, câu hỏi, câu trả lời, feedback, báo cáo và kho câu hỏi. Supabase cũng được dùng trong luồng xác thực và lưu trữ tệp âm thanh cho voice mode. Backend truy cập dữ liệu nghiệp vụ thông qua Prisma, còn frontend dùng Supabase client cho các phần liên quan đến phiên đăng nhập [3.8-T1].

Dữ liệu của hệ thống có nhiều quan hệ rõ ràng. Một người dùng có thể có nhiều phiên phỏng vấn; một phiên có nhiều câu hỏi; mỗi câu hỏi có thể có câu trả lời; câu trả lời có feedback; phiên có báo cáo tổng hợp. Cơ sở dữ liệu quan hệ giúp biểu diễn các liên kết này chặt chẽ hơn so với lưu tài liệu rời rạc.

#### Lý do chọn

PostgreSQL phù hợp vì hệ thống cần nhất quán dữ liệu giữa nhiều bảng. Nếu dùng cơ sở dữ liệu document-only, việc bảo đảm quan hệ giữa người dùng, phiên, câu hỏi, câu trả lời và báo cáo sẽ phụ thuộc nhiều hơn vào logic ứng dụng. PostgreSQL cung cấp ràng buộc, khóa ngoại, transaction và chỉ mục, phù hợp với dữ liệu có quan hệ rõ.

Supabase phù hợp với giai đoạn phát triển vì giảm chi phí vận hành PostgreSQL, Auth và Storage. So với tự triển khai PostgreSQL, Supabase giúp nhóm tập trung vào chức năng phỏng vấn thử. So với Firebase/Firestore, PostgreSQL phù hợp hơn với dữ liệu quan hệ của dự án và dễ kết hợp với Prisma. Điểm cần lưu ý là Supabase tạo một mức phụ thuộc vào nền tảng, nhưng trong phạm vi GR1 lợi ích về tốc độ triển khai và tích hợp lớn hơn rủi ro này.

### 3.8.2 Prisma ORM

#### Lý thuyết

Prisma ORM là công cụ truy cập cơ sở dữ liệu cho ứng dụng TypeScript và JavaScript. Tài liệu Prisma mô tả Prisma ORM gồm Prisma Schema, Prisma Client và các công cụ hỗ trợ làm việc với cơ sở dữ liệu [3.8-S2]. Prisma Client là client truy vấn được sinh tự động, có kiểm tra kiểu và dựa trên schema của ứng dụng [3.8-S3].

Prisma Schema mô tả datasource, generator, model, quan hệ và một số thuộc tính dữ liệu [3.8-S4]. Từ schema này, Prisma tạo client để backend truy vấn cơ sở dữ liệu bằng API TypeScript thay vì viết SQL thủ công cho mọi thao tác. Tuy nhiên, Prisma không thay thế hoàn toàn SQL, đặc biệt với các ràng buộc hoặc đặc tính nâng cao của PostgreSQL.

#### Ứng dụng trong hệ thống

Trong AI Mock Interview, Prisma là lớp truy cập dữ liệu chính của backend. Schema Prisma mô tả các nhóm dữ liệu như người dùng, hồ sơ, mô tả công việc, phiên phỏng vấn, câu hỏi phiên, câu trả lời, feedback, đoạn nhận xét, báo cáo và kho câu hỏi. Backend dùng Prisma để tạo, đọc, cập nhật và liên kết dữ liệu trong các luồng nghiệp vụ [3.8-T2].

Prisma cũng giúp backend TypeScript làm việc với dữ liệu nhất quán hơn. Khi schema thay đổi, client được sinh lại để phản ánh cấu trúc mới. Điều này giảm rủi ro sai tên trường hoặc sai kiểu dữ liệu trong quá trình phát triển, nhất là với các bảng có nhiều quan hệ như phiên, câu hỏi, câu trả lời và feedback.

#### Lý do chọn

Prisma phù hợp vì nhóm phát triển dùng TypeScript ở backend và cần thao tác với cơ sở dữ liệu quan hệ có nhiều bảng. Prisma giúp mã truy cập dữ liệu dễ đọc hơn so với viết SQL thủ công ở mọi nơi, đồng thời vẫn cho phép dùng SQL bổ sung khi cần tận dụng khả năng riêng của PostgreSQL.

So với viết toàn bộ SQL bằng thư viện truy vấn thấp hơn, Prisma giảm lỗi lặp lại và tăng khả năng kiểm tra kiểu. So với một ORM truyền thống nhiều cấu hình runtime, Prisma có schema rõ ràng và client sinh tự động, phù hợp với dự án cần phát triển nhanh. Nhược điểm là một số ràng buộc nâng cao không được biểu diễn đầy đủ trong Prisma, nên hệ thống cần bổ sung quy trình SQL riêng cho phần đó.

### 3.8.3 JSONB, giao dịch và ràng buộc dữ liệu

#### Lý thuyết

PostgreSQL hỗ trợ hai kiểu dữ liệu JSON là `json` và `jsonb`. Tài liệu PostgreSQL nêu rằng `jsonb` lưu dữ liệu ở dạng nhị phân đã phân rã, giúp xử lý hiệu quả hơn và hỗ trợ indexing, trong khi `json` giữ bản sao văn bản đầu vào [3.8-S5]. JSONB phù hợp với dữ liệu bán cấu trúc, nghĩa là dữ liệu vẫn thuộc một bản ghi quan hệ nhưng phần nội dung bên trong có thể thay đổi linh hoạt.

Transaction là cơ chế nhóm nhiều thao tác cơ sở dữ liệu thành một đơn vị nhất quán. PostgreSQL cho phép commit toàn bộ khi thành công hoặc rollback khi có lỗi [3.8-S6]. Constraint là ràng buộc dữ liệu ở tầng cơ sở dữ liệu, ví dụ khóa chính, khóa ngoại, unique, check và not null, giúp bảo vệ tính hợp lệ của dữ liệu ngay cả khi lỗi xảy ra ở tầng ứng dụng [3.8-S7].

#### Ứng dụng trong hệ thống

AI Mock Interview dùng JSON/JSONB cho các dữ liệu có cấu trúc linh hoạt như rubric, điểm theo năng lực, nội dung báo cáo, bản dịch câu hỏi, metadata hồ sơ và thông tin phụ trợ của câu trả lời. Những dữ liệu này có thể khác nhau theo loại phiên, context pack hoặc phiên bản prompt, nên không phải lúc nào cũng phù hợp để tách thành nhiều cột cố định.

Transaction và ràng buộc dữ liệu được dùng để bảo vệ tính nhất quán giữa các thực thể chính. Ví dụ, câu trả lời phải gắn với đúng phiên và đúng câu hỏi; feedback phải gắn với câu trả lời; báo cáo phải thuộc về phiên; một số trạng thái, điểm số hoặc kiểu dữ liệu cần nằm trong miền hợp lệ. Các ràng buộc này giúp cơ sở dữ liệu trở thành lớp bảo vệ bổ sung cho backend [3.8-T2].

#### Lý do chọn

JSONB phù hợp vì hệ thống AI thường có dữ liệu thay đổi theo phiên bản prompt hoặc rubric. Nếu ép toàn bộ dữ liệu AI thành cột cố định, schema sẽ nhanh chóng phức tạp và khó thay đổi. Nếu lưu toàn bộ dữ liệu trong document không quan hệ, hệ thống lại mất lợi thế của PostgreSQL trong quản lý quan hệ phiên, câu hỏi, câu trả lời và báo cáo.

Transaction và constraint phù hợp vì dữ liệu phỏng vấn có liên kết chặt chẽ. So với chỉ kiểm tra ở service backend, ràng buộc ở database an toàn hơn vì vẫn bảo vệ dữ liệu khi có bug ứng dụng, retry job hoặc nhiều request gần nhau. Cách kết hợp bảng quan hệ với JSONB giúp hệ thống cân bằng giữa tính nhất quán và độ linh hoạt.

### 3.8.4 Đồng bộ Prisma schema và phần SQL bổ sung

#### Lý thuyết

Prisma Schema là nguồn mô tả model và quan hệ ở tầng ứng dụng, còn SQL là ngôn ngữ gốc để định nghĩa và điều chỉnh nhiều đặc tính của PostgreSQL. Trong thực tế, không phải mọi khả năng của PostgreSQL đều được biểu diễn đầy đủ hoặc thuận tiện bằng Prisma Schema. Vì vậy, một số dự án kết hợp ORM cho phần mô hình chính với SQL bổ sung cho ràng buộc nâng cao, trigger, policy hoặc index đặc thù.

Cách kết hợp này yêu cầu quy trình đồng bộ rõ ràng. Nếu Prisma schema và SQL bổ sung không được áp dụng cùng nhau, cơ sở dữ liệu thật có thể lệch khỏi mô hình ứng dụng. Khi đó backend có thể gặp lỗi truy vấn, thiếu cột, thiếu ràng buộc hoặc hành vi khác môi trường phát triển.

#### Ứng dụng trong hệ thống

AI Mock Interview dùng Prisma để quản lý phần schema chính và có thêm SQL bổ sung cho các ràng buộc hoặc hardening ở tầng PostgreSQL. Repo có script kiểm tra và áp dụng SQL sau khi đồng bộ Prisma, đồng thời có tài liệu kiến trúc ghi nhận quyết định dùng raw SQL ngoài phạm vi Prisma push [3.8-T3].

SQL bổ sung phục vụ các yêu cầu như bảo vệ dữ liệu, bổ sung ràng buộc kiểm tra, trigger, chỉ mục đặc thù và các quy tắc không thuận tiện khi chỉ dùng Prisma. Trong Chương 3, điểm quan trọng là công nghệ lưu trữ không chỉ gồm ORM, mà còn gồm quy trình vận hành để cơ sở dữ liệu thật giữ đúng các ràng buộc mà hệ thống cần.

#### Lý do chọn

Kết hợp Prisma schema và SQL bổ sung phù hợp vì dự án cần cả tốc độ phát triển lẫn an toàn dữ liệu. Prisma giúp backend TypeScript thao tác dữ liệu thuận tiện; SQL bổ sung giúp tận dụng khả năng đầy đủ của PostgreSQL khi cần ràng buộc nâng cao. Nếu chỉ dùng Prisma, một số bảo vệ dữ liệu có thể phải dồn lên service code. Nếu chỉ dùng SQL thủ công, tốc độ phát triển và kiểm tra kiểu ở backend sẽ giảm.

So với bỏ qua các ràng buộc nâng cao để đơn giản hóa triển khai, quy trình SQL bổ sung giúp hệ thống bền hơn khi có retry, job nền hoặc lỗi ứng dụng. Chi phí đánh đổi là nhóm phải duy trì quy trình đồng bộ cẩn thận, nhưng đây là chi phí hợp lý với hệ thống có dữ liệu phiên phỏng vấn, feedback và báo cáo liên kết chặt chẽ.

### 3.8.5 Các nhóm dữ liệu chính trong hệ thống

#### Lý thuyết

Trong thiết kế cơ sở dữ liệu, việc chia dữ liệu thành các nhóm theo miền nghiệp vụ giúp mô hình dễ hiểu hơn. Với cơ sở dữ liệu quan hệ, mỗi nhóm dữ liệu có thể được biểu diễn bằng một hoặc nhiều bảng, liên kết bằng khóa và ràng buộc. Cách tổ chức này giúp hệ thống truy vấn, bảo vệ và mở rộng dữ liệu theo từng chức năng.

Việc phân nhóm dữ liệu ở Chương 3 chỉ nhằm giải thích vai trò công nghệ lưu trữ. Thiết kế chi tiết từng bảng, quan hệ, index và luồng truy vấn thuộc phạm vi Chương 4 hoặc tài liệu thiết kế cơ sở dữ liệu.

#### Ứng dụng trong hệ thống

Ở mức tổng quan, dữ liệu của AI Mock Interview có thể chia thành các nhóm sau:

| Nhóm dữ liệu | Vai trò trong hệ thống |
| --- | --- |
| Người dùng và hồ sơ | Lưu tài khoản, hồ sơ cá nhân, định hướng nghề nghiệp và thông tin phục vụ cá nhân hóa phiên luyện tập |
| Mô tả công việc | Lưu JD người dùng nhập hoặc lưu lại để tái sử dụng khi tạo phiên phỏng vấn |
| Phiên phỏng vấn | Lưu cấu hình phiên, loại phỏng vấn, context pack, trạng thái và thông tin tổng quan của phiên |
| Câu hỏi và câu trả lời | Lưu câu hỏi trong phiên, thứ tự câu hỏi, câu trả lời văn bản hoặc transcript và metadata liên quan |
| Feedback và báo cáo | Lưu điểm số, nhận xét, đoạn cần cải thiện, câu trả lời mẫu và báo cáo tổng hợp sau phiên |
| Kho câu hỏi | Lưu câu hỏi có sẵn để hỗ trợ sinh câu hỏi và làm phương án dự phòng khi AI không tạo được kết quả phù hợp |

Các nhóm này được lưu trên PostgreSQL và truy cập qua Prisma ở backend. Một số nội dung linh hoạt như rubric, điểm theo năng lực hoặc nội dung báo cáo được lưu bằng JSON/JSONB để dễ thích ứng với nhiều loại phiên [3.8-T2].

#### Lý do chọn

Cách phân nhóm dữ liệu này phù hợp vì luồng nghiệp vụ của hệ thống xoay quanh phiên phỏng vấn. Người dùng tạo phiên từ mô tả công việc, hệ thống sinh câu hỏi, người dùng trả lời, AI tạo feedback và cuối cùng hệ thống tổng hợp báo cáo. Nếu dữ liệu không được nhóm rõ ràng, việc truy xuất lịch sử phiên, hiển thị báo cáo hoặc kiểm tra tiến độ feedback sẽ khó bảo trì.

So với lưu mọi thứ trong một bảng lớn hoặc một JSON document duy nhất, phân nhóm theo quan hệ giúp dữ liệu dễ truy vấn và kiểm soát hơn. So với mô hình quá chi tiết ngay từ đầu, cách chia nhóm ở mức vừa đủ giúp Chương 3 giải thích nền tảng công nghệ mà không lặp lại thiết kế chi tiết của Chương 4.

---
*Nguồn tham khảo mục 3.8:*

*[3.8-S1] Supabase. "Database." https://supabase.com/docs/guides/database/overview*

*[3.8-S2] Prisma. "What is Prisma ORM?" https://www.prisma.io/docs/orm*

*[3.8-S3] Prisma. "Introduction to Prisma Client." https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction*

*[3.8-S4] Prisma. "Prisma schema." https://www.prisma.io/docs/orm/prisma-schema/overview*

*[3.8-S5] PostgreSQL. "JSON Types." https://www.postgresql.org/docs/current/datatype-json.html*

*[3.8-S6] PostgreSQL. "Transactions." https://www.postgresql.org/docs/current/tutorial-transactions.html*

*[3.8-S7] PostgreSQL. "Constraints." https://www.postgresql.org/docs/current/ddl-constraints.html*

*[3.8-T1] Supabase and database implementation sources: `client/lib/supabase.ts`, `client/lib/supabase-server.ts`, `server/src/auth`, `server/src/turn/audio-storage.service.ts`, `server/prisma/schema.prisma`.*

*[3.8-T2] Prisma data model sources: `server/prisma/schema.prisma`, `server/prisma.config.ts`, `server/src/prisma/prisma.service.ts`, `server/package.json`.*

*[3.8-T3] Raw SQL synchronization sources: `docs/Design/ArchitecturalDesign/ADRs/ADR-008_raw-sql-outside-prisma-db-push.md`, `server/prisma/migrations/migration.sql`, `server/prisma/verify-db-hardening.ts`, `server/package.json`.*

# Question Generation Flow — QA Test Cases

**Phạm vi:** kiểm tra luồng sinh câu hỏi được mô tả trong [question-generation-flow.md](../question-generation-flow.md), đối chiếu với implementation hiện tại của `SessionService`, `QuestionGenerationProcessor`, `QuestionBankService`, `OpenAIGateway` và trang phỏng vấn frontend.

**Mục tiêu:** xác nhận luồng tạo session, enqueue job, sinh câu hỏi bằng AI, fallback Question Bank, lưu `session_questions`, phát SSE và frontend lấy câu hỏi hoạt động đúng; đồng thời ghi nhận các điểm tài liệu đang lệch implementation.

---

## 1. Current Implementation Audit

| # | Khu vực | Mô tả trong tài liệu | Hành vi/code hiện tại | Rủi ro |
|---|---------|----------------------|------------------------|--------|
| A01 | AI model | Gọi cố định OpenAI GPT-4o. | `OpenAIGateway` dùng env `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL`; default là OpenAI-compatible local `google/gemma-4-e4b`. | Tài liệu gây hiểu nhầm khi vận hành local/staging. |
| A02 | BullMQ timeout | Job timeout 15 giây, override OpenAI timeout 120 giây. | Queue/job không cấu hình timeout; `15_000` trong repo là Prisma transaction timeout. | Test/ops có thể debug sai nguyên nhân timeout. |
| A03 | Fallback condition | Chỉ fallback cho quota/rate/timeout/empty/schema; network/5xx retry job. | Processor catch mọi lỗi AI rồi thử Question Bank fallback; `isAIFallbackEligible` chỉ đổi log. | Hành vi retry/fallback không đúng tài liệu. |
| A04 | `order_index` | 0-based: `0,1,2...`. | Worker lưu `index + 1`; API docs cũng nói 1-based. | Frontend/test có thể assert sai thứ tự. |
| A05 | `rubric_json` | Rubric riêng từng câu. | Worker lưu `{}` cho cả AI và fallback. | Feedback/report không có per-question rubric như tài liệu kỳ vọng. |
| A06 | Difficulty spread | Dùng `floor`: với `N=5` là `1 easy / 2 medium / 2 hard`. | Code dùng `Math.round`: với `N=5` là `2 easy / 2 medium / 1 hard`. | Phân phối câu hỏi khó lệch so với spec. |
| A07 | SSE readiness | Frontend nhận SSE `active` rồi GET `/questions`. | Trang interview poll `/questions` ngay, đồng thời SSE `active` cũng trigger refetch nếu câu hỏi chưa sẵn sàng; SSE `error` hiển thị lỗi rõ ràng. | Đã có regression QG-17/QG-18/QG-19. |
| A08 | Status race guard | Chỉ set `active` khi session còn `generating`. | Worker chỉ set `active` khi session còn `generating` hoặc legacy `ready`. | Đã có regression QG-14/QG-15. |
| A09 | QuestionUsage | Ghi `QuestionUsage x N` qua `createMany`. | Code gọi `questionUsage.create` từng câu qua `recordUsage`. | Không sai chức năng, nhưng tài liệu chưa đúng chi tiết implementation. |
| A10 | Polling endpoint | Poll `GET /sessions/:id`. | Frontend poll `GET /sessions/:id/questions`; status endpoint chỉ dùng cho update/GET status riêng. | Tài liệu mô tả sai contract frontend chính. |

---

## 2. Public Contracts Under Test

| Contract | Expected behavior |
|----------|-------------------|
| `POST /api/v1/sessions` | Tạo session `generating`, lưu cấu hình, enqueue job `question-generation` với `attempts=2`, `backoff.fixed=2000ms`. |
| BullMQ `question-generation` job | Worker chọn pipeline theo `sessionType`, gọi AI hoặc fallback, lưu đủ `numQuestions`, chuyển status và emit SSE. |
| `GET /api/v1/sessions/:id/questions` | Trả `{ questions }` theo `orderIndex` tăng dần; contract hiện tại là 1-based. |
| SSE `/api/v1/sessions/:id/events` | Phát `session.status` với `{ status, sessionId }`; payload không chứa danh sách câu hỏi. |
| Question Bank fallback | Lọc theo `sessionType + contextPackId + deletedAt=null`, resolve `translations[language]`, ghi usage cho từng câu fallback. |

---

## 3. Test Data

| Data set | Nội dung |
|----------|----------|
| Valid JD | JD tiếng Việt >= 100 ký tự, ví dụ Backend Developer với Node.js, PostgreSQL, API, teamwork. |
| Session types | `hr`, `technical`, `mixed`. |
| Context packs | `VN`, `Western`. |
| Question count | Boundary `3`, default `5`, high value `10`, invalid `2`, invalid `11`. |
| Fallback bank | Ít nhất 10 câu cho `technical/VN`, gồm easy `difficulty=1,2`, medium `3`, hard `4,5`; thêm câu khác `hr/VN`, `technical/Western`, `deletedAt != null` để kiểm filter. |
| Language | `vi` có bản dịch, và row thiếu `translations.vi` để kiểm fallback về `content`. |

---

## 4. Backend/API Test Cases

| ID | Mục tiêu | Setup/Input | Bước kiểm tra | Expected result |
|----|----------|-------------|---------------|-----------------|
| QG-01 | Tạo session enqueue đúng job | JD hợp lệ, `sessionType=hr`, `contextPack=VN`, `numQuestions=5` | Gọi `POST /api/v1/sessions`. | Response 201; session `status=generating`; DB có session; queue có job `question-generation` với `sessionId`, `userId`, `language`, `totalQuestions=5`, `attempts=2`, `backoff.fixed=2000`. |
| QG-02 | Validate input trước khi sinh câu hỏi | JD < 100 ký tự; `numQuestions=2`; `numQuestions=11`; invalid enum. | Gọi `POST /api/v1/sessions` cho từng case. | API trả validation error; không tạo session; không enqueue job. |
| QG-03 | AI success path | Mock pipeline trả đúng 5 câu hợp schema. | Worker xử lý job. | Tạo 5 `session_questions`; `question_bank_id=null`; `orderIndex=1..5`; `rubricJson={}` theo code hiện tại; session `active`; emit SSE `session.status active`. |
| QG-04 | AI trả dư câu hỏi | Mock pipeline trả 7 câu, `totalQuestions=5`. | Worker xử lý job. | Chỉ lưu 5 câu đầu; không gọi fallback; session `active`; không ghi `question_usage`. |
| QG-05 | AI trả thiếu câu hỏi | Mock pipeline trả 3 câu, `totalQuestions=5`; Question Bank đủ 5. | Worker xử lý job. | Không lưu 3 câu AI; kích hoạt fallback; lưu 5 câu fallback; ghi usage cho 5 câu; session `active`. |
| QG-06 | JSON/schema lỗi fallback | AI trả JSON thiếu `competency_domain` hoặc `difficulty=4`. | Worker xử lý job. | Fallback chạy; không lưu câu AI lỗi; nếu fallback đủ thì session `active`; nếu fallback thiếu thì session `error`. |
| QG-07 | Fallback-eligible AI errors | Mock lần lượt `AI_QUOTA_EXCEEDED`, `AI_RATE_LIMIT`, `AI_TIMEOUT`, `AI_EMPTY_RESPONSE`, `SCHEMA_VALIDATION_ERROR`. | Worker xử lý từng lỗi. | Mỗi lỗi dùng fallback ngay trong cùng worker attempt; không gọi pipeline lần hai; lưu câu fallback; emit `active`. |
| QG-08 | Network/5xx behavior mismatch | Mock lỗi thường hoặc `AI_SERVICE_ERROR`; Question Bank đủ. | Worker xử lý job. | Theo tài liệu: throw để BullMQ retry, không fallback. Theo code hiện tại: fallback ngay. TC này đánh dấu **Expected mismatch** cho đến khi chốt sửa doc hoặc sửa code. |
| QG-09 | AI + fallback đều thất bại | AI lỗi; Question Bank trả 0 hoặc ít hơn `totalQuestions`. | Worker xử lý job. | Session chuyển `error`; emit SSE `session.status error`; không có `session_questions` mới; user không thể tiếp tục phỏng vấn. |
| QG-10 | Fallback filter đúng | Seed nhiều câu khác `sessionType/contextPack/deletedAt`. | Gọi `selectFallbackQuestions('technical','VN',5,'vi')`. | Chỉ chọn câu `technical + VN + deletedAt=null`; không chọn `hr`, `Western`, hoặc soft-deleted rows. |
| QG-11 | Difficulty spread hiện tại | Candidate đủ easy/medium/hard, `N=5`. | Chạy fallback selection. | Theo code hiện tại chọn `2 easy / 2 medium / 1 hard`. Nếu spec giữ `floor`, TC phải ghi mismatch vì spec kỳ vọng `1/2/2`. |
| QG-12 | Không shuffle gây lặp | Dùng cùng Question Bank, tạo 2 fallback sessions cùng `sessionType/contextPack`. | Chạy fallback 2 lần. | Hai session nhận cùng bộ/thứ tự câu hỏi vì query order cố định và selection dùng `slice(0,n)`. |
| QG-13 | Translation fallback | Một candidate có `translations.vi`, một candidate thiếu `vi`. | Chạy fallback với `language=vi`. | Row có `translations.vi` dùng bản dịch; row thiếu `vi` dùng `content`; `estimatedTimeMin=null` thành `5`. |
| QG-14 | Race pause/cancel | Session chuyển `paused` hoặc `canceled` trước khi worker hoàn tất. | Worker lưu câu hỏi rồi gọi active guard. | Không set `active`; không emit active; trạng thái vẫn `paused/canceled`. |
| QG-15 | Race trạng thái bất thường | Session đang `error`, `completing`, hoặc `completed`; worker cũ hoàn tất muộn. | Worker gọi active guard. | Không set `active`; không emit active; guard chỉ cho phép `generating/ready`. |
| QG-16 | GET questions contract | Session có câu hỏi `orderIndex=1..n`. | Gọi `GET /api/v1/sessions/:id/questions`. | Response `{ questions }`; mỗi item có `id`, `content`, `orderIndex`; sắp xếp tăng dần; nếu session đang `generating/ready` và đã có câu hỏi thì service chuyển `active`. |
| QG-20 | Không ghi usage cho AI-generated | AI success path. | Worker xử lý job. | Không tạo `question_usage`; usage chỉ ghi cho fallback Question Bank. |

---

## 5. Frontend/SSE Test Cases

| ID | Mục tiêu | Setup/Input | Bước kiểm tra | Expected result |
|----|----------|-------------|---------------|-----------------|
| QG-17 | Polling success | Mock `/questions` trả rỗng 2 lần, lần 3 trả questions. | Mở `/sessions/:id`. | UI hết loading và hiển thị câu đầu tiên; chứng minh frontend không cần SSE để nhận câu hỏi. |
| QG-18 | SSE-only readiness | Mock `/questions` rỗng ban đầu; SSE bắn `session.status active`; lần refetch sau SSE trả questions. | Mở `/sessions/:id`. | Frontend refetch questions sau SSE active và hiển thị câu đầu tiên. |
| QG-19 | SSE error path | Worker emit `session.status error` trong lúc frontend đang chờ. | Mở `/sessions/:id`. | UI hiển thị lỗi rõ ràng và không cho submit answer. |

---

## 6. Acceptance Criteria

- QG-01 đến QG-07, QG-09, QG-10, QG-13 đến QG-20 phải PASS theo implementation hiện tại.
- QG-08 và QG-11 là testcase ghi nhận mismatch giữa tài liệu cũ và code hiện tại; kết quả hiện tại được assert theo code để tránh regression âm thầm.
- Không có testcase nào được phép dùng AI real API cho regression bắt buộc; AI output phải mock/stub để tránh nondeterministic.
- Khi chạy manual exploratory với AI thật, chỉ assert schema và UX readiness, không assert nội dung câu hỏi chính xác từng chữ.

---

## 7. Automation Mapping

| Test group | Automation đề xuất |
|------------|--------------------|
| QG-01, QG-02, QG-16 | Jest unit/integration ở `session.service.spec.ts` và controller validation/e2e nếu cần. |
| QG-03 đến QG-09, QG-14, QG-15, QG-20 | Jest ở `question-generation.processor.spec.ts`. |
| QG-10 đến QG-13 | Jest ở `question-bank.service.spec.ts`. |
| QG-17 đến QG-19 | Playwright ở `client/e2e/interview.spec.ts` với API route mocks. |

# Checklist Thẩm Định Tài Liệu SRS

**Tiêu chuẩn áp dụng:** IEEE 830-1998 + ISO/IEC/IEEE 29148-2018
**Vai trò người dùng:** Senior BA / QA Lead / Reviewer
**Cách dùng:** Đánh dấu `[x]` cho mục đạt, `[!]` cho mục có vấn đề, `[N/A]` nếu không áp dụng. Mỗi mục có lý do chuyên môn để bạn hiểu *tại sao* cần kiểm tra, không phải làm cho có.

---

## Cách chấm điểm tổng thể

| Mức | Tỷ lệ Pass | Đánh giá |
|---|---|---|
| **A — Approved** | ≥ 95% mục bắt buộc + ≥ 80% mục khuyến nghị | Sẵn sàng baseline, ký phê duyệt |
| **B — Approved with conditions** | 85–94% bắt buộc | Phê duyệt có điều kiện, fix trong 1 sprint |
| **C — Major revision** | 70–84% bắt buộc | Quay lại tác giả, review lại sau khi sửa |
| **D — Reject** | < 70% bắt buộc | Tài liệu chưa đủ trưởng thành để baseline |

> **Lưu ý:** Một mục bắt buộc duy nhất bị fail (ví dụ: thiếu acceptance criteria) cũng có thể tự động hạ xuống mức C, bất kể tỷ lệ tổng. Reviewer phải dùng phán đoán chuyên môn.

---

## PHẦN A — KIỂM TRA HÌNH THỨC \u0026 CẤU TRÚC

### A.1 Metadata tài liệu (Bắt buộc)

- [ ] **A.1.1** Có version number, ngày tạo/cập nhật, trạng thái (Draft/Review/Approved)
  > *Vì sao:* Không có version control thì không thể truy vết khi yêu cầu thay đổi. Đây là điều kiện tiên quyết của configuration management.

- [ ] **A.1.2** Có lịch sử phiên bản (change log) ghi rõ *cái gì* thay đổi, *ai* thay đổi, *vì sao*
  > *Vì sao:* Change log chỉ ghi "cập nhật nội dung" là vô dụng. Phải đủ chi tiết để reviewer hiểu được delta giữa hai bản mà không cần diff.

- [ ] **A.1.3** Xác định rõ tác giả, người review, người phê duyệt (RACI)
  > *Vì sao:* Khi có conflict yêu cầu, phải biết hỏi ai. Tài liệu vô chủ là tài liệu vô giá trị.

- [ ] **A.1.4** Có mục lục (Table of Contents) khớp với cấu trúc thực tế
  > *Vì sao:* TOC lệch là dấu hiệu tài liệu được sửa vội, không qua review chính thức.

### A.2 Tuân thủ cấu trúc IEEE 830 / 29148 (Bắt buộc)

- [ ] **A.2.1** Có Section 1 — Introduction (Purpose, Scope, Definitions, References, Overview)
- [ ] **A.2.2** Có Section 2 — Overall Description (Product perspective, functions, user characteristics, constraints, assumptions)
- [ ] **A.2.3** Có Section 3 — Specific Requirements (Functional + Non-functional)
- [ ] **A.2.4** Có Traceability Matrix hoặc cơ chế tương đương
  > *Vì sao:* Không có traceability thì không thể chứng minh đã test hết yêu cầu. Đây là yêu cầu tuyệt đối của 29148.

- [ ] **A.2.5** Glossary chứa **mọi** thuật ngữ chuyên ngành được dùng trong tài liệu
  > *Vì sao:* Test cụ thể: lấy 5 thuật ngữ ngẫu nhiên trong tài liệu, kiểm tra chúng có trong glossary không. Nếu thiếu → fail.

### A.3 Đối tượng đọc \u0026 phạm vi (Khuyến nghị)

- [ ] **A.3.1** Xác định rõ stakeholder và mục đích đọc của từng nhóm
- [ ] **A.3.2** In-scope và Out-of-scope được liệt kê tường minh, có lý do loại trừ
  > *Vì sao:* Out-of-scope quan trọng hơn in-scope. Không có nó, scope creep là chắc chắn.

- [ ] **A.3.3** Có business goals + measurable success criteria (KPI)
  > *Vì sao:* Yêu cầu không gắn với business goal là yêu cầu mồ côi. Sau này không ai biết tại sao phải build.

---

## PHẦN B — CHẤT LƯỢNG NỘI DUNG YÊU CẦU

### B.1 Tính đúng đắn (Correctness) — Bắt buộc

- [ ] **B.1.1** Mỗi yêu cầu phản ánh đúng nhu cầu stakeholder thực tế (đã được xác nhận với họ)
- [ ] **B.1.2** Không có yêu cầu "tự nghĩ ra" mà không có stakeholder source
  > *Vì sao:* BA hay tự suy diễn yêu cầu. Mỗi yêu cầu phải truy ngược được về một stakeholder/document/decision.

- [ ] **B.1.3** Domain terminology được dùng đúng (đặc biệt với domain chuyên môn cao)

### B.2 Tính rõ ràng (Unambiguity) — Bắt buộc

- [ ] **B.2.1** Không có từ mơ hồ: "user-friendly", "fast", "efficient", "appropriate", "adequate", "easy"
  > *Vì sao:* Mỗi từ này = một bug tiềm năng. "Fast" với BA có thể là 2s, với dev là 5s, với user là 500ms.

- [ ] **B.2.2** Không có "and/or", "etc.", "TBD" (hoặc nếu có TBD thì phải có ngày commit giải quyết)
- [ ] **B.2.3** Mỗi yêu cầu chỉ có MỘT cách diễn giải duy nhất
  > *Test:* Đưa cùng một requirement cho 3 người đọc, hỏi họ implement ra sao. Nếu 3 người ra 3 kết quả khác nhau → fail.

- [ ] **B.2.4** Câu chủ động, ngắn gọn, dùng "shall/must" (bắt buộc) hay "should" (khuyến nghị) nhất quán
- [ ] **B.2.5** Số liệu, ngưỡng, đơn vị được nêu cụ thể (5 Mbps, không phải "tốc độ cao")

### B.3 Tính đầy đủ (Completeness) — Bắt buộc

- [ ] **B.3.1** Mọi tác nhân (actor) đều được mô tả với role và quyền hạn
- [ ] **B.3.2** Mọi use case có: Pre-condition, Post-condition, Main Flow, Alternative Flow, Exception Flow
- [ ] **B.3.3** Mọi error case và edge case được xử lý (không chỉ happy path)
  > *Test:* Đếm tỷ lệ Alternative + Exception flows trên Main flow. Nếu < 1.5x → khả năng cao thiếu edge case.

- [ ] **B.3.4** Mỗi requirement có ID duy nhất, không trùng lặp, có quy ước đặt tên rõ ràng
- [ ] **B.3.5** Tất cả input đều có validation rules (format, range, required/optional)
- [ ] **B.3.6** Tất cả output đều có format spec (schema, kiểu dữ liệu, ngôn ngữ)
- [ ] **B.3.7** Không có reference đến hình/bảng/section không tồn tại

### B.4 Tính nhất quán (Consistency) — Bắt buộc

- [ ] **B.4.1** Cùng một thuật ngữ được dùng nhất quán xuyên tài liệu (không "user" chỗ này, "người dùng" chỗ kia)
- [ ] **B.4.2** Không có yêu cầu mâu thuẫn lẫn nhau
  > *Test thường gặp:* Section A nói "lưu data 30 ngày", Section B nói "xóa ngay sau xử lý". Đây là failure pattern phổ biến nhất.

- [ ] **B.4.3** Số liệu thống kê khớp nhau (giới hạn JD = 100 ký tự ở mọi nơi nó xuất hiện)
- [ ] **B.4.4** Use case không mâu thuẫn với business rule
- [ ] **B.4.5** Các diagram (UC, sequence, ER) khớp với nội dung text

### B.5 Tính kiểm chứng được (Verifiability) — Bắt buộc

- [ ] **B.5.1** Mỗi yêu cầu chức năng có thể test được — pass/fail rõ ràng
  > *Test "verifiability litmus":* Hỏi "Làm sao tôi viết được test case cho cái này?". Nếu không trả lời được → fail.

- [ ] **B.5.2** Mỗi yêu cầu phi chức năng có metric đo được + ngưỡng + phương pháp đo
  > *Vì sao:* "System phải nhanh" — không kiểm chứng được. "P95 latency < 200ms khi có 100 concurrent users, đo bằng k6" — kiểm chứng được.

- [ ] **B.5.3** Acceptance criteria đầy đủ cho mọi use case quan trọng
- [ ] **B.5.4** Acceptance criteria viết theo Given-When-Then hoặc tương đương, không chung chung

### B.6 Tính khả thi (Feasibility) — Khuyến nghị

- [ ] **B.6.1** Yêu cầu khả thi với công nghệ và ngân sách hiện tại (đã consult tech lead)
- [ ] **B.6.2** Yêu cầu phi chức năng (performance, scalability) có cơ sở thực tế, không "wish list"
- [ ] **B.6.3** Timeline implement phù hợp với scope đã định
- [ ] **B.6.4** Constraints (license, integration, regulatory) đã được xác định

### B.7 Tính độc lập triển khai (Implementation-free) — Khuyến nghị

- [ ] **B.7.1** SRS mô tả *cái gì* (what), không phải *làm thế nào* (how)
  > *Vì sao:* "Hệ thống phải dùng React 18 với Redux" thuộc về SAD, không phải SRS. Lẫn lộn 2 cái này là dấu hiệu BA chưa tách bạch role.

- [ ] **B.7.2** Chi tiết technical (framework, schema DB, prompt cụ thể) được tách sang SAD/Design doc
- [ ] **B.7.3** Có thể implement bằng nhiều cách khác nhau và vẫn pass yêu cầu

### B.8 Tính ưu tiên (Prioritization) — Khuyến nghị

- [ ] **B.8.1** Mỗi yêu cầu có mức độ ưu tiên (Must/Should/Could/Won't — MoSCoW hoặc tương đương)
- [ ] **B.8.2** Phân biệt rõ MVP vs phase sau
- [ ] **B.8.3** Dependency giữa các requirement được liệt kê

---

## PHẦN C — YÊU CẦU PHI CHỨC NĂNG (NFR)

### C.1 Performance (Bắt buộc)

- [ ] **C.1.1** Có ngưỡng cụ thể cho response time (per endpoint nếu khác nhau)
- [ ] **C.1.2** Có ngưỡng throughput (RPS, TPS, concurrent users)
- [ ] **C.1.3** Có điều kiện đo (load level, network condition)
- [ ] **C.1.4** Có percentile, không chỉ average (p50, p95, p99)
  > *Vì sao:* Average ẩn outlier. P95 = 200ms với p99 = 5s là hệ thống có vấn đề tail latency.

### C.2 Security (Bắt buộc)

- [ ] **C.2.1** Authentication mechanism được spec rõ
- [ ] **C.2.2** Authorization rules (RBAC/ABAC) được liệt kê per resource
- [ ] **C.2.3** Có yêu cầu về encryption (at rest, in transit)
- [ ] **C.2.4** Có yêu cầu về session management, token expiry
- [ ] **C.2.5** Có yêu cầu về audit log (cái gì được log, retention bao lâu)
- [ ] **C.2.6** Threat model hoặc các kịch bản tấn công đã xét

### C.3 Privacy \u0026 Compliance (Bắt buộc nếu có PII)

- [ ] **C.3.1** PII (Personally Identifiable Information) được xác định và phân loại
- [ ] **C.3.2** Có data retention policy
- [ ] **C.3.3** Có cơ chế user xóa dữ liệu / xuất dữ liệu (GDPR-like rights)
- [ ] **C.3.4** Tuân thủ luật địa phương (Nghị định 13/2023 cho VN, GDPR cho EU)
- [ ] **C.3.5** Cookie/tracking policy được spec

### C.4 Usability (Khuyến nghị)

- [ ] **C.4.1** Có metric usability đo được (task completion rate, time-on-task, error rate)
- [ ] **C.4.2** Có yêu cầu về accessibility (WCAG 2.1 AA tối thiểu)
- [ ] **C.4.3** Có yêu cầu về i18n/l10n nếu sản phẩm đa ngôn ngữ
- [ ] **C.4.4** Có yêu cầu về responsive design / mobile support

### C.5 Reliability \u0026 Availability (Bắt buộc với production)

- [ ] **C.5.1** Có SLA target (99.5%, 99.9%, ...)
- [ ] **C.5.2** Có RTO (Recovery Time Objective) và RPO (Recovery Point Objective)
- [ ] **C.5.3** Có yêu cầu về backup, disaster recovery
- [ ] **C.5.4** Có yêu cầu về error rate tối đa
- [ ] **C.5.5** Hành vi khi dependency bên ngoài fail (degradation strategy)

### C.6 Maintainability (Khuyến nghị)

- [ ] **C.6.1** Có yêu cầu về logging (structured, level)
- [ ] **C.6.2** Có yêu cầu về monitoring và alerting
- [ ] **C.6.3** Có yêu cầu về documentation (API doc, ops runbook)

### C.7 Scalability (Khuyến nghị)

- [ ] **C.7.1** Spec growth assumption (users, data volume) trong 1-3 năm tới
- [ ] **C.7.2** Định nghĩa khi nào scale up vs scale out
- [ ] **C.7.3** Identify bottleneck tiềm năng

---

## PHẦN D — YÊU CẦU ĐẶC THÙ HỆ THỐNG AI/LLM

> *Phần này không có trong IEEE 830 gốc nhưng cần thiết cho dự án AI hiện đại. Khuyến nghị bổ sung từ ISO/IEC TR 24028 (AI trustworthiness) và NIST AI RMF.*

### D.1 AI Behavior Specification (Bắt buộc nếu có AI)

- [ ] **D.1.1** Có ràng buộc hành vi AI (constraints model phải thỏa mãn)
- [ ] **D.1.2** Có schema/format đầu ra rõ ràng cho mỗi AI call
- [ ] **D.1.3** Có spec cho hallucination handling và validation
- [ ] **D.1.4** Có fallback strategy khi AI fail

### D.2 AI Quality \u0026 Safety (Bắt buộc nếu có AI)

- [ ] **D.2.1** Có tiêu chí chất lượng AI đo được (precision, recall, user satisfaction)
- [ ] **D.2.2** Có moderation/safety layer cho input/output
- [ ] **D.2.3** Có cơ chế xử lý prompt injection
- [ ] **D.2.4** Có cơ chế đo và cải thiện prompt (versioning, A/B testing)

### D.3 AI Operational Constraints (Khuyến nghị)

- [ ] **D.3.1** Có token budget per call/session
- [ ] **D.3.2** Có cost ceiling và cost alerting
- [ ] **D.3.3** Có rate limit cho user và cho hệ thống
- [ ] **D.3.4** Có fallback khi AI vendor down

---

## PHẦN E — TRACEABILITY \u0026 TESTABILITY

### E.1 Traceability Matrix (Bắt buộc)

- [ ] **E.1.1** Mỗi requirement được trace đến nguồn (stakeholder need, business goal)
- [ ] **E.1.2** Mỗi requirement được trace đến design element (forward trace)
- [ ] **E.1.3** Mỗi requirement được trace đến test case (forward trace)
- [ ] **E.1.4** Bidirectional traceability (có thể đi ngược từ test → requirement → need)
  > *Vì sao:* Khi test fail, phải truy ngược được requirement bị ảnh hưởng. Khi yêu cầu thay đổi, phải truy được test cases nào cần update.

- [ ] **E.1.5** Cross-cutting requirements (security, performance áp dụng nhiều UC) được trace đầy đủ
- [ ] **E.1.6** Không có requirement "mồ côi" (không trace đến đâu)
- [ ] **E.1.7** Không có test case "mồ côi" (không cover requirement nào)

### E.2 Acceptance Criteria (Bắt buộc)

- [ ] **E.2.1** Mỗi use case có ≥ 3 acceptance criteria (covers happy + alt + exception)
- [ ] **E.2.2** AC được đánh số, có thể tham chiếu (AC-01-1, AC-01-2, ...)
- [ ] **E.2.3** AC có thể test được (binary pass/fail, không "look reasonable")
- [ ] **E.2.4** AC bao phủ đủ NFR liên quan

---

## PHẦN F — KIỂM TRA THỰC HÀNH (PRACTICAL TESTS)

> *Đây là các test thực tế tôi dùng khi review SRS. Chúng bắt 80% lỗi mà checklist tổng quát bỏ sót.*

### F.1 The "Stranger Test"

- [ ] **F.1.1** Đưa SRS cho dev mới gia nhập đọc trong 2 giờ. Họ có hiểu cần build cái gì không?
- [ ] **F.1.2** Họ có biết bắt đầu code từ đâu không?
- [ ] **F.1.3** Họ có thể viết được test case mà không cần hỏi BA không?

### F.2 The "Translation Test"

- [ ] **F.2.1** Lấy 5 requirement ngẫu nhiên, đưa cho 3 người implement độc lập. Output có giống nhau không?
- [ ] **F.2.2** Lấy 5 NFR ngẫu nhiên, hỏi tester làm sao test. Họ có viết được test plan không?

### F.3 The "Diff Test"

- [ ] **F.3.1** So sánh version mới vs cũ. Mọi thay đổi quan trọng có được phản ánh trong change log không?
- [ ] **F.3.2** Có thay đổi nào "ngầm" không được note không?

### F.4 The "Edge Case Test"

- [ ] **F.4.1** Đếm tỷ lệ Exception/Alternative flow trên Main flow. < 1.5x là dấu hiệu thiếu edge case.
- [ ] **F.4.2** Cho 10 input "ác ý" (empty, null, max size, special char, SQL injection, ...). SRS có spec cách xử lý không?

### F.5 The "Search Test"

- [ ] **F.5.1** Search "TBD", "TODO", "?". Phải = 0 (hoặc có ngày commit).
- [ ] **F.5.2** Search "and/or", "etc.". Phải = 0.
- [ ] **F.5.3** Search "user-friendly", "fast", "easy", "intuitive". Phải = 0.

### F.6 The "Math Test"

- [ ] **F.6.1** Mọi con số (timeout, limit, threshold) có khớp nhau giữa các section không?
- [ ] **F.6.2** Mọi tổng/percentage có cộng đúng không?
- [ ] **F.6.3** Capacity claim (X users) có khớp với infrastructure spec không?

### F.7 The "Reverse Test"

- [ ] **F.7.1** Viết một test case ngẫu nhiên. Có thể trace ngược về requirement không?
- [ ] **F.7.2** Lấy một requirement ngẫu nhiên. Có ít nhất 1 test case cover nó không?

---

## PHẦN G — RED FLAGS (DẤU HIỆU TÀI LIỆU CÓ VẤN ĐỀ NGHIÊM TRỌNG)

> *Nếu thấy ≥ 2 dấu hiệu sau, khuyến nghị dừng review và yêu cầu rework toàn bộ.*

- [ ] **G.1** Có nhiều "TBD" rải rác mà không có ngày commit
- [ ] **G.2** Cùng một thông tin xuất hiện ở nhiều nơi với giá trị khác nhau
- [ ] **G.3** Use case không có Exception Flow
- [ ] **G.4** NFR không có metric (chỉ có "tốt", "nhanh", "an toàn")
- [ ] **G.5** Không có Traceability Matrix hoặc có nhưng không cập nhật
- [ ] **G.6** Diagram được tạo từ template, không phản ánh hệ thống thật
- [ ] **G.7** Yêu cầu mâu thuẫn lẫn nhau và mâu thuẫn không được phát hiện qua review nội bộ
- [ ] **G.8** Thiếu Out-of-scope hoặc Out-of-scope quá ngắn
- [ ] **G.9** Glossary thiếu thuật ngữ chuyên môn quan trọng
- [ ] **G.10** SRS chứa quá nhiều technical detail thuộc về SAD (smell: code snippet, schema cụ thể, framework name)

---

## PHẦN H — REVIEW REPORT TEMPLATE

Sau khi hoàn thành checklist, tổng hợp findings theo template sau:

```markdown
# SRS Review Report

**Document:** [Tên tài liệu] v[X.Y]
**Reviewer:** [Tên]
**Date:** [Ngày]
**Standard applied:** IEEE 830-1998 / ISO/IEC/IEEE 29148-2018

## 1. Executive Summary

- **Overall verdict:** A / B / C / D
- **Pass rate (mandatory):** XX%
- **Pass rate (recommended):** XX%
- **Critical issues found:** N
- **Major issues found:** N
- **Minor issues found:** N

## 2. Critical Issues (Must fix before approval)

| ID | Section | Issue | Impact | Suggested fix |
|---|---|---|---|---|
| C-01 | ... | ... | ... | ... |

## 3. Major Issues (Should fix in next revision)

| ID | Section | Issue | Impact | Suggested fix |
|---|---|---|---|---|

## 4. Minor Issues (Polish)

| ID | Section | Issue | Suggested fix |
|---|---|---|---|

## 5. Strengths

- [Điểm tốt 1]
- [Điểm tốt 2]

## 6. Recommendations

- [Khuyến nghị 1]
- [Khuyến nghị 2]

## 7. Decision

- [ ] Approved
- [ ] Approved with conditions: [list]
- [ ] Rejected — major revision required

**Signed:** ____________________
**Date:** ____________________
```

---

## Phụ lục — Tham chiếu nhanh tiêu chuẩn

### IEEE 830-1998 vs ISO/IEC/IEEE 29148-2018

| Khía cạnh | IEEE 830 (1998, đã withdrawn) | 29148 (2018, hiện hành) |
|---|---|---|
| Phạm vi | Chỉ SRS | SRS + StRS + cả lifecycle requirement |
| Đặc tính requirement tốt | 8 đặc tính | 9 đặc tính (bổ sung "Singular") |
| Stakeholder analysis | Sơ sài | Chi tiết, có quy trình |
| Verification \u0026 validation | Đề cập | Quy trình rõ ràng |
| Tình trạng | Replaced | Active |

> **Khuyến nghị thực tế:** Dùng cấu trúc IEEE 830 (quen thuộc, dễ đọc) nhưng áp dụng tư duy 29148 (lifecycle, stakeholder, V\u0026V). Đây là cách hầu hết tổ chức Việt Nam đang làm.

### 9 đặc tính requirement tốt (theo 29148)

1. **Necessary** — Cần thiết, bỏ đi thì hệ thống thiếu chức năng
2. **Implementation-free** — Không ràng buộc cách thực hiện
3. **Unambiguous** — Một cách hiểu duy nhất
4. **Consistent** — Không mâu thuẫn với requirement khác
5. **Complete** — Đủ thông tin để implement và test
6. **Singular** — Một requirement = một thứ (không "and")
7. **Feasible** — Khả thi với ràng buộc hiện có
8. **Traceable** — Truy vết được nguồn và đích
9. **Verifiable** — Kiểm chứng được, có metric

---

*Checklist này là tài liệu sống. Cập nhật khi gặp pattern lỗi mới hoặc khi tiêu chuẩn thay đổi.*sssss
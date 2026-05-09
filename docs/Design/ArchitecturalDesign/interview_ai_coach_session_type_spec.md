# Interview AI Coach – Session Type Specifications

> **Tài liệu đặc tả chi tiết cho 3 loại session phỏng vấn**
> **Phạm vi**: HR/Behavioral Interview · Technical Knowledge Interview · Mixed Interview
>
> Tài liệu này bổ sung cho Business Requirements và liên kết với *Adaptive Follow-up Rules + Rubric Scoring Template* (tài liệu riêng).
>
> Đối tượng đọc: Product Owner, BA, AI Engineer, Backend Engineer, Content Curator.

---

## Mục lục

- [Phần 0: Common Framework](#phần-0-common-framework)
  - [0.1. Cấu trúc thuộc tính chuẩn](#01-cấu-trúc-thuộc-tính-chuẩn-cho-mỗi-session-type)
  - [0.2. Question Taxonomy Levels](#02-question-taxonomy-levels)
- [Phần 1: HR / Behavioral Interview](#session-type-1-hr--behavioral-interview)
- [Phần 2: Technical Knowledge Interview](#session-type-2-technical-knowledge-interview)
- [Phần 3: Mixed Interview](#session-type-3-mixed-interview)
- [Phần 4: Comparison Matrix tổng hợp](#phần-4-comparison-matrix-tổng-hợp)
- [Phần 5: Implementation Notes](#phần-5-implementation-notes)

---

# Phần 0: Common Framework

## 0.1. Cấu trúc thuộc tính chuẩn cho mỗi Session Type

Mỗi session type spec gồm **12 phần cố định** để đảm bảo đầy đủ thông tin cho dev team triển khai và AI engineer xây prompt:

1. **Overview & Objectives** – mục đích, target outcome
2. **Question Taxonomy** – cây phân loại câu hỏi
3. **Time & Count Matrix** – số câu × thời lượng × độ khó
4. **Question Type Patterns** – các pattern câu hỏi thường gặp
5. **Sample Question Library** – câu hỏi mẫu theo level
6. **Difficulty Calibration** – định nghĩa Easy/Medium/Hard
7. **Rubric Mapping** – rubric áp dụng
8. **Adaptive Follow-up Triggers** – trigger nào active
9. **Persona Suitability** – persona nào phù hợp
10. **Input Modes** – text/voice/code/canvas
11. **Sequencing Logic** – thứ tự câu hỏi
12. **Edge Cases** – tình huống đặc biệt

## 0.2. Question Taxonomy Levels

Tất cả câu hỏi được tag theo schema chuẩn 4 chiều:

```python
Question = {
  "category":            # L1 - HR | Technical | Coding | SystemDesign | Situational
  "subcategory":         # L2 - ví dụ "Teamwork" trong HR
  "topic":               # L3 - ví dụ "Conflict resolution"
  "difficulty":          # {Easy, Medium, Hard}
  "question_type":       # {Definition, Mechanism, Comparison, Scenario, BEI, ...}
  "competency":          # tag năng lực (mapping với rubric)
  "estimated_time_min":  # int
  "applicable_roles":    # [Backend, Frontend, Mobile, Data, AI]
  "applicable_levels":   # [Intern, Fresher, Junior_1y, Junior_2y]
}
```

---

# Session Type 1: HR / Behavioral Interview

## 1.1. Overview & Objectives

| Thuộc tính                           | Giá trị                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mã session**                       | `HR_BEHAVIORAL`                                                                                                                                       |
| **Mục đích chính**                  | Đánh giá soft skills, culture fit, motivation, behavioral pattern                                                                                   |
| **Knowledge area**                    | KHÔNG đánh giá hard skill kỹ thuật                                                                                                                |
| **Target outcomes**                   | Xác định ứng viên có (1) tư duy phù hợp công việc, (2) kỹ năng giao tiếp & teamwork, (3) động lực thật sự, (4) khả năng học hỏi từ trải nghiệm |
| **Vòng tương ứng thực tế**       | HR Round / Behavioral Round / Cultural Fit Round                                                                                                      |
| **Đối tượng người hỏi (mô phỏng)** | HR Business Partner / Hiring Manager / Senior Leadership                                                                                              |

## 1.2. Question Taxonomy (HR/Behavioral)

13 subcategory chính, mỗi subcategory có 2–4 topic con:

```
HR_BEHAVIORAL/
├── 1. Self-Introduction (always at opening)
│   ├── Background introduction
│   └── Why this role / Why this company
│
├── 2. Motivation & Career Aspiration
│   ├── Career goals (short-term 1y, long-term 3-5y)
│   ├── Why CNTT / Why this specialization
│   └── Why leave current school/internship
│
├── 3. Teamwork & Collaboration
│   ├── Working in diverse team
│   ├── Helping a struggling teammate
│   └── Cross-functional collaboration
│
├── 4. Conflict Resolution
│   ├── Disagreement with teammate
│   ├── Conflict with mentor/professor
│   └── Handling unfair criticism
│
├── 5. Failure & Learning
│   ├── Project that didn't go as planned
│   ├── Mistake you made and recovered from
│   └── Time you received tough feedback
│
├── 6. Leadership & Initiative (adapted for fresher)
│   ├── Taking ownership without being asked
│   ├── Leading a class/club/project
│   └── Convincing others of your idea
│
├── 7. Stress & Pressure Management
│   ├── Tight deadline situation
│   ├── Multiple priorities at once
│   └── Working through difficult period
│
├── 8. Adaptability & Change
│   ├── Learning a new technology quickly
│   ├── Adjusting to new environment
│   └── Handling unexpected change
│
├── 9. Communication & Feedback
│   ├── Explaining tech to non-tech person
│   ├── Receiving feedback
│   └── Giving feedback to peer
│
├── 10. Strengths & Weaknesses
│   ├── Top 3 strengths with evidence
│   ├── A weakness you're working on
│   └── Growth area / blind spot
│
├── 11. Work Ethic & Ownership
│   ├── Going above and beyond
│   ├── Quality vs speed trade-off
│   └── Handling repetitive task
│
├── 12. Culture Fit & Values
│   ├── Ideal work environment
│   ├── Values alignment with company
│   └── Dealing with ethical dilemma
│
└── 13. Closing
    ├── Reverse questions
    └── Anything else you'd like to share
```

## 1.3. Time & Count Matrix

| Thời lượng        | Tổng câu | Phân bổ gợi ý                                                       |
| ------------------ | --------- | ---------------------------------------------------------------------- |
| **15 phút** (mini) | 3–4      | 1 self-intro + 2 core BEI + reverse                                    |
| **30 phút**        | 5–7      | 1 self-intro + 4 core BEI + 1 stretch + reverse                        |
| **45 phút**        | 7–10     | 1 self-intro + 6–8 BEI (covering 5–6 categories) + reverse           |
| **60 phút**        | 9–13     | 1 self-intro + 8–10 BEI (covering 7–8 categories) + 1 closing + reverse |

**Time per question** (bao gồm follow-up):

- Self-introduction: 3–4 phút
- Standard BEI: 4–5 phút
- Stretch question (multi-part): 5–7 phút
- Reverse questions: 3–5 phút (toàn bộ phase)

## 1.4. Question Type Patterns

Behavioral interview chỉ dùng **3 patterns chính**:

### Pattern A – Past-Behavior (BEI thuần)

```
"Hãy kể về một lần em [đã làm/đã trải qua] [tình huống X]."
"Cho anh/chị một ví dụ cụ thể về lúc em phải [hành vi cụ thể]."
```

### Pattern B – Hypothetical/Situational

```
"Nếu em là leader của 1 team và một thành viên liên tục trễ deadline,
em sẽ xử lý như thế nào?"
```

> **Lưu ý**: Pattern B yếu hơn Pattern A (chỉ test "biết nên làm gì" chứ không test "đã thực sự làm gì"), nên hạn chế, dùng tối đa **20%** câu hỏi.

### Pattern C – Self-reflection

```
"Em tự đánh giá điểm mạnh nhất / yếu nhất của mình là gì? Cho ví dụ?"
"Em đã thay đổi như thế nào trong 1 năm qua?"
```

## 1.5. Sample Question Library (cho fresher CNTT VN)

15 câu mẫu (production cần 100+ câu):

| ID     | Subcategory   | Câu hỏi                                                                                                            | Difficulty | Competency                  |
| ------ | ------------- | -------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------- |
| HR-001 | Self-intro    | Em hãy giới thiệu bản thân và lý do em ứng tuyển vị trí [X] tại [Công ty]?                                  | Easy       | Communication, Motivation   |
| HR-002 | Motivation    | Vì sao em chọn ngành/công nghệ [X] mà không phải [Y]?                                                          | Easy       | Motivation                  |
| HR-003 | Career goal   | 3 năm tới em hình dung mình sẽ phát triển ra sao?                                                                | Medium     | Self-awareness              |
| HR-004 | Teamwork      | Kể về một lần em làm việc nhóm trong dự án ở trường/CLB. Vai trò của em và thử thách lớn nhất là gì? | Medium     | Collaboration               |
| HR-005 | Conflict      | Có lần nào em bất đồng quan điểm với một thành viên trong nhóm/đồng nghiệp không? Em xử lý ra sao?       | Medium     | Conflict resolution         |
| HR-006 | Failure       | Hãy kể về một dự án/bài tập lớn KHÔNG đạt như mong đợi. Em rút ra điều gì?                                | Medium     | Self-awareness, Resilience  |
| HR-007 | Initiative    | Cho ví dụ một lần em chủ động làm gì đó vượt ngoài yêu cầu (không ai bảo nhưng em thấy cần làm)?         | Hard       | Ownership                   |
| HR-008 | Pressure      | Khi cùng lúc deadline đồ án, thi cuối kỳ và intern – em sắp xếp ưu tiên thế nào?                              | Medium     | Time management             |
| HR-009 | Adaptability  | Lần gần nhất em phải học một công nghệ mới rất nhanh, em đã làm thế nào?                                     | Medium     | Learning agility            |
| HR-010 | Communication | Em đã từng phải giải thích một concept kỹ thuật cho người không biết IT (ví dụ ba mẹ, bạn ngoài ngành) chưa? Em làm thế nào? | Easy       | Communication               |
| HR-011 | Strengths     | Top 3 điểm mạnh của em là gì? Ví dụ minh họa cho điểm mạnh số 1?                                              | Easy       | Self-awareness              |
| HR-012 | Weakness      | Một điểm yếu mà em đang cố cải thiện là gì? Em đã làm gì cụ thể để cải thiện?                            | Medium     | Self-awareness              |
| HR-013 | Ownership     | Khi gặp một bug em không biết cách fix sau 1 ngày tự tìm – em làm gì?                                          | Medium     | Problem-solving, Help-seeking |
| HR-014 | Culture       | Môi trường làm việc lý tưởng với em là như thế nào?                                                            | Easy       | Culture fit                 |
| HR-015 | Stretch       | Kể về một lần em phải nói "không" với yêu cầu của một người có quyền lực hơn (giảng viên, sếp intern, leader nhóm). | Hard       | Assertiveness               |

## 1.6. Difficulty Calibration

| Level      | Đặc điểm câu hỏi                                                                                                              | Đặc điểm probing                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Easy**   | Câu hỏi 1 chiều, có template rõ; ứng viên dễ chuẩn bị trước (Self-intro, motivation, strength)                           | Follow-up nhẹ, chấp nhận câu trả lời chuẩn bị         |
| **Medium** | Yêu cầu kể tình huống cụ thể với ví dụ thật từ học tập/intern; multi-part STAR                                       | Follow-up theo STAR, đào personal contribution                |
| **Hard**   | Tình huống phức tạp, có ethical/political dimension; câu hỏi "stretch" về ownership ở mức cao hơn level fresher | Follow-up multi-layer, đào trade-off và self-reflection sâu |

## 1.7. Rubric Mapping

- **Áp dụng**: Behavioral Rubric (D1–D6) đã định nghĩa.
- **Trọng số**: Theo `target_level` (Fresher / Junior).
- **Self-introduction (HR-001)** chấm theo **rubric đặc biệt** (rút gọn): Clarity (40%) + Relevance to role (30%) + Confidence (30%) – không áp D1–D6 đầy đủ vì không phải BEI.

## 1.8. Adaptive Follow-up Triggers Active

| Trigger                       | Active? | Ghi chú                                                  |
| ----------------------------- | ------- | --------------------------------------------------------- |
| T1 – STAR Missing             | ✅ Cao  | Trigger chủ lực                                          |
| T2 – "We" Overuse             | ✅ Cao  | Trừ khi câu hỏi explicit về teamwork                  |
| T3 – Unverifiable Claim       | ✅      | Khi user nói "tăng X%", "rất nhiều"                  |
| T4 – Vague                    | ✅ Cao  | Khi không có ví dụ cụ thể                            |
| T5 – Surface Technical        | ❌ Off  | Không áp dụng cho HR                                    |
| T6 – Trade-off Missing        | ❌ Off  | Không áp dụng                                           |
| T7 – No Reflection            | ✅ Cao  | Đặc biệt cho failure/conflict questions                 |
| T8 – CV Inconsistency         | ✅      | Khi câu trả lời không khớp CV                       |
| S1 – Edge Case                | ❌ Off  | Không áp dụng                                           |
| S2 – Approach Justification   | ❌ Off  | Không áp dụng                                           |

## 1.9. Persona Suitability

| Persona        | Phù hợp     | Ghi chú                                                  |
| -------------- | ------------ | --------------------------------------------------------- |
| Friendly HR    | ✅ Best fit  | Tone ấm, khuyến khích, follow-up gentle                |
| Senior Manager | ✅ Good fit  | Tone formal hơn, hỏi về career trajectory              |
| Tech Lead      | ⚠️ Partial | Chỉ phù hợp cho behavioral về teamwork, learning      |
| Strict Senior  | ❌ Avoid     | Quá áp lực cho HR session, gây phản tác dụng        |

## 1.10. Input Modes

- **Voice**: ✅ Khuyến nghị mặc định (mô phỏng thực tế tốt nhất)
- **Text**: ✅ Cho user prefer / khiếm thính / luyện viết
- **Code editor**: ❌ Không sử dụng
- **Drawing canvas**: ❌ Không sử dụng

## 1.11. Sequencing Logic

```
[Opening Phase – cố định]
1. Self-introduction (HR-001 hoặc tương tự)
2. Why this role / Why this company

[Warm-up Phase]
3. Easy question (Strengths / Motivation)

[Core Phase – random 5–8 câu từ 5–8 subcategory khác nhau]
- Đảm bảo coverage tối thiểu 5 subcategory
- Random thứ tự nhưng tránh 2 câu cùng subcategory liên tiếp
- Sau câu Failure phải có 1 câu Positive (psychological balance)

[Stretch Phase – 1–2 câu]
- Hard difficulty
- Có thể là multi-part hoặc edge case

[Closing Phase]
- "Em có câu hỏi gì cho anh/chị không?" (reverse Q)
- Closing remark từ AI
```

> **Quan trọng**: Sau khi user trả lời câu Failure (HR-006) hoặc Conflict (HR-005), câu kế tiếp **không được** là một câu nặng nề khác. Bắt buộc chèn 1 câu nhẹ hoặc tích cực để giữ tâm lý.

## 1.12. Edge Cases

- User không có project/intern (sinh viên năm 3) → AI điều hướng câu hỏi sang context học tập, CLB, gia đình.
- User trả lời "em chưa từng gặp tình huống đó" → AI cho phép hypothetical version (Pattern B) thay vì ép kể.
- User có giai đoạn gap (nghỉ học 1 năm) → AI có thể hỏi nhẹ nhàng về giai đoạn đó nhưng không phán xét.
- User thừa nhận điều nhạy cảm (depression, family issue) → AI ghi nhận với empathy, không đào sâu, chuyển câu.

---

# Session Type 2: Technical Knowledge Interview

## 2.1. Overview & Objectives

| Thuộc tính                  | Giá trị                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mã session**              | `TECHNICAL_KNOWLEDGE`                                                                                                                                                                                 |
| **Mục đích chính**         | Đánh giá kiến thức kỹ thuật (conceptual depth, application, trade-off awareness)                                                                                                              |
| **Knowledge area**          | Hard skills theo role (Backend / Frontend / Mobile / Data / AI)                                                                                                                                       |
| **Target outcomes**         | Xác định ứng viên có (1) nền tảng vững, (2) hiểu cơ chế chứ không chỉ thuộc lòng, (3) áp dụng được vào dự án thực, (4) nhận thức được trade-off |
| **Vòng tương ứng thực tế** | Technical Round 1 (Knowledge Screening) – không bao gồm live coding                                                                                                                                |
| **Đối tượng người hỏi**  | Tech Lead / Senior Engineer                                                                                                                                                                           |

> **Quan trọng**: Session này **KHÔNG** bao gồm live coding hay system design (đó là 2 session type riêng). Đây là phỏng vấn **conceptual technical** – hỏi đáp lý thuyết và scenario.

## 2.2. Question Taxonomy (Technical) – Theo Role

Taxonomy phụ thuộc vào role mục tiêu. Dưới đây là 4 role phổ biến nhất cho fresher VN.

### 2.2.A – Backend Developer

```
TECHNICAL_BACKEND/
├── 1. Programming Fundamentals
│   ├── OOP (4 pillars + practical examples)
│   ├── Functional concepts (immutability, pure function)
│   ├── Language-specific (Java/Python/Node) – generic vs language quirks
│   └── Memory management basics
│
├── 2. Data Structures & Algorithms (conceptual, not coding)
│   ├── Complexity analysis (Big-O)
│   ├── Array vs LinkedList – use cases
│   ├── HashMap internals
│   ├── Tree (BST, balanced) basics
│   └── Sorting & searching
│
├── 3. Database
│   ├── SQL fundamentals (JOIN types, GROUP BY, subquery)
│   ├── Indexing (B-tree, when to index, downside)
│   ├── Transactions & ACID
│   ├── Normalization (1NF–3NF)
│   ├── SQL vs NoSQL trade-off
│   └── ORM concept
│
├── 4. Web & API
│   ├── HTTP fundamentals (methods, status codes, headers)
│   ├── REST principles (statelessness, idempotency)
│   ├── REST vs GraphQL vs RPC
│   ├── Authentication (Session, JWT, OAuth basics)
│   └── CORS, CSRF, basic security
│
├── 5. System Concepts
│   ├── Caching (browser, CDN, server, DB query cache)
│   ├── Async vs sync, event loop
│   ├── Message queue (concept level)
│   ├── Load balancing basics
│   └── Microservice vs monolith trade-off
│
├── 6. Software Engineering Practices
│   ├── Git workflow (branch, merge vs rebase, PR)
│   ├── Testing (unit/integration/e2e – when which)
│   ├── Clean code principles
│   ├── Design patterns (top 5 cho fresher: Singleton, Factory, Strategy, Observer, Repository)
│   └── SOLID principles
│
└── 7. DevOps Awareness (light)
    ├── Container concept (Docker)
    ├── CI/CD pipeline basics
    └── Logging & monitoring concept
```

### 2.2.B – Frontend Developer

```
TECHNICAL_FRONTEND/
├── 1. Web Fundamentals
│   ├── HTML semantics
│   ├── CSS (box model, flexbox, grid, specificity)
│   ├── Browser rendering pipeline
│   └── Accessibility (a11y) basics
│
├── 2. JavaScript Core
│   ├── Closures, scope, hoisting
│   ├── this & binding
│   ├── Event loop, microtask vs macrotask
│   ├── Promises, async/await
│   ├── Prototypes vs classes
│   └── Modules (ESM, CommonJS)
│
├── 3. Framework (theo CV: React/Vue/Angular)
│   ├── Component lifecycle
│   ├── State management (local vs global)
│   ├── Hooks / Composition API patterns
│   ├── Reactivity model
│   └── Performance optimization (memo, virtualization)
│
├── 4. State Management
│   ├── Context vs Redux/Zustand/Pinia
│   ├── Server state vs client state
│   └── React Query / SWR concept
│
├── 5. Performance & Optimization
│   ├── Critical rendering path
│   ├── Code splitting & lazy loading
│   ├── Image optimization
│   └── Web Vitals
│
├── 6. API & Networking
│   ├── Fetch / Axios usage
│   ├── REST consumption patterns
│   ├── Authentication storage (localStorage vs cookie trade-off)
│   └── Error handling patterns
│
├── 7. Testing & Tooling
│   ├── Unit test (Jest/Vitest)
│   ├── Component test
│   ├── E2E (Cypress/Playwright concept)
│   └── Build tools (Webpack/Vite concept)
│
└── 8. CSS & Design Systems
    ├── Responsive design
    ├── CSS-in-JS vs utility-first (Tailwind)
    └── Component library concept
```

### 2.2.C – Mobile Developer (iOS/Android)

```
TECHNICAL_MOBILE/
├── 1. Platform Fundamentals
│   ├── App lifecycle
│   ├── Activity/ViewController lifecycle
│   ├── Permissions model
│   └── Background tasks
│
├── 2. UI Framework (Native or Cross-platform theo CV)
│   ├── Layout system
│   ├── Navigation patterns
│   ├── State & data binding
│   └── Animation basics
│
├── 3. Architecture Patterns
│   ├── MVC / MVP / MVVM
│   ├── Clean Architecture concepts
│   └── Dependency Injection
│
├── 4. Data & Storage
│   ├── Local DB (SQLite/Room/Core Data)
│   ├── Key-value (SharedPreferences/UserDefaults)
│   └── File system & cache
│
├── 5. Networking
│   ├── HTTP client (Retrofit/Alamofire)
│   ├── Async patterns (coroutines, async/await, RxJava)
│   └── Offline-first concepts
│
├── 6. Performance
│   ├── Memory management
│   ├── Battery & network optimization
│   └── Image loading & cache
│
└── 7. Distribution
    ├── App signing
    ├── Store guidelines basics
    └── Crash reporting concept
```

### 2.2.D – Data / AI Engineer

```
TECHNICAL_DATA_AI/
├── 1. SQL & Data Manipulation
│   ├── Complex JOIN, subquery, window functions
│   ├── Aggregation patterns
│   └── Query optimization basics
│
├── 2. Python for Data
│   ├── Pandas (DataFrame ops)
│   ├── NumPy basics
│   └── Common pitfalls
│
├── 3. Statistics Fundamentals
│   ├── Descriptive stats
│   ├── Distribution (normal, skewed)
│   ├── Hypothesis testing concept
│   └── Correlation vs causation
│
├── 4. Machine Learning Basics
│   ├── Supervised vs unsupervised
│   ├── Train/val/test split
│   ├── Overfitting, underfitting
│   ├── Bias-variance trade-off
│   ├── Common algorithms (linear/logistic regression, decision tree, k-means)
│   └── Evaluation metrics (accuracy, precision, recall, F1, AUC)
│
├── 5. Data Pipeline Concepts
│   ├── ETL vs ELT
│   ├── Batch vs streaming
│   └── Data warehouse vs data lake
│
└── 6. (Cho AI Engineer) Deep Learning Basics
    ├── Neural network basics
    ├── Backprop concept (high level)
    ├── Common architectures (CNN, RNN, Transformer concept)
    └── Pre-trained models / fine-tuning
```

## 2.3. Time & Count Matrix

| Thời lượng        | Tổng câu | Easy | Medium | Hard | Phân bổ subcategory             |
| ------------------ | --------- | ---- | ------ | ---- | ----------------------------------- |
| **15 phút** (mini) | 5–7      | 2    | 3      | 0–1 | 3–4 sub                            |
| **30 phút**        | 9–12     | 3    | 6      | 1–2 | 5–6 sub                            |
| **45 phút**        | 13–17    | 4    | 8      | 2–3 | 6–7 sub                            |
| **60 phút**        | 17–22    | 5    | 11     | 3–4 | 7–8 sub (gần như coverage hết taxonomy) |

**Time per question**:

- Easy (definition): 1.5–2 phút
- Medium (mechanism/scenario): 2.5–4 phút
- Hard (multi-part / trade-off / debugging): 4–6 phút
- Cộng follow-up time: trung bình +1.5 phút/câu khi T5 trigger

## 2.4. Question Type Patterns

Technical knowledge có **6 patterns câu hỏi**, mỗi pattern test khía cạnh khác nhau:

### Pattern T-A: Definition

```
"X là gì?"
"Em hiểu thế nào về X?"
```

- **Test**: TD1 (Conceptual Accuracy) ở mức cơ bản.
- **Difficulty**: Easy.

### Pattern T-B: Mechanism / How it works

```
"X hoạt động như thế nào dưới hood?"
"Khi em gọi [function/operation], điều gì diễn ra?"
"Browser render một trang web qua những bước nào?"
```

- **Test**: TD2 (Depth of Understanding).
- **Difficulty**: Medium–Hard.

### Pattern T-C: Comparison

```
"X vs Y khác nhau ở điểm nào? Khi nào dùng cái nào?"
"Sự khác biệt giữa SQL và NoSQL?"
```

- **Test**: TD2 + TD4 (Trade-off).
- **Difficulty**: Medium.

### Pattern T-D: Scenario / Application

```
"Trong dự án [scenario], em sẽ chọn [X hay Y]? Vì sao?"
"Nếu cần lưu data session 30 phút, em chọn cách nào?"
```

- **Test**: TD3 (Real-world Application) + TD4.
- **Difficulty**: Medium–Hard.

### Pattern T-E: Debugging / Diagnosis

```
"User báo trang web load chậm. Em sẽ debug từ đâu?"
"Query này đang chậm – em sẽ kiểm tra những gì?"
```

- **Test**: TD2 + TD3 + problem-solving.
- **Difficulty**: Hard.

### Pattern T-F: Trade-off Analysis

```
"Microservice vs monolith – chọn cái nào cho dự án 5 người? Vì sao?"
"Pros/cons của việc dùng JWT cho authentication?"
```

- **Test**: TD4 (Trade-off Awareness) – đặc biệt quan trọng.
- **Difficulty**: Hard.

## 2.5. Sample Question Library (Backend Fresher – 12 câu mẫu)

| ID     | Subcat       | Pattern | Câu hỏi                                                                                                                  | Difficulty |
| ------ | ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| TB-001 | OOP          | T-A     | Em hãy giải thích 4 nguyên tắc OOP và cho ví dụ Encapsulation từ dự án em đã làm?                              | Easy       |
| TB-002 | DSA          | T-C     | HashMap và TreeMap khác nhau thế nào? Khi nào em chọn cái nào?                                                       | Medium     |
| TB-003 | DB           | T-B     | Em hãy giải thích B-tree index hoạt động ra sao và vì sao nó nhanh hơn full-table scan?                          | Hard       |
| TB-004 | DB           | T-D     | Em có một bảng `users` 10 triệu rows, query theo email rất chậm. Em sẽ làm gì?                                  | Medium     |
| TB-005 | DB           | T-A     | ACID là gì? Cho ví dụ vi phạm Isolation?                                                                                | Medium     |
| TB-006 | Web          | T-A     | Khác biệt giữa HTTP status code 401 và 403?                                                                              | Easy       |
| TB-007 | Web          | T-B     | REST có nguyên tắc statelessness – nó nghĩa là gì và vì sao quan trọng?                                            | Medium     |
| TB-008 | Web          | T-C     | JWT vs Session – em chọn cái nào cho ứng dụng cần SSO? Vì sao?                                                    | Hard       |
| TB-009 | System       | T-A     | Cache là gì? Có những loại cache nào trong một web app điển hình?                                                  | Easy       |
| TB-010 | System       | T-D     | Em có một API gọi external service rất chậm. Có những cách nào để cải thiện UX?                                | Medium     |
| TB-011 | Engineering  | T-C     | Unit test, integration test, E2E test khác nhau ra sao? Tỷ lệ test nên là bao nhiêu?                                | Medium     |
| TB-012 | DevOps       | T-A     | Docker là gì? Vì sao team dev hay dùng Docker?                                                                            | Easy       |

> Production cần **150–300 câu/role** để đủ variety chống repeat khi user luyện nhiều session.

## 2.6. Difficulty Calibration

| Level      | Đặc điểm                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| **Easy**   | Định nghĩa khái niệm cơ bản; pattern T-A; có thể trả lời từ kiến thức sách/khóa học             |
| **Medium** | Yêu cầu hiểu cơ chế hoặc so sánh; pattern T-B/T-C; cần áp dụng kiến thức                                  |
| **Hard**   | Trade-off, debugging, scenario phức tạp; pattern T-D/T-E/T-F; cần kinh nghiệm thực tế hoặc tư duy tổng hợp |

> **Calibration cho fresher**: Hard không có nghĩa là expert-level – chỉ là "đẩy ra khỏi comfort zone" của level đó.

## 2.7. Rubric Mapping

- **Áp dụng**: Technical Rubric (TD1–TD5).
- **Trọng số đặc biệt theo pattern**:

| Pattern | TD1 | TD2 | TD3 | TD4 | TD5 |
| ------- | --- | --- | --- | --- | --- |
| T-A     | 60% | –  | –  | –  | 40% |
| T-B     | 30% | 50% | –  | –  | 20% |
| T-C     | 25% | –  | –  | 50% | 25% |
| T-D     | –  | –  | 60% | 30% | 10% |
| T-E     | –  | 30% | 30% | 30% | 10% |
| T-F     | –  | 20% | –  | 70% | 10% |

## 2.8. Adaptive Follow-up Triggers Active

| Trigger                       | Active? | Ghi chú                                                  |
| ----------------------------- | ------- | --------------------------------------------------------- |
| T1 – STAR Missing             | ❌ Off  | Không áp dụng cho technical                            |
| T2 – "We" Overuse             | ❌ Off  | Không áp dụng                                           |
| T3 – Unverifiable Claim       | ✅      | Khi user nói "tăng performance 80%"                     |
| T4 – Vague                    | ✅      | Khi trả lời quá chung chung                            |
| T5 – Surface Technical        | ✅ Cao  | Trigger chủ lực                                          |
| T6 – Trade-off Missing        | ✅ Cao  | Đặc biệt cho pattern T-C/T-D/T-F                        |
| T7 – No Reflection            | ❌ Off  | Không áp dụng                                           |
| T8 – CV Inconsistency         | ✅      | Khi claim trên CV không khớp với kiến thức demo     |
| S1 – Edge Case                | ⚠️    | Soft: chỉ khi còn thời gian                             |
| S2 – Approach Justification   | ✅      | Khi user chọn solution mà không giải thích            |

## 2.9. Persona Suitability

| Persona        | Phù hợp                                              |
| -------------- | ----------------------------------------------------- |
| Friendly HR    | ❌ Không phù hợp                                    |
| Senior Manager | ⚠️ Chỉ phù hợp ở mức thấp                       |
| Tech Lead      | ✅ Best fit                                           |
| Strict Senior  | ✅ Good fit – đặc biệt cho Hard difficulty         |

## 2.10. Input Modes

- **Voice**: ✅ Mặc định
- **Text**: ✅ Cho user prefer
- **Code editor**: ⚠️ Optional khi câu hỏi cần thể hiện snippet code (ví dụ "Viết SQL query lấy top 10 user theo doanh thu")
- **Drawing canvas**: ❌

## 2.11. Sequencing Logic

```
[Opening]
1. Brief tech intro: "Em chia sẻ tech stack chính + 1 dự án em proud nhất?"
   (Mục đích: lấy context để cá nhân hóa câu hỏi)

[Warm-up – 2–3 câu Easy]
2. Câu Easy theo subcategory mạnh trên CV (giúp user vào nhịp)

[Core – 60% câu hỏi, mix Medium]
3. Cover 5–7 subcategory chính
4. Mỗi subcategory tối đa 2 câu liên tiếp (tránh đào quá sâu một mảng)
5. Xen kẽ T-A → T-B → T-C → T-D pattern

[Advanced – 20% câu hỏi Hard]
6. 2–3 câu Hard tập trung vào scenario, trade-off, debugging
7. Có thể đào sâu vào tech stack chính của user (theo CV)

[Wind-down – 1 câu Easy/Medium]
8. Câu nhẹ để user kết thúc với cảm giác tích cực

[Closing & Reverse Q]
9. "Em có câu hỏi gì cho anh/chị về team/tech stack/code culture?"
```

## 2.12. Edge Cases

- User trả lời "em chưa học cái này" → AI ghi nhận, không phạt thêm bằng follow-up, có thể chuyển hướng câu hỏi sang mảng user mạnh.
- User trả lời sai (misconception) → AI **không sửa lỗi tại buổi phỏng vấn** (giữ realism); chỉ ghi nhận để correct trong feedback report cuối session.
- User dùng buzzword không đúng ("microservice" cho monolith app) → trigger T5 để đào sâu, kiểm chứng hiểu thật hay không.
- User trả lời quá nhanh (< 10 giây) cho câu Hard → suspicious, có thể follow-up đào sâu.
- User trả lời quá dài (> 5 phút độc thoại) → AI gentle interrupt: "Em chốt ý chính giúp anh/chị nhé".
- Công nghệ user mention nhưng AI không nắm vững (niche tech) → AI hỏi user giải thích thay vì pretend hiểu.

---

# Session Type 3: Mixed Interview

## 3.1. Overview & Objectives

| Thuộc tính                  | Giá trị                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mã session**              | `MIXED_INTERVIEW`                                                                                                                                                                                     |
| **Mục đích chính**         | Mô phỏng vòng phỏng vấn screening end-to-end thực tế, kết hợp behavioral + technical trong 1 session                                                                                       |
| **Knowledge area**          | Cả soft skills + hard skills                                                                                                                                                                         |
| **Target outcomes**         | (1) Test khả năng switch context giữa behavioral và technical, (2) Mô phỏng full experience của vòng phỏng vấn screening, (3) Đánh giá tổng thể                                |
| **Vòng tương ứng thực tế** | Screening Interview / First-round Combined Interview (phổ biến ở SME, startup, các công ty không có vòng riêng cho HR)                                                                    |
| **Đối tượng người hỏi**  | Tech Lead có training HR / Hiring Manager kiêm technical                                                                                                                                            |

## 3.2. Question Composition

Mixed interview là **tổ hợp** hai session type trên với tỷ lệ thay đổi theo emphasis:

| Emphasis Mode             | % Behavioral | % Technical | % Situational | Khi nào dùng                                  |
| ------------------------- | ------------ | ----------- | ------------- | ------------------------------------------------ |
| **Balanced** (default)    | 35%          | 50%         | 15%           | Standard screening                               |
| **Tech-heavy**            | 25%          | 65%         | 10%           | Cho tech-focused company (FAANG-style)           |
| **Culture-heavy**         | 50%          | 35%         | 15%           | Cho company nhấn mạnh culture (startup, agency) |

> User có thể chọn emphasis mode khi setup session (mặc định Balanced).

**Situational** (15%) là loại câu hỏi đặc thù chỉ Mixed mới có nhiều: cross-functional scenarios như "Dev vs PM disagree về scope, em xử lý sao?" – test cả technical judgment + soft skill.

## 3.3. Time & Count Matrix (Balanced mode)

| Thời lượng | Total | Behavioral | Technical | Situational | Reverse Q |
| ----------- | ----- | ---------- | --------- | ----------- | --------- |
| **30 phút** | 7–9  | 2–3       | 4–5      | 1           | 1         |
| **45 phút** | 11–14 | 4          | 6–8      | 1–2        | reverse   |
| **60 phút** | 14–18 | 5          | 8–11     | 2           | reverse   |

> **Lưu ý**: Mixed interview **không** rút ngắn xuống 15 phút (không đủ cover cả 2).

## 3.4. Sequencing Logic (đặc biệt quan trọng cho Mixed)

Mixed interview có 1 đặc thù: **transition giữa behavioral và technical phải tự nhiên** – không thể nhảy đột ngột. Sequence chuẩn:

```
[Opening – 4 phút]
1. Self-introduction (HR-001 style)
2. Brief on dự án proud nhất → bridge sang technical

[Technical Block 1 – Warmup – 8 phút]
3. Câu Easy về tech stack user đã mention
4. Câu Medium về fundamentals của role

[Behavioral Block 1 – 8 phút]
5. Motivation question (why this role/company)
6. Teamwork hoặc Communication question

[Technical Block 2 – Core – 15 phút]
7. 3–4 câu Medium-Hard về core knowledge
8. Có thể bao gồm 1 scenario hoặc trade-off question

[Behavioral Block 2 – 8 phút]
9. Failure / Conflict question
10. Learning agility hoặc Adaptability

[Situational Block – 6 phút]
11. 1–2 câu cross-functional scenario
    Ví dụ: "Em là dev được giao build feature, nhưng em thấy spec từ PM
    có vấn đề về UX. Em xử lý ra sao?"

[Wind-down – 3 phút]
12. Strength + Career goal (nhẹ nhàng)

[Closing – 5 phút]
13. Reverse questions
14. Closing remark
```

## 3.5. Rubric Mapping & Aggregation

Mixed interview cần aggregation tinh tế:

```python
# Per-question scoring
behavioral_questions  -> D1–D6 rubric
technical_questions   -> TD1–TD5 rubric
situational_questions -> Hybrid rubric (50% behavioral + 50% technical anchors)

# Session-level aggregation
behavioral_avg  = mean(behavioral_question_scores)
technical_avg   = mean(technical_question_scores)
situational_avg = mean(situational_question_scores)
communication   = from voice analytics (CO1–CO5)

# Final score with emphasis weighting
if emphasis == "balanced":
    overall = 0.30*behavioral + 0.45*technical + 0.15*situational + 0.10*communication
elif emphasis == "tech_heavy":
    overall = 0.20*behavioral + 0.60*technical + 0.10*situational + 0.10*communication
elif emphasis == "culture_heavy":
    overall = 0.45*behavioral + 0.30*technical + 0.15*situational + 0.10*communication
```

## 3.6. Adaptive Follow-up Triggers Active

**Tất cả 8 trigger T1–T8 + 2 soft trigger S1–S2** đều active, kích hoạt theo loại câu hỏi đang xử lý:

- Câu behavioral → T1, T2, T3, T4, T7, T8
- Câu technical → T3, T4, T5, T6, T8, S2
- Câu situational → T1, T4, T6 (mix)

## 3.7. Persona Suitability

| Persona        | Phù hợp                                              |
| -------------- | ----------------------------------------------------- |
| Friendly HR    | ⚠️ Partial – yếu ở technical block            |
| Senior Manager | ✅ Good fit – có thể handle cả 2                  |
| Tech Lead      | ✅ Best fit – realistic nhất                        |
| Strict Senior  | ⚠️ Phù hợp với Tech-heavy emphasis              |

## 3.8. Input Modes

- **Voice**: ✅ Mặc định
- **Text**: ✅
- **Code editor**: ⚠️ Optional cho 1 vài câu technical
- **Drawing canvas**: ❌ Không phù hợp với mixed (dành cho session SD riêng)

## 3.9. Edge Cases đặc thù của Mixed

- User mạnh ở 1 mảng (ví dụ technical xuất sắc nhưng behavioral yếu) → AI giữ nguyên balance, không tăng câu hỏi mảng yếu để "cứu" → đảm bảo realism.
- Transition giữa 2 block: AI nên có **bridge sentence** ("Cảm ơn em chia sẻ. Bây giờ chuyển sang phần kỹ thuật một chút – em hãy giải thích...").
- User bí câu technical → KHÔNG chuyển ngay sang behavioral để "cứu" (vì sẽ tạo pattern user lợi dụng) → tiếp tục theo plan, ghi nhận ở feedback.
- Time overrun ở technical block → cắt bớt situational, không bỏ behavioral block 2.

---

# Phần 4: Comparison Matrix tổng hợp

| Tiêu chí                          | HR/Behavioral                            | Technical Knowledge                                                          | Mixed Interview                       |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| **Mục tiêu chính**                | Soft skills, culture fit                 | Hard skills, conceptual depth                                                 | End-to-end screening                  |
| **Vòng thực tế**                 | HR Round                                 | Technical Round 1                                                             | Combined Screening                    |
| **Thời lượng tối thiểu**       | 15 phút                                 | 15 phút                                                                      | 30 phút                              |
| **Số câu (60min)**                | 9–13                                    | 17–22                                                                        | 14–18                                |
| **Loại pattern câu hỏi**       | BEI, Situational, Self-reflection        | Definition, Mechanism, Comparison, Scenario, Debug, Trade-off                | Tất cả                              |
| **Rubric**                         | D1–D6                                   | TD1–TD5                                                                      | D1–D6 + TD1–TD5 + hybrid            |
| **Trigger active chính**          | T1, T2, T4, T7                           | T5, T6, S2                                                                    | Tất cả                              |
| **Persona best-fit**               | Friendly HR                              | Tech Lead                                                                     | Tech Lead, Senior Manager             |
| **Input mode chính**              | Voice/Text                               | Voice/Text                                                                    | Voice/Text                            |
| **Code editor cần?**              | ❌                                        | Optional                                                                      | Optional                              |
| **Sequencing complexity**          | Simple (1 phase)                         | Medium (warmup→core→advanced)                                              | High (multi-block với transition)    |
| **Time/câu trung bình**          | 4 phút                                  | 2.5 phút                                                                     | 3 phút                               |
| **Output report focus**            | Behavioral patterns, soft skills heatmap | Knowledge gaps map, tech depth chart                                         | Combined dashboard                    |
| **Difficulty ceiling cho fresher** | Hard = ownership/ethical                 | Hard = trade-off/debugging                                                    | Hard ở từng phần riêng           |

---

# Phần 5: Implementation Notes

## 5.1. Question Bank Sizing

Để tránh user gặp lại câu hỏi và đảm bảo variety, đề xuất kích thước bank tối thiểu:

| Session Type            | Câu hỏi tối thiểu | Sub-tag bắt buộc                             |
| ----------------------- | -------------------- | ----------------------------------------------- |
| HR/Behavioral           | 100–150 câu         | 13 subcategory × tối thiểu 8 câu/subcategory |
| Technical Backend       | 200 câu              | 7 subcategory × ~30 câu                        |
| Technical Frontend      | 200 câu              | 8 subcategory × ~25 câu                        |
| Technical Mobile        | 150 câu              | 7 subcategory × ~22 câu                        |
| Technical Data/AI       | 200 câu              | 6 subcategory × ~33 câu                        |
| Situational (cho Mixed) | 50 câu               | Cross-functional scenarios                      |

**Total cho MVP**: ~900–1000 câu (curated) + LLM-generated dynamic 30%.

## 5.2. Quy tắc Anti-repeat

```python
def select_question(user_id, session_type, taxonomy_filter):
    # Loại bỏ câu user đã gặp trong 30 ngày gần nhất
    seen_question_ids = get_user_history(user_id, days=30)
    candidates = filter_questions(
        session_type, taxonomy_filter,
        exclude=seen_question_ids
    )
    if len(candidates) < THRESHOLD:
        # Fallback sang LLM-generated với CV/JD context
        return generate_dynamic_question(user_cv, jd, taxonomy_filter)
    return random.choice(candidates)
```

## 5.3. Dynamic Composition Engine

Cho mỗi session, engine cần:

1. **Đọc input**: `session_type`, `target_role`, `target_level`, JD, CV, `duration`, `difficulty`, `emphasis` (cho Mixed)
2. **Tính số câu** theo Time & Count Matrix
3. **Phân bổ subcategory** theo coverage rule
4. **Sample câu hỏi** từ bank (70%) + LLM-generate (30%) với anti-repeat
5. **Sequence** theo Sequencing Logic của session type
6. **Inject metadata** (rubric, trigger config, time budget) vào mỗi câu

## 5.4. Validation Rules trước khi start session

Engine phải validate plan trước khi bắt đầu:

- ✅ Tổng thời gian dự kiến ≤ duration đã chọn (có buffer 10%)
- ✅ Coverage subcategory ≥ minimum required
- ✅ Difficulty distribution match target
- ✅ Không có câu hỏi duplicate trong queue
- ✅ Câu hỏi áp dụng được cho role + level đã chọn
- ❌ Nếu không validate được → fallback hoặc thông báo user

## 5.5. Lưu ý cho Localization

Khi sinh câu hỏi tiếng Việt:

- Đại từ: nhất quán "anh/chị – em" trong toàn session.
- Code-switch: cho phép thuật ngữ tech tiếng Anh (REST, Hash, microservice…) nhưng phần dẫn dắt tiếng Việt.
- Tránh idiom phức tạp gây khó hiểu cho user.

## 5.6. Tóm tắt nguyên tắc kiến trúc

3 session type này phải được implement như **3 pipeline riêng biệt** chứ không phải 1 pipeline với flag, vì:

- Logic sequencing rất khác (Mixed phức tạp hơn nhiều)
- Trigger set khác
- Rubric khác
- Persona phù hợp khác
- Anti-pattern khác (HR cấm Strict Senior, Technical cấm Friendly HR…)

Đầu tư đúng vào spec của 3 session type này sẽ tạo khác biệt rõ rệt với các competitor "one-size-fits-all".

---

*Tài liệu phiên bản 1.0 – Dùng cho thiết kế MVP của Interview AI Coach.*
*Tài liệu liên quan: Adaptive Follow-up Rules + Rubric Scoring Template (file riêng).*

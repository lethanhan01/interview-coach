# Interview AI Coach – Design Specification

**Tài liệu thiết kế:** Adaptive Follow-up Rules & Rubric Scoring Template  
**Phạm vi:** Hệ thống mô phỏng phỏng vấn cho sinh viên năm cuối / fresher CNTT tại Việt Nam  
**Phiên bản:** 1.0  

---

## Mục lục

- [Phần A. Adaptive Follow-up Rules](#phần-a-adaptive-follow-up-rules)
  - [A.1. Triết lý thiết kế](#a1-triết-lý-thiết-kế)
  - [A.2. Trigger Taxonomy](#a2-trigger-taxonomy)
  - [A.3. Chi tiết từng trigger](#a3-chi-tiết-từng-trigger)
  - [A.4. Anti-Trigger / Stopping Conditions](#a4-anti-trigger--stopping-conditions)
  - [A.5. Pseudocode / JSON Schema để triển khai](#a5-pseudocode--json-schema-để-triển-khai)
- [Phần B. Rubric Scoring Template](#phần-b-rubric-scoring-template)
  - [B.1. Nguyên tắc thiết kế rubric](#b1-nguyên-tắc-thiết-kế-rubric)
  - [B.2. Rubric cho Behavioral Question (BEI/STAR)](#b2-rubric-cho-behavioral-question-beistar)
  - [B.3. Rubric cho Technical Knowledge Question](#b3-rubric-cho-technical-knowledge-question)
  - [B.4. Rubric cho Coding Question](#b4-rubric-cho-coding-question)
  - [B.5. Rubric cho System Design Question](#b5-rubric-cho-system-design-question)
  - [B.6. Rubric Communication / Soft Skills](#b6-rubric-communication--soft-skills-cross-cutting)
  - [B.7. Aggregation – Tính điểm tổng và Recommendation](#b7-aggregation--tính-điểm-tổng-và-recommendation)
  - [B.8. JSON Schema mẫu cho lưu trữ score](#b8-json-schema-mẫu-cho-lưu-trữ-score)
- [Phụ lục: Lưu ý triển khai](#phụ-lục-lưu-ý-triển-khai)

---

# Phần A. Adaptive Follow-up Rules

## A.1. Triết lý thiết kế

Adaptive Follow-up không nên là "AI thấy thích thì hỏi thêm" mà phải dựa trên các **trigger có thể kiểm chứng** (deterministic triggers) kết hợp với **đánh giá ngữ nghĩa của LLM** (semantic evaluation). Mục tiêu: bắt chước kỹ thuật **probing** của interviewer chuyên nghiệp – đào sâu để verify, không hỏi cho có.

**Ba nguyên tắc cốt lõi:**

1. **Mỗi follow-up phải có lý do rõ ràng** (mappable tới một trigger cụ thể) → để giải thích được trong feedback cuối.
2. **Tối đa 2 follow-up/câu chính** → tránh sa lầy, ăn vào budget thời gian của câu khác.
3. **Follow-up không tạo điểm trừ trực tiếp** → user thấy follow-up là cơ hội bổ sung, không phải bị "soi mói".

## A.2. Trigger Taxonomy

Hệ thống sử dụng **8 trigger chính** (hard triggers) và **2 trigger phụ** (soft triggers, chỉ kích hoạt khi còn budget thời gian).

### Hard triggers

| Mã | Trigger | Áp dụng cho | Mức ưu tiên |
|---|---|---|---|
| T1 | STAR Component Missing | Behavioral | Cao |
| T2 | "We" Overuse / Personal Ownership Unclear | Behavioral | Cao |
| T3 | Unquantified / Unverifiable Claim | Behavioral, Technical | Trung |
| T4 | Vague / No Concrete Example | All | Cao |
| T5 | Surface-Level Technical Answer | Technical, Coding | Cao |
| T6 | Missing Trade-off / Alternative Awareness | Technical, System Design | Trung |
| T7 | No Reflection / Learning | Behavioral (failure/conflict Q) | Trung |
| T8 | CV/Earlier-Answer Inconsistency | All | Cao |

### Soft triggers

| Mã | Trigger | Áp dụng cho |
|---|---|---|
| S1 | Edge Case / Boundary Probing | Coding, System Design |
| S2 | "Why this approach over X?" | Technical, Coding |

## A.3. Chi tiết từng trigger

### T1 – STAR Component Missing

**Điều kiện kích hoạt** (cho câu behavioral):
- LLM evaluator phân tích câu trả lời theo 4 component STAR.
- Thiếu **bất kỳ** component nào với confidence ≥ 0.7 → trigger.
- Ưu tiên thiếu **Action** > **Result** > **Situation** > **Task**.

**Template follow-up** (chọn theo component thiếu):

```
Thiếu Situation:
  → "Em có thể mô tả thêm bối cảnh không – đó là dự án gì, 
     team bao nhiêu người, em làm trong giai đoạn nào?"

Thiếu Task:
  → "Trong tình huống đó, vai trò và mục tiêu cụ thể của em là gì?"

Thiếu Action:
  → "Em đã làm gì cụ thể để xử lý? Đi qua các bước em đã thực hiện 
     được không?"

Thiếu Result:
  → "Kết quả cuối cùng ra sao? Có cách nào em đo lường được tác động 
     của việc em làm không?"
```

**Ví dụ thực tế:**
- User trả lời: *"Em đã từng làm dự án nhóm và gặp khó khăn về deadline, em cố gắng động viên các bạn và cuối cùng cũng xong."*
- LLM phân tích: S=có (yếu), T=mơ hồ, A=mơ hồ ("động viên"), R=mơ hồ ("xong")
- Trigger: T1 với component thiếu = Action
- Follow-up: *"Cụ thể em đã 'động viên' bằng cách nào? Em có làm gì khác về mặt kế hoạch hay phân chia công việc không?"*

### T2 – "We" Overuse / Personal Ownership Unclear

**Điều kiện kích hoạt:**
- Đếm tỷ lệ pronoun: nếu "chúng em / cả nhóm / team" xuất hiện ≥ 3 lần và "em / tôi" < 2 lần → trigger.
- Hoặc LLM đánh giá: không thể xác định **đóng góp cá nhân riêng** của ứng viên với confidence ≥ 0.7.

**Template follow-up:**

```
"Em vừa kể nhiều về team – nhưng anh/chị muốn hiểu rõ hơn về phần 
của riêng em. Cụ thể em phụ trách hạng mục nào, và em là người 
trực tiếp làm gì?"
```

**Lưu ý:** Trigger này **không** kích hoạt nếu câu hỏi gốc là về teamwork ("Hãy kể về một lần em làm việc nhóm tốt") – vì lúc đó "we" là phù hợp. Hãy gắn cờ `question_type: collaborative` để skip.

### T3 – Unquantified / Unverifiable Claim

**Điều kiện kích hoạt:**
- Câu trả lời chứa các con số/claim mạnh (regex: `\d+%`, `tăng/giảm \d+`, "rất nhiều", "đa số") **nhưng** không có baseline / phương pháp đo / context.
- Hoặc claim quá lớn cho level fresher (ví dụ "tăng performance 300%", "tiết kiệm 5 tỷ" cho intern) → suspicious.

**Template follow-up:**

```
Có số liệu nhưng thiếu cách đo:
  → "Con số [X] đó em đo lường bằng cách nào? Trước khi cải thiện 
     thì baseline là bao nhiêu?"

Claim mơ hồ:
  → "Khi em nói 'rất nhiều / đa số', cụ thể là khoảng bao nhiêu? 
     Có ví dụ nào giúp anh/chị hình dung không?"

Claim quá lớn so với level:
  → "Đó là một cải tiến rất ấn tượng. Em có thể chia sẻ chi tiết 
     em đóng góp phần nào trong con số đó không?"
```

### T4 – Vague / No Concrete Example

**Điều kiện kích hoạt** (cho mọi loại câu trừ Y/N):
- Câu trả lời < 30 từ với câu hỏi yêu cầu mô tả/giải thích.
- Hoặc câu trả lời thuần "lý thuyết / triết lý" không có ví dụ cụ thể nào.
- Pattern detect: câu chỉ chứa các phát biểu khái quát ("Em luôn cố gắng…", "Theo em thì…") mà không có "ví dụ là…", "lần đó…", "trong dự án X…".

**Template follow-up:**

```
"Em vừa nói về [chủ đề] một cách khá tổng quát. Em có thể cho 
anh/chị một ví dụ cụ thể từ dự án hoặc trải nghiệm thực tế của 
em không?"
```

### T5 – Surface-Level Technical Answer

**Điều kiện kích hoạt** (technical questions):
- Câu trả lời **đúng nhưng nông** (LLM evaluator nhận diện: chứa keyword đúng nhưng không có cơ chế hoạt động / use case).
- Hoặc trả lời theo kiểu định nghĩa sách giáo khoa, không có trải nghiệm thực tế.

**Template follow-up có 3 hướng** (chọn theo context):

```
Hướng 1 – Đào cơ chế:
  → "Em vừa nhắc đến [khái niệm]. Em có thể giải thích thêm 
     cơ chế bên dưới hoạt động thế nào không?"

Hướng 2 – Đào ứng dụng thực tế:
  → "Trong dự án em đã làm, em có dịp dùng [khái niệm] này chưa? 
     Tình huống cụ thể là gì?"

Hướng 3 – Đào edge case:
  → "Khi nào em sẽ KHÔNG dùng [approach này]? Có trường hợp nào 
     nó không phù hợp không?"
```

**Ví dụ:**
- Q: *"REST API là gì?"*
- A: *"REST là một kiến trúc API dùng HTTP, có các phương thức GET POST PUT DELETE."*
- Đánh giá: đúng cơ bản nhưng nông → T5 trigger
- Follow-up: *"Em có thể giải thích nguyên tắc statelessness của REST không, và tại sao nó lại quan trọng?"*

### T6 – Missing Trade-off / Alternative Awareness

**Điều kiện kích hoạt:**
- Câu trả lời đưa ra một giải pháp/approach mà **không đề cập alternative hoặc trade-off**.
- Áp dụng cho câu kiểu "Em chọn công nghệ X, vì sao?" hoặc system design.

**Template follow-up:**

```
"Em đã chọn [X]. Em có cân nhắc các phương án khác không? 
Trade-off của [X] so với [Y] là gì?"

hoặc

"Đâu là điểm yếu / hạn chế của giải pháp em vừa đề xuất?"
```

### T7 – No Reflection / Learning

**Điều kiện kích hoạt:**
- Áp dụng cho câu hỏi về **failure / conflict / mistake**.
- Câu trả lời mô tả tình huống nhưng **thiếu phần "bài học"**.

**Template follow-up:**

```
"Sau trải nghiệm đó, em rút ra bài học gì? Nếu được làm lại, 
em sẽ làm khác đi như thế nào?"
```

### T8 – CV/Earlier-Answer Inconsistency

**Điều kiện kích hoạt** (cao cấp – cần state tracking):
- Câu trả lời mâu thuẫn với thông tin trên CV (ví dụ CV ghi 2 năm React, trả lời "em mới học React 3 tháng").
- Hoặc mâu thuẫn với câu trả lời trước đó trong session.

**Template follow-up** (nhẹ nhàng, không gây áp lực):

```
"Anh/chị thấy trên CV em có ghi [X], nhưng vừa rồi em nói 
[Y]. Em có thể giải thích thêm cho anh/chị hiểu rõ hơn không?"
```

### S1 – Edge Case Probing (Soft, cho coding)

**Điều kiện kích hoạt** sau khi user đưa ra solution coding:
- User chưa đề cập edge case (empty input, null, max size, negative number…).

**Template:**

```
"Solution của em chạy được với input thường. Nếu input là 
[empty array / null / 1 phần tử / số rất lớn], code có còn 
chạy đúng không?"
```

### S2 – Approach Justification

**Điều kiện kích hoạt:**
- User chọn một approach (ví dụ HashMap thay vì Array) mà không giải thích.

**Template:**

```
"Vì sao em chọn [data structure / algorithm này] mà không 
phải [alternative]? Phân tích complexity giúp anh/chị nhé?"
```

## A.4. Anti-Trigger / Stopping Conditions

Hệ thống **KHÔNG** kích hoạt follow-up khi:

1. **Đã follow up 2 lần** cho câu hỏi hiện tại.
2. **Câu trả lời đã đầy đủ** (đạt ≥ 80% rubric của câu đó).
3. **Còn < 20% thời gian session** – ưu tiên qua câu khác.
4. **User dùng "không biết / chưa từng làm"** một cách chân thật → không nên đào tiếp, nên ghi nhận và chuyển câu (không phạt thêm bằng follow-up).
5. **User đang stress** (phát hiện qua silence pattern, voice tremor, hoặc tự nói "em xin phép qua câu khác") → respect và move on.

## A.5. Pseudocode / JSON Schema để triển khai

### JSON Schema cho 1 rule

```json
{
  "follow_up_rule": {
    "trigger_id": "T1_STAR_MISSING",
    "applies_to_question_types": ["behavioral"],
    "preconditions": {
      "follow_up_count_for_current_q": "< 2",
      "remaining_time_pct": "> 20",
      "user_stress_detected": false
    },
    "evaluation": {
      "method": "llm_classifier",
      "prompt_template": "Phân tích câu trả lời sau theo STAR... Trả về JSON: {S: bool, T: bool, A: bool, R: bool, confidence: float}",
      "trigger_condition": "any_component_missing AND confidence >= 0.7"
    },
    "priority_order_when_multiple_missing": ["A", "R", "S", "T"],
    "follow_up_question_templates": {
      "A_missing": "Cụ thể em đã làm gì để giải quyết tình huống đó?",
      "R_missing": "Kết quả cuối cùng ra sao? Em đo lường được không?",
      "S_missing": "Em có thể mô tả thêm bối cảnh không?",
      "T_missing": "Vai trò cụ thể của em trong tình huống đó là gì?"
    },
    "max_invocations_per_session": 5
  }
}
```

### Pipeline xử lý sau khi user submit câu trả lời

```
1. parse_answer() → {text, audio_meta, time_taken}
2. evaluate_with_rubric() → {score_per_dimension, missing_aspects}
3. check_triggers_in_priority_order():
   for trigger in [T1, T2, T8, T4, T5, T3, T6, T7, S1, S2]:
       if trigger.preconditions_met() and trigger.evaluation_passed():
           generate_follow_up(trigger)
           push_to_queue_front()
           increment_follow_up_counter()
           return
4. if no trigger fired: pop next question from queue
```

---

# Phần B. Rubric Scoring Template

## B.1. Nguyên tắc thiết kế rubric

1. **Thang 4 điểm** (không phải 5) – buộc người chấm/AI có quan điểm rõ, không "trung lập an toàn":
   - **1 – Strong No** / Below expectation
   - **2 – No** / Needs improvement
   - **3 – Yes** / Meets expectation
   - **4 – Strong Yes** / Exceeds expectation

2. **Mỗi mức có behavioral anchor cụ thể** (mô tả hành vi/đặc điểm quan sát được) → AI và user đều hiểu giống nhau.

3. **Mỗi rubric có evidence requirement** – bắt buộc trích dẫn câu nói cụ thể của user làm bằng chứng.

4. **Multi-dimensional scoring** – không chấm 1 điểm tổng mà chấm theo nhiều dimension, sau đó tổng hợp có trọng số.

5. **Calibration với level mục tiêu** – cùng câu trả lời nhưng kỳ vọng cho Intern khác Junior 2y.

## B.2. Rubric cho Behavioral Question (BEI/STAR)

### 6 Dimension và trọng số

| Dimension | Trọng số (Fresher) | Trọng số (Junior) |
|---|---|---|
| D1. STAR Completeness | 20% | 15% |
| D2. Specificity & Detail | 15% | 15% |
| D3. Personal Ownership | 15% | 20% |
| D4. Self-awareness & Learning | 15% | 15% |
| D5. Communication Clarity | 15% | 15% |
| D6. Competency Demonstration | 20% | 20% |

### Behavioral Anchors

**D1 – STAR Completeness**

| Điểm | Anchor |
|---|---|
| 1 | Câu trả lời mơ hồ, không xác định được tình huống cụ thể; thiếu ≥ 3 component STAR |
| 2 | Có 2/4 component STAR rõ ràng; thiếu Action hoặc Result rõ rệt |
| 3 | Đủ 4 component STAR; có thể nông ở 1 phần nhưng đủ hiểu được |
| 4 | Đủ 4 component, mỗi phần đều rõ; Result có số liệu cụ thể |

**D2 – Specificity & Detail**

| Điểm | Anchor |
|---|---|
| 1 | Toàn câu chung chung ("em luôn cố gắng…", "thường thì em…") |
| 2 | Có 1 ví dụ nhưng vẫn nhiều phát biểu khái quát |
| 3 | Có ít nhất 1 ví dụ cụ thể (tên dự án, thời gian, người liên quan) |
| 4 | Nhiều chi tiết quan sát được (số liệu, tên công nghệ, thời gian, hậu quả cụ thể) |

**D3 – Personal Ownership**

| Điểm | Anchor |
|---|---|
| 1 | Nói toàn về team/người khác, không xác định được đóng góp cá nhân |
| 2 | Có "I/em" nhưng đóng góp cá nhân chưa rõ ranh giới với team |
| 3 | Phân biệt rõ "em làm gì" vs "team làm gì"; xác định được trách nhiệm cá nhân |
| 4 | Thể hiện rõ initiative, ra quyết định cá nhân, nhận trách nhiệm khi cần |

**D4 – Self-awareness & Learning**

| Điểm | Anchor |
|---|---|
| 1 | Không có phản tư; kể như tường thuật |
| 2 | Có nhắc đến bài học nhưng chung chung ("em học được nhiều thứ") |
| 3 | Nêu được bài học cụ thể từ trải nghiệm |
| 4 | Bài học có chiều sâu + cho thấy thay đổi hành vi/cách làm sau đó |

**D5 – Communication Clarity**

| Điểm | Anchor |
|---|---|
| 1 | Khó theo dõi; lan man, lặp ý, không có cấu trúc |
| 2 | Hiểu được nhưng cần đoán; cấu trúc lỏng |
| 3 | Trình bày có thứ tự, dễ theo dõi |
| 4 | Cấu trúc rõ (mở-thân-kết); ngắn gọn nhưng đủ ý; dùng signposting ("Đầu tiên… sau đó… cuối cùng…") |

**D6 – Competency Demonstration**

| Điểm | Anchor |
|---|---|
| 1 | Câu trả lời không thể hiện competency được test (ví dụ hỏi leadership nhưng kể về kỹ thuật) |
| 2 | Có chạm tới competency nhưng yếu |
| 3 | Demo được competency ở mức cơ bản phù hợp với level |
| 4 | Demo competency rõ ràng, có chiều sâu phù hợp hoặc vượt level |

### Cách tổng hợp điểm

```
score_per_question = Σ (dimension_score × weight)
score_normalized = score_per_question × 25  // chuyển về thang 100
```

**Ví dụ với fresher:** D1=3, D2=3, D3=2, D4=2, D5=3, D6=3 
→ (3×0.2 + 3×0.15 + 2×0.15 + 2×0.15 + 3×0.15 + 3×0.2) = 2.6 → 65/100

## B.3. Rubric cho Technical Knowledge Question

### 5 Dimension

| Dimension | Trọng số |
|---|---|
| TD1. Conceptual Accuracy | 30% |
| TD2. Depth of Understanding | 25% |
| TD3. Real-world Application | 20% |
| TD4. Trade-off Awareness | 15% |
| TD5. Technical Communication | 10% |

### Behavioral Anchors

**TD1 – Conceptual Accuracy**

| Điểm | Anchor |
|---|---|
| 1 | Trả lời sai khái niệm cốt lõi |
| 2 | Đúng một phần, có misconception ở chi tiết quan trọng |
| 3 | Đúng cơ bản, không có lỗi nghiêm trọng |
| 4 | Đúng và chính xác cả ở chi tiết khó |

**TD2 – Depth of Understanding**

| Điểm | Anchor |
|---|---|
| 1 | Chỉ nhắc tên/định nghĩa surface |
| 2 | Hiểu định nghĩa, mô tả được "what" nhưng không "how/why" |
| 3 | Giải thích được cơ chế hoạt động bên dưới |
| 4 | Đào tới lớp internal (ví dụ: không chỉ biết HashMap O(1) mà giải thích được hash collision, load factor, rehashing) |

**TD3 – Real-world Application**

| Điểm | Anchor |
|---|---|
| 1 | Không liên hệ được với thực tế |
| 2 | Liên hệ được nhưng chỉ ví dụ chung từ tài liệu |
| 3 | Có ví dụ từ dự án/khóa học của bản thân |
| 4 | Ví dụ cá nhân có context cụ thể + giải thích vì sao chọn cách đó trong tình huống đó |

**TD4 – Trade-off Awareness**

| Điểm | Anchor |
|---|---|
| 1 | Không nhận thức được có alternative |
| 2 | Biết có alternative nhưng không so sánh được |
| 3 | So sánh được pros/cons cơ bản |
| 4 | Phân tích trade-off nhiều chiều (performance vs readability vs cost vs scalability) |

**TD5 – Technical Communication**

| Điểm | Anchor |
|---|---|
| 1 | Lạm dụng buzzword không đúng chỗ; người nghe không hiểu |
| 2 | Dùng đúng thuật ngữ nhưng chưa giải thích được cho người ngoài ngành |
| 3 | Giải thích kỹ thuật rõ ràng, có cấu trúc |
| 4 | Có khả năng "translate" – giải thích cho cả người non-tech hiểu được |

## B.4. Rubric cho Coding Question

Đây là rubric **đa giai đoạn** – chấm cả quá trình, không chỉ kết quả cuối.

### 7 Dimension

| Dimension | Trọng số |
|---|---|
| CD1. Problem Understanding & Clarification | 10% |
| CD2. Approach & Algorithm Choice | 20% |
| CD3. Code Correctness | 25% |
| CD4. Code Quality & Readability | 15% |
| CD5. Complexity Analysis | 10% |
| CD6. Edge Case Handling | 10% |
| CD7. Communication While Coding | 10% |

### Behavioral Anchors

**CD1 – Problem Understanding & Clarification**

| Điểm | Anchor |
|---|---|
| 1 | Nhảy vào code ngay, hiểu sai đề |
| 2 | Hiểu đề nhưng không hỏi clarifying question |
| 3 | Hỏi 1–2 câu làm rõ (input range, format, có ràng buộc đặc biệt không) |
| 4 | Hỏi clarifying đầy đủ: input/output, edge cases, constraints, expected scale; tự nói lại đề bằng lời mình trước khi code |

**CD2 – Approach & Algorithm Choice**

| Điểm | Anchor |
|---|---|
| 1 | Approach sai hoặc brute force khi không cần thiết |
| 2 | Approach hoạt động được nhưng chưa tối ưu, không xét alternative |
| 3 | Approach hợp lý, có cân nhắc 1–2 alternative |
| 4 | Chọn data structure + algorithm tối ưu cho constraint; giải thích rõ vì sao không chọn alternative |

**CD3 – Code Correctness**

| Điểm | Anchor |
|---|---|
| 1 | Code không chạy / sai logic ở case cơ bản |
| 2 | Chạy đúng case cơ bản, sai 1+ edge case |
| 3 | Đúng case cơ bản và phần lớn edge case |
| 4 | Đúng tất cả case bao gồm edge case khó |

**CD4 – Code Quality & Readability**

| Điểm | Anchor |
|---|---|
| 1 | Tên biến tệ (a, b, x), không indent, code lộn xộn |
| 2 | Đọc được nhưng có code smell (duplicate, magic number) |
| 3 | Tên biến/hàm có ý nghĩa, cấu trúc rõ |
| 4 | Code clean, tách hàm hợp lý, có thể đọc như văn bản |

**CD5 – Complexity Analysis**

| Điểm | Anchor |
|---|---|
| 1 | Không phân tích / phân tích sai Big-O |
| 2 | Tính được time complexity nhưng chưa space, hoặc ngược lại |
| 3 | Tính đúng cả time và space |
| 4 | Phân tích chi tiết kèm best/worst/average case + cách cải thiện thêm |

**CD6 – Edge Case Handling**

| Điểm | Anchor |
|---|---|
| 1 | Không xét edge case |
| 2 | Xét được 1–2 edge case khi được nhắc |
| 3 | Tự liệt kê edge case (empty, null, single element, max size) trước hoặc sau khi code |
| 4 | Bao phủ edge case toàn diện + viết test case |

**CD7 – Communication While Coding**

| Điểm | Anchor |
|---|---|
| 1 | Code im lặng, không giải thích đang làm gì |
| 2 | Có nói nhưng rời rạc, khó theo dõi |
| 3 | Vừa code vừa giải thích bước đang làm |
| 4 | Think-aloud rõ ràng, sign-post chuyển bước, chủ động xác nhận khi gặp ambiguity |

## B.5. Rubric cho System Design Question

Phù hợp cho fresher level: ở mức nhỏ, ví dụ "Thiết kế URL shortener", "Thiết kế chat 1-1 đơn giản".

### 6 Dimension

| Dimension | Trọng số |
|---|---|
| SD1. Requirements Gathering | 20% |
| SD2. High-level Architecture | 20% |
| SD3. Data Model | 15% |
| SD4. API Design | 15% |
| SD5. Scalability & Bottleneck | 15% |
| SD6. Trade-off Discussion | 15% |

### Behavioral Anchors

**SD1 – Requirements Gathering**

| Điểm | Anchor |
|---|---|
| 1 | Không hỏi requirements, code/vẽ ngay |
| 2 | Hỏi 1–2 câu nhưng bỏ sót functional/non-functional requirements |
| 3 | Hỏi đủ functional requirements + một số non-functional (scale, latency) |
| 4 | Hỏi đầy đủ functional + non-functional + ràng buộc; ước lượng scale (DAU, QPS, storage) |

**SD2 – High-level Architecture**

| Điểm | Anchor |
|---|---|
| 1 | Không vẽ được kiến trúc / kiến trúc sai cơ bản |
| 2 | Vẽ được nhưng thiếu component quan trọng |
| 3 | Kiến trúc đủ component chính (client, LB, app, DB, cache) |
| 4 | Kiến trúc rõ ràng + giải thích flow request đầu cuối + có dự phòng |

**SD3 – Data Model**

| Điểm | Anchor |
|---|---|
| 1 | Không thiết kế data model / sai cơ bản |
| 2 | Có schema nhưng thiếu trường / quan hệ |
| 3 | Schema hợp lý, có index cơ bản |
| 4 | Schema tối ưu, có normalize/denormalize tùy use case, có index theo query pattern |

**SD4 – API Design**

| Điểm | Anchor |
|---|---|
| 1 | Không định nghĩa API / API không hợp lý |
| 2 | Có API nhưng thiếu input/output spec rõ ràng |
| 3 | API rõ ràng, RESTful hoặc GraphQL hợp lý |
| 4 | API design tối ưu: versioning, error handling, rate limiting, idempotency |

**SD5 – Scalability & Bottleneck**

| Điểm | Anchor |
|---|---|
| 1 | Không nhắc đến scalability |
| 2 | Có nhắc nhưng chung chung ("dùng cache là được") |
| 3 | Xác định được bottleneck cơ bản và đề xuất giải pháp (cache, sharding, replica) |
| 4 | Phân tích bottleneck đa chiều, đề xuất giải pháp có trade-off, ước lượng được capacity |

**SD6 – Trade-off Discussion**

| Điểm | Anchor |
|---|---|
| 1 | Không đề cập trade-off |
| 2 | Nhắc đến trade-off bề mặt |
| 3 | Phân tích được pros/cons của 2–3 lựa chọn |
| 4 | Trade-off đa chiều (consistency vs availability, cost vs performance, complexity vs flexibility) + lựa chọn có lý do |

## B.6. Rubric Communication / Soft Skills (Cross-cutting)

Đây là rubric chấm **toàn session**, không phải từng câu, dựa trên voice analytics + transcript.

| Dimension | Đo bằng | Thang chấm |
|---|---|---|
| CO1. Speech Pace | Words per minute (WPM) | Tối ưu 130–160 WPM, quá nhanh/chậm trừ điểm |
| CO2. Filler Words | Đếm "ờ", "ừm", "kiểu", "like", "you know" | < 2/phút = 4đ; 2–4 = 3đ; 4–7 = 2đ; > 7 = 1đ |
| CO3. Confidence (voice) | Pitch variance, voice tremor | Đánh giá bằng audio model |
| CO4. Listening | Có hỏi clarification? Có dừng để xác nhận? | Có/không |
| CO5. Structure | Dùng signposting, khung trả lời rõ | LLM đánh giá |

### Anchor cho CO1 – Speech Pace

| Điểm | WPM Range | Mô tả |
|---|---|---|
| 1 | < 90 hoặc > 200 | Quá chậm gây buồn ngủ / quá nhanh không nghe kịp |
| 2 | 90–110 hoặc 180–200 | Hơi chậm/nhanh, người nghe phải tập trung |
| 3 | 110–130 hoặc 160–180 | Pace ổn, có thể tinh chỉnh |
| 4 | 130–160 | Pace tối ưu cho phỏng vấn |

### Anchor cho CO3 – Confidence

| Điểm | Anchor |
|---|---|
| 1 | Voice run, pause dài giữa câu, lên giọng cuối câu khẳng định (uptalk) |
| 2 | Có moment thiếu tự tin nhưng phục hồi được |
| 3 | Giọng ổn định, có biến điệu phù hợp |
| 4 | Giọng tự tin, biến điệu tốt, dùng pause chiến lược để nhấn mạnh |

## B.7. Aggregation – Tính điểm tổng và Recommendation

### Công thức tính điểm tổng session

```
Behavioral_Avg = mean(score across all behavioral questions)
Technical_Avg = mean(score across all technical questions)
Coding_Avg = mean(score across all coding questions)
SystemDesign_Avg = mean(score across all SD questions)
Communication = score from CO rubric

Overall = w1×Behavioral + w2×Technical + w3×Coding + w4×SD + w5×Communication
```

### Trọng số tùy loại session

| Loại session | w1 (BEH) | w2 (TECH) | w3 (CODE) | w4 (SD) | w5 (COMM) |
|---|---|---|---|---|---|
| HR Session | 0.70 | – | – | – | 0.30 |
| Technical Session | – | 0.60 | 0.30 | – | 0.10 |
| Coding-only | – | – | 0.85 | – | 0.15 |
| System Design | – | 0.20 | – | 0.65 | 0.15 |
| Mixed Full Loop | 0.25 | 0.25 | 0.25 | 0.15 | 0.10 |

### Mapping điểm sang Recommendation

| Overall (1–4) | Label | Ý nghĩa |
|---|---|---|
| ≥ 3.5 | **Strong Hire (mô phỏng)** | Vượt kỳ vọng level mục tiêu, sẵn sàng phỏng vấn thật |
| 3.0–3.49 | **Hire (mô phỏng)** | Đạt level, có thể đi phỏng vấn nhưng nên luyện thêm điểm yếu |
| 2.5–2.99 | **Borderline** | Cần luyện thêm 2–3 session trước khi đi thật |
| 2.0–2.49 | **No Hire (mô phỏng)** | Cần ôn lại nền tảng + luyện cấu trúc trả lời |
| < 2.0 | **Strong No Hire (mô phỏng)** | Cần học lại từ căn bản |

> **Quan trọng:** Luôn kèm chú thích "(mô phỏng)" và giải thích đây là kết quả AI tại thời điểm test, không phải đánh giá năng lực tổng thể.

## B.8. JSON Schema mẫu cho lưu trữ score

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "session_type": "technical",
  "target_level": "fresher",
  "target_position": "Backend Developer",
  "started_at": "2026-05-08T09:00:00Z",
  "duration_minutes": 45,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "behavioral",
      "competency": "teamwork",
      "question_text": "Hãy kể về một lần em làm việc với đồng nghiệp khó tính",
      "user_answer": {
        "text": "...",
        "audio_url": "s3://...",
        "duration_sec": 95
      },
      "rubric_scores": {
        "D1_star_completeness": {
          "score": 3,
          "evidence": "User mentioned project Capstone, team of 4, role as backend lead...",
          "missing_aspects": ["quantified_result"]
        },
        "D2_specificity": {"score": 3, "evidence": "..."},
        "D3_personal_ownership": {"score": 2, "evidence": "Used 'we' 5 times, 'I' 1 time"},
        "D4_learning": {"score": 4, "evidence": "..."},
        "D5_clarity": {"score": 3, "evidence": "..."},
        "D6_competency": {"score": 3, "evidence": "..."}
      },
      "weighted_score": 2.85,
      "follow_ups_triggered": ["T2_we_overuse"],
      "surgical_feedback": "Câu trả lời của em có cấu trúc tốt nhưng dùng 'chúng em' quá nhiều..."
    }
  ],
  "communication_scores": {
    "speech_pace_wpm": 142,
    "filler_count_per_min": 3.2,
    "confidence_score": 3,
    "listening_score": 3,
    "structure_score": 3
  },
  "overall_score": 3.1,
  "recommendation": "HIRE_SIMULATED",
  "competency_heatmap": {
    "teamwork": 3.2,
    "problem_solving": 2.8,
    "technical_depth": 3.5,
    "communication": 3.1
  },
  "action_plan": [
    "Luyện 3 câu STAR về personal contribution (giảm 'we', tăng 'I')",
    "Ôn lại Big-O complexity – trượt 2/3 câu liên quan",
    "Thực hành nói chậm hơn 20% – pace hiện tại 175 WPM hơi nhanh"
  ]
}
```

---

# Phụ lục: Lưu ý triển khai

## 1. Tách bạch Evaluator LLM khỏi Interviewer LLM

Một LLM đóng vai phỏng vấn (interviewer agent), một LLM khác chấm điểm độc lập (evaluator agent). Tránh "self-grading bias" khi cùng 1 model vừa hỏi vừa chấm – model thường có xu hướng đánh giá cao câu trả lời theo flow nó đã dẫn dắt.

**Đề xuất kiến trúc:**

```
[User Answer] 
    ↓
[Interviewer Agent] → quyết định follow-up hoặc next question
    ↓
[Evaluator Agent (độc lập)] → chấm điểm theo rubric
    ↓
[Aggregator] → tổng hợp điểm session
```

## 2. Calibrate rubric với dữ liệu thật

Nếu có thể, thu thập 50–100 câu trả lời mẫu (từ mock với mentor thật) → để mentor chấm tay → so với điểm AI chấm → fine-tune prompt cho khớp. Đây gọi là **rubric calibration** và là khâu quan trọng nhất để hệ thống "công bằng".

**Quy trình calibration:**

1. Thu thập sample answers (đa dạng level, đa dạng quality).
2. Mời 2–3 senior engineer/HR chấm độc lập theo rubric → lấy điểm trung bình làm "ground truth".
3. Cho AI chấm cùng sample → tính độ lệch (MAE).
4. Nếu MAE > 0.5 (trên thang 4) → tinh chỉnh prompt evaluator.
5. Lặp lại cho đến khi MAE < 0.3 và hệ số tương quan Pearson > 0.7.

## 3. Cho user appeal điểm

Cho phép user phản hồi "tôi nghĩ câu này tôi đáng cao hơn" – ghi lại làm dữ liệu cải tiến rubric/prompt. Có thể dùng cấu trúc:

```json
{
  "appeal": {
    "question_id": "q1",
    "dimension": "D3_personal_ownership",
    "user_claimed_score": 3,
    "ai_given_score": 2,
    "user_reasoning": "Em nghĩ em đã nói rõ phần em làm là...",
    "status": "pending_review"
  }
}
```

Định kỳ review batch các appeal để cải thiện prompt evaluator.

## 4. Privacy & Security

- CV và transcript phỏng vấn chứa PII → cần mã hóa at-rest và in-transit.
- Audio recording nên có TTL (ví dụ tự xóa sau 30 ngày trừ khi user opt-in lưu lâu hơn).
- Cho phép user xóa toàn bộ dữ liệu (GDPR-compliant ngay cả khi VN chưa bắt buộc – tốt cho brand).

## 5. Logging & Observability

Log mọi LLM call (prompt + response + token count + latency) để:
- Debug khi user complaint.
- Theo dõi cost.
- Phát hiện prompt injection / abuse.
- Cải thiện prompt qua thời gian.

## 6. Metric thành công của hệ thống

| Metric | Target | Đo bằng |
|---|---|---|
| Rubric MAE so với mentor thật | < 0.3/4 | Định kỳ benchmark |
| User retention sau session 1 | > 40% quay lại session 2 | Analytics |
| Improvement rate | Điểm trung bình tăng ≥ 0.3 sau 3 session | Track per user |
| Net Promoter Score | > 30 | Survey |
| Appeal rate | < 10% câu hỏi bị appeal | Track hệ thống |

---

**Tài liệu này phiên bản 1.0 – sẽ được iterate khi MVP đi vào hoạt động và có dữ liệu thực tế.**

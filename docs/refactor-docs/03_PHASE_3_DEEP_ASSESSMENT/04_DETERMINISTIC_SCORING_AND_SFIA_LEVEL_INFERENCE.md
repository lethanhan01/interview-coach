# TASK 3.4: TÍNH ĐIỂM TẤT ĐỊNH & SUY LUẬN CẤP ĐỘ NĂNG LỰC SFIA 9

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Scoring Algorithm & Competency Science)  
> **Áp dụng cho**: `server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts`  
> **Tài liệu cha**: [00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 1.0.0  

---

## 1. NGUYÊN TẮC THIẾT KẾ: TẠI SAO PHẢI TÍNH ĐIỂM TẤT ĐỊNH 100%?

Trong các hệ thống đánh giá phỏng vấn truyền thống, việc yêu cầu LLM "cho một con số điểm từ 0 đến 100" gây ra các vấn đề nghiêm trọng:
1. **Lạm phát Điểm số (Grade Inflation)**: LLM có xu hướng "dĩ hòa vi quý", thường cho điểm từ $70 - 85$ kể cả khi câu trả lời thiếu sót nhiều kiến thức.
2. **Tính Ngẫu nhiên (Stochastic Inconsistency)**: Cùng một câu trả lời, nếu submit 2 lần với LLM có thể cho ra 65 điểm rồi 82 điểm, vi phạm tiêu chuẩn công bằng học thuật và tuyển dụng.

**Giải pháp của InterviewAI**:
* AI chỉ đóng vai trò **Trọng tài Thẩm định Bằng chứng** (chỉ trả lời Đúng/Sai nhị phân `passed: true | false` cho từng tiêu chí).
* **NestJS [`ScoringEngineService`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts)** chịu trách nhiệm độc quyền tính toán toàn bộ điểm số, tỷ lệ đạt và cấp bậc SFIA thông qua **công thức toán học tất định 100%**.

---

## 2. CÔNG THỨC TÍNH ĐIỂM CÂU HỎI (`questionScore`)

Mỗi câu hỏi có danh sách tiêu chí $C = \{c_1, c_2, \dots, c_n\}$, mỗi tiêu chí có trọng số $w_i \ge 0$ và trạng thái đạt $p_i \in \{0, 1\}$:

$$\text{CriteriaPassRate} = \frac{\sum_{i=1}^n (w_i \times p_i)}{\sum_{i=1}^n w_i} \times 100$$

$$\text{QuestionScore} = \min\left(100, \max\left(0, \text{round}(\text{CriteriaPassRate})\right)\right)$$

Đồng thời, hệ thống phân tách thành 2 chỉ số tỷ lệ đạt độc lập:
* **`corePassRate`**: Tỷ lệ đạt của các tiêu chí cốt lõi (thuộc chiều `dimension = 'core'`).
* **`seniorityPassRate`**: Tỷ lệ đạt của các tiêu chí kinh nghiệm chuyên sâu (thuộc chiều `dimension = 'seniority'`).

---

## 3. THUẬT TOÁN SUY LUẬN CẤP ĐỘ THỰC TẾ (`inferDemonstratedLevel`)

Cấp độ SFIA 9 được đo lường từ Level 1 đến Level 7. Thuật toán suy luận cấp độ thực tế thể hiện (`demonstratedLevel`) dựa trên mức độ hoàn thành hai chiều năng lực:

```mermaid
graph TD
    Start["Bắt đầu: Target Level (Ví dụ: Level 4)"] --> CheckCore{"Core Pass Rate >= 0.5?"}
    
    CheckCore -->|"Không đạt (< 0.5)"| Drop2["Hạ 2 Cấp độ<br/>demonstratedLevel = targetLevel - 2"]
    CheckCore -->|"Đạt (>= 0.5)"| CheckSeniority{"Seniority Pass Rate >= 0.5?"}
    
    CheckSeniority -->|"Không đạt (< 0.5)"| Drop1["Hạ 1 Cấp độ<br/>demonstratedLevel = targetLevel - 1"]
    CheckSeniority -->|"Đạt (>= 0.5)"| Keep["Giữ nguyên Cấp độ<br/>demonstratedLevel = targetLevel"]
    
    Drop2 --> Clamp["Chặn Biên: [1, targetLevel]"]
    Drop1 --> Clamp
    Keep --> Clamp
    Clamp --> EndLevel["Kết quả: demonstratedLevel (SmallInt: 1 - 7)"]
```

```typescript
inferDemonstratedLevel(
  targetLevel: number,
  corePassRate: number,
  seniorityPassRate: number,
): number {
  const safeTargetLevel = Math.max(1, Math.min(7, Math.round(targetLevel || 3)));

  let rawLevel: number;
  if (corePassRate < 0.5) {
    // Trượt kiến thức cốt lõi -> tụt 2 cấp
    rawLevel = safeTargetLevel - 2;
  } else if (seniorityPassRate < 0.5) {
    // Đạt cốt lõi nhưng thiếu chiều sâu kinh nghiệm -> tụt 1 cấp
    rawLevel = safeTargetLevel - 1;
  } else {
    // Đạt cả 2 chiều chuẩn mực
    rawLevel = safeTargetLevel;
  }

  // Luôn chặn trong khoảng an toàn [1, targetLevel]
  return Math.min(safeTargetLevel, Math.max(1, rawLevel));
}
```

---

## 4. TỔNG HỢP ĐIỂM KỸ NĂNG PHIÊN (`session_skills`)

Sau mỗi lượt trả lời được đánh giá, `ScoringEngineService.aggregateSessionSkillScores(sessionId, tx)` tự động quét toàn bộ các câu hỏi đã trả lời thuộc về từng kỹ năng (`session_skill_id`):

$$\text{SkillScore} = \text{round}\left(\frac{\sum (\text{QuestionScore}_j \times \text{weight}_j)}{\sum \text{weight}_j}\right)$$

$$\text{ActualLevel} = \text{round}\left(\text{Median}(\text{demonstratedLevel}_1, \dots, \text{demonstratedLevel}_m)\right)$$

Dữ liệu được cập nhật trực tiếp vào bảng [`session_skills`](file:///c:/Users/An/Documents/GR1/InterviewCoach/server/prisma/schema.prisma#L268-L289) bên trong cùng một `prisma.$transaction`.

---

## 5. XỬ LÝ CÂU HỎI BỎ QUA (SKIPPED QUESTIONS)

Nếu ứng viên chọn "Bỏ qua câu hỏi" (`skipQuestion = true`) hoặc hết thời gian trả lời:
* Tự động gán `passed = false` cho $100\%$ các tiêu chí của câu hỏi đó.
* Điểm câu hỏi: `questionScore = 0`.
* Cấp độ thể hiện: `demonstratedLevel = 1`.
* Ghi nhận đầy đủ vào mẫu số đánh giá để phản ánh đúng năng lực tổng thể của toàn buổi phỏng vấn.

---

## 6. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Tính Tất định Tuyệt đối (100% Deterministic)**: Cùng một danh sách `criteriaEvaluations`, chạy hàm `calculateQuestionScore` 1.000 lần phải trả về kết quả giống nhau từng chữ số thập phân.
2. **Không Vượt Quá Cấp độ Mục tiêu**: `demonstratedLevel` không bao giờ lớn hơn `targetLevel` và không bao giờ nhỏ hơn `1`.
3. **Tính Toàn vẹn Transaction**: Cập nhật điểm `ai_feedbacks` và tổng hợp `session_skills` luôn nằm trong cùng một transaction database.

---

## 7. TASK EXECUTION CONTRACT

### 7.1 Prerequisites (Tiền đề bắt buộc)
- [ ] Hoàn thành **Task 3.3**: Kết quả Pass 1, Fact-Checking và Pass 2 từ Python AI Service đã sẵn sàng.
- [ ] Bảng `ai_feedbacks` và `session_skills` trong PostgreSQL đã có sẵn qua Prisma schema.

### 7.2 Target Deliverables (Sản phẩm mã nguồn đầu ra)
- [ ] `server/src/modules/interview-assessment/evaluation/scoring-engine.service.ts`: Triển khai các phương thức tính toán toán học:
  * `calculateQuestionScore(criteriaEvaluations, factCheckResult)`
  * `inferDemonstratedLevel(targetLevel, starRatio, coreRatio, seniorityRatio)`
  * `aggregateSessionSkillScores(sessionId, tx)`
- [ ] `server/src/modules/interview-assessment/evaluation/scoring-engine.service.spec.ts`: Bộ unit test xác minh tính tất định và biên giá trị.

### 7.3 Architectural Rules Enforced (Tuân thủ AGENTS.md)
- [x] **Backend Rule 1**: Logic tính điểm được đóng gói trong domain service, export qua `AssessmentFacade`.
- [x] **Backend Rule 3**: Ném ngoại lệ chuẩn `InterviewAIException(ErrorCode.SCORING_CALCULATION_FAILED, ...)`.
- [x] **Backend Rule 5**: Deterministic Scoring Invariant; toàn bộ việc ghi nhận điểm vào `session_skills` chạy trong `prisma.$transaction`.

### 7.4 Verification Command (Lệnh kiểm thử & Xác thực tự động)
```bash
# Tier 1 (NestJS Scoring Engine Deterministic Unit Test)
cd server && npm run test -- src/modules/interview-assessment/evaluation/scoring-engine.service.spec.ts
```

### 7.5 Definition of Done (DoD)
- [ ] Chạy hàm `calculateQuestionScore` 1.000 lần với cùng một input cho ra kết quả trùng khớp 100% (Zero Randomness).
- [ ] Giá trị `demonstratedLevel` không bao giờ vượt quá `targetLevel` và không bao giờ nhỏ hơn 1.
- [ ] Trường hợp thí sinh bỏ qua câu hỏi (`skipQuestion = true`), tự động gán `questionScore = 0` và `demonstratedLevel = 1` an toàn.
- [ ] Tất cả các phép cập nhật điểm nhiều bảng đều nhận đối tượng transaction `tx: Prisma.TransactionClient`.

### 7.6 Next Task Transition (Bước chuyển tiếp)
- Tiếp tục sang **Task 3.5: BullMQ Outbox Orchestration & NestJS Worker**: [05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md](05_BULLMQ_OUTBOX_ORCHESTRATION_AND_NESTJS_WORKER.md) để điều phối tác vụ nền và tích hợp lưu trữ database.


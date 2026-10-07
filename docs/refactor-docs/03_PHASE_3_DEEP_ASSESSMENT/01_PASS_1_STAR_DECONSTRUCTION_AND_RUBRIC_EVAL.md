# TASK 3.1: PASS 1 — BÓC TÁCH CẤU TRÚC STAR & THẨM ĐỊNH TIÊU CHÍ RUBRIC

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (AI Prompt Engineering & NLP Deconstruction)  
> **Áp dụng cho**: `ai-service/app/services/assessment/pass1_extractor.py`  
> **Tài liệu cha**: [00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 1.0.0  

---

## 1. MỤC TIÊU & NHIỆM VỤ CỦA PASS 1

Pass 1 là chặng **Bóc tách & Thẩm định Bằng chứng (Extraction & Evidence Verification)**, thực hiện trong $< 4.5\text{ giây}$:
1. **Phân tích Cấu trúc STAR**: Bóc tách câu trả lời của ứng viên thành 4 thành phần định lượng: **Situation (Bối cảnh)**, **Task (Nhiệm vụ)**, **Action (Hành động cụ thể)**, và **Result (Kết quả định lượng)**.
2. **Thẩm định Tiêu chí Nhị phân (Binary Rubric Evaluation)**: Đối chiếu câu trả lời với danh sách các tiêu chí trong câu hỏi (`rubricCriteria` thuộc 2 chiều: `core` và `seniority`):
   * Đưa ra phán quyết nhị phân: `passed: true` hoặc `false`.
   * **Bắt buộc trích dẫn bằng chứng (`evidence`)**: Trích nguyên văn một câu hoặc mệnh đề trong câu trả lời làm bằng chứng xác thực.
   * **Chỉ rõ lý do nếu không đạt (`deductionReason`)**: Nêu rõ khía cạnh kỹ thuật còn thiếu để ứng viên hiểu lý do bị đánh trượt tiêu chí.

---

## 2. SYSTEM PROMPT CHUẨN HÓA CHO PASS 1

```markdown
Bạn là Chuyên gia Khảo sát Năng lực Kỹ thuật Cấp cao (Lead Technical Assessor).
Nhiệm vụ của bạn là bóc tách cấu trúc câu trả lời của ứng viên và thẩm định tính thỏa mãn của từng tiêu chí đánh giá với sự khách quan và chính xác tuyệt đối.

### QUY TẮC BÓC TÁCH STAR:
1. Situation: Ứng viên có nêu rõ bài toán kinh doanh, quy mô hệ thống, hoặc bối cảnh dự án không?
2. Task: Mục tiêu kỹ thuật cụ thể mà ứng viên được giao giải quyết là gì?
3. Action: Ứng viên ĐÃ LÀM GÌ CỤ THỂ? (Phân biệt rõ ràng giữa "tôi làm" và "chúng tôi/team làm").
4. Result: Có số liệu đo lường cụ thể về hiệu năng, chi phí, hoặc độ tin cậy không (ví dụ: giảm 30% latency, tiết kiệm 40% RAM)?

### QUY TẮC THẨM ĐỊNH TIÊU CHÍ NHỊ PHÂN:
Với mỗi tiêu chí trong `rubric_criteria`:
- Chỉ đánh dấu `passed = true` khi câu trả lời có BẰNG CHỨNG XÁC THỰC thể hiện rõ ràng hành động hoặc kiến thức tương ứng.
- Tuyệt đối không suy đoán hoặc châm chước nếu ứng viên chỉ nói chung chung hoặc bỏ qua tiêu chí.
- Luôn trích dẫn nguyên văn câu nói của ứng viên vào trường `evidence`. Nếu không đạt, gán `evidence = ""` và giải thích rõ tại `deduction_reason`.
```

---

## 3. PYDANTIC CONTRACT CHO PASS 1 (`ai-service/app/schemas/pass1.py`)

```python
from typing import List, Optional, Literal
from pydantic import Field
from app.schemas.base import CamelModel

class STARComponent(CamelModel):
    score: int = Field(ge=0, le=100, description="Điểm đánh giá từng phần STAR (0-100)")
    summary: str = Field(description="Tóm tắt ngắn gọn nội dung ứng viên đã trình bày ở phần này")
    hasConcreteEvidence: bool = Field(description="Có dữ liệu/hành động cụ thể hay chỉ nói chung chung")

class STARAnalysisResult(CamelModel):
    situation: STARComponent
    task: STARComponent
    action: STARComponent
    result: STARComponent
    starCompletenessRatio: float = Field(ge=0.0, le=1.0, description="Tỷ lệ hoàn thiện STAR")
    executiveSummary: str

class EvaluatedCriterionItem(CamelModel):
    criteriaId: str
    dimension: Literal["core", "seniority"]
    passed: bool
    evidence: str = Field(description="Trích dẫn nguyên văn từ câu trả lời")
    deductionReason: Optional[str] = Field(None, description="Lý do không đạt tiêu chí")

class Pass1ExtractionResponse(CamelModel):
    starAnalysis: STARAnalysisResult
    criteriaEvaluations: List[EvaluatedCriterionItem]
```

---

## 4. XỬ LÝ NGOẠI LỆ & TRƯỜNG HỢP BIÊN (EDGE CASES)

| Trường hợp Biên | Hành vi Xử lý | Đầu ra Chuẩn |
| :--- | :--- | :--- |
| **Ứng viên nộp bài rỗng hoặc < 15 từ** | Short-circuit ngay lập tức, không gọi LLM để tiết kiệm chi phí token. | `passed = false` cho 100% tiêu chí, `starCompletenessRatio = 0.0`. |
| **Ứng viên nói lạc đề hoàn toàn** | Pass 1 nhận diện không có nội dung nào khớp với tiêu chí kỹ thuật. | `passed = false` cho toàn bộ tiêu chí, `deductionReason = "Câu trả lời lạc đề, không đề cập đến công nghệ được hỏi."` |
| **Ứng viên chỉ nói lý thuyết suông (không có STAR)** | Situation & Task có điểm, nhưng Action & Result = 0. | `starCompletenessRatio < 0.4`, cảnh báo thiếu kinh nghiệm thực chiến. |

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Độ chính xác Trích dẫn (Evidence Fidelity)**: $100\%$ chuỗi trong `evidence` phải tồn tại chính xác trong `answerText` gốc của ứng viên.
2. **Tuân thủ Tiêu chí Nhị phân**: Không có trường hợp nào trả về giá trị null cho trường `passed`.
3. **Thời gian Thực thi**: P95 Latency của Pass 1 $< 4.5\text{ giây}$.

---

## 6. TASK EXECUTION CONTRACT

### 6.1 Prerequisites (Tiền đề bắt buộc)
- [ ] Hoàn thành toàn bộ **Phase 2** (Quality Gate 2 Approved).
- [ ] LLM client (OpenAI hoặc local vLLM adapter) được cấu hình trong `ai-service/app/core/llm.py`.
- [ ] Pydantic v2 `CamelModel` cơ sở đã sẵn sàng tại `ai-service/app/schemas/base.py`.

### 6.2 Target Deliverables (Sản phẩm mã nguồn đầu ra)
- [ ] `ai-service/app/services/assessment/pass1_extractor.py`: Lớp `Pass1ExtractorService` bóc tách 4 thành phần STAR và đánh giá nhị phân rubric.
- [ ] `ai-service/app/schemas/assessment.py`: Pydantic Models `Pass1ExtractionResponse`, `STARAnalysisResult`, `EvaluatedCriterionItem` (kế thừa `CamelModel`).
- [ ] `ai-service/app/prompts/assessment_pass1.py`: System prompt bóc tách cấu trúc và rubric evaluation.
- [ ] `ai-service/app/api/v1/assessment.py`: Endpoint nội bộ `POST /api/v1/assessment/pass1`.

### 6.3 Architectural Rules Enforced (Tuân thủ AGENTS.md)
- [x] **Backend Rule 5**: AI Isolation; prompt và response schema được kiểm thực chặt chẽ qua Pydantic structured output.
- [x] **Zero Schema Drift**: 100% thuộc tính trả về định dạng `camelCase` (`starCompletenessRatio`, `hasConcreteEvidence`, `deductionReason`).

### 6.4 Verification Command (Lệnh kiểm thử & Xác thực tự động)
```bash
# Tier 1 (Unit & Mocked LLM Extraction Test)
cd ai-service && uv run pytest tests/unit/test_pass1_extractor.py -v

# Tier 2 (Live LLM Pass 1 Extraction Verification)
curl -X POST -H "x-internal-secret: interviewai-super-secret-dev-key-change-in-prod" \
  -H "Content-Type: application/json" \
  -d '{"question":"Kể về sự cố hệ thống bạn từng xử lý","answerText":"Trong dự án trước, hệ thống Kafka bị tắc do lag partition. Tôi đã tăng partition từ 4 lên 12 và cấu hình lại consumer group, giúp giảm độ trễ về dưới 50ms."}' \
  http://localhost:8000/api/v1/assessment/pass1
```

### 6.5 Definition of Done (DoD)
- [ ] 100% trích dẫn `evidence` của tiêu chí đạt phải tồn tại chính xác trong câu trả lời gốc của ứng viên.
- [ ] Không có trường hợp nào `passed` bị null.
- [ ] P95 Latency của Pass 1 $< 4.5\text{s}$.
- [ ] Short-circuit: Câu trả lời rỗng hoặc $< 15$ từ trả về ngay kết quả trượt mà không tốn chi phí gọi LLM.

### 6.6 Next Task Transition (Bước chuyển tiếp)
- Tiếp tục sang **Task 3.2: Technical Fact-Checking & Buzzwords Detection**: [02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md](02_TECHNICAL_FACT_CHECKING_AND_BUZZWORD_DETECTION.md) để kiểm chứng tính đúng đắn kỹ thuật.


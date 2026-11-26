# TASK 3.1: SINGLE-PASS STRUCTURED ASSESSMENT ENDPOINT & EVIDENCE CITATION
# (ĐÁNH GIÁ CÂU TRẢ LỜI MỘT LƯỢT: BÓC TÁCH STAR, THẨM ĐỊNH TIÊU CHÍ, SINH CÂU TRẢ LỜI MẪU & HIGHLIGHT)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Deep Technical Specification (AI Prompt Engineering, Pydantic Schema & Structured Output)  
> **Áp dụng cho**: `ai-service/app/services/assessment/`, `ai-service/app/schemas/assessment.py`  
> **Tài liệu cha**: [00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Gom toàn bộ đánh giá vào 1 lượt gọi LLM duy nhất, cắt giảm 50% độ trễ và chi phí token)  

---

## 1. NGUYÊN TẮC THIẾT KẾ: TẠI SAO PHẢI LÀ SINGLE-PASS?

Trong bản thảo thiết kế ban đầu, việc chia thành 2 lượt gọi LLM độc lập (Pass 1 bóc tách STAR $\to$ Pass 2 tổng hợp nhận xét và highlight) tạo ra 3 điểm nghẽn lớn:
1. **Độ trễ nhân đôi**: Mỗi lượt gọi LLM tốn từ $3.5\text{s} - 5.0\text{s}$. Tách 2 pass khiến tổng thời gian chờ của ứng viên lên tới $8 - 12\text{ giây}$.
2. **Lãng phí chi phí Token**: Phải gửi lại toàn bộ Job Description, câu hỏi, và câu trả lời của ứng viên trong cả 2 lượt gọi.
3. **Mất liên kết ngữ cảnh (Context Fragmentation)**: Lượt 2 tổng hợp nhận xét mà không thấy trực tiếp quá trình đối chiếu tiêu chí của lượt 1.

**Giải pháp Single-Pass Chuẩn mực**:
* Gom toàn bộ 4 nhiệm vụ:
  1. Thẩm định tiêu chí nhị phân (`passed: true | false`) kèm trích dẫn nguyên văn bằng chứng (`evidence`).
  2. Bóc tách tóm tắt cấu trúc STAR (Situation, Task, Action, Result).
  3. Chỉ ra điểm mạnh (`strengths`) và điểm cần cải thiện (`improvements`).
  4. Sinh câu trả lời mẫu hoàn hảo (`modelAnswer`) và phân đoạn đánh dấu văn bản (`annotatedSegments`).
* Vào **đúng một lượt gọi LLM** sử dụng tính năng **Structured Output (JSON Schema / Pydantic v2)**.
* Thời gian xử lý giảm xuống $< 4.5\text{ giây}$.

---

## 2. PYDANTIC V2 CONTRACT SCHEMA (`ai-service/app/schemas/assessment.py`)

```python
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class CriterionEvaluation(BaseModel):
    criteriaId: str = Field(description="ID của tiêu chí (ví dụ: crit_core, crit_seniority)")
    passed: bool = Field(description="Đạt (true) hoặc Không đạt (false)")
    evidence: str = Field(description="Trích dẫn nguyên văn câu/mệnh đề từ transcript chứng minh đạt")
    deductionReason: Optional[str] = Field(default=None, description="Lý do trừ điểm nếu không đạt tiêu chí")

class AnnotatedSegment(BaseModel):
    segmentText: str = Field(description="Đoạn văn bản trích dẫn nguyên văn từ câu trả lời của ứng viên")
    startIndex: int = Field(description="Chỉ số ký tự bắt đầu (0-based offset)")
    endIndex: int = Field(description="Chỉ số ký tự kết thúc")
    highlightLevel: Literal["positive", "warning", "critical_gap", "neutral"]
    annotation: str = Field(description="Lời giải thích nhận xét lý do highlight đoạn này")
    suggestion: Optional[str] = Field(default=None, description="Gợi ý cách diễn đạt tốt hơn")
    improvedVersion: Optional[str] = Field(default=None, description="Câu viết lại hoàn chỉnh")

class SinglePassEvaluationResponse(BaseModel):
    criteriaEvaluations: List[CriterionEvaluation] = Field(description="Kết quả thẩm định từng tiêu chí")
    starSummary: Optional[str] = Field(default=None, description="Tóm tắt ngắn gọn cấu trúc STAR của câu trả lời")
    strengths: List[str] = Field(description="Các điểm mạnh cụ thể thể hiện trong câu trả lời")
    improvements: List[str] = Field(description="Các điểm cần cải thiện để nâng cao năng lực")
    modelAnswer: str = Field(description="Câu trả lời mẫu chuẩn mực theo đúng vai trò và cấp bậc")
    keyTakeaway: str = Field(description="Thông điệp cốt lõi hoặc bài học then chốt rút ra sau câu hỏi")
    annotatedSegments: List[AnnotatedSegment] = Field(default_factory=list, description="Danh sách phân đoạn đánh dấu văn bản")
```

---

## 3. SYSTEM PROMPT CHUẨN HÓA CHO SINGLE-PASS EVALUATION

```markdown
Bạn là Chuyên gia Đánh giá Năng lực Phỏng vấn Kỹ thuật Cấp cao (Lead Technical Assessor).
Nhiệm vụ của bạn là thẩm định câu trả lời của ứng viên dựa trên các tiêu chí rubric được cung cấp, đồng thời đưa ra nhận xét hành động và câu trả lời mẫu chuẩn mực.

### NGUYÊN TẮC THẨM ĐỊNH TIÊU CHÍ (STRICT BINARY VERDICT):
1. Với mỗi tiêu chí trong `rubricCriteria`:
   - Chỉ đánh dấu `passed = true` khi câu trả lời có BẰNG CHỨNG XÁC THỰC thể hiện rõ ràng hành động, quyết định hoặc kiến thức kỹ thuật tương ứng.
   - Luôn trích dẫn nguyên văn câu nói của ứng viên vào trường `evidence`.
   - Nếu không đạt, gán `passed = false`, `evidence = ""` và nêu rõ lý do thiếu sót tại `deductionReason`.

### NGUYÊN TẮC HIGHLIGHT PHÂN ĐOẠN (ANNOTATED SEGMENTS):
2. Trường `segmentText` BẮT BUỘC phải là chuỗi ký tự copy nguyên văn 100% từ câu trả lời của ứng viên.
   - `startIndex` và `endIndex` phải khớp chính xác vị trí ký tự trong transcript.
   - Gán `highlightLevel`:
     * `positive`: Điểm sáng, thể hiện tư duy tốt.
     * `warning`: Diễn đạt mơ hồ, thiếu số liệu định lượng.
     * `critical_gap`: Sai kiến thức kỹ thuật hoặc đi ngược best practices.

### NGUYÊN TẮC CÂU TRẢ LỜI MẪU (MODEL ANSWER):
3. `modelAnswer` phải là câu trả lời mẫu hoàn chỉnh (3-4 câu ngắn gọn, súc tích) viết theo đúng vai trò và cấp bậc như thể một ứng viên xuất sắc đang trực tiếp trả lời phỏng vấn.
```

---

## 4. ENDPOINT FASTAPI ROUTER (`ai-service/app/routers/assessment.py`)

```python
from fastapi import APIRouter, Depends, Header, HTTPException, status
from app.schemas.assessment import AssessmentRequest, SinglePassEvaluationResponse
from app.services.assessment.assessment_service import SinglePassAssessmentService
from app.core.config import get_settings

router = APIRouter(prefix="/api/v1/assessment", tags=["Assessment"])

@router.post("/evaluate", response_model=SinglePassEvaluationResponse)
async def evaluate_answer(
    payload: AssessmentRequest,
    x_internal_secret: str = Header(...),
    service: SinglePassAssessmentService = Depends(),
    settings = Depends(get_settings),
):
    if x_internal_secret != settings.INTERNAL_AI_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service secret",
        )
    return await service.evaluate_single_pass(payload)
```

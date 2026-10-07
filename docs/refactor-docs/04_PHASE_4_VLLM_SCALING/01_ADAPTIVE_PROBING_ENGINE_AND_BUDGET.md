# TASK 4.1: ADAPTIVE PROBING ENGINE & PROBING BUDGET ORCHESTRATION
# (HỎI XOÁY ĐÁP SÂU THEO LƯỢT: PROMPT SPECIFICATION, LLM PROBING & BUDGET CONTROL)

> **Trạng thái**: Approved / Pragmatic Production Specification  
> **Cấp độ**: Deep Technical Specification (Conversational AI & Adaptive Probing)  
> **Áp dụng cho**: `ai-service/app/services/probing/`, `ai-service/app/schemas/probing.py`, LLM API Client  
> **Tài liệu cha**: [00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_4_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0 (Thay thế cụm vLLM và WebSocket duplex bằng cơ chế hỏi đào sâu theo lượt)  

---

## 1. MỤC TIÊU KỸ THUẬT & TRIẾT LÝ THIẾT KẾ

Trong phỏng vấn kỹ thuật thực tế, người phỏng vấn hiếm khi chỉ hỏi một câu rồi bỏ qua. Khi ứng viên đưa ra một giải pháp (ví dụ: *"Em dùng Redis cache"* hoặc *"Em cấu hình Docker Compose"*), người phỏng vấn sẽ đặt **câu hỏi đào sâu (Probing / Follow-up Question)** để kiểm tra:
1. **Độ sâu hiểu biết thực tế**: Ứng viên tự làm hay chỉ học vẹt / sao chép mã nguồn?
2. **Khả năng phân tích đánh đổi (Trade-off Analysis)**: Ứng viên có hiểu điểm yếu của giải pháp (Cache invalidation, Cache Stampede, Network bottleneck) hay không?
3. **Phản xạ tư duy kiến trúc**: Khi gặp sự cố biên (Edge cases), ứng viên ứng biến ra sao?

### Nguyên tắc Thiết kế Cốt lõi:
* **Hỏi xoáy theo lượt (Turn-based)**: Không đòi hỏi kết nối WebSocket liên tục hay xử lý âm thanh phức tạp; câu hỏi đào sâu được sinh ra ngay sau khi ứng viên nộp câu trả lời chính.
* **Ngân sách Hỏi xoáy Nghiêm ngặt (Strict Probing Budget)**:
  * Cấp bậc Junior (`targetSfiaLevel` $\le 3$): Tối đa **1 câu hỏi đào sâu** cho mỗi câu hỏi chính.
  * Cấp bậc Mid/Senior (`targetSfiaLevel` $\ge 4$): Tối đa **2 câu hỏi đào sâu** cho mỗi câu hỏi chính.
* **Quy tắc Bỏ qua An toàn (Early Exit Heuristic)**: Nếu câu trả lời chính quá ngắn ($< 20$ từ), không liên quan đến câu hỏi, hoặc ứng viên thừa nhận *"Em chưa biết"*, hệ thống lập tức trả về `shouldProbe = false` để không làm mất thời gian của ứng viên.

---

## 2. SYSTEM PROMPT & LOGIC SINH CÂU HỎI ĐÀO SÂU

```markdown
Bạn là Người Phỏng Vấn Kỹ Thuật Cấp Cao (Senior Technical Interviewer).
Nhiệm vụ của bạn là phân tích câu trả lời vừa rồi của ứng viên và quyết định xem có cần đặt một CÂU HỎI ĐÀO SÂU (Adaptive Probing Question) hay không.

### QUY TẮC QUYẾT ĐỊNH (PROBING HEURISTICS):
1. ĐÁNH GIÁ CHẤT LƯỢNG NỘI DUNG:
   - Nếu câu trả lời quá ngắn, lạc đề, hoặc ứng viên xin bỏ qua: Đặt `should_probe = false`, `probing_question = ""`.
   - Nếu câu trả lời có đề cập đến một công nghệ, kiến trúc, hoặc quyết định kỹ thuật cụ thể (ví dụ: Redis, Kafka, JWT, Index HNSW, Microservices, Transaction): Đặt `should_probe = true` và xoáy sâu vào quyết định đó.

2. NGUYÊN TẮC SOẠN CÂU HỎI ĐÀO SÂU:
   - Bắt đầu bằng việc trích dẫn lại ngắn gọn ý của ứng viên (ví dụ: "Bạn vừa nhắc đến việc sử dụng Redis để cache dữ liệu...").
   - Hỏi trực tiếp vào bài toán đánh đổi, rủi ro hoặc tình huống ngoại lệ (ví dụ: "...vậy bạn xử lý bài toán Cache Stampede hoặc Cache Invalidation như thế nào khi dữ liệu DB gốc bị cập nhật liên tục?").
   - Giữ câu hỏi ngắn gọn (1-2 câu), tự nhiên và sắc bén.
   - Ngôn ngữ: Khớp với ngôn ngữ của phiên phỏng vấn (vi/en).
```

---

## 3. CONTRACT ĐẶC TẢ API & PYDANTIC SCHEMA

### 3.1 Pydantic Request & Response Models (`ai-service/app/schemas/probing.py`)

```python
from typing import Optional, List
from pydantic import BaseModel, Field

class ProbingRequest(BaseModel):
    questionText: str = Field(description="Nội dung câu hỏi chính hiện tại")
    candidateAnswer: str = Field(description="Câu trả lời của ứng viên cho câu hỏi chính")
    sessionType: str = Field(default="technical", description="Loại phỏng vấn: technical hoặc hr")
    targetSfiaLevel: int = Field(default=3, ge=1, le=7, description="Cấp độ mục tiêu SFIA (1-7)")
    language: str = Field(default="vi", description="Ngôn ngữ phỏng vấn: vi hoặc en")

class ProbingResponse(BaseModel):
    shouldProbe: bool = Field(description="Có cần đặt câu hỏi đào sâu hay không")
    probingQuestion: Optional[str] = Field(default=None, description="Nội dung câu hỏi đào sâu nếu có")
    probingRationale: Optional[str] = Field(default=None, description="Lý do AI quyết định hỏi xoáy vào điểm này")
    targetAspect: Optional[str] = Field(default=None, description="Khía cạnh kỹ thuật được xoáy: concurrency, caching, architecture, failure_recovery")
```

### 3.2 Endpoint Implementation (`ai-service/app/routers/probing.py`)

```python
from fastapi import APIRouter, Depends, Header, HTTPException, status
from app.schemas.probing import ProbingRequest, ProbingResponse
from app.services.probing.probing_service import AdaptiveProbingService
from app.core.config import get_settings

router = APIRouter(prefix="/api/v1/probing", tags=["Adaptive Probing"])

@router.post("/generate", response_model=ProbingResponse)
async def generate_probing_question(
    payload: ProbingRequest,
    x_internal_secret: str = Header(...),
    service: AdaptiveProbingService = Depends(),
    settings = Depends(get_settings),
):
    if x_internal_secret != settings.INTERNAL_AI_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service secret",
        )
    return await service.evaluate_and_probe(payload)
```

---

## 4. TIÊU CHÍ KIỂM THỬ (QUALITY GATE 4.1)

1. **Hiệu năng & Độ trễ**: Thời gian sinh câu hỏi đào sâu $< 1.5\text{s}$ (P95) khi sử dụng LLM Cloud / local API.
2. **Kiểm soát Ngân sách**: Tuyệt đối không sinh câu hỏi đào sâu nếu số từ của câu trả lời chính $< 20$ từ.
3. **Độ sắc bén kỹ thuật**: 100% câu hỏi đào sâu bám sát công nghệ hoặc thuật ngữ mà ứng viên vừa trình bày trong câu trả lời chính.

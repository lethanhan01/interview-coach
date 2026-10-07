# TASK 3.3: PASS 2 — TỔNG HỢP NHẬN XÉT, CÂU TRẢ LỜI MẪU & ANNOTATED SEGMENTS

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Coaching NLP & UI Segment Highlighting)  
> **Áp dụng cho**: `ai-service/app/services/assessment/pass2_synthesizer.py`  
> **Tài liệu cha**: [00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_3_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 1.0.0  

---

## 1. MỤC TIÊU & NHIỆM VỤ CỦA PASS 2

Pass 2 là chặng **Tổng hợp & Huấn luyện Tương tác (Synthesis & Interactive Coaching)**. Sử dụng dữ liệu đã phân tích sâu từ Pass 1 (Bóc tách STAR, thẩm định tiêu chí và kiểm tra tính đúng đắn kỹ thuật) để hoàn thiện báo cáo phản hồi cho ứng viên trong $< 4.5\text{ giây}$:

1. **Tổng hợp Điểm mạnh & Điểm cần cải thiện (`strengths` & `improvements`)**: Đưa ra nhận xét có tính hành động cao (actionable advice), gắn chặt với bằng chứng thực tế từ câu trả lời.
2. **Câu trả lời Mẫu Chuẩn mực (`modelAnswer`)**: Xây dựng phiên bản câu trả lời lý tưởng bám sát cấu trúc STAR, giải quyết trọn vẹn bài toán kỹ thuật theo đúng cấp bậc mục tiêu SFIA 9.
3. **Bài học Then chốt (`keyTakeaway`)**: Tóm tắt thông điệp cốt lõi trong 1-2 câu súc tích.
4. **Phân đoạn Đánh dấu Trực quan (`annotatedSegments`)**: Trích xuất các phân đoạn văn bản kèm tọa độ ký tự chính xác (`startIndex`, `endIndex`) để giao diện Web tô màu (Highlight) và hiển thị tooltip nhận xét tương tác trực tiếp trên transcript.

---

## 2. NGUYÊN TẮC TÔ MÀU PHÂN ĐOẠN (ANNOTATED SEGMENT TAXONOMY)

Giao diện Frontend (`client/`) hỗ trợ 4 cấp độ đánh dấu trực quan:

| Cấp độ Highlight (`highlightLevel`) | Màu sắc UI | Ý nghĩa Nghiệp vụ & Ngữ cảnh Áp dụng |
| :--- | :---: | :--- |
| **`positive`** | Xanh lá | Luận điểm xuất sắc, câu trả lời có số liệu định lượng, giải pháp kiến trúc tối ưu. |
| **`warning`** | Vàng | Trả lời đúng một phần nhưng còn chung chung, thiếu ví dụ hoặc chưa làm rõ trade-off. |
| **`critical_gap`** | Đỏ | Thông tin sai lệch nghiêm trọng về mặt kỹ thuật, hoặc thiếu sót hoàn toàn phần hành động/kết quả. |
| **`neutral`** | Xám/Xanh nhạt | Thông tin bối cảnh nền hoặc lời chào hỏi không ảnh hưởng đến điểm kỹ năng. |

---

## 3. THUẬT TOÁN ĐỐI SOÁT VÀ SỬA LỖI TỌA ĐỘ KÝ TỰ (OFFSET VERIFICATION)

> [!WARNING]
> LLM đôi khi sinh ra các chỉ số `startIndex` và `endIndex` bị lệch $1-3$ ký tự so với văn bản gốc (`answerText`).
> Để tránh gây vỡ DOM hoặc crash trên giao diện Next.js, Python middleware bắt buộc chạy thuật toán kiểm tra và tự động canh chỉnh (Self-Healing Character Alignment):

```python
def align_annotated_segments(
    answer_text: str, 
    segments: List[AnnotatedSegmentItem]
) -> List[AnnotatedSegmentItem]:
    """
    Kiểm tra và tự động sửa lệch vị trí startIndex / endIndex dựa trên chuỗi segmentText.
    """
    valid_segments = []
    
    for seg in segments:
        text = seg.segmentText.strip()
        if not text:
            continue
            
        start = seg.startIndex
        end = seg.endIndex
        
        # 1. Kiểm tra vị trí hiện tại có khớp chính xác không
        if answer_text[start:end] == text:
            valid_segments.append(seg)
            continue
            
        # 2. Nếu lệch, thực hiện tìm kiếm chuỗi con trong phạm vi lân cận hoặc toàn văn bản
        exact_pos = answer_text.find(text)
        if exact_pos != -1:
            seg.startIndex = exact_pos
            seg.endIndex = exact_pos + len(text)
            valid_segments.append(seg)
        else:
            # Bỏ qua segment nếu văn bản không thực sự tồn tại trong transcript gốc
            continue
            
    # Sắp xếp các đoạn theo thứ tự xuất hiện tăng dần
    valid_segments.sort(key=lambda x: x.startIndex)
    return valid_segments
```

---

## 4. PYDANTIC SCHEMA CHO PASS 2 (`ai-service/app/schemas/pass2.py`)

```python
from typing import List, Optional, Literal
from pydantic import Field
from app.schemas.base import CamelModel

class AnnotatedSegmentItem(CamelModel):
    segmentText: str = Field(description="Đoạn văn bản trích dẫn từ transcript")
    startIndex: int = Field(ge=0, description="Vị trí ký tự bắt đầu (0-based)")
    endIndex: int = Field(ge=0, description="Vị trí ký tự kết thúc")
    highlightLevel: Literal["positive", "warning", "critical_gap", "neutral"]
    annotation: str = Field(description="Lời giải thích nhận xét của chuyên gia AI")
    suggestion: Optional[str] = Field(None, description="Gợi ý cách cải thiện đoạn này")
    improvedVersion: Optional[str] = Field(None, description="Cách diễn đạt mẫu chuẩn hơn")

class Pass2SynthesisResponse(CamelModel):
    strengths: List[str] = Field(min_length=1, description="Các điểm mạnh then chốt")
    improvements: List[str] = Field(min_length=1, description="Các điểm cần cải thiện cụ thể")
    modelAnswer: str = Field(description="Câu trả lời mẫu hoàn hảo theo chuẩn STAR")
    keyTakeaway: str = Field(description="Bài học hoặc thông điệp cốt lõi")
    annotatedSegments: List[AnnotatedSegmentItem]
```

---

## 5. TIÊU CHÍ NGHIỆM THU (QUALITY GATES)

1. **Khớp Tọa độ 100%**: Tuyệt đối không có trường hợp `answerText[startIndex:endIndex] != segmentText` khi trả về cho NestJS.
2. **Không Chồng lấn Tọa độ (No Overlapping)**: Các phân đoạn `annotatedSegments` không được giao thoa nhau về khoảng vị trí ký tự để tránh lỗi render highlight trên CSS.
3. **Chất lượng Model Answer**: Câu trả lời mẫu bắt buộc thể hiện đủ 4 khía cạnh STAR và nêu rõ các số liệu đo lường kỹ thuật thực tế.

---

## 6. TASK EXECUTION CONTRACT

### 6.1 Prerequisites (Tiền đề bắt buộc)
- [ ] Hoàn thành **Task 3.2**: Toàn bộ kết quả Pass 1 (STAR, Rubric) và Fact-Checking (Lỗi kỹ thuật, Buzzwords) đã sẵn sàng.
- [ ] Pydantic v2 `CamelModel` sẵn sàng.

### 6.2 Target Deliverables (Sản phẩm mã nguồn đầu ra)
- [ ] `ai-service/app/services/assessment/pass2_synthesizer.py`: Lớp `Pass2SynthesizerService` tổng hợp nhận xét, sinh câu trả lời mẫu STAR hoàn hảo.
- [ ] `ai-service/app/services/assessment/offset_healer.py`: Thuật toán Character Offset Healing đối chiếu và tự động chữa lành độ lệch tọa độ ký tự.
- [ ] `ai-service/app/schemas/assessment.py`: Bổ sung Pydantic models `Pass2SynthesisResponse`, `AnnotatedSegmentItem` (kế thừa `CamelModel`).
- [ ] `ai-service/app/prompts/assessment_pass2.py`: System prompt tổng hợp nhận xét huấn luyện và bài học.

### 6.3 Architectural Rules Enforced (Tuân thủ AGENTS.md)
- [x] **Backend Rule 5**: AI Isolation; kiểm soát structured output chặt chẽ, loại bỏ hoàn toàn rủi ro văng lỗi frontend do sai lệch tọa độ.
- [x] **Zero Schema Drift**: 100% thuộc tính trả về định dạng `camelCase` (`modelAnswer`, `keyTakeaway`, `annotatedSegments`, `startIndex`, `endIndex`).

### 6.4 Verification Command (Lệnh kiểm thử & Xác thực tự động)
```bash
# Tier 1 (Unit & Character Offset Healing Test)
cd ai-service && uv run pytest tests/unit/test_pass2_synthesizer.py -v

# Tier 2 (Live LLM Pass 2 Synthesis Verification)
curl -X POST -H "x-internal-secret: interviewai-super-secret-dev-key-change-in-prod" \
  -H "Content-Type: application/json" \
  -d '{"question":"Giải thích Sharding trong DB","answerText":"Sharding là chia dữ liệu theo chiều ngang ra nhiều database instances."}' \
  http://localhost:8000/api/v1/assessment/pass2
```

### 6.5 Definition of Done (DoD)
- [ ] Khớp tọa độ 100%: Xác minh `answerText[startIndex:endIndex] == segmentText` cho toàn bộ các phân đoạn.
- [ ] Không chồng lấn khoảng vị trí (`No Overlapping Intervals`), giúp giao diện Frontend hiển thị tooltip mượt mà.
- [ ] `modelAnswer` chuẩn hóa đầy đủ 4 phần Situation, Task, Action, Result.
- [ ] P95 Latency của Pass 2 $< 5.0\text{ giây}$.

### 6.6 Next Task Transition (Bước chuyển tiếp)
- Tiếp tục sang **Task 3.4: Deterministic Scoring & SFIA Level Inference**: [04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md](04_DETERMINISTIC_SCORING_AND_SFIA_LEVEL_INFERENCE.md) để tính điểm tất định 100% bằng toán học phía NestJS.


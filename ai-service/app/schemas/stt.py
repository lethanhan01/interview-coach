from pydantic import Field
from app.schemas.base import CamelModel


class VoiceMetrics(CamelModel):
    wpm: int = Field(ge=0, description="Words Per Minute tính trên thời gian nói thực tế")
    filler_word_count: int = Field(ge=0, description="Tổng số lượng từ đệm phát hiện được")
    filler_words: list[str] = Field(default_factory=list, description="Danh sách từ đệm cụ thể")
    pause_count: int = Field(ge=0, description="Số lần ngập ngừng im lặng > 1.2s")
    total_pause_duration_seconds: float = Field(ge=0.0, description="Tổng thời gian ngập ngừng im lặng (giây)")
    speech_duration_seconds: float = Field(ge=0.0, description="Thời lượng phát âm thực tế (giây)")
    confidence_score: float = Field(ge=0.0, le=100.0, description="Độ tin cậy trung bình của phát âm (0-100)")


class STTWordTimestamp(CamelModel):
    word: str
    start: float
    end: float
    probability: float


class STTResponse(CamelModel):
    text: str
    language: str
    duration_seconds: float
    metrics: VoiceMetrics
    words: list[STTWordTimestamp] | None = None

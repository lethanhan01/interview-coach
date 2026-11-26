from pydantic import Field
from app.schemas.base import CamelModel


class TTSRequest(CamelModel):
    text: str = Field(min_length=1, description="Nội dung văn bản cần đọc")
    language: str = Field(default="vi", description="'vi' cho Tiếng Việt, 'en' cho Tiếng Anh")
    voice: str | None = Field(
        default=None,
        description="Tên voice tùy chọn (af_heart, am_adam, vi-VN-HoaiMyNeural, vi-VN-NamMinhNeural)",
    )
    speed: float | None = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Tốc độ đọc từ 0.5 đến 2.0",
    )

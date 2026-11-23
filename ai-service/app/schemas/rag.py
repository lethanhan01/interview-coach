from pydantic import Field, field_validator

from app.core.config import get_settings
from app.schemas.base import CamelModel


class EmbedRequest(CamelModel):
    texts: list[str] = Field(
        min_length=1,
        description="Danh sách văn bản cần embed (mỗi phần tử không rỗng)",
    )

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, value: list[str]) -> list[str]:
        settings = get_settings()
        if len(value) > settings.embedding_max_batch:
            raise ValueError(f"texts vượt quá {settings.embedding_max_batch} phần tử mỗi lần gọi")
        cleaned: list[str] = []
        for index, text in enumerate(value):
            stripped = text.strip()
            if not stripped:
                raise ValueError(f"texts[{index}] rỗng")
            if len(stripped) > settings.embedding_max_chars:
                raise ValueError(
                    f"texts[{index}] dài {len(stripped)} ký tự, "
                    f"vượt giới hạn {settings.embedding_max_chars}"
                )
            cleaned.append(stripped)
        return cleaned


class EmbedResponse(CamelModel):
    vectors: list[list[float]] = Field(description="Vector theo đúng thứ tự của texts")
    dimension: int = Field(gt=0, description="Số chiều của mỗi vector")
    model: str = Field(description="Model id upstream đã sinh vector")

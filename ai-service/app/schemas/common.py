from typing import Any
from app.schemas.base import CamelModel


class HealthResponse(CamelModel):
    status: str = "ok"


class ReadyResponse(CamelModel):
    status: str
    device: str
    models: dict[str, str]


class ErrorResponse(CamelModel):
    success: bool = False
    error_code: str
    message: str
    details: dict[str, Any] = {}

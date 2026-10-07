from typing import Any
from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class AIException(Exception):
    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


async def ai_exception_handler(_request: Request, exc: AIException) -> JSONResponse:
    logger.warn("business_exception_caught", errorCode=exc.error_code, message=exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "errorCode": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    logger.warn("http_exception_caught", statusCode=exc.status_code, detail=exc.detail)
    if isinstance(exc.detail, dict) and "errorCode" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "errorCode": "HTTP_ERROR",
            "message": str(exc.detail),
            "details": {},
        },
    )


async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.warn("validation_error_caught", errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "errorCode": "VALIDATION_ERROR",
            "message": "Dữ liệu payload đầu vào không hợp lệ.",
            "details": {"validationErrors": exc.errors()},
        },
    )


async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_server_exception", error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "errorCode": "INTERNAL_SERVER_ERROR",
            "message": "Lỗi nội bộ hệ thống AI Microservice.",
            "details": {"error": str(exc)},
        },
    )

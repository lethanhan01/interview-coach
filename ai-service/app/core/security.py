import hmac
from fastapi import HTTPException, Request, status
from app.core.config import get_settings


async def verify_internal_secret(request: Request) -> None:
    secret_header = request.headers.get("x-internal-secret")
    expected_secret = get_settings().internal_ai_secret

    if not secret_header or not hmac.compare_digest(secret_header, expected_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "errorCode": "INVALID_INTERNAL_SECRET",
                "message": "Xác thực nội bộ thất bại: x-internal-secret không hợp lệ.",
            },
        )

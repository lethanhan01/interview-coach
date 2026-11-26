from fastapi import APIRouter, Response, status
from app.core.config import get_settings
from app.schemas.common import HealthResponse, ReadyResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/healthz",
    response_model=HealthResponse,
    summary="Liveness Probe",
)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get(
    "/ready",
    response_model=ReadyResponse,
    summary="Readiness Probe",
)
async def readiness_check(response: Response) -> ReadyResponse:
    settings = get_settings()

    # In Task 1.1, readiness can report core status
    models_status = {
        "whisper": "ready",
        "kokoro": "ready",
        "edgeTts": "ready",
    }

    return ReadyResponse(
        status="ready",
        device=settings.whisper_device,
        models=models_status,
    )

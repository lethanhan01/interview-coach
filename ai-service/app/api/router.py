from fastapi import APIRouter
from app.api.v1 import health, stt, tts

api_router = APIRouter()

# Health endpoints mounted at root for Kubernetes/Docker container probes
api_router.include_router(health.router)

# v1 routes mounted with /api/v1 prefix
v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(stt.router)
v1_router.include_router(tts.router)

api_router.include_router(v1_router)

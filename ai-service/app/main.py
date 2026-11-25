from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from prometheus_fastapi_instrumentator import Instrumentator
import httpx
import structlog

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    AIException,
    ai_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import TracingAndLoggingMiddleware, setup_logging
from app.services.rag.embedder import OpenAICompatibleEmbedder

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    setup_logging(settings.log_level)
    logger.info(
        "service_starting",
        env=settings.app_env,
        device=settings.whisper_device,
        whisperModel=settings.whisper_model_size,
        embeddingModel=settings.embedding_model,
    )
    embedding_client = httpx.AsyncClient(timeout=settings.embedding_timeout_s)
    fastapi_app.state.embedder = OpenAICompatibleEmbedder(embedding_client, settings)
    try:
        yield
    finally:
        await embedding_client.aclose()
        logger.info("service_shutting_down")


app = FastAPI(
    title="Intervia Compute Engine",
    description="Stateless STT, TTS & NLP Microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# Prometheus Metrics
Instrumentator().instrument(app).expose(app)

# Register Exception Handlers
app.add_exception_handler(AIException, ai_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Tracing and Logging Middleware
app.add_middleware(TracingAndLoggingMiddleware)

# Include API Router
app.include_router(api_router)

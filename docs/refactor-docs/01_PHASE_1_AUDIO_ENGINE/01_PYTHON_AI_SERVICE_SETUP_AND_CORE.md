# TASK 1.1: PYTHON AI MICROSERVICE SETUP, DEPENDENCY MANAGEMENT & RUNTIME CORE

> **Trạng thái**: Approved / Production Specification  
> **Cấp độ**: Deep Technical Specification (Backend & Infrastructure Architecture)  
> **Áp dụng cho**: Khởi tạo thư mục `ai-service/`, Python 3.11+, Astral `uv`, Docker Container  
> **Tài liệu cha**: [00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md](00_PHASE_1_OVERVIEW_AND_ARCHITECTURE.md)  
> **Phiên bản**: 2.0.0  

---

## 1. MỤC TIÊU KỸ THUẬT & YÊU CẦU NỀN TẢNG

1. **Khởi tạo Microservice Chuyên biệt `ai-service/`**: Xây dựng service tính toán phi trạng thái (Stateless Compute Microservice) bằng **FastAPI** và **Python 3.11+**, hoàn toàn tách biệt khỏi runtime Node.js của NestJS.
2. **Quản lý Dependency Siêu tốc bằng `uv`**: Thay thế `pip`/`poetry` truyền thống bằng `uv` (Astral) nhằm tối ưu hóa 10-100x thời gian cài đặt thư viện và đảm bảo tính tất định qua `uv.lock`.
3. **Đóng gói Docker Multi-Stage hỗ trợ Dual Profile (CPU & GPU CUDA)**:
   * Cài đặt đầy đủ các thư viện hệ thống C/C++ cần thiết cho xử lý media: `ffmpeg`, `libavcodec-dev`, `libavformat-dev`, `libswresample-dev`.
   * Tự động thích ứng môi trường Local Development (máy dev CPU đa nhân) và Production Server (GPU NVIDIA CUDA).
4. **Hạ tầng Core Vững chắc**:
   * Cấu hình tập trung bằng Pydantic BaseSettings (`app/core/config.py`).
   * Structured JSON Logging chuẩn hóa qua `structlog` kết hợp theo dõi vết `x-request-id`.
   * Xác thực Inter-Service an toàn bằng `x-internal-secret` với `hmac.compare_digest` chống Timing Attacks.
   * Xử lý ngoại lệ chuẩn hóa qua Standard Error Envelope, tương thích 100% với `InterviewAIException` của NestJS.

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN HÓA (`ai-service/`)

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI entrypoint, lifespan, middleware & routes
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic Settings & validation biến môi trường
│   │   ├── logging.py              # Structlog JSON structured logging cấu hình sẵn
│   │   ├── security.py             # Middleware kiểm tra x-internal-secret (timing-safe)
│   │   └── exceptions.py           # Standard Error Envelope & custom exception handlers
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py               # Tổng hợp router v1
│   │   └── v1/
│   │       ├── health.py           # GET /healthz & GET /ready
│   │       ├── stt.py              # POST /api/v1/stt/transcribe
│   │       └── tts.py              # POST /api/v1/tts/synthesize
│   ├── services/
│   │   ├── stt/
│   │   │   ├── __init__.py
│   │   │   ├── audio_decoder.py    # PyAV in-memory WebM/Opus -> PCM Float32 16kHz
│   │   │   ├── vad_filter.py       # Silero VAD lọc khoảng lặng & hesitation detector
│   │   │   ├── whisper_engine.py   # faster-whisper singleton (CTranslate2)
│   │   │   └── metrics_extractor.py# Trích xuất WPM, pauses, bilingual filler words
│   │   └── tts/
│   │       ├── __init__.py
│   │       ├── tts_manager.py      # Bộ điều phối Hybrid TTS (EN: Kokoro, VI: EdgeTTS)
│   │       ├── kokoro_engine.py    # Kokoro-82M neural synthesizer (English studio)
│   │       └── edge_tts_engine.py  # Edge-TTS synthesizer (Vietnamese native)
│   └── schemas/
│       ├── __init__.py
│       ├── base.py                 # CamelModel (alias_generator=to_camel)
│       ├── common.py               # ErrorResponse & HealthResponse models
│       ├── stt.py                  # Pydantic request/response models cho STT
│       └── tts.py                  # Pydantic request/response models cho TTS
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Fixtures & mock client
│   ├── test_contracts.py           # Kiểm thử độ lệch Schema (Contract Tests)
│   ├── test_stt.py                 # Unit tests cho STT pipeline
│   └── test_tts.py                 # Unit tests cho TTS pipeline
├── Dockerfile                      # Multi-stage production container
├── Dockerfile.gpu                  # CUDA 12-optimized container
├── pyproject.toml                  # Khai báo dependencies qua uv
└── uv.lock                         # Khóa phiên bản dependency tất định
```

---

## 3. KHAI BÁO DEPENDENCIES (`pyproject.toml`)

Tệp `pyproject.toml` định nghĩa toàn bộ thư viện máy học, giải mã âm thanh và web server:

```toml
[project]
name = "interviewai-engine"
version = "0.1.0"
description = "High-Performance AI Compute Microservice for InterviewAI Platform"
readme = "README.md"
requires-python = ">=3.11"
authors = [
    { name = "InterviewAI Core Team", email = "engineering@interviewai.internal" }
]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.31.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
    "python-multipart>=0.0.12",
    "faster-whisper>=1.0.3",
    "av>=12.0.0",                       # PyAV: giải mã WebM/Opus -> PCM in-memory
    "torch>=2.4.0",
    "torchaudio>=2.4.0",
    "kokoro>=0.8.4",                     # Neural TTS cho Tiếng Anh (studio quality)
    "edge-tts>=6.1.12",                  # Neural TTS cho Tiếng Việt (chuẩn giọng Bắc/Nam)
    "soundfile>=0.12.1",
    "numpy>=1.26.4",
    "structlog>=24.4.0",
    "httpx>=0.27.2",
    "prometheus-fastapi-instrumentator>=7.0.0",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "ruff>=0.6.9",
    "mypy>=1.11.2",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B"]

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
```

---

## 4. DOCKERFILE MULTI-STAGE HỖ TRỢ DUAL PROFILE (CPU & GPU)

### 4.1 Dockerfile Chuẩn Đa Năng (CPU-first / Dev & Standard Staging)
`ai-service/Dockerfile`:

```dockerfile
# ==============================================================================
# GIAI ĐOẠN 1: BUILDER STAGE
# ==============================================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Cài đặt uv và công cụ biên dịch tối thiểu
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /bin/uv

# Copy cấu hình dependencies
COPY pyproject.toml uv.lock ./

# Cài đặt virtual environment vào /build/.venv
ENV UV_PROJECT_ENVIRONMENT=/build/.venv
RUN uv sync --frozen --no-dev --no-install-project

# ==============================================================================
# GIAI ĐOẠN 2: RUNTIME STAGE
# ==============================================================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Bắt buộc cài đặt thư viện hệ thống để PyAV giải mã Opus/WebM và xử lý audio
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswresample-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Tạo người dùng non-root vì lý do bảo mật
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser

# Copy virtualenv từ builder
COPY --from=builder /build/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy mã nguồn ứng dụng
COPY app /app/app

# Cấp quyền thư mục cache model cho appuser
RUN mkdir -p /app/models_cache && chown -R appuser:appgroup /app
USER appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/app/models_cache \
    PORT=8000

EXPOSE 8000

# Healthcheck probe nội bộ
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

### 4.2 Dockerfile Tối ưu hóa GPU CUDA (Production với NVIDIA GPU)
`ai-service/Dockerfile.gpu`:

```dockerfile
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS runtime

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-venv \
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libswresample-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /bin/uv

COPY pyproject.toml uv.lock ./
ENV UV_PROJECT_ENVIRONMENT=/app/.venv
RUN uv sync --frozen --no-dev

COPY app /app/app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

---

## 5. THỰC THI HẠ TẦNG CORE RUNTIME

### 5.1 Cấu hình Tập trung: `app/core/config.py`

Sử dụng `pydantic-settings` tự động đọc `.env` với validation kiểu dữ liệu nghiêm ngặt:

```python
from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Settings
    app_env: Literal["development", "staging", "production"] = "development"
    port: int = 8000
    host: str = "0.0.0.0"
    log_level: str = "INFO"
    
    # Bảo mật Inter-Service (Secret đối soát với NestJS)
    internal_ai_secret: str = Field(
        default="interviewai-super-secret-dev-key-change-in-prod",
        description="Khóa bảo mật bắt buộc trong header x-internal-secret",
    )

    # Cấu hình STT Engine (faster-whisper)
    whisper_model_size: str = Field(
        default="small",
        description="Kích thước model whisper: tiny, base, small, medium, large-v3",
    )
    whisper_device: Literal["cpu", "cuda"] = "cpu"
    whisper_compute_type: Literal["int8", "float16", "float32"] = "int8"
    whisper_threads: int = 4

    # Cấu hình VAD
    vad_threshold: float = 0.5
    min_speech_duration_ms: int = 250
    min_silence_duration_ms: int = 500

    # Cấu hình TTS
    kokoro_voice_default: str = "af_heart"
    edge_tts_vi_voice_default: str = "vi-VN-HoaiMyNeural"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

### 5.2 Structured JSON Logging: `app/core/logging.py`

Xuất log chuẩn JSON hỗ trợ `request_id` contextvar, sẵn sàng tích hợp với ELK, Datadog hoặc Grafana Loki:

```python
import logging
import sys
from contextvars import ContextVar
import structlog

# Context variable lưu trữ requestId cho từng async task
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def add_request_id(_logger: logging.Logger, _method_name: str, event_dict: dict) -> dict:
    req_id = request_id_ctx.get()
    if req_id:
        event_dict["requestId"] = req_id
    return event_dict


def setup_logging(log_level: str = "INFO") -> None:
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level.upper(),
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            add_request_id,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

---

### 5.3 Bảo mật Timing-Safe Inter-Service: `app/core/security.py`

Kiểm tra header `x-internal-secret` an toàn bằng thuật toán so sánh hằng thời gian (`hmac.compare_digest`), triệt tiêu hoàn toàn lỗ hổng Timing Attack:

```python
import hmac
from fastapi import Request, HTTPException, status
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
```

---

### 5.4 Chuẩn hóa Error Envelope: `app/core/exceptions.py`

Đồng bộ ngoại lệ trả về khớp định dạng của NestJS `InterviewAIException`:

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import structlog

logger = structlog.get_logger()


class AIException(Exception):
    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict | None = None,
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


async def ai_exception_handler(_request: Request, exc: AIException) -> JSONResponse:
    logger.warn("business_exception_caught", error_code=exc.error_code, msg=exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "errorCode": exc.error_code,
            "message": exc.message,
            "details": exc.details,
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
```

---

### 5.5 FastAPI Application Entrypoint: `app/main.py`

Tệp entrypoint tổng hợp middlewares, contextvars `request_id`, lifespan model warmup và đăng ký routers:

```python
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from prometheus_fastapi_instrumentator import Instrumentator
import structlog

from app.core.config import get_settings
from app.core.logging import setup_logging, request_id_ctx
from app.core.exceptions import (
    AIException,
    ai_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.api.router import api_router
from app.services.stt.whisper_engine import WhisperEngine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.log_level)
    logger.info(
        "service_starting",
        env=settings.app_env,
        device=settings.whisper_device,
        model=settings.whisper_model_size,
    )
    
    # Preload mô hình Whisper vào RAM / VRAM lúc khởi động (Warmup)
    try:
        WhisperEngine.get_instance().warmup()
        logger.info("whisper_engine_warmed_up")
    except Exception as e:
        logger.error("whisper_warmup_failed", error=str(e))
        
    yield
    logger.info("service_shutting_down")


app = FastAPI(
    title="InterviewAI Compute Engine",
    description="Stateless STT, TTS & NLP Microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# Prometheus Metrics Instrumentation
Instrumentator().instrument(app).expose(app)

# Đăng ký Exception Handlers
app.add_exception_handler(AIException, ai_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


# Middleware đo lường Latency & gắn Request-Id
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next) -> Response:
    start_time = time.perf_counter()
    req_id = request.headers.get("x-request-id", "req-internal-auto")
    request_id_ctx.set(req_id)

    response = await call_next(request)

    latency_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Response-Time-Ms"] = f"{latency_ms:.2f}"
    response.headers["X-Request-Id"] = req_id

    # Không log các probe thăm dò tần suất cao
    if request.url.path not in ["/healthz", "/metrics"]:
        logger.info(
            "http_request_handled",
            method=request.method,
            path=request.url.path,
            statusCode=response.status_code,
            latencyMs=round(latency_ms, 2),
        )

    return response


# Đăng ký Router
app.include_router(api_router)
```

---

## 6. HƯỚNG DẪN THỰC THI & KIỂM THỬ KHỞI ĐỘNG

### 6.1 Khởi chạy Local Development (với `uv`)
```bash
cd ai-service

# Khởi tạo môi trường ảo và cài dependencies
uv sync

# Chạy server development với auto-reload
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6.2 Build & Chạy Container Docker (CPU)
```bash
# Build image
docker build -t interviewai-engine:latest .

# Run container
docker run -p 8000:8000 \
  -e INTERNAL_AI_SECRET="interviewai-super-secret-dev-key-change-in-prod" \
  interviewai-engine:latest
```

### 6.3 Kiểm tra Healthcheck Liveness Probe
```bash
curl -i http://localhost:8000/healthz
```
Phản hồi kỳ vọng:
```http
HTTP/1.1 200 OK
content-type: application/json
X-Response-Time-Ms: 0.85
X-Request-Id: req-internal-auto

{"status":"ok"}
```

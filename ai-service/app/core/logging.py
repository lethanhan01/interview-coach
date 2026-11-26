import logging
import sys
import time
import uuid
from contextvars import ContextVar
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variables for tracing
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def add_trace_context(_logger: logging.Logger, _method_name: str, event_dict: dict) -> dict:
    corr_id = correlation_id_ctx.get()
    req_id = request_id_ctx.get()
    if corr_id:
        event_dict["correlationId"] = corr_id
    if req_id:
        event_dict["requestId"] = req_id
    event_dict["service"] = "ai-service"
    return event_dict


def setup_logging(log_level: str = "INFO") -> None:
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper(), logging.INFO),
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            add_trace_context,
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


class TracingAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()

        corr_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())

        correlation_id_ctx.set(corr_id)
        request_id_ctx.set(req_id)

        logger = structlog.get_logger()

        response = await call_next(request)

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["x-correlation-id"] = corr_id
        response.headers["x-request-id"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{latency_ms:.2f}"

        # Do not log frequent healthz probes in noise logs
        if request.url.path not in ["/healthz", "/metrics"]:
            logger.info(
                "http_request_handled",
                method=request.method,
                path=request.url.path,
                statusCode=response.status_code,
                latencyMs=round(latency_ms, 2),
            )

        return response

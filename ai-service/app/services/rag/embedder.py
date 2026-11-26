"""Stateless embedder gọi upstream OpenAI-compatible `POST {base_url}/embeddings`.

Không kết nối DB. Mọi lỗi upstream được chuẩn hoá thành `AIException`:
- timeout / không kết nối được  -> 503 EMBEDDING_UPSTREAM_UNAVAILABLE
- upstream trả HTTP lỗi          -> 502 EMBEDDING_UPSTREAM_ERROR
- response sai shape / số chiều  -> 502 EMBEDDING_INVALID_RESPONSE
"""

from typing import Any

import httpx
import structlog

from app.core.config import Settings
from app.core.exceptions import AIException
from app.schemas.rag import EmbedResponse

logger = structlog.get_logger()


class OpenAICompatibleEmbedder:
    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    async def embed(self, texts: list[str]) -> EmbedResponse:
        payload = await self._post_embeddings(texts)
        vectors = self._extract_vectors(payload, expected_count=len(texts))
        model = payload.get("model")
        return EmbedResponse(
            vectors=vectors,
            dimension=self._settings.embedding_dim,
            model=model if isinstance(model, str) and model else self._settings.embedding_model,
        )

    async def _post_embeddings(self, texts: list[str]) -> dict[str, Any]:
        url = f"{self._settings.embedding_base_url.rstrip('/')}/embeddings"
        try:
            response = await self._client.post(
                url,
                json={"model": self._settings.embedding_model, "input": texts},
                headers={"Authorization": f"Bearer {self._settings.embedding_api_key}"},
                timeout=self._settings.embedding_timeout_s,
            )
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            logger.warning("embedding_upstream_unavailable", error=type(exc).__name__)
            raise AIException(
                error_code="EMBEDDING_UPSTREAM_UNAVAILABLE",
                message="Không kết nối được dịch vụ embedding upstream.",
                status_code=503,
                details={"reason": type(exc).__name__},
            ) from exc

        if response.is_error:
            logger.warning("embedding_upstream_error", statusCode=response.status_code)
            raise AIException(
                error_code="EMBEDDING_UPSTREAM_ERROR",
                message="Dịch vụ embedding upstream trả về lỗi.",
                status_code=502,
                details={"upstreamStatus": response.status_code},
            )

        try:
            body = response.json()
        except ValueError as exc:
            raise self._invalid("Response upstream không phải JSON hợp lệ.") from exc
        if not isinstance(body, dict):
            raise self._invalid("Response upstream không phải JSON object.")
        return body

    def _extract_vectors(self, payload: dict[str, Any], expected_count: int) -> list[list[float]]:
        data = payload.get("data")
        if not isinstance(data, list) or len(data) != expected_count:
            raise self._invalid(f"Số vector upstream trả về không khớp (kỳ vọng {expected_count}).")

        indexed: dict[int, list[float]] = {}
        for item in data:
            if not isinstance(item, dict):
                raise self._invalid("Phần tử data không phải object.")
            index = item.get("index")
            embedding = item.get("embedding")
            if not isinstance(index, int) or not 0 <= index < expected_count or index in indexed:
                raise self._invalid("Chỉ số index của vector không hợp lệ.")
            if not isinstance(embedding, list) or len(embedding) != self._settings.embedding_dim:
                raise self._invalid(
                    f"Vector index={index} không có đúng {self._settings.embedding_dim} chiều."
                )
            if not all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in embedding):
                raise self._invalid(f"Vector index={index} chứa giá trị không phải số.")
            indexed[index] = [float(v) for v in embedding]

        return [indexed[i] for i in range(expected_count)]

    @staticmethod
    def _invalid(message: str) -> AIException:
        logger.warning("embedding_invalid_response", reason=message)
        return AIException(
            error_code="EMBEDDING_INVALID_RESPONSE",
            message=message,
            status_code=502,
        )

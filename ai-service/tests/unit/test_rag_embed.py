import json
from collections.abc import Callable, Iterator

import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.v1.rag import get_embedder
from app.core.config import get_settings
from app.main import app
from app.services.rag.embedder import OpenAICompatibleEmbedder

DIM = get_settings().embedding_dim
URL = "/api/v1/rag/embed"


def _vector(seed: float) -> list[float]:
    return [seed] * DIM


def _ok_handler(request: httpx.Request) -> httpx.Response:
    body = json.loads(request.content)
    texts = body["input"]
    # Trả về ngược thứ tự để kiểm tra embedder sắp xếp lại theo index.
    data = [
        {"object": "embedding", "index": i, "embedding": _vector(float(i))}
        for i in reversed(range(len(texts)))
    ]
    return httpx.Response(200, json={"object": "list", "data": data, "model": body["model"]})


Handler = Callable[[httpx.Request], httpx.Response]
InstallUpstream = Callable[[Handler], None]


@pytest.fixture
def use_upstream() -> Iterator[InstallUpstream]:
    def _install(handler: Handler) -> None:
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        embedder = OpenAICompatibleEmbedder(client, get_settings())
        app.dependency_overrides[get_embedder] = lambda: embedder

    yield _install
    app.dependency_overrides.pop(get_embedder, None)


def _headers() -> dict[str, str]:
    return {"x-internal-secret": get_settings().internal_ai_secret}


def test_embed_happy_path_preserves_order(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return _ok_handler(request)

    use_upstream(handler)
    response = client.post(
        URL, json={"texts": ["  first  ", "second", "third"]}, headers=_headers()
    )

    assert response.status_code == 200
    body = response.json()
    assert body["dimension"] == DIM
    assert body["model"] == get_settings().embedding_model
    assert [v[0] for v in body["vectors"]] == [0.0, 1.0, 2.0]
    assert all(len(v) == DIM for v in body["vectors"])
    assert str(captured["url"]).endswith("/embeddings")
    assert captured["body"] == {
        "model": get_settings().embedding_model,
        "input": ["first", "second", "third"],
    }


def test_embed_wrong_dimension_returns_502(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"index": 0, "embedding": [0.1, 0.2]}]})

    use_upstream(handler)
    response = client.post(URL, json={"texts": ["a"]}, headers=_headers())

    assert response.status_code == 502
    assert response.json()["errorCode"] == "EMBEDDING_INVALID_RESPONSE"


def test_embed_count_mismatch_returns_502(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"index": 0, "embedding": _vector(0.1)}]})

    use_upstream(handler)
    response = client.post(URL, json={"texts": ["a", "b"]}, headers=_headers())

    assert response.status_code == 502
    assert response.json()["errorCode"] == "EMBEDDING_INVALID_RESPONSE"


def test_embed_duplicate_index_returns_502(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        item = {"index": 0, "embedding": _vector(0.1)}
        return httpx.Response(200, json={"data": [item, item]})

    use_upstream(handler)
    response = client.post(URL, json={"texts": ["a", "b"]}, headers=_headers())

    assert response.status_code == 502
    assert response.json()["errorCode"] == "EMBEDDING_INVALID_RESPONSE"


def test_embed_upstream_http_error_returns_502(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    use_upstream(lambda _request: httpx.Response(500, text="boom"))
    response = client.post(URL, json={"texts": ["a"]}, headers=_headers())

    assert response.status_code == 502
    body = response.json()
    assert body["errorCode"] == "EMBEDDING_UPSTREAM_ERROR"
    assert body["details"]["upstreamStatus"] == 500


def test_embed_upstream_down_returns_503(client: TestClient, use_upstream: InstallUpstream) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    use_upstream(handler)
    response = client.post(URL, json={"texts": ["a"]}, headers=_headers())

    assert response.status_code == 503
    assert response.json()["errorCode"] == "EMBEDDING_UPSTREAM_UNAVAILABLE"


def test_embed_upstream_timeout_returns_503(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out", request=request)

    use_upstream(handler)
    response = client.post(URL, json={"texts": ["a"]}, headers=_headers())

    assert response.status_code == 503
    assert response.json()["errorCode"] == "EMBEDDING_UPSTREAM_UNAVAILABLE"


def test_embed_missing_secret_returns_401(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    use_upstream(_ok_handler)
    response = client.post(URL, json={"texts": ["a"]})

    assert response.status_code == 401
    assert response.json()["errorCode"] == "INVALID_INTERNAL_SECRET"


@pytest.mark.parametrize(
    "payload",
    [
        {"texts": []},
        {"texts": ["   "]},
        {"texts": ["a" * (get_settings().embedding_max_chars + 1)]},
        {"texts": ["a"] * (get_settings().embedding_max_batch + 1)},
        {},
    ],
    ids=["empty-list", "blank-item", "too-long-item", "too-many-items", "missing-field"],
)
def test_embed_invalid_payload_returns_422(
    client: TestClient, use_upstream: InstallUpstream, payload: dict[str, object]
) -> None:
    use_upstream(_ok_handler)
    response = client.post(URL, json=payload, headers=_headers())

    assert response.status_code == 422
    assert response.json()["errorCode"] == "VALIDATION_ERROR"


def test_custom_validator_error_is_serializable_422(
    client: TestClient, use_upstream: InstallUpstream
) -> None:
    """Hồi quy: ValueError trong validator từng làm handler 422 crash thành 500."""
    use_upstream(_ok_handler)
    response = client.post(URL, json={"texts": ["ok", "   "]}, headers=_headers())

    assert response.status_code == 422
    body = response.json()
    assert body["errorCode"] == "VALIDATION_ERROR"
    messages = [e["msg"] for e in body["details"]["validationErrors"]]
    assert any("texts[1]" in m for m in messages)


def test_embed_without_lifespan_returns_503(client: TestClient) -> None:
    app.dependency_overrides.pop(get_embedder, None)
    had_embedder = hasattr(app.state, "embedder")
    saved = getattr(app.state, "embedder", None)
    if had_embedder:
        del app.state.embedder
    try:
        response = client.post(URL, json={"texts": ["a"]}, headers=_headers())
    finally:
        if had_embedder:
            app.state.embedder = saved

    assert response.status_code == 503
    assert response.json()["errorCode"] == "EMBEDDING_NOT_INITIALIZED"

from fastapi.testclient import TestClient


def test_healthz_returns_200_ok(client: TestClient) -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_ready_returns_200_ready(client: TestClient) -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "models" in data
    assert data["models"]["whisper"] == "ready"


def test_tracing_headers_injected(client: TestClient) -> None:
    response = client.get(
        "/healthz",
        headers={
            "x-correlation-id": "test-corr-1234",
            "x-request-id": "test-req-5678",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("x-correlation-id") == "test-corr-1234"
    assert response.headers.get("x-request-id") == "test-req-5678"
    assert "X-Response-Time-Ms" in response.headers

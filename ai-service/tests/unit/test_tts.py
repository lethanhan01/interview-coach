import pytest
from fastapi.testclient import TestClient
from app.schemas.tts import TTSRequest
from app.services.tts.tts_manager import TTSManager


def test_tts_synthesize_unauthorized(client: TestClient):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "Hello world", "language": "en"},
    )
    assert response.status_code == 401
    assert response.json()["errorCode"] == "INVALID_INTERNAL_SECRET"


def test_tts_synthesize_empty_text(client: TestClient):
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": "   ", "language": "vi"},
        headers={"x-internal-secret": "interviewai-super-secret-dev-key-change-in-prod"},
    )
    assert response.status_code == 422
    assert response.json()["errorCode"] == "EMPTY_TEXT_SYNTHESIS"


def test_tts_synthesize_text_too_long(client: TestClient):
    long_text = "a" * 1005
    response = client.post(
        "/api/v1/tts/synthesize",
        json={"text": long_text, "language": "vi"},
        headers={"x-internal-secret": "interviewai-super-secret-dev-key-change-in-prod"},
    )
    assert response.status_code == 413
    assert response.json()["errorCode"] == "TEXT_TOO_LONG"


@pytest.mark.asyncio
async def test_tts_manager_routes_vietnamese_to_edge_tts():
    req = TTSRequest(text="Bạn hãy giới thiệu về bản thân.", language="vi")
    generator, media_type, engine = await TTSManager.synthesize(req)
    assert media_type == "audio/mpeg"
    assert engine == "edge-tts"
    assert generator is not None


@pytest.mark.asyncio
async def test_tts_manager_routes_english():
    req = TTSRequest(text="Explain asynchronous programming in Python.", language="en")
    generator, media_type, engine = await TTSManager.synthesize(req)
    assert media_type in ["audio/wav", "audio/mpeg"]
    assert engine in ["kokoro", "edge-tts-fallback"]
    assert generator is not None

import json
from pathlib import Path
from app.schemas.common import ErrorResponse
from app.schemas.rag import EmbedResponse
from app.schemas.stt import STTResponse, STTWordTimestamp, VoiceMetrics
from app.schemas.tts import TTSRequest


def test_stt_response_conforms_to_fixture_keys_and_types():
    fixture_path = (
        Path(__file__).parents[2] / "contracts" / "fixtures" / "stt-response.fixture.json"
    )
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    instance = STTResponse(
        text=fixture_data["text"],
        language=fixture_data["language"],
        duration_seconds=fixture_data["durationSeconds"],
        metrics=VoiceMetrics(**fixture_data["metrics"]),
        words=[STTWordTimestamp(**w) for w in fixture_data["words"]],
    )

    dumped = instance.model_dump(by_alias=True)

    assert dumped["text"] == fixture_data["text"]
    assert dumped["language"] == fixture_data["language"]
    assert dumped["durationSeconds"] == fixture_data["durationSeconds"]
    assert dumped["metrics"]["wpm"] == fixture_data["metrics"]["wpm"]
    assert dumped["metrics"]["fillerWordCount"] == fixture_data["metrics"]["fillerWordCount"]
    assert dumped["metrics"]["fillerWords"] == fixture_data["metrics"]["fillerWords"]
    assert dumped["metrics"]["pauseCount"] == fixture_data["metrics"]["pauseCount"]
    assert (
        dumped["metrics"]["totalPauseDurationSeconds"]
        == fixture_data["metrics"]["totalPauseDurationSeconds"]
    )
    assert (
        dumped["metrics"]["speechDurationSeconds"]
        == fixture_data["metrics"]["speechDurationSeconds"]
    )
    assert dumped["metrics"]["confidenceScore"] == fixture_data["metrics"]["confidenceScore"]
    assert len(dumped["words"]) == len(fixture_data["words"])
    assert dumped["words"][0]["word"] == fixture_data["words"][0]["word"]


def test_tts_request_conforms_to_fixture():
    fixture_path = Path(__file__).parents[2] / "contracts" / "fixtures" / "tts-request.fixture.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    instance = TTSRequest(**fixture_data)
    dumped = instance.model_dump(by_alias=True)

    assert dumped["text"] == fixture_data["text"]
    assert dumped["language"] == fixture_data["language"]
    assert dumped["voice"] == fixture_data["voice"]
    assert dumped["speed"] == fixture_data["speed"]


def test_error_envelope_conforms_to_fixture():
    fixture_path = (
        Path(__file__).parents[2] / "contracts" / "fixtures" / "error-envelope.fixture.json"
    )
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    instance = ErrorResponse(
        success=fixture_data["success"],
        error_code=fixture_data["errorCode"],
        message=fixture_data["message"],
        details=fixture_data["details"],
    )
    dumped = instance.model_dump(by_alias=True)

    assert dumped["success"] == fixture_data["success"]
    assert dumped["errorCode"] == fixture_data["errorCode"]
    assert dumped["message"] == fixture_data["message"]
    assert dumped["details"] == fixture_data["details"]


def test_rag_embed_response_conforms_to_fixture():
    fixture_path = (
        Path(__file__).parents[2] / "contracts" / "fixtures" / "rag-embed-response.fixture.json"
    )
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixture_data = json.load(f)

    instance = EmbedResponse.model_validate(fixture_data)
    dumped = instance.model_dump(by_alias=True)

    assert set(dumped.keys()) == {"vectors", "dimension", "model"}
    assert dumped == fixture_data
    assert all(len(v) == fixture_data["dimension"] for v in dumped["vectors"])

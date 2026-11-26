import pytest
from app.core.exceptions import AIException
from app.services.stt.audio_decoder import AudioDecoder
from app.services.stt.metrics_extractor import MetricsExtractor
from app.services.stt.vad_filter import SileroVADFilter
import numpy as np
from fastapi.testclient import TestClient


def test_decode_empty_bytes_raises_exception():
    with pytest.raises(AIException) as exc_info:
        AudioDecoder.decode_to_pcm_float32(b"")
    assert exc_info.value.error_code == "AUDIO_EMPTY"


def test_decode_corrupted_bytes_raises_exception():
    with pytest.raises(AIException) as exc_info:
        AudioDecoder.decode_to_pcm_float32(b"corrupted-invalid-audio-bytes-not-av-container")
    assert exc_info.value.error_code == "AUDIO_CORRUPTED"


def test_metrics_extractor_wpm_calculation():
    text = "Tôi là lập trình viên backend có kinh nghiệm về hệ thống phân tán và docker."
    # 16 từ trong 6.5s -> (16 / (6.5 / 60)) = 148 WPM
    metrics = MetricsExtractor.extract_metrics(
        text=text,
        speech_duration_seconds=6.5,
        pause_count=1,
        total_pause_duration_seconds=1.5,
        words_metadata=[],
        language="vi",
    )
    assert metrics.wpm == 148
    assert metrics.pause_count == 1
    assert metrics.total_pause_duration_seconds == 1.5


def test_filler_words_detection_bilingual():
    text = "Ừm thì tôi nghĩ là dự án này basically rất là phức tạp like kiến trúc microservices."
    metrics = MetricsExtractor.extract_metrics(
        text=text,
        speech_duration_seconds=10.0,
        pause_count=0,
        total_pause_duration_seconds=0.0,
        words_metadata=[],
        language="vi",
    )
    assert metrics.filler_word_count >= 3
    assert "ừm" in metrics.filler_words
    assert "basically" in metrics.filler_words
    assert "like" in metrics.filler_words


def test_vad_filter_empty_audio():
    vad = SileroVADFilter.get_instance()
    res = vad.process(np.array([], dtype=np.float32))
    assert res.has_speech is False
    assert res.speech_duration_seconds == 0.0


def test_stt_transcribe_unauthorized(client: TestClient):
    response = client.post(
        "/api/v1/stt/transcribe",
        files={"file": ("test.wav", b"fake-bytes", "audio/wav")},
    )
    assert response.status_code == 401
    assert response.json()["errorCode"] == "INVALID_INTERNAL_SECRET"

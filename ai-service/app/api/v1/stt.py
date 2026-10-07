from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.core.exceptions import AIException
from app.core.security import verify_internal_secret
from app.schemas.stt import STTResponse, STTWordTimestamp
from app.services.stt.audio_decoder import AudioDecoder
from app.services.stt.metrics_extractor import MetricsExtractor
from app.services.stt.vad_filter import SileroVADFilter
from app.services.stt.whisper_engine import WhisperEngine

router = APIRouter(prefix="/stt", tags=["Speech-To-Text"])


@router.post(
    "/transcribe",
    response_model=STTResponse,
    dependencies=[Depends(verify_internal_secret)],
    summary="Giải mã In-Memory và Trích xuất Transcript kèm Voice Metrics",
)
async def transcribe_audio(
    file: UploadFile = File(..., description="File binary audio từ client (WebM/WAV/MP4)"),
    language: str = Form(default="vi", description="Ngôn ngữ nhận diện: vi | en"),
    vad_filter: bool = Form(default=True, description="Kích hoạt bộ lọc Silero VAD"),
) -> STTResponse:
    # 1. Đọc audio buffer vào bộ nhớ
    audio_bytes = await file.read()

    # 2. Giải mã bằng PyAV in-memory sang Float32 16kHz
    pcm_array, total_duration = AudioDecoder.decode_to_pcm_float32(audio_bytes)

    # 3. Lọc VAD và đo khoảng lặng
    if vad_filter:
        vad_engine = SileroVADFilter.get_instance()
        vad_res = vad_engine.process(pcm_array)

        if not vad_res.has_speech:
            raise AIException(
                error_code="NO_SPEECH_DETECTED",
                message="Không phát hiện thấy âm thanh giọng nói rõ ràng trong bản ghi.",
                status_code=400,
            )

        processed_audio = vad_res.cleaned_audio
        speech_duration = vad_res.speech_duration_seconds
        pause_count = vad_res.pause_count
        pause_duration = vad_res.total_pause_duration_seconds
    else:
        processed_audio = pcm_array
        speech_duration = total_duration
        pause_count = 0
        pause_duration = 0.0

    # 4. Nhận diện giọng nói qua faster-whisper
    whisper_engine = WhisperEngine.get_instance()
    text, words_data = whisper_engine.transcribe(processed_audio, language=language)

    # 5. Khai phá bộ chỉ số âm học
    metrics = MetricsExtractor.extract_metrics(
        text=text,
        speech_duration_seconds=speech_duration,
        pause_count=pause_count,
        total_pause_duration_seconds=pause_duration,
        words_metadata=words_data,
        language=language,
    )

    words_models = [STTWordTimestamp(**w) for w in words_data] if words_data else []

    return STTResponse(
        text=text,
        language=language,
        duration_seconds=total_duration,
        metrics=metrics,
        words=words_models,
    )

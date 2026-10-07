from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.exceptions import AIException
from app.core.security import verify_internal_secret
from app.schemas.tts import TTSRequest
from app.services.tts.tts_manager import TTSManager

router = APIRouter(prefix="/tts", tags=["Text-To-Speech"])


@router.post(
    "/synthesize",
    dependencies=[Depends(verify_internal_secret)],
    summary="Tổng hợp Giọng nói Đa ngữ Truyền phát (Chunked Audio Stream)",
)
async def synthesize_speech(
    request: TTSRequest,
) -> StreamingResponse:
    if not request.text or len(request.text.strip()) == 0:
        raise AIException(
            error_code="EMPTY_TEXT_SYNTHESIS",
            message="Nội dung văn bản yêu cầu đọc không được để trống.",
            status_code=422,
        )

    if len(request.text) > 1000:
        raise AIException(
            error_code="TEXT_TOO_LONG",
            message="Độ dài văn bản vượt quá giới hạn tối đa 1.000 ký tự cho một câu hỏi.",
            status_code=413,
        )

    audio_stream, media_type, engine_used = await TTSManager.synthesize(request)

    # Ước tính thời lượng phát âm (trung bình 1 từ ~ 0.4s)
    word_count = len(request.text.split())
    estimated_duration = round(word_count * 0.4 / (request.speed or 1.0), 1)

    headers = {
        "X-TTS-Engine": engine_used,
        "X-Audio-Duration-Seconds": str(estimated_duration),
        "Cache-Control": "public, max-age=86400",
    }

    return StreamingResponse(
        audio_stream,
        media_type=media_type,
        headers=headers,
    )

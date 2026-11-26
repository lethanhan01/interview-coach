from typing import AsyncGenerator
import edge_tts
import structlog
from app.core.exceptions import AIException

logger = structlog.get_logger()

SUPPORTED_VOICES = {
    "vi-VN-HoaiMyNeural": "Nữ - Giọng Bắc truyền cảm",
    "vi-VN-NamMinhNeural": "Nam - Giọng Nam ấm áp",
    "en-US-AriaNeural": "Nữ - Tiếng Anh tự nhiên",
    "en-US-GuyNeural": "Nam - Tiếng Anh tự nhiên",
}


class EdgeTTSEngine:
    @staticmethod
    async def generate_audio_stream(
        text: str,
        voice: str = "vi-VN-HoaiMyNeural",
        speed: float = 1.0,
    ) -> AsyncGenerator[bytes, None]:
        """
        Truyền phát âm thanh chunked MP3 trực tiếp từ Microsoft Edge Neural TTS.
        """
        if voice not in SUPPORTED_VOICES:
            voice = "vi-VN-HoaiMyNeural"

        rate_percent = int((speed - 1.0) * 100)
        rate_str = f"{rate_percent:+d}%"

        try:
            communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            logger.exception("edge_tts_stream_error", error=str(e), voice=voice)
            raise AIException(
                error_code="TTS_UPSTREAM_ERROR",
                message="Dịch vụ tổng hợp giọng nói gián đoạn kết nối mạng ra máy chủ TTS.",
                status_code=502,
                details={"error": str(e)},
            )

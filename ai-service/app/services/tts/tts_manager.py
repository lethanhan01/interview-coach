from typing import AsyncGenerator
import structlog
from app.schemas.tts import TTSRequest
from app.services.tts.edge_tts_engine import EdgeTTSEngine

logger = structlog.get_logger()


class TTSManager:
    @staticmethod
    async def synthesize(request: TTSRequest) -> tuple[AsyncGenerator[bytes, None], str, str]:
        """
        Điều phối tổng hợp giọng nói dựa trên mã ngôn ngữ.
        Trả về: (audio_generator, content_type, engine_used)
        """
        text = request.text.strip()
        lang = request.language.lower()
        speed = request.speed or 1.0

        if lang == "en":
            voice = request.voice or "af_heart"
            try:
                from app.services.tts.kokoro_engine import KokoroEngine

                logger.info("dispatching_tts_kokoro_en", voice=voice, speed=speed)
                engine = KokoroEngine.get_instance()
                generator = engine.generate_audio_stream(text=text, voice=voice, speed=speed)
                return generator, "audio/wav", "kokoro"
            except Exception as e:
                logger.warn(
                    "kokoro_unavailable_falling_back_to_edge_tts_en",
                    error=str(e),
                )
                fallback_voice = "en-US-AriaNeural"
                generator = EdgeTTSEngine.generate_audio_stream(
                    text=text, voice=fallback_voice, speed=speed
                )
                return generator, "audio/mpeg", "edge-tts-fallback"

        # Mặc định tiếng Việt
        voice = request.voice or "vi-VN-HoaiMyNeural"
        logger.info("dispatching_tts_edge_vi", voice=voice, speed=speed)
        generator = EdgeTTSEngine.generate_audio_stream(text=text, voice=voice, speed=speed)
        return generator, "audio/mpeg", "edge-tts"

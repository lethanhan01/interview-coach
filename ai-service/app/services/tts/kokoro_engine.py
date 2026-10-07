import io
import threading
from typing import AsyncGenerator
import numpy as np
import soundfile as sf
import structlog

logger = structlog.get_logger()

KOKORO_SAMPLE_RATE = 24000


class KokoroEngine:
    _instance: "KokoroEngine | None" = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self):
        logger.info("initializing_kokoro_tts_pipeline")
        from kokoro import KPipeline

        # Khởi tạo pipeline phát âm tiếng Anh ('a' = American English)
        self.pipeline = KPipeline(lang_code="a")
        logger.info("kokoro_tts_pipeline_initialized")

    @classmethod
    def get_instance(cls) -> "KokoroEngine":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    async def generate_audio_stream(
        self,
        text: str,
        voice: str = "af_heart",
        speed: float = 1.0,
    ) -> AsyncGenerator[bytes, None]:
        """
        Sinh luồng âm thanh WAV theo từng chunk nhị phân để giảm Time-To-First-Byte (TTFB).
        """
        try:
            generator = self.pipeline(
                text,
                voice=voice,
                speed=speed,
                split_pattern=r"\n+",
            )

            for _graphemes, _phonemes, audio in generator:
                if isinstance(audio, np.ndarray) and len(audio) > 0:
                    buffer = io.BytesIO()
                    sf.write(
                        buffer,
                        audio,
                        samplerate=KOKORO_SAMPLE_RATE,
                        format="WAV",
                        subtype="PCM_16",
                    )
                    buffer.seek(0)
                    yield buffer.read()
        except Exception as e:
            logger.exception("kokoro_synthesis_failed", error=str(e), text=text[:50])
            raise e

import threading
from typing import Any
import numpy as np
from faster_whisper import WhisperModel
import structlog
from app.core.config import get_settings

logger = structlog.get_logger()


class WhisperEngine:
    _instance: "WhisperEngine | None" = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self):
        settings = get_settings()
        self.device = settings.whisper_device
        self.compute_type = settings.whisper_compute_type
        self.model_size = settings.whisper_model_size

        logger.info(
            "initializing_faster_whisper",
            modelSize=self.model_size,
            device=self.device,
            computeType=self.compute_type,
        )

        self.model = WhisperModel(
            self.model_size,
            device=self.device,
            compute_type=self.compute_type,
            cpu_threads=settings.whisper_threads,
        )
        logger.info("faster_whisper_initialized")

    @classmethod
    def get_instance(cls) -> "WhisperEngine":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def warmup(self) -> None:
        """Kích hoạt nạp trọng số và suy luận thử 1s âm thanh tĩnh."""
        dummy_audio = np.zeros(16000, dtype=np.float32)
        try:
            self.model.transcribe(dummy_audio, language="en", beam_size=1)
            logger.info("whisper_engine_warmed_up")
        except Exception as e:
            logger.warn("whisper_warmup_warning", error=str(e))

    def transcribe(
        self,
        audio_array: np.ndarray,
        language: str = "vi",
    ) -> tuple[str, list[dict[str, Any]]]:
        """
        Thực hiện Beam Search nhận diện ngữ âm và trích xuất word-level timestamps.
        """
        segments, _ = self.model.transcribe(
            audio_array,
            language=language,
            beam_size=5,
            word_timestamps=True,
            vad_filter=False,  # Đã lọc qua VADFilter trước đó
            temperature=0.0,
        )

        full_text_list: list[str] = []
        words_metadata: list[dict[str, Any]] = []

        for seg in segments:
            full_text_list.append(seg.text.strip())
            if seg.words:
                for w in seg.words:
                    words_metadata.append(
                        {
                            "word": w.word.strip(),
                            "start": round(w.start, 2),
                            "end": round(w.end, 2),
                            "probability": round(w.probability, 4),
                        }
                    )

        full_transcript = " ".join(full_text_list).strip()
        return full_transcript, words_metadata

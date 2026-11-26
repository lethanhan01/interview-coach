from dataclasses import dataclass
import numpy as np
import torch
import structlog
from app.core.config import get_settings

logger = structlog.get_logger()

PAUSE_THRESHOLD_SECONDS = 1.2  # Khoảng lặng tính là ngập ngừng (> 1.2s)


@dataclass
class VADResult:
    cleaned_audio: np.ndarray
    speech_duration_seconds: float
    pause_count: int
    total_pause_duration_seconds: float
    has_speech: bool


class SileroVADFilter:
    _instance: "SileroVADFilter | None" = None

    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.get_speech_timestamps = None

        try:
            logger.info("loading_silero_vad_model")
            self.model, utils = torch.hub.load(
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
                onnx=False,
            )
            self.get_speech_timestamps = utils[0]
            self.model.eval()
            logger.info("silero_vad_model_loaded")
        except Exception as e:
            logger.warn("silero_vad_load_failed_using_energy_fallback", error=str(e))
            self.model = None

    @classmethod
    def get_instance(cls) -> "SileroVADFilter":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def process(self, audio_array: np.ndarray, sample_rate: int = 16000) -> VADResult:
        if len(audio_array) == 0:
            return VADResult(
                cleaned_audio=np.array([], dtype=np.float32),
                speech_duration_seconds=0.0,
                pause_count=0,
                total_pause_duration_seconds=0.0,
                has_speech=False,
            )

        if self.model is not None and self.get_speech_timestamps is not None:
            return self._process_silero(audio_array, sample_rate)
        return self._process_energy_fallback(audio_array, sample_rate)

    def _process_silero(self, audio_array: np.ndarray, sample_rate: int) -> VADResult:
        tensor_audio = torch.from_numpy(audio_array)
        speech_timestamps = self.get_speech_timestamps(
            tensor_audio,
            self.model,
            threshold=self.settings.vad_threshold,
            sampling_rate=sample_rate,
            min_speech_duration_ms=self.settings.min_speech_duration_ms,
            min_silence_duration_ms=self.settings.min_silence_duration_ms,
        )

        if not speech_timestamps:
            return VADResult(
                cleaned_audio=np.array([], dtype=np.float32),
                speech_duration_seconds=0.0,
                pause_count=0,
                total_pause_duration_seconds=0.0,
                has_speech=False,
            )

        speech_chunks = []
        pause_count = 0
        total_pause_duration = 0.0

        for i, ts in enumerate(speech_timestamps):
            start = ts["start"]
            end = ts["end"]
            speech_chunks.append(audio_array[start:end])

            if i > 0:
                prev_end = speech_timestamps[i - 1]["end"]
                silence_gap = (start - prev_end) / sample_rate
                if silence_gap >= PAUSE_THRESHOLD_SECONDS:
                    pause_count += 1
                    total_pause_duration += silence_gap

        cleaned_audio = (
            np.concatenate(speech_chunks) if speech_chunks else np.array([], dtype=np.float32)
        )
        speech_duration = round(float(len(cleaned_audio) / sample_rate), 2)

        return VADResult(
            cleaned_audio=cleaned_audio,
            speech_duration_seconds=speech_duration,
            pause_count=pause_count,
            total_pause_duration_seconds=round(total_pause_duration, 2),
            has_speech=True,
        )

    def _process_energy_fallback(self, audio_array: np.ndarray, sample_rate: int) -> VADResult:
        """Fallback phát hiện tiếng nói dựa trên năng lượng RMS khi offline."""
        frame_len = int(sample_rate * 0.03)  # 30ms frames
        if frame_len == 0:
            frame_len = 1

        num_frames = len(audio_array) // frame_len
        if num_frames == 0:
            return VADResult(audio_array, round(len(audio_array) / sample_rate, 2), 0, 0.0, True)

        rms_values = [
            float(np.sqrt(np.mean(audio_array[i * frame_len : (i + 1) * frame_len] ** 2)))
            for i in range(num_frames)
        ]
        threshold = max(np.mean(rms_values) * 0.4, 0.005)

        is_speech = [r > threshold for r in rms_values]
        if not any(is_speech):
            return VADResult(np.array([], dtype=np.float32), 0.0, 0, 0.0, False)

        speech_chunks = []
        pause_count = 0
        total_pause_duration = 0.0
        in_speech = False
        silence_start = None

        for idx, speech in enumerate(is_speech):
            chunk = audio_array[idx * frame_len : (idx + 1) * frame_len]
            if speech:
                speech_chunks.append(chunk)
                if not in_speech:
                    in_speech = True
                    if silence_start is not None:
                        gap_sec = (idx - silence_start) * 0.03
                        if gap_sec >= PAUSE_THRESHOLD_SECONDS:
                            pause_count += 1
                            total_pause_duration += gap_sec
                        silence_start = None
            else:
                if in_speech:
                    in_speech = False
                    silence_start = idx

        cleaned = np.concatenate(speech_chunks) if speech_chunks else audio_array
        duration = round(float(len(cleaned) / sample_rate), 2)
        return VADResult(cleaned, duration, pause_count, round(total_pause_duration, 2), True)

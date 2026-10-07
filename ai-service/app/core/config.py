from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Settings
    app_env: Literal["development", "staging", "production"] = "development"
    port: int = 8000
    host: str = "0.0.0.0"
    log_level: str = "INFO"

    # Inter-Service Authentication Secret
    internal_ai_secret: str = Field(
        default="interviewai-super-secret-dev-key-change-in-prod",
        description="Khóa bảo mật bắt buộc trong header x-internal-secret đối soát với NestJS",
    )

    # STT Engine (faster-whisper)
    whisper_model_size: str = Field(
        default="small",
        description="Kích thước model whisper: tiny, base, small, medium, large-v3",
    )
    whisper_device: Literal["cpu", "cuda"] = "cpu"
    whisper_compute_type: Literal["int8", "float16", "float32"] = "int8"
    whisper_threads: int = 4

    # VAD Configuration (Silero VAD)
    vad_threshold: float = 0.5
    min_speech_duration_ms: int = 250
    min_silence_duration_ms: int = 500

    # TTS Configuration
    kokoro_voice_default: str = "af_heart"
    edge_tts_vi_voice_default: str = "vi-VN-HoaiMyNeural"


@lru_cache
def get_settings() -> Settings:
    return Settings()

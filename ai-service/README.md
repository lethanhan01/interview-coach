# Intervia Compute Engine (`ai-service`)

Dedicated Stateless AI Compute Microservice for STT (faster-whisper), Hybrid TTS (Kokoro-82M EN & Edge-TTS VI), and advanced voice metrics extraction.

## Chạy Local Development với `uv`
```bash
cd ai-service
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Chạy Kiểm thử
```bash
uv run pytest
```

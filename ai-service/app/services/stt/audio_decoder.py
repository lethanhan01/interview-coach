import io
import av
import numpy as np
import structlog
from app.core.exceptions import AIException

logger = structlog.get_logger()

TARGET_SAMPLE_RATE = 16000


class AudioDecoder:
    """
    Giải mã binary buffer (WebM, WAV, MP4, OGG) trực tiếp trong RAM thành
    mảng NumPy 1D Mono Float32 ở tần số 16.000 Hz.
    """

    @staticmethod
    def decode_to_pcm_float32(audio_bytes: bytes) -> tuple[np.ndarray, float]:
        if not audio_bytes or len(audio_bytes) == 0:
            raise AIException(
                error_code="AUDIO_EMPTY",
                message="Dữ liệu âm thanh nhận được rỗng (0 bytes).",
                status_code=400,
            )

        try:
            input_buffer = io.BytesIO(audio_bytes)
            container = av.open(input_buffer)
        except Exception as e:
            logger.warn("pyav_open_failed", error=str(e), size=len(audio_bytes))
            raise AIException(
                error_code="AUDIO_CORRUPTED",
                message="Không thể mở hoặc phân tích định dạng container của tệp âm thanh.",
                status_code=400,
                details={"decoderError": str(e)},
            )

        try:
            audio_stream = next(s for s in container.streams if s.type == "audio")
        except StopIteration:
            raise AIException(
                error_code="AUDIO_NO_STREAM",
                message="Không tìm thấy stream âm thanh hợp lệ trong tệp tải lên.",
                status_code=400,
            )

        resampler = av.AudioResampler(
            format="flt",
            layout="mono",
            rate=TARGET_SAMPLE_RATE,
        )

        frames_data: list[np.ndarray] = []

        try:
            for frame in container.decode(audio_stream):
                resampled_frames = resampler.resample(frame)
                for r_frame in resampled_frames:
                    arr = r_frame.to_ndarray()
                    frames_data.append(arr.flatten())
        except Exception as e:
            logger.warn("pyav_decode_frame_error", error=str(e))
            raise AIException(
                error_code="AUDIO_DECODE_ERROR",
                message="Lỗi trong quá trình giải mã các gói tin âm thanh trong bộ nhớ.",
                status_code=400,
                details={"error": str(e)},
            )
        finally:
            container.close()

        if not frames_data:
            raise AIException(
                error_code="AUDIO_EMPTY_FRAMES",
                message="Tệp âm thanh không chứa khung dữ liệu PCM hợp lệ.",
                status_code=400,
            )

        pcm_array = np.concatenate(frames_data).astype(np.float32)

        # Chuẩn hóa giá trị tín hiệu âm thanh vào khoảng [-1.0, 1.0]
        max_abs = np.max(np.abs(pcm_array))
        if max_abs > 1.0:
            pcm_array = pcm_array / max_abs

        duration_seconds = round(float(len(pcm_array) / TARGET_SAMPLE_RATE), 2)
        return pcm_array, duration_seconds

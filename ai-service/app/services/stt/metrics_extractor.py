import re
from typing import Any
from app.schemas.stt import VoiceMetrics

# Danh mục từ đệm kỹ thuật song ngữ
FILLER_WORDS_VI = [
    r"\bừm\b",
    r"\bừ\b",
    r"\bà\b",
    r"\bthì\b",
    r"\blà\b",
    r"\bkiểu như\b",
    r"\bdạ thì\b",
    r"\bnói chung là\b",
    r"\bcơ mà\b",
    r"\bvới lại\b",
    r"\bthế nên là\b",
]

FILLER_WORDS_EN = [
    r"\buh\b",
    r"\bum\b",
    r"\blike\b",
    r"\byou know\b",
    r"\bactually\b",
    r"\bbasically\b",
    r"\bliterally\b",
    r"\bright\b",
    r"\bsort of\b",
    r"\bkind of\b",
]


class MetricsExtractor:
    @staticmethod
    def extract_metrics(
        text: str,
        speech_duration_seconds: float,
        pause_count: int,
        total_pause_duration_seconds: float,
        words_metadata: list[dict[str, Any]],
        language: str = "vi",
    ) -> VoiceMetrics:
        # 1. Đếm tổng số từ
        words = re.findall(r"\w+", text.lower())
        word_count = len(words)

        # 2. Tính WPM trên thời lượng phát âm thực tế
        effective_duration_minutes = max(speech_duration_seconds, 1.0) / 60.0
        wpm = int(round(word_count / effective_duration_minutes)) if word_count > 0 else 0

        # 3. Quét phát hiện từ đệm song ngữ
        detected_fillers: list[str] = []
        filler_patterns = FILLER_WORDS_VI if language == "vi" else FILLER_WORDS_EN
        if language == "vi":
            filler_patterns = FILLER_WORDS_VI + [r"\buh\b", r"\bum\b", r"\blike\b", r"\bbasically\b"]

        lowered_text = text.lower()
        for pattern in filler_patterns:
            matches = re.findall(pattern, lowered_text)
            if matches:
                detected_fillers.extend(matches)

        # 4. Tính toán Confidence Score trung bình
        if words_metadata:
            probs = [w["probability"] for w in words_metadata if "probability" in w]
            avg_prob = float(sum(probs) / len(probs)) if probs else 0.9
            confidence_score = round(avg_prob * 100.0, 1)
        else:
            confidence_score = 90.0 if word_count > 0 else 0.0

        return VoiceMetrics(
            wpm=wpm,
            filler_word_count=len(detected_fillers),
            filler_words=detected_fillers,
            pause_count=pause_count,
            total_pause_duration_seconds=total_pause_duration_seconds,
            speech_duration_seconds=speech_duration_seconds,
            confidence_score=confidence_score,
        )

# US-007: Submit interview answer — voice or text

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-04
**Status**: Draft

## Story

As a Candidate,
I want to answer each interview question by speaking or by typing,
So that I can practice in the format closest to a real interview or adapt to my current environment.

## Acceptance Criteria

- AC1 (positive — voice): Given a Candidate clicks "Bắt đầu ghi âm" and speaks, when they click "Dừng ghi âm", then the transcript appears within 5 seconds and voice metrics (WPM, filler word count, pause count) are displayed alongside the transcript.
- AC2 (positive — text): Given a Candidate clicks "Trả lời bằng văn bản", types an answer, and clicks "Gửi câu trả lời", then the answer is saved with voice_metrics=null and the session proceeds to follow-up evaluation.
- AC3 (negative — mic blocked): Given microphone permission is denied by the browser, when the Candidate clicks "Bắt đầu ghi âm", then a guidance popup explaining how to grant microphone access appears and the text input path is activated automatically.
- AC4 (negative — Whisper timeout): Given Whisper API does not respond within 10 seconds, when the timeout triggers, then the Candidate sees "Chuyển đổi giọng nói gặp sự cố. Nhập văn bản?" and text input is activated.
- AC5 (boundary — voice metrics accuracy): Given a recorded answer is transcribed, when WPM and filler word count are computed, then the computed values deviate ≤10% from a ground-truth manual count on the same recording.

## INVEST Check

- [x] **I**ndependent — answer submission là core loop step; không phụ thuộc story nào chưa done
- [x] **N**egotiable — AC5 (voice metrics accuracy) có thể relax threshold hoặc defer sang V&V phase
- [x] **V**aluable — answering questions là hành động cốt lõi của toàn bộ app
- [x] **E**stimable — Voice: MediaRecorder + Whisper integration; Text: standard form — estimable
- [x] **S**mall — 2 paths (voice/text) có thể implement song song; mỗi path độc lập
- [x] **T**estable — AC1: timer + transcript text; AC2: DB record; AC3/AC4: error state; AC5: E2E với known audio

## Notes / Open Questions

- Filler words danh sách: ["ừm", "à", "thì", "ý là", "kiểu như", "um", "uh", "like", "you know"] — từ UC-04 Giai đoạn 2A bước 7. Danh sách này đủ chưa? Flag cho design phase.
- AC5: "ground-truth manual count" cần test fixture — ai sẽ tạo và maintain? Nên xác định trong test plan.
- Auto-stop sau 5 phút (UC-04 Giai đoạn 2A bước 4) — không cần AC riêng vì đây là safeguard, không phải feature chính.

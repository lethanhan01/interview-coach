# US-009: Practice vs. Exam mode behavior

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-04
**Status**: Draft

## Story

As a Candidate,
I want to choose between practice mode (with hints and pause) and exam mode (timed, no assistance),
So that I can both learn with guidance and test myself under interview-like pressure.

## Acceptance Criteria

- AC1 (positive — practice mode): Given mode=practice, when the interview is active, then the Pause button and Hint button are visible and functional; pressing Hint returns 1–2 directional sentences without revealing the full model answer.
- AC2 (positive — exam mode): Given mode=exam, when the interview is active, then neither the Pause button nor the Hint button is visible on screen.
- AC3 (positive — exam timer warning): Given mode=exam and ≤30 seconds remain for the current question, when the timer reaches that threshold, then the AI displays "Còn 30 giây, em chốt ý chính" once.
- AC4 (boundary — exam auto-submit): Given mode=exam and the per-question time limit expires, when the timer reaches 0, then whatever text or audio the Candidate has produced is automatically submitted and the session advances to the next question without Candidate action.

## INVEST Check

- [x] **I**ndependent — mode behavior có thể test ngay khi interview session UI có (sau US-007)
- [x] **N**egotiable — AC4 (auto-submit on timeout) có thể simplify thành "skip question" nếu audio auto-submit phức tạp
- [x] **V**aluable — exam mode tạo realistic pressure; practice mode giúp học có scaffolding
- [x] **E**stimable — mode flag đơn giản; timer logic chuẩn; auto-submit phụ thuộc audio pipeline
- [x] **S**mall — hoàn thành trong 1 sprint; AC3/AC4 gộp với timer implementation
- [x] **T**estable — AC1/AC2: DOM element visibility; AC3: inject mock timer; AC4: E2E với real timeout

## Notes / Open Questions

- AC3: "AI displays" — hiển thị dưới dạng toast, inline message, hay AI bubble? Chưa spec trong UC-04. Flag cho UI/UX phase.
- mode được lưu vào `interview_sessions.mode` (UC-03 AC-03-7). Verify: khi mode=exam, session config ghi đúng để UC-04 đọc và ẩn buttons — cross-story consistency, test ở E2E.
- Practice mode Hint: "1–2 directional sentences, not full model answer" — đây là output constraint cho AI prompt. Cần include trong Feedback Analyzer prompt engineering. Flag cho design phase.

# US-013: Rewrite answer and compare improvement

**Persona**: Candidate
**Priority**: SHOULD
**Story points**: TBD
**Related UC**: UC-07
**Status**: Draft

## Story

As a Candidate,
I want to re-answer a question after seeing AI feedback and view a side-by-side comparison of my original and improved answer with a score delta,
So that I can practice iterative improvement and see measurable progress.

## Acceptance Criteria

- AC1 (positive — comparison layout): Given a Candidate clicks "Luyện lại câu này" and submits a rewrite (voice or text), when the comparison loads, then the left column shows the original annotated transcript + original score and the right column shows the new annotated transcript + new score.
- AC2 (positive — delta badge states): Given the comparison loads, when the delta score is computed:
  - delta > 10: badge is green-dark with text "Cải thiện rõ rệt!"
  - delta 1–10: badge is green-light with text "Có cải thiện"
  - delta = 0: badge is yellow with text "Chưa thay đổi nhiều — xem gợi ý bên trái"
  - delta < 0: badge is orange with text "Điểm giảm — xem lại annotation gốc"
- AC3 (boundary — attempt limit): Given a Candidate has made 5 rewrite attempts for a question, when they view the comparison page for that question, then the "Thử lại" button is replaced by "Đã đạt tối đa" (non-clickable).
- AC4 (negative — Feedback Analyzer timeout on rewrite): Given the Feedback Analyzer does not respond during rewrite evaluation, when the timeout triggers, then the rewrite transcript is saved, the Candidate sees "Đang xử lý...", and one automatic retry occurs after 5 seconds.

## INVEST Check

- [x] **I**ndependent — UC-07 là optional loop từ UC-06; không block any other story
- [x] **N**egotiable — AC3 (max 5 attempts) có thể adjust; "So sánh tất cả" timeline view (AF-07-C) là negotiable
- [x] **V**aluable — Rewrite & Compare là unique learning loop; directly addresses core user need (improvement tracking)
- [x] **E**stimable — 2-column layout + delta badge + re-run Feedback Analyzer — estimable
- [ ] **S**mall — layout 2 cột + delta logic + attempt counter + retry logic là ~2 sprint work cho solo dev; xem Notes
- [x] **T**estable — AC1: DOM column check; AC2: 4 delta states với mock scores; AC3: disable button; AC4: mock timeout + verify retry

## Notes / Open Questions

- **Small concern**: Story cover 2 phases (submit rewrite + display comparison). Có thể tách: US-013a "Submit rewrite answer" + US-013b "View comparison with delta score" nếu sprint capacity cần. Để nguyên là 1 story cho requirements clarity.
- AC2: delta badge colors (green-dark / green-light / yellow / orange) — exact hex values là UI/UX decision, không cần spec ở requirements level.
- AF-07-B (lần 3+: cột trái show lần cao điểm nhất thay vì lần trước): phức tạp hơn. Behavior này không có AC ở đây — sẽ cover trong TC nếu cần.
- `rewrite_answers` FK → `session_id` + `question_id` — data integrity verify ở integration test, không cần AC riêng.

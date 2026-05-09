# US-011: Annotated transcript and per-question feedback

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-06
**Status**: Draft

## Story

As a Candidate,
I want to see my answer transcript with color-coded highlights and an annotation popup explaining each flagged phrase,
So that I know exactly which parts of my answer were strong, which need improvement, and specifically why.

## Acceptance Criteria

- AC1 (positive — load time): Given a session is complete and UC-05 has run, when the Candidate opens the feedback view for the default (first) question, then the annotated transcript loads within 500ms.
- AC2 (positive — color coding): Given annotated segments exist, when the transcript is displayed, then segments are color-coded: green=good, yellow=warning, red=critical — each color mapping to the segment's `level` field value.
- AC3 (positive — popup content): Given the Candidate clicks or hovers a yellow or red segment, when the popup opens, then it shows: a severity label, Vấn đề (the `reason` field), Gợi ý (the `suggestion` field), and Nên nói (the `improved_version` field). All three content fields are non-empty for warning and critical segments.
- AC4 (positive — model answer): Given the feedback page is loaded, when the Candidate scrolls to the bottom of the question view, then the full Model Answer is visible and not truncated (no "Show more" that hides content by default).
- AC5 (boundary — no warnings or critical): Given a question has zero warning or critical annotated segments, when the Candidate views that question, then the "Luyện lại câu này" button is not shown.

## INVEST Check

- [x] **I**ndependent — UC-06 view là read-only; không block và không bị block bởi story khác sau UC-05
- [x] **N**egotiable — popup trigger (click vs. hover) là UI detail, negotiable
- [x] **V**aluable — annotated transcript là core differentiator của InterviewAI (Surgical Feedback)
- [x] **E**stimable — text highlight + popup UI là well-understood; data từ DB via API
- [x] **S**mall — hoàn thành trong 1 sprint; multi-question tab navigation có thể defer
- [x] **T**estable — AC1: timing measure; AC2/AC3: DOM inspect; AC4: verify full text length; AC5: conditional button

## Notes / Open Questions

- AC3: `improved_version` là non-empty "for warning and critical segments" — spec từ AC-05-2. Confirm: good segments có thể không có improved_version (null là ok). Không cần popup cho green segments.
- `start_index`/`end_index` mismatch (E-06-2): nếu index không khớp với transcript text, highlight bị skip nhưng session không crash. Không cần AC riêng — behavior transparent với user.
- Voice metrics badge (AF-06-B): "95 WPM · 4 filler words" — hiển thị nếu có voice answer. Display-only, không cần AC riêng.

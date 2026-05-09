# US-012: Comprehensive session performance report

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-06
**Status**: Draft

## Story

As a Candidate,
I want to view an overall session report covering my score, speaking metrics, competency breakdown, reverse question evaluation, and a personalized action plan,
So that I understand where I stand and what to focus on in my next practice session.

## Acceptance Criteria

- AC1 (positive — executive summary): Given a completed session, when the Candidate opens the report, then the Executive Summary section shows: overall_score (0–100), one recommendation badge from {Strong Hire / Hire / Borderline / No Hire}, ≥1 strength, ≥1 area to improve, and a disclaimer note ("Điểm mô phỏng, không phải từ nhà tuyển dụng").
- AC2 (positive — competency heatmap): Given the report is loaded, when the Candidate views the Competency Heatmap, then 5 axes are shown (Problem-solving, Communication, Technical Depth, Behavioral Maturity, Culture Fit), each scored on a [1–5] scale.
- AC3 (positive — action plan): Given the report is loaded, when the Candidate views the Action Plan, then ≥3 action items are shown; each item has a non-empty `action` field; `resource` may be null.
- AC4 (positive — action plan navigation): Given the Candidate clicks a recommended session type link in the Action Plan, when they reach the session creation page, then `session_type` and `difficulty` fields are pre-filled with the recommended values.
- AC5 (boundary — reverse questions absent): Given UC-12 was not performed or returned no reverse questions, when the report loads, then the Reverse Questions Evaluation section is completely absent (no empty card or placeholder).

## INVEST Check

- [x] **I**ndependent — report view là read-only; không block story khác
- [x] **N**egotiable — Communication Analysis section (WPM/filler stats) có thể defer nếu voice không có trong all sessions
- [x] **V**aluable — báo cáo tổng hợp giúp Candidate hiểu overall performance và next steps
- [x] **E**stimable — data đã có trong DB sau UC-05; render report là frontend-heavy, estimable
- [x] **S**mall — hoàn thành trong 1 sprint; AC4 (navigation) có thể tách nếu cần
- [x] **T**estable — AC1: check badge + score range + disclaimer text; AC2: count axes; AC3: count items; AC4: verify pre-fill; AC5: DOM section absent

## Notes / Open Questions

- AC1 recommendation thresholds: Strong Hire ≥85 / Hire 70–84 / Borderline 55–69 / No Hire <55 (từ UC-05 step 1). Thresholds này có thể điều chỉnh không? Flag cho design phase.
- Communication Analysis (UC-06 bước 12): hiển thị khi ≥1 voice answer có. Nếu toàn text session → WPM/filler không relevant — section có ẩn không? Chưa spec rõ trong UC-06. Flag.
- AC5: UC-12 (Reverse Questions) là SHOULD. Nếu chưa impl UC-12 → section luôn ẩn trong early builds — đây là expected behavior.

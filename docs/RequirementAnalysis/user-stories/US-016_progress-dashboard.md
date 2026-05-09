# US-016: Personal progress dashboard

**Persona**: Candidate
**Priority**: SHOULD
**Story points**: TBD
**Related UC**: UC-13
**Status**: Draft

## Story

As a Candidate,
I want to view my competency progress over time, track my practice streak, and replay past sessions,
So that I can identify weak areas and stay motivated to practice consistently.

## Acceptance Criteria

- AC1 (chart): Given at least 1 completed session exists, when I open the Dashboard, then a competency chart renders data from `competency_heatmap_json` of each session in chronological order, filterable by 7d/30d/all, and loads in ≤ 300ms.
- AC2 (streak): Given sessions exist on consecutive days, when I open the Dashboard, then the streak counter shows the correct consecutive-day count; the counter resets to 0 if today has no completed session.
- AC3 (recommendation): Given the most recent session has a lowest-scoring competency, when I open the Dashboard, then a recommendation card suggests 1–2 session types targeting that competency; if the Recommendation Engine returns empty, a default fallback card ("Luyện thêm session Mixed Interview") is shown.
- AC4 (replay): Given a past completed session, when I click it in the Replay Section, then I am navigated to UC-06 with that session's full feedback loaded in ≤ 300ms.

## INVEST Check

- [x] Independent — không block và không bị block bởi story nào cụ thể
- [x] Negotiable — có thể thu hẹp xuống chart-only nếu cần
- [x] Valuable — visibility vào tiến bộ là core retention mechanism
- [x] Estimable — 4 sub-features đã defined rõ ràng
- [ ] Small — CONCERN: cover 4 sub-features (chart, streak, recommendation, replay). Có thể tách thành US-016a (chart + streak) và US-016b (recommendation + replay). Giữ nguyên 1 story cho requirements clarity; tách khi sprint planning nếu cần.
- [x] Testable — AC là concrete, có thể pass/fail rõ ràng

## Notes / Open Questions

- INVEST Small flag: cùng pattern với US-013. Tách nếu sprint planning cần granularity cao hơn.
- AC3: recommendation logic là backend. QA verify qua API response, không phải UI text matching.

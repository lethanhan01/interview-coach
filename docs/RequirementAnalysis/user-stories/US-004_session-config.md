# US-004: Interview session configuration

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-03
**Status**: Draft

## Story

As a Candidate,
I want to configure interview type, number of questions, difficulty, persona, mode, duration, and language before starting,
So that each session is tailored to my specific preparation goal.

## Acceptance Criteria

- AC1 (positive): Given a Candidate configures all parameters (e.g., type=technical, 7 questions, difficulty=hard, persona=strict_senior, mode=exam, duration=45min, language=vi), when the session is created, then all values are stored correctly in interview_sessions and passed to the Question Generator.
- AC2 (positive — pre-fill difficulty): Given the Candidate has an existing placement_level, when they reach the difficulty selector, then the field is pre-filled with the matching difficulty level (remains editable).
- AC3 (positive — question order): Given configuration is saved and questions are generated, when the session starts, then questions are sorted by order_index (warm-up → core → stretch) as stored in plan_json.
- AC4 (boundary — session_type filtering): Given session_type=technical, when questions are generated, then all questions belong to the technical domain (no pure HR behavioral questions appear in a technical-only session).

## INVEST Check

- [x] **I**ndependent — configuration form độc lập với UC khác sau khi JD đã có
- [x] **N**egotiable — số lượng parameters có thể giảm cho MVP (ví dụ: bỏ persona selector)
- [x] **V**aluable — cấu hình đúng loại phỏng vấn là điều kiện để practice có ý nghĩa
- [x] **E**stimable — form với dropdowns/toggles là standard; question_type filtering phụ thuộc Question Generator API
- [x] **S**mall — hoàn thành được trong 1 sprint; AC4 có thể defer sang integration test
- [x] **T**estable — AC có thể verify qua DB inspection, session config JSON, question domain check

## Notes / Open Questions

- AC2 (pre-fill): `placement_level` được set bởi UC-11 (Placement Test — COULD). Nếu UC-11 chưa impl, field này sẽ không có pre-fill — fallback là default difficulty (medium).
- "Live Coding" và "System Design" session types hiển thị với badge "Sắp ra mắt" và disabled — UC-03 Main Flow bước 3. Không cần AC riêng cho disabled states.

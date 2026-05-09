# US-015: Ask questions to AI interviewer during reverse interview phase

**Persona**: Candidate
**Priority**: SHOULD
**Story points**: TBD
**Related UC**: UC-12
**Status**: Draft

## Story

As a Candidate,
I want to ask questions to the AI interviewer (in company persona) at the end of the main interview,
So that I can practice the reverse-interview phase and receive an evaluation of my question quality in the session report.

## Acceptance Criteria

- AC1 (positive): Given UC-04 has ended and the reverse phase starts, when I submit a question (text or voice), then the AI responds in character consistent with the persona selected in UC-03.
- AC2 (scoring hidden): Given I ask a question, when the AI responds, then no quality label (Insightful / Generic / Red-flag) is visible during the reverse phase; the label appears only in the Reverse Questions Evaluation section of the session report (UC-06).
- AC3 (limit): Given I have already submitted 3 questions, when I attempt a 4th, then the UI disables the input field and the API rejects the request with HTTP 400.
- AC4 (skip): Given the reverse phase starts, when I press "Không, cảm ơn", then no questions are recorded and the session proceeds to the closing phase with no side effects.

## INVEST Check

- [x] Independent — không block và không bị block bởi story nào cụ thể
- [x] Negotiable — số câu tối đa (1–3) có thể thu hẹp
- [x] Valuable — luyện kỹ năng đặt câu hỏi ngược — gap thường gặp của fresher
- [x] Estimable — bounded interaction loop (max 3 rounds), 1 AI call/round
- [x] Small — single interaction loop
- [x] Testable — AC là concrete, có thể pass/fail rõ ràng

## Notes / Open Questions

- AC1 testability: "in-character" response yêu cầu rubric định tính. QA phải định nghĩa test criteria trong TC phase (tương tự US-005 AC1/AC2).
- Scoring chạy server-side, không expose trong UC-12; verify qua UC-06 output trong TC phase.

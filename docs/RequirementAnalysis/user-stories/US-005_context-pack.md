# US-005: Context Pack selection

**Persona**: Candidate
**Priority**: SHOULD
**Story points**: TBD
**Related UC**: UC-03b
**Status**: Draft

## Story

As a Candidate,
I want to choose between a Vietnamese and a Western/International interview Context Pack,
So that the AI evaluates my answers against the cultural norms and expectations of the company I am targeting.

## Acceptance Criteria

- AC1 (positive — VN pack): Given a Candidate selects the VN Context Pack and completes a session, when they view questions and feedback, then the content emphasizes teamwork, respect, and long-term commitment over individual impact metrics.
- AC2 (positive — Western pack): Given a Candidate selects the Western Context Pack and completes a session, when they view questions and feedback, then the content expects STAR structure, quantified results, and first-person ownership ("I did", not "we did").
- AC3 (negative): Given the Candidate tries to proceed to the next step without selecting a pack, when they click Continue, then the form highlights the selection field and shows "Vui lòng chọn Context Pack...".
- AC4 (boundary — load time): Given a Candidate selects and confirms a pack, when the system saves the selection, then the rubric JSON is loaded and available within 200ms.

## INVEST Check

- [x] **I**ndependent — Context Pack selection có thể test độc lập sau khi session setup form có
- [x] **N**egotiable — preview của 1–2 rubric criteria (UC-03b bước 3) có thể bỏ trong MVP
- [x] **V**aluable — VN vs Western là differentiator cốt lõi của InterviewAI so với competitors
- [x] **E**stimable — UI: 2 radio card; backend: load rubric JSON từ DB — estimable
- [x] **S**mall — hoàn thành trong 1 sprint
- [x] **T**estable — AC1/AC2: verify rubric_json content; AC3: form validation; AC4: network timing

## Notes / Open Questions

- AC1/AC2: "emphasizes teamwork vs. individual impact" là semantic test — cần test data (cùng JD, so sánh generated questions). Testability phụ thuộc vào QA reviewer chấm qualitatively. Cần định nghĩa rõ criteria trong TC phase.
- E-03b-2: nếu `context_packs` table không query được → load rubric default (VN) từ file config tĩnh. Behavior này không cần AC riêng vì transparent với user.

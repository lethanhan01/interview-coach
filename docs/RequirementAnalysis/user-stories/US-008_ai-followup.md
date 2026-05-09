# US-008: AI follow-up questions

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-04
**Status**: Draft

## Story

As a Candidate,
I want the AI to ask targeted follow-up questions when my answer is shallow or missing key elements,
So that I practice going deeper the way a real interviewer would probe.

## Acceptance Criteria

- AC1 (positive — pronoun dilution rule): Given an answer containing ≥5 occurrences of "chúng tôi" or "nhóm" and 0 occurrences of "tôi" or "em", when the Follow-up Engine evaluates, then it generates a follow-up: "Cụ thể em đã làm gì?".
- AC2 (positive — STAR result rule): Given a behavioral answer that describes a Situation, Task, and Action but contains no Result statement, when the engine evaluates, then a follow-up question asks for the final outcome.
- AC3 (boundary — max follow-ups per question): Given an answer simultaneously triggers multiple follow-up rules, when the engine processes, then at most 2 follow-up questions are generated for that main question.
- AC4 (positive — grounded in transcript): Given a follow-up question is generated, when it is displayed, then its text contains at least one phrase extracted from the Candidate's original answer transcript.
- AC5 (negative — engine timeout): Given the Follow-up Engine does not respond, when the timeout triggers, then the session does not crash; skip_follow_up=true is set and the session proceeds to feedback generation.

## INVEST Check

- [x] **I**ndependent — Follow-up Engine chạy sau answer submission (US-007); không block story khác
- [x] **N**egotiable — số lượng rules (5 rules hiện tại) có thể giảm xuống 2–3 rules cho MVP
- [x] **V**aluable — follow-up là tính năng differentiate InterviewAI khỏi passive Q&A tools
- [x] **E**stimable — 5 rules rõ ràng, NLP/regex-based; prompt engineering cho AI follow-up — estimable
- [x] **S**mall — có thể ship với 2 rules trước, thêm rules sau; AC5 là safety net
- [x] **T**estable — AC1/AC2: fixed test transcript + assert follow-up text; AC3: trigger 3+ rules và count; AC4: string match; AC5: mock timeout

## Notes / Open Questions

- AC1: "Cụ thể em đã làm gì?" — đây là exact string hay family of similar questions? Nếu AI generates semantically similar, liệu có pass AC không? Cần clarify: exact match vs. semantic equivalence trong TC phase.
- 5 follow-up rules (UC-04 Giai đoạn 3): Rule 1 (pronoun), Rule 2 (unquantified claim), Rule 3 (missing STAR result), Rule 4 (vague without example), Rule 5 (shallow technical). AC chỉ cover Rule 1 và Rule 3 — Rules 2/4/5 sẽ cover trong Test Cases.
- Follow-up được lưu với `parent_question_id` FK — data integrity được verify trong US-011 (annotated transcript) chứ không cần AC riêng ở đây.

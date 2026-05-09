# US-006: Opening phase introduction

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-04
**Status**: Draft

## Story

As a Candidate,
I want the AI interviewer to introduce itself with its persona and ask a fixed opening question before the main questions begin,
So that the session feels like a realistic interview from the start and I can practice self-introduction.

## Acceptance Criteria

- AC1 (positive): Given a session starts with any persona (e.g., friendly_hr), when the opening phase begins, then the AI displays the persona's name and role and asks exactly: "Em hãy tự giới thiệu về bản thân và lý do em ứng tuyển vào vị trí này tại [Tên công ty]." with the extracted company name substituted.
- AC2 (positive): Given the Candidate submits an opening answer (voice or text), when it is processed, then the AI responds with 1–2 sentences (no score, no segment annotations shown) and the main question loop begins.
- AC3 (boundary — silence detection): Given the Candidate does not provide any input for 15 seconds, when the timeout triggers, then the AI displays "Em cứ thoải mái suy nghĩ, hoặc cần anh/chị làm rõ?" exactly once per question instance (the prompt does not repeat if silence continues beyond 15s).

## INVEST Check

- [x] **I**ndependent — opening phase là Giai đoạn 0 có thể verify độc lập trước main loop
- [x] **N**egotiable — TTS đọc câu hỏi (UC-04 bước 3 optional) có thể bỏ khỏi scope
- [x] **V**aluable — tạo cảm giác phỏng vấn thực tế từ đầu; practice self-introduction là kỹ năng cụ thể
- [x] **E**stimable — persona display + fixed question text + silence timer — estimable
- [x] **S**mall — hoàn thành trong 1 sprint; AC3 (silence timer) có thể defer nếu cần
- [x] **T**estable — AC1: kiểm tra câu hỏi text + company name; AC2: verify no score shown; AC3: automation trigger timer

## Notes / Open Questions

- AC1: canonical question text đã xác nhận trong UC-04 Giai đoạn 0 bước 3 và Section 2.5.4 Phase 4. Single source of truth là UC-04.
- "Tên công ty" được trích xuất từ JD bởi GPT-4o (UC-03 Main Flow — lưu vào `job_title`). Nếu extraction fail → fallback là tên UC-03 session default (không null). AC không cần cover extraction fail vì đó là UC-03's responsibility.
- Persona avatar (UC-04 Giai đoạn 0 bước 1): chỉ là display; không ảnh hưởng behavior. Không cần AC.

# US-014: Placement test for difficulty calibration

**Persona**: Candidate
**Priority**: COULD
**Story points**: TBD
**Related UC**: UC-11
**Status**: Draft

## Story

As a Candidate,
I want to complete a short placement test after setting up my profile,
So that the system can pre-fill the difficulty level when I create interview sessions.

## Acceptance Criteria

- AC1 (positive): Given UC-02 is complete and the system displays the test prompt, when I answer all questions and press "Nộp bài", then `placement_level` is saved as `intern`, `fresher`, or `junior` per the scoring thresholds (< 40% → intern; 40–70% → fresher; > 70% → junior), and the Dashboard is shown.
- AC2 (skip): Given the test prompt is displayed, when I press "Bỏ qua", then no `placement_level` is saved, I am redirected to the Dashboard with no side effects, and the next session creation form has no pre-filled difficulty.
- AC3 (pre-fill): Given `placement_level` is set, when I open the session creation form (UC-03), then the `difficulty` field is pre-filled with the corresponding level.
- AC4 (error): Given AI scoring times out (> 10s), then `placement_level = null` is saved, a non-blocking error message is shown ("Không thể tính kết quả lúc này. Bạn có thể làm lại sau trong phần Hồ sơ."), and I am redirected to the Dashboard.

## INVEST Check

- [x] Independent — không block và không bị block bởi story nào cụ thể
- [x] Negotiable — số lượng câu hỏi (5–10) và số levels có thể điều chỉnh
- [x] Valuable — giảm friction khi tạo session lần đầu
- [x] Estimable — single screen, single AI call, 1 DB write
- [x] Small — hoàn thành được trong 1 sprint
- [x] Testable — AC là concrete, có thể pass/fail rõ ràng

## Notes / Open Questions

- Trigger là bước 11 của UC-02 Main Flow — story này phụ thuộc UC-02 về mặt workflow, không phải dev dependency.
- INVEST Priority: COULD — không block MVP; chỉ cải thiện UX onboarding.

# User Stories — InterviewAI

Thư mục này chứa toàn bộ User Stories cho dự án InterviewAI.

---

## Quy ước tổ chức file

```
docs/user-stories/
├── README.md              ← file này (template + index)
├── US-001_login.md
├── US-002_upload-cv.md
├── US-003_create-session.md
└── ...
```

Mỗi story là 1 file riêng. Tên file: `US-XXX_slug.md` (slug viết thường, dấu gạch ngang, mô tả ngắn).

---

## Template (copy cho mỗi story mới)

```markdown
# US-XXX: [Short title]

**Persona**: [từ Discovery Document §4 — Candidate / Admin]
**Priority**: MUST / SHOULD / COULD / WON'T
**Story points**: TBD
**Related UC**: UC-XX
**Status**: Draft / Ready / Done

## Story

As a [persona],
I want to [capability],
So that [benefit].

## Acceptance Criteria

- AC1 (positive): Given [context], when [action], then [outcome].
- AC2 (negative): Given [invalid context], when [action], then [rejection/error].
- AC3 (boundary): Given [edge case], when [action], then [outcome].

## INVEST Check

- [ ] **I**ndependent — không block và không bị block bởi story nào cụ thể
- [ ] **N**egotiable — scope có thể điều chỉnh
- [ ] **V**aluable — rõ ràng lý do người dùng cần tính năng này
- [ ] **E**stimable — đủ chi tiết để estimate
- [ ] **S**mall — hoàn thành được trong 1 sprint (≤ 1 tuần với solo dev)
- [ ] **T**estable — AC là concrete, có thể pass/fail rõ ràng

## Notes / Open Questions

- (để trống nếu không có)
```

---

## INVEST — Giải thích nhanh

| Chữ | Nghĩa | Fail dấu hiệu |
|-----|-------|---------------|
| **I**ndependent | Không phụ thuộc vào story chưa xong | "Story này cần US-005 xong trước" |
| **N**egotiable | Scope có thể thu hẹp | "Phải có đúng 5 màu highlight" |
| **V**aluable | Người dùng hoặc business được gì | "As a developer, I want to..." |
| **E**stimable | Dev có thể ước tính effort | Quá mơ hồ để estimate |
| **S**mall | Hoàn thành trong 1 sprint | "Epic" cần tách nhỏ |
| **T**estable | AC có thể pass/fail | AC dùng từ "dễ dùng", "nhanh" |

---

## Những điều KHÔNG làm

- Đừng viết technical task là user story. Ví dụ sai: *"Setup database schema for sessions"* — đây là task của developer, không phải story của user.
- Đừng bỏ "So that" — mệnh đề value là bắt buộc. Nếu không viết được "So that", story chưa rõ mục đích.
- Đừng dùng "user" chung chung — phải chỉ rõ Persona (Candidate hoặc Admin, từ Discovery §4).
- Đừng để AC chứa từ vague: "nhanh", "dễ dùng", "hữu ích". Thay bằng số cụ thể hoặc hành vi quan sát được.

---

## Personas (từ Discovery Document §4)

| Persona | Mô tả ngắn | Use Cases chính |
|---------|-----------|-----------------|
| **Candidate** | Sinh viên năm cuối / fresher CNTT VN, 0–12 tháng kinh nghiệm | UC-01, UC-02, UC-03, UC-03b, UC-04, UC-06, UC-07, UC-08 |
| **Admin** | Tác giả dự án — duy trì dữ liệu và vận hành prototype | UC-01, UC-09, UC-10 |

---

## Index

| ID | Tiêu đề | UC | Priority | Status |
|----|---------|-----|----------|--------|
| [US-001](US-001_google-auth.md) | Google OAuth login | UC-01 | MUST | Draft |
| [US-002](US-002_session-persistence.md) | Session persistence and logout | UC-01 | MUST | Draft |
| [US-003](US-003_jd-input.md) | Job Description input | UC-03 | MUST | Draft |
| [US-004](US-004_session-config.md) | Interview session configuration | UC-03 | MUST | Draft |
| [US-005](US-005_context-pack.md) | Context Pack selection | UC-03b | SHOULD | Draft |
| [US-006](US-006_opening-phase.md) | Opening phase introduction | UC-04 | MUST | Draft |
| [US-007](US-007_submit-answer.md) | Submit answer — voice or text | UC-04 | MUST | Draft |
| [US-008](US-008_ai-followup.md) | AI follow-up questions | UC-04 | MUST | Draft |
| [US-009](US-009_interview-modes.md) | Practice vs. Exam mode | UC-04 | MUST | Draft |
| [US-010](US-010_session-resilience.md) | Session interruption and resumption | UC-04 | SHOULD | Draft |
| [US-011](US-011_annotated-transcript.md) | Annotated transcript and per-question feedback | UC-06 | MUST | Draft |
| [US-012](US-012_comprehensive-report.md) | Comprehensive session performance report | UC-06 | MUST | Draft |
| [US-013](US-013_rewrite-compare.md) | Rewrite answer and compare improvement | UC-07 | SHOULD | Draft |
| [US-014](US-014_placement-test.md) | Placement test for difficulty calibration | UC-11 | COULD | Draft |
| [US-015](US-015_reverse-questions.md) | Ask questions to AI interviewer (reverse phase) | UC-12 | SHOULD | Draft |
| [US-016](US-016_progress-dashboard.md) | Personal progress dashboard | UC-13 | SHOULD | Draft |

*Cập nhật bảng này mỗi khi thêm story mới.*

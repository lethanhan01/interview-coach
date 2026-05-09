# US-003: Job Description input

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-03
**Status**: Draft

## Story

As a Candidate,
I want to provide a Job Description by pasting text, uploading a PDF, or entering a URL,
So that the AI can generate questions tailored to the specific role I am applying for.

## Acceptance Criteria

- AC1 (positive): Given a Candidate pastes a JD ≥100 characters and confirms, then a session is created with the JD stored and questions generated within 10 seconds.
- AC2 (negative): Given a JD with <100 characters, when the Candidate tries to proceed, then the form shows "Job Description quá ngắn..." and navigation is blocked.
- AC3 (positive — URL): Given a Candidate enters a valid crawlable URL, when the system fetches it within 10 seconds, then the JD content fills the text area for review and editing before the Candidate confirms.
- AC4 (negative — URL fail): Given the URL cannot be crawled or the fetch times out (>10s), when the error triggers, then the Candidate sees "Không tải được JD từ URL..." and the paste option is shown.
- AC5 (negative — PDF): Given a PDF >5MB or with non-extractable text is uploaded, when the Candidate submits it, then the system shows "Không thể đọc file PDF..." and offers the paste option.

## INVEST Check

- [x] **I**ndependent — JD input là bước đầu tiên độc lập, không phụ thuộc US khác
- [x] **N**egotiable — URL crawl (AC3/AC4) có thể tách thành story riêng nếu scope quá lớn
- [x] **V**aluable — JD là input cốt lõi; không có JD thì AI không thể sinh câu hỏi relevant
- [x] **E**stimable — paste là trivial; URL crawl + PDF parse là medium complexity
- [x] **S**mall — 3 sub-paths (paste/URL/PDF) có thể implement tuần tự trong 1 sprint
- [x] **T**estable — AC có thể pass/fail: session created, error text hiển thị, text area filled

## Notes / Open Questions

- AC1: "within 10 seconds" bao gồm cả question generation (AC-03-1). Nếu cần tách: JD validation ≤1s, question gen ≤10s total.
- URL crawl: cần whitelist domain hay cho phép arbitrary URL? Chưa elicited — flag cho design phase.
- PDF: tối đa 5MB theo E-03-5; giới hạn này đã xác nhận với stakeholder chưa?

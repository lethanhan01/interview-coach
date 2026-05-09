# US-001: Google OAuth login

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-01
**Status**: Draft

## Story

As a Candidate,
I want to sign in using my Google account,
So that I can access InterviewAI without creating or managing a separate password.

## Acceptance Criteria

- AC1 (positive): Given an unauthenticated user, when they click "Đăng nhập bằng Google" and complete Google consent, then they are redirected to Dashboard (if profile_completed=true) or profile setup (if false) within 5 seconds.
- AC2 (negative): Given Google OAuth returns an error, when the callback is received, then a toast "Đăng nhập thất bại. Vui lòng thử lại." appears and the user remains on the Landing page.
- AC3 (boundary): Given the account has status=banned, when OAuth completes, then the user sees "Tài khoản của bạn đã bị vô hiệu hóa..." and cannot access the app.

## INVEST Check

- [x] **I**ndependent — không block và không bị block bởi story nào cụ thể
- [x] **N**egotiable — scope có thể điều chỉnh (ví dụ: bỏ AC3 nếu ban feature không cần trong prototype)
- [x] **V**aluable — Candidate không thể dùng app nếu không login
- [x] **E**stimable — OAuth flow với Supabase là standard, estimable
- [x] **S**mall — hoàn thành được trong 1 sprint
- [x] **T**estable — AC có thể pass/fail rõ ràng (redirect URL, toast text, error state)

## Notes / Open Questions

- AC3 (banned): phụ thuộc vào việc admin có khả năng ban account hay không. Đây là happy-path-adjacent test; AC vẫn hợp lệ vì UC-01 E-01-3 đã spec behavior này.
- JWT lưu HttpOnly cookie — không kiểm tra được từ JS; test bằng network inspection hoặc E2E cookie header.

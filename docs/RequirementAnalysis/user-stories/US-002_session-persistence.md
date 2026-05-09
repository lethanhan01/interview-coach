# US-002: Session persistence and logout

**Persona**: Candidate
**Priority**: MUST
**Story points**: TBD
**Related UC**: UC-01
**Status**: Draft

## Story

As a Candidate,
I want my login to persist across browser sessions and to be able to log out securely,
So that I can continue practice without re-authenticating every visit and keep my account safe on shared devices.

## Acceptance Criteria

- AC1 (positive): Given a Candidate with a valid JWT access token, when they re-open the app in a new tab, then they are automatically redirected to Dashboard without seeing the login screen.
- AC2 (positive): Given the access token has expired but the refresh token is still valid, when the app opens, then the system silently issues a new access token and the Candidate reaches Dashboard.
- AC3 (positive): Given a logged-in Candidate clicks logout, when logout completes, then the JWT cookie is deleted, the refresh token is revoked server-side, and the next visit shows the Landing page.
- AC4 (negative): Given both access and refresh tokens have expired, when the Candidate opens the app, then the Landing page is shown (not an error page or loading spinner).

## INVEST Check

- [x] **I**ndependent — không block và không bị block bởi story nào cụ thể
- [x] **N**egotiable — silent refresh (AC2) có thể tách thành story riêng nếu cần
- [x] **V**aluable — tránh friction đăng nhập lặp lại; bảo mật trên thiết bị chung
- [x] **E**stimable — token lifecycle với Supabase Auth là standard
- [x] **S**mall — hoàn thành được trong 1 sprint
- [x] **T**estable — AC có thể verify qua cookie header, redirect URL, server-side token revocation

## Notes / Open Questions

- AC2: Supabase JS SDK tự handle silent refresh — implementation-level detail, không cần spec thêm ở requirements.
- AC3: "Revoked server-side" có nghĩa là refresh token bị xóa khỏi Supabase Auth session table, không chỉ client-side cookie clear.

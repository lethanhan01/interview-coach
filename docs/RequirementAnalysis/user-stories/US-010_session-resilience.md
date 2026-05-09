# US-010: Session interruption and resumption

**Persona**: Candidate
**Priority**: SHOULD
**Story points**: TBD
**Related UC**: UC-04
**Status**: Draft

## Story

As a Candidate,
I want my interview session to be saved if I accidentally close the browser,
So that I can resume from where I left off without losing my progress.

## Acceptance Criteria

- AC1 (positive): Given a Candidate closes the browser tab during an active session, when they return to the Dashboard within 30 minutes, then the Dashboard shows a "Tiếp tục phiên chưa hoàn thành?" prompt linking directly to the interrupted session.
- AC2 (negative): Given a session has been in interrupted state for >30 minutes, when the Candidate views the Dashboard, then the session appears in their session list with status=interrupted but no resumption prompt (the session is not silently hidden or deleted).

## INVEST Check

- [x] **I**ndependent — session resilience không block core interview flow; có thể ship sau UC-04 core
- [x] **N**egotiable — resumption window (30 min) là negotiable; prompt wording có thể thay đổi
- [x] **V**aluable — tránh mất toàn bộ progress khi mất kết nối hoặc đóng nhầm tab
- [x] **E**stimable — Beacon API on `beforeunload` + server-side status update — estimable nhưng non-trivial
- [ ] **S**mall — Beacon API + server-side timeout logic có thể phức tạp hơn 1 sprint; xem Notes
- [x] **T**estable — AC1: simulate tab close + check Dashboard prompt; AC2: advance mock clock + check session list

## Notes / Open Questions

- **Small concern**: Implementation gồm (a) `beforeunload` + Beacon API gọi status=interrupted, (b) server-side 30-min timeout check khi Dashboard load, (c) Dashboard UI conditional. Có thể tách thành 2 tickets nếu cần: status detection vs. Dashboard prompt.
- AC1 assumes Beacon API thành công — nếu Beacon fail (e.g., offline), status sẽ không được set. Edge case này chấp nhận được ở prototype scope.
- "Tiếp tục phiên" khi resume: cần định nghĩa behavior — resume từ câu đang trả lời dở, hay từ câu tiếp theo? Chưa elicited đủ. Flag cho design phase.

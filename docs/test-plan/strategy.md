# Test Strategy — InterviewAI v1.0 (Prototype)

**Phiên bản:** 0.1 (Draft)
**Ngày soạn:** 2026-05-06
**Giai đoạn:** Requirements Analysis — outline scope và approach; chưa viết TC cụ thể
**Tác giả:** Lê Thành An — MSSV 20235631

---

## 1. Scope

### 1.1 Trong phạm vi test

| Nhóm | Phạm vi |
|------|---------|
| Authentication | UC-01: Đăng ký / Đăng nhập Google OAuth; phân quyền Candidate / Admin |
| Profile & CV | UC-02: Upload CV PDF; parse; validation kích thước và định dạng |
| Session setup | UC-03, UC-03b: Cấu hình phiên từ JD; chọn Context Pack VN / Western |
| Interview flow | UC-04: Trả lời bằng voice và text; Adaptive Follow-up; lưu transcript |
| Surgical Feedback | UC-05, UC-06: Sinh feedback; Annotated Transcript; annotation popup |
| Rewrite & Compare | UC-07: Rewrite câu trả lời; delta score; so sánh hai phiên |
| Session history | UC-08: Danh sách phiên; xem lại feedback cũ |
| Admin | UC-09: Quản lý người dùng; UC-10: Quản lý Question Bank |
| NFR | Performance, Security (OWASP Top 10), AI quality, AI safety, Data integrity |

### 1.2 Ngoài phạm vi test (v1.0)

- Coding interview / system design questions
- Mobile native app (iOS / Android)
- Multi-language ngoài Việt/Anh
- Analytics dashboard và gamification
- Load test > 50 concurrent users (prototype scope)
- Accessibility (WCAG 2.1) — dời sang UI/UX phase

---

## 2. Approach

### 2.1 Triết lý

- **Requirements-first:** Không viết TC trước khi FR / UC tương ứng ổn định. Hiện tại SRS còn open findings (xem `/srs-audit` và `/qa-review` 2026-05-06) — TC sẽ được viết sau khi các blocker được fix.
- **Risk-based priority:** Tập trung vào các luồng AI (UC-04, UC-05, UC-07) và security (S-04, data isolation) — đây là vùng rủi ro cao nhất của prototype.
- **Manual-first:** Với prototype 50 users / solo dev, manual test + smoke test là đủ. Automation chỉ áp dụng cho logic thuần (unit test AI schema validation).

### 2.2 Phương pháp

| Loại | Áp dụng cho |
|------|-------------|
| Exploratory testing | AI output quality — không thể fully scripted |
| Scripted (TC) | Auth flows, boundary values, CRUD |
| Regression | Sau mỗi sprint khi fix bug hoặc thêm feature |
| Pilot user test | Sau launch beta — 5 users, đo usability metrics |

---

## 3. Test Levels (Pyramid)

```
         ┌──────────┐
         │   E2E    │  ← Ít (3–5 critical happy paths)
         └──────────┘
       ┌────────────────┐
       │  Integration   │  ← Vừa (API contracts, DB, AI fallback)
       └────────────────┘
    ┌────────────────────────┐
    │         Unit           │  ← Nhiều (schema validation, scoring logic)
    └────────────────────────┘
```

### Unit tests (nhiều nhất)
- JSON schema validation của Feedback Analyzer output (Pydantic)
- Scoring logic: delta score tính đúng không?
- Voice metrics: WPM, filler count với dữ liệu giả
- Boundary: JD < 100 chars → reject; audio > 25MB → reject

### Integration tests (vừa)
- Auth: Google OAuth → Supabase session → API endpoint nhận JWT hợp lệ
- CV upload: PDF ≤ 5MB → parse → lưu `user_profiles.cv_structured`
- AI pipeline: transcript → Feedback Analyzer → validate JSON → lưu DB
- Fallback: Feedback Analyzer timeout → text fallback kích hoạt, transcript không mất
- Data isolation: Candidate A không thể đọc session của Candidate B

### E2E tests (ít nhất — chỉ happy path)
1. Candidate đăng nhập → tạo phiên → trả lời voice → xem Surgical Feedback → rewrite → thấy delta score
2. Candidate đăng nhập → tạo phiên → trả lời text → xem feedback → vào history → mở lại phiên cũ
3. Admin đăng nhập → thêm câu hỏi vào Question Bank → tạo phiên mới có câu hỏi đó

---

## 4. Environments

| Môi trường | Mục đích | Data strategy |
|------------|----------|---------------|
| **Local (dev)** | Unit test, integration test | Seed data cố định; không dùng OpenAI real API (mock/stub) |
| **Staging** | E2E test, exploratory, pilot | Supabase staging project; OpenAI real API với rate limit thấp |
| **Production** | Smoke test sau deploy | 1–2 happy path TC; không test negative trên prod |

**AI testing note:** Vì AI output không deterministic, test AI quality phải dùng:
- **Unit:** Mock response cố định → kiểm tra schema và save logic
- **Integration:** Real API call với sample JD/transcript đã chọn sẵn; assert schema, không assert content
- **Exploratory:** Manual review 10–20 outputs với HR rubric

---

## 5. Tools

*(Điền trong Implementation phase sau khi tech stack finalized)*

| Loại | Placeholder |
|------|-------------|
| Unit test (frontend) | TBD — Jest / Vitest |
| Unit test (backend) | TBD — Pytest |
| Integration test | TBD — Pytest + httpx |
| E2E | TBD — Playwright |
| API test | TBD — httpx / Postman |
| Security scan | OWASP ZAP (manual + automated) |
| Reporting | TBD — GitHub Actions CI |

---

## 6. Roles

| Vai trò | Người | Trách nhiệm |
|---------|-------|-------------|
| Test designer | Lê Thành An | Viết TC, maintain test plan |
| Test executor | Lê Thành An | Chạy TC, ghi kết quả |
| AI quality reviewer | Lê Thành An + 1 HR expert | Review 10–20 Surgical Feedback outputs trước launch |
| Sign-off | GVHD Cao Tuấn Dũng | Review test report trước bảo vệ |

---

## 7. Risks

| # | Rủi ro | Mức độ | Mitigation |
|---|--------|--------|------------|
| TR1 | AI output không deterministic → khó viết assert | High | Test schema, không test content; dùng exploratory cho quality |
| TR2 | Whisper accuracy thấp với accent → E2E voice test flaky | Med | Test với audio samples cố định; fallback text path phải luôn có |
| TR3 | Solo dev: test bị bỏ qua khi deadline áp lực | High | Ưu tiên integration test trên CI; E2E chỉ 3 paths quan trọng nhất |
| TR4 | SRS còn open findings → TC viết sớm sẽ phải sửa lại | Med | Đợi SRS blocker được fix trước khi viết TC cho phần đó |
| TR5 | Data isolation S-04 không được test → security hole | High | Mandatory: integration test data isolation trước launch beta |

---

## 8. Entry / Exit Criteria

### Entry criteria (để bắt đầu viết TC)
- [ ] SRS blocker findings từ `/qa-review` 2026-05-06 đã được fix
- [ ] MoSCoW priority đã được thêm vào tất cả UC và NFR
- [ ] User stories đã được viết cho tất cả MUST UC

### Exit criteria (để exit Requirements Analysis)
- [ ] Mỗi MUST requirement có ≥ 1 TC (positive + negative)
- [ ] TC coverage matrix cập nhật trong RTM
- [ ] Không có TC nào ở trạng thái FAIL với severity Critical
- [ ] AI quality pilot test với ≥ 5 users: ≥ 80% rating "feedback cụ thể, hữu ích"

---

## 9. Liên kết

- [SRS v1.6](../SRS/SRS_InterviewAI_Full.md) — nguồn yêu cầu cho TC
- [RTM](../SRS/RTM_InterviewAI.md) — traceability matrix, cần thêm cột TC
- [SAD v1.0](../SAD/SAD_InterviewAI_v1.0.md) — AI pipeline detail, fallback behavior
- [docs/test-plan/](.) — các TC sẽ nằm trong thư mục này

---

*Tài liệu này là outline — TC cụ thể sẽ được viết trong V&V phase sau khi SRS ổn định.*

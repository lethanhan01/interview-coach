# Phase 10 — Identity review

**Mục tiêu:** quyết định bằng evidence liệu Auth, User và Admin có nên cùng một Identity context; không đổi tên module chỉ vì sơ đồ đích.

## Current state và ràng buộc

`AuthModule` là global, owns credential/token/password reset; User owns self-profile; Admin owns user/role/status/soft-delete administration. APIs và permission rules khác nhau dù cùng User/account data.

## Nhiệm vụ

- [ ] Map endpoint, consumer, guard, authorization policy, user table access và lifecycle của ba module.
- [ ] Locate shared policy/duplication thật (ví dụ user lookup/status rule), characterize current behavior with tests.
- [ ] Chọn một trong hai, ghi decision vào progress:
  - giữ modules riêng với boundary documented nếu merge chỉ là rename/folder move;
  - thêm `IdentityModule` facade, migrate từng capability nếu shared policy/lifecycle chứng minh value.
- [ ] Nếu merge: migrate Auth trước/sau cùng một surface nhỏ, retain cookies/JWT/tokenVersion; Profile và Admin đi sau từng PR.
- [ ] Không làm Auth global rộng hơn trong code mới chỉ để tránh explicit import.
- [ ] Validate last-admin protection, self-update/delete protection, email verification, password reset/change/logout/token invalidation.

## Exit criteria

- Có decision documented với import/duplication evidence.
- Nếu merge, contract auth/cookie/role/status không đổi và old exports removed only after zero callers.
- Nếu không merge, kết luận “giữ nguyên” là completion hợp lệ; không tạo code không có nhu cầu.

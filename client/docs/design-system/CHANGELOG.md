# Changelog

Tất cả các thay đổi đáng chú ý của Design System sẽ được ghi nhận tại file này. Mặc dù Design System chỉ được dùng nội bộ trong repository, việc theo dõi changelog là bắt buộc để quản lý sự thay đổi.

## Phân loại thay đổi (Change Categories)

Mỗi thay đổi cần được phân loại thành một trong ba nhóm sau:

### Patch

- Bug fix.
- Accessibility fix không phá API.
- Documentation.

### Minor

- Component mới.
- Variant mới.
- Optional prop mới.

### Breaking

- Xóa prop.
- Đổi semantic.
- Đổi default behavior.
- Xóa token.

---

## [Unreleased]

### Minor

- Thêm tài liệu quản trị Design System: Contribution guide, Component request template, Deprecation policy.

<!-- Format mẫu khi có thay đổi mới:
## [YYYY-MM-DD] - Tiêu đề cập nhật
### Minor
- Thêm component `Toast`
### Patch
- Sửa lỗi màu sắc hover của `Button`
### Breaking
- Xóa prop `isDanger` khỏi `Button`, dùng `variant="destructive"` thay thế.
-->

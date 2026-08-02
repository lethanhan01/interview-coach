# Hướng dẫn đóng góp (Contribution Guide)

Tài liệu này quy định quy trình và tiêu chuẩn để đóng góp vào Design System.

## 1. Khi nào được tạo component mới

- Khi UI pattern được sử dụng lại ở ít nhất 3 nơi khác nhau trong ứng dụng.
- Khi thành phần đó có tính độc lập cao, không chứa logic nghiệp vụ (business logic) cụ thể.
- Khi không có component nào hiện tại có thể đáp ứng được yêu cầu (ngay cả khi thêm prop).

## 2. Cách kiểm tra component đã tồn tại chưa

- Tìm kiếm trên Storybook để xem có component tương tự không.
- Đọc `docs/design-system/` và danh sách các UI Primitives/Common Components.
- Hỏi trên kênh giao tiếp của team thiết kế/phát triển trước khi bắt đầu code.

## 3. Khi nào được thêm variant

- Khi component hiện tại đáp ứng 80% yêu cầu, chỉ khác biệt về mặt hiển thị (màu sắc, kích thước, trạng thái).
- Khi variant mới tuân thủ thiết kế chung và có thể được sử dụng ở nhiều nơi, không chỉ một màn hình duy nhất.

## 4. Khi nào variant nên nằm trong feature

- Khi variant đó mang tính đặc thù cao, bị ràng buộc chặt chẽ với một tính năng (feature) cụ thể.
- Khi UI đó không có khả năng tái sử dụng ở các module khác.
- Trong trường hợp này, hãy bọc component hệ thống lại trong một wrapper component ở thư mục `feature`.

## 5. Quy tắc đặt tên

- Tên component phải dùng PascalCase (ví dụ: `Button`, `DialogModal`).
- Tên Props phải rõ ràng, tránh viết tắt (ví dụ: `isDisabled` thay vì `dis`, `onClick` thay vì `clk`).
- Các biến thể nên sử dụng prop chuẩn như `variant`, `size`, `color`.

## 6. Quy tắc sử dụng token

- Tuyệt đối không hard-code mã màu (HEX, RGB) hay kích thước cố định (px) nếu đã có token tương ứng.
- Luôn sử dụng Semantic Tokens (ví dụ: `text-destructive`, `bg-primary`) thay vì Base Tokens (ví dụ: `text-red-500`, `bg-blue-600`).

## 7. Yêu cầu Storybook

- Mọi component mới hoặc variant mới ĐỀU PHẢI có file `.stories.tsx` đi kèm.
- Storybook phải thể hiện đầy đủ các trạng thái: Default, Hover, Focus, Disabled, Error (nếu có).
- Phải có tài liệu (autodocs) mô tả các props.

## 8. Yêu cầu testing

- Phải có Unit Test kiểm tra logic của component (ví dụ: callback có được gọi không).
- Phải vượt qua các Visual Regression Tests trên Playwright (nếu cấu hình) để đảm bảo không bị vỡ giao diện.

## 9. Yêu cầu accessibility (a11y)

- Component phải hỗ trợ điều hướng bằng bàn phím (Keyboard support).
- Phải có state `focus-visible` rõ ràng.
- Phải có đủ các attributes ARIA cần thiết cho screen readers.
- Phải vượt qua kiểm tra độ tương phản màu sắc.

## 10. Yêu cầu backward compatibility

- Không tự ý thay đổi API (props) của component hiện có nếu làm vỡ code ở những nơi đang sử dụng (Breaking Change).
- Nếu cần xóa hoặc thay đổi prop, phải tuân thủ [Deprecation Policy](./12-deprecation-policy.md).
- Ưu tiên mở rộng (thêm optional props) thay vì thay đổi hành vi mặc định (default behavior).

## 11. Review Checklist (Pull Request)

Khi tạo Pull Request cập nhật hoặc thêm mới component, vui lòng đảm bảo các tiêu chí sau:

- [ ] Không tạo component trùng
- [ ] Dùng semantic token
- [ ] Không hard-code màu
- [ ] Không có class động không thể detect
- [ ] Có focus-visible
- [ ] Có keyboard support
- [ ] Có dark theme
- [ ] Có Storybook stories
- [ ] Có tests
- [ ] Có a11y checks
- [ ] Có documentation
- [ ] Lint thành công
- [ ] Typecheck thành công
- [ ] Build thành công

## 12. Cách deprecate component

- Nếu cần loại bỏ một component hoặc prop, KHÔNG được xóa ngay lập tức.
- Phải đánh dấu `@deprecated` trong JSDoc, kèm theo thông báo và hướng dẫn chuyển đổi sang component/prop mới.
- Ghi chú rõ ràng trong CHANGELOG.md và thông báo cho team.
- Tuân thủ theo các bước trong [Deprecation Policy](./12-deprecation-policy.md).

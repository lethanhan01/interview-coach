# Testing Strategy

Tài liệu này định nghĩa chiến lược testing nhiều tầng cho Design System để đảm bảo chất lượng, tính tái sử dụng, và trải nghiệm người dùng cuối (UX). Hệ thống được kiểm thử qua 5 tầng:

## 1. Static Checks

Đảm bảo mã nguồn nhất quán và an toàn trước khi chạy:

- **TypeScript**: Bắt lỗi kiểu dữ liệu ở mức compile-time (`npm run typecheck`).
- **ESLint**: Đảm bảo tuân thủ best practices của Next.js và React (`npm run lint`).
- **Prettier**: Chuẩn hóa format code (`npm run format:check`).
- **Build**: Đảm bảo component không gây lỗi quá trình đóng gói production (`npm run build`).

## 2. Component Tests (Unit Tests)

Sử dụng **Vitest** kết hợp **React Testing Library**. Mỗi component phải có unit tests bao phủ các khía cạnh:

- **Render**: Component render đúng mà không bị crash.
- **Props**: Các class, style, text được apply chuẩn xác dựa trên props truyền vào.
- **State**: Trạng thái local hoạt động đúng.
- **User Interaction**: Tương tác cơ bản (click, type) thay đổi UI nội bộ.
- **Controlled và Uncontrolled**: Đảm bảo component hỗ trợ cả 2 mô hình state quản lý.
- **Event Callback**: Các hàm `onChange`, `onClick` được gọi đúng params.
- **Disabled Behavior**: Component không trigger sự kiện hay thay đổi state khi ở trạng thái disabled.

## 3. Accessibility Checks (A11y)

Tiêu chuẩn bắt buộc cho mọi UI component. Chúng ta tiếp cận qua 2 phương pháp:

- **Automated**: Sử dụng `@storybook/addon-a11y` (dựa trên axe-core). Các story quan trọng đều phải vượt qua automated checks.
- **Manual**: Kiểm thử thủ công là bắt buộc (Xem chi tiết ở `09-accessibility.md`).
  - _Automated accessibility test không được coi là thay thế hoàn toàn kiểm tra thủ công._

## 4. Visual Regression Tests

Đảm bảo UI không bị vỡ giao diện (pixel-perfect) khi code thay đổi. Chúng ta sử dụng **Playwright** cho mục đích này.

Tối thiểu phải có visual test cho các trạng thái:

- Button variants (solid, outline, ghost).
- Form states (default, hover, focus, invalid).
- Dialog, DropdownMenu, Tabs (trạng thái mở).
- Alert (các mức độ severity).
- Page layout (cấu trúc chung).
- Dark theme.
- Mobile viewport.

**Quy trình chạy**: Đảm bảo baseline được tạo và chạy trong môi trường CI ổn định nhằm tránh lỗi sai lệch (flaky).

## 5. Interaction Tests

Đối với các component phức tạp cần điều hướng bàn phím hoặc tương tác chuột nhiều bước:

- Dialog open và close (Focus lock & restore).
- Dropdown keyboard navigation (Arrow keys).
- Tabs keyboard navigation (Arrow keys).
- Form invalid state (Hiển thị lỗi và focus error field).
- Toast (Auto-dismiss, swipe).
- ConfirmDialog (Hành động hủy/xác nhận).
- Select hoặc Combobox (Search, select via enter/click).

## NPM Scripts

Sử dụng các scripts sau trong `package.json` để chạy test cho Design System:

```bash
# Chạy tất cả test
npm run test

# Unit tests bằng Vitest
npm run test:unit

# Accessibility tests bằng Storybook test-runner
npm run test:a11y

# Visual regression tests bằng Playwright
npm run test:visual

# Chạy toàn bộ luồng test của design system
npm run test:design-system
```

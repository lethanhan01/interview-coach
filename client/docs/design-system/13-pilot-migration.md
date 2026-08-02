# Pilot Migration: Admin Users Page

## Mục tiêu

Kiểm chứng quá trình áp dụng Design System mới vào một màn hình thực tế, đảm bảo:

- Không thay đổi logic nghiệp vụ (API, state management, hooks).
- Thay thế hoàn toàn raw HTML và Tailwind utility classes rác rưởi bằng các UI Primitives và Design Tokens.
- Nâng cao trải nghiệm UX/UI (thêm trạng thái Loading, Empty, Dialog xác nhận thay thế cho `window.confirm`).

## Màn hình được chọn

**Đường dẫn**: `app/(admin)/users/page.tsx`

**Lý do chọn**:

- Là một trang quản trị tiêu chuẩn.
- Chứa các thành phần cốt lõi: Typography, Table, Button, Error State.
- Scope vừa phải (< 100 lines code trước migration), rủi ro side-effects thấp.

## Quá trình Mapping Component

| Component cũ               | Design System Component                         | Ghi chú                                                            |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `<h1>`                     | Typography (`text-2xl font-bold`)               | Áp dụng color token `text-ink`.                                    |
| `<table/>`, `<tr>`, `<td>` | `Table`, `TableHeader`, `TableRow`, `TableCell` | Bọc trong `bg-surface shadow-card` container.                      |
| `<button>` (Native)        | `Button` (UI Primitives)                        | Thay button text "Xóa" thành variant `destructive` kèm icon.       |
| `<p role="alert">`         | Custom Alert Box                                | Sử dụng màu `text-danger bg-danger-bg` thay thế tạm.               |
| Loading (`return null`)    | `LoadingSpinner`                                | Hiển thị rõ ràng trạng thái đang fetch dữ liệu.                    |
| Empty (Bảng rỗng)          | Custom Empty State                              | Có icon và thông báo rõ ràng khi không có data.                    |
| `window.confirm`           | `AlertDialog`                                   | Chuyển từ native browser prompt sang overlay Dialog chuyên nghiệp. |
| Không có                   | `Input` (Search)                                | Thêm local search filter để hoàn thiện bộ tính năng quản trị.      |

## Các thay đổi chính đã thực hiện

1. **Thiết kế lại Layout**: Căn chỉnh max-width, áp dụng các token `space-y-6`, `py-6`.
2. **Nâng cấp UX cho Actions**: Thay vì hiện chữ "Khóa/Mở khóa" thô sơ, ta dùng `Button` kết hợp icon từ `lucide-react`.
3. **Cải tiến Data Display**: Dữ liệu vai trò và trạng thái được gắn `Badge` component với các màu sắc chuẩn (brand, success, danger).
4. **Cải tiến Overlays**: Tạo state `userToDelete` để quản lý đóng/mở `AlertDialog`. Khi người dùng xác nhận, gọi hàm `deleteUser` tương tự logic cũ.

## Bài học rút ra (Lessons Learned)

- Việc sử dụng Radix UI cho các component như `AlertDialog` yêu cầu quản lý state client-side cẩn thận (`open`, `onOpenChange`), nhưng bù lại khả năng accessibility là rất tốt.
- `Table` component đóng gói sẵn các class Tailwind, giúp việc render một bảng phức tạp trở nên gọn gàng hơn nhiều so với việc code tay các thẻ HTML native.
- Component `Input` với slot cho icon (như `leadingIcon`) giúp việc dựng form nhanh và đồng bộ hơn.

## Kế hoạch tiếp theo

- Dựa trên sự thành công của Pilot, các màn hình khác (như `sessions/page.tsx`, `jd-library/page.tsx`) có thể được migrate theo pattern tương tự.
- Xây dựng component `PageHeader` dùng chung để tránh lặp lại cấu trúc title/description ở mỗi trang.

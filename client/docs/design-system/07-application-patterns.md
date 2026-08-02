# 07. Application Patterns

Tài liệu này định nghĩa các mẫu giao diện ứng dụng (Application Patterns) được xây dựng từ việc kết hợp nhiều UI Primitives. Mục tiêu của Application Patterns là cung cấp các layout và component mang tính chuẩn hóa cao nhưng **không chứa logic nghiệp vụ cụ thể**.

## Nguyên tắc thiết kế

1. **Table là UI Primitive, DataTable là Pattern**:
   - `Table` chỉ làm nhiệm vụ render bảng (được xây dựng bằng thẻ `div` với display `grid`/`flex` để hỗ trợ responsive thay vì native `table`).
   - `DataTable` là component tổng hợp gồm Table, Pagination, Toolbar, và FilterBar.
2. **DataTable "Ngu" (Controlled State)**:
   - DataTable không chứa state phân trang, sắp xếp nội bộ hay tự động gọi API.
   - Component này nhận dữ liệu (`data`), định nghĩa cột (`columns`), và các state (như `currentPage`, `onPageChange`) từ component cha.
3. **Quản lý Spacing tập trung**:
   - Spacing của một trang (padding, max-width) phải do các layout patterns (`PageContainer`, `PageSection`, `ResponsiveStack`) quản lý.
   - Các page feature không tự ý thêm `padding` hay `max-width` bằng class utility riêng lẻ.
4. **State Management tự động**:
   - Feature Page không tự viết cấu trúc if/else để hiển thị Loading, Error hay Empty.
   - Sử dụng `<AsyncBoundary>` để tự động bọc content và render `<LoadingState>`, `<ErrorState>`, `<EmptyState>`.
5. **Đơn nhiệm và Rõ ràng**:
   - `ConfirmDialog` nhận các props đơn giản (`title`, `onConfirm`), không liên kết cứng với Entity nào (như "Xóa User" hay "Xóa Meeting").
   - `PageHeader` hỗ trợ slot cho title, description, actions và breadcrumbs.
   - Không tạo ra một component "万能" (omnipotent - toàn năng) nhận vô số boolean props; ưu tiên pattern composition (lắp ráp component).

## Danh sách Patterns (Thư mục: `client/components/patterns/`)

### Layout Patterns

- **PageContainer**: Quản lý chiều rộng tối đa và khoảng cách lề hai bên.
- **PageHeader**: Chứa tiêu đề trang và các thao tác chung (nút thêm, xuất file...).
- **PageSection**: Phân chia nội dung trang thành các khối lớn, có tiêu đề phụ.
- **ResponsiveStack**: Hỗ trợ xếp chồng theo chiều dọc trên mobile và dàn ngang trên desktop.

### Feedback Patterns

- **LoadingState / ErrorState / EmptyState**: Các trạng thái UI được chuẩn hóa.
- **AsyncBoundary**: Wrapper nhận `isLoading`, `isError`, `isEmpty` và hiển thị UI tương ứng, loại bỏ code logic lặp lại trong các page.

### Form Patterns

- **FormSection**: Nhóm các trường nhập liệu liên quan với nhau.
- **SearchInput**: Ô tìm kiếm có sẵn icon và nút clear text.

### Data Patterns

- **Toolbar**: Thanh công cụ chứa action.
- **FilterBar**: Khu vực chứa bộ lọc dữ liệu.
- **Pagination**: Mẫu phân trang chuẩn.
- **DataTable**: Table hoàn chỉnh bao gồm dữ liệu trống, cột, dòng, render logic.

### Dialog Patterns

- **ConfirmDialog**: Hộp thoại xác nhận nhanh một hành động (như xóa dữ liệu).

## Code Ví dụ

Xem file Storybook `client/stories/pages/PagePatterns.stories.tsx` để xem cách các pattern này kết hợp với nhau trong một trang thực tế (User List Page, Meeting List Page, ...).

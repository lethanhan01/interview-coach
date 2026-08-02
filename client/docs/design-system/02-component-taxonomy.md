# Component Taxonomy

Tài liệu này hệ thống hóa toàn bộ các thành phần trong Design System, được phân loại từ mức độ nguyên thủy nhất (Foundations) đến các thành phần phức tạp và mẫu giao diện (Patterns).

## 1. Foundations (Design Tokens)

Các giá trị cốt lõi định hình ngôn ngữ thiết kế chung, được định nghĩa dưới dạng CSS Variables.

- **Colors:** Màu sắc semantic (brand, surface, ink, danger, success, etc.).
- **Typography:** Phông chữ (sans, mono), kích cỡ, độ đậm (font-weight), chiều cao dòng (line-height).
- **Spacing:** Khoảng cách (margin, padding, gap).
- **Radius:** Độ bo góc (rounded).
- **Shadows:** Đổ bóng (shadow-card, shadow-btn, shadow-glow).
- **Breakpoints:** Các điểm ngắt cho responsive design.
- **Motion:** Các giá trị về animation và transition duration/timing function.
- **Z-index:** Các mốc phân tầng hiển thị chiều sâu.
- **Icons:** Thư viện hệ thống icon (sử dụng `lucide-react`).

## 2. UI Primitives

Các building block cơ bản nhất. Đa phần là các HTML element được bọc lại (wrapper) với styling chuẩn của Design System. Không chứa state phức tạp.

- **Button:** Nút bấm cơ bản.
- **IconButton:** Nút bấm chỉ chứa icon.
- **Input:** Trường nhập text cơ bản.
- **Textarea:** Trường nhập văn bản nhiều dòng.
- **Label:** Nhãn cho các form elements.
- **Checkbox:** Hộp kiểm đa lựa chọn.
- **RadioGroup:** Nhóm các lựa chọn độc quyền (single choice).
- **Switch:** Nút bật/tắt (toggle).
- **Select:** Trình đơn thả xuống để chọn giá trị.
- **Badge:** Thẻ đánh dấu trạng thái hoặc nhãn (ví dụ: "New", "Success").
- **Avatar:** Hình ảnh hoặc ký tự đại diện người dùng.
- **Card:** Khung chứa nội dung cơ bản.
- **Separator:** Đường phân cách (Divider).
- **Skeleton:** Trạng thái loading giả lập giao diện thật.
- **Spinner:** Trạng thái loading dạng vòng xoay.
- **Alert:** Hộp thông báo nội tuyến (inline message).

## 3. Complex Components

Các thành phần giao diện phức tạp hơn, thường đòi hỏi quản lý trạng thái nội bộ (internal state) như mở/đóng, focus, và accessibility (a11y) nâng cao. Các component này ưu tiên xây dựng trên nền tảng Headless UI (như Radix UI).

- **Dialog:** Cửa sổ Modal hiển thị thông tin hoặc form.
- **AlertDialog:** Modal yêu cầu người dùng xác nhận các hành động quan trọng (destructive actions).
- **DropdownMenu:** Trình đơn chức năng xuất hiện khi click vào một element (thường là button).
- **Popover:** Hộp thông tin nhỏ (rich content) xuất hiện khi tương tác với một element.
- **Tooltip:** Nhãn mô tả ngắn xuất hiện khi hover.
- **Tabs:** Hệ thống chuyển đổi nội dung cùng cấp.
- **Accordion:** Danh sách các phần tử có thể thu gọn/mở rộng.
- **Sheet (Drawer):** Panel trượt ra từ các cạnh màn hình.
- **Toast:** Thông báo nhỏ gọn xuất hiện và tự biến mất (snackbar).

## 4. Application Patterns

Các mẫu thiết kế lặp đi lặp lại ở cấp độ trang hoặc section lớn, là sự kết hợp của nhiều Primitives và Complex Components.

- **PageHeader:** Tiêu đề chuẩn của một trang, bao gồm title, breadcrumb và action buttons.
- **PageContainer:** Wrapper chuẩn quản lý chiều rộng tối đa và padding của một trang.
- **EmptyState:** Trạng thái khi không có dữ liệu (thường gồm hình ảnh, thông điệp và CTA).
- **ErrorState:** Trạng thái khi có lỗi xảy ra (kèm nút Retry).
- **LoadingState:** Màn hình hoặc khu vực chờ dữ liệu tổng hợp.
- **ConfirmDialog:** Mẫu dialog xác nhận thao tác chung có thể gọi thông qua context/hook.
- **SearchInput:** Ô tìm kiếm có tích hợp sẵn icon và nút clear.
- **FilterBar:** Thanh công cụ chứa các bộ lọc (Select, Checkbox, Search).
- **DataTable:** Bảng dữ liệu có hỗ trợ sắp xếp, chọn hàng và phân trang.
- **Pagination:** Thành phần điều hướng phân trang.
- **FormField:** Mẫu chuẩn bao gồm Label + Input/Select/Textarea + Error message.
- **FormSection:** Khung chứa một nhóm các trường form có chung bối cảnh (kèm tiêu đề phụ).

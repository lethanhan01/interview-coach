# Accessibility (A11y)

Tài liệu này hướng dẫn cách kiểm tra và đảm bảo Design System đáp ứng tiêu chuẩn tiếp cận cơ bản cho người dùng, đặc biệt là người khuyết tật.

## 1. Storybook Accessibility Addon

Dự án đã được cấu hình `@storybook/addon-a11y`. Khi mở Storybook, bạn sẽ thấy tab **Accessibility** ở panel bên dưới mỗi story.
Addon này chạy các kiểm tra tĩnh dựa trên `axe-core` và báo cáo các lỗi:

- Thiếu `aria-label` cho các nút không có text.
- Thiếu contrast màu chữ.
- Thiếu phân cấp heading.

**Yêu cầu**: Tất cả các components mới đưa vào Design System đều phải pass 100% automated checks trong Storybook (0 violations).

## 2. Kiểm tra thủ công (Manual Checks)

Automated tests chỉ phát hiện được khoảng 30% các lỗi a11y. Do đó, **kiểm tra thủ công là bắt buộc** đối với các component tương tác.

### Keyboard-only Navigation

- Sử dụng phím `Tab` để di chuyển qua lại giữa các phần tử tương tác.
- Component không được bẫy focus (keyboard trap).
- Có thể thao tác đầy đủ bằng bàn phím (ví dụ: dùng mũi tên để chọn tabs, dùng `Enter`/`Space` để click nút).

### Focus Visibility & Order

- Trạng thái `focus` phải hiển thị rõ ràng (thường sử dụng ring hoặc viền nổi bật).
- Thứ tự focus (Tab order) phải đi theo thứ tự logic của DOM, từ trái sang phải, từ trên xuống dưới.

### Accessible Name

- Các thành phần không có text hiển thị (như icon button) bắt buộc phải có `aria-label` hoặc được liên kết bằng `aria-labelledby`.

### Error Announcement

- Lỗi form, toast notification phải sử dụng `aria-live` hoặc role tương ứng (như `role="alert"`) để screen reader có thể đọc lên ngay khi chúng xuất hiện.

### Dialog & Modal Behavior

- Khi mở modal/dialog, focus phải tự động chuyển vào phần tử tương tác đầu tiên bên trong modal.
- Focus phải bị khóa (trapped) bên trong modal khi nó đang mở.
- Khi đóng modal, focus phải được trả về phần tử đã trigger modal đó.

### Menu & Dropdown Keyboard Behavior

- Khi focus vào trigger, nhấn `Enter` hoặc `Space` để mở.
- Khi menu đang mở, dùng mũi tên (Lên/Xuống) để di chuyển giữa các items.
- Phím `Esc` phải đóng được dropdown và trả focus về trigger.

### Color Contrast & Reduced Motion

- Độ tương phản của văn bản và icon phải tuân thủ chuẩn WCAG AA (thường là 4.5:1 đối với chữ thường và 3:1 đối với chữ lớn).
- Hỗ trợ `prefers-reduced-motion` đối với các animation chạy liên tục hoặc chuyển động mạnh. Animation nên tắt hoặc giảm thiểu nếu user bật cờ này ở OS.

## 3. Tổng kết

Không release component nếu chưa qua bước kiểm tra thủ công với bàn phím. Design System tốt không chỉ đẹp mà còn phải dùng được với tất cả mọi người.

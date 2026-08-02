# Coding Conventions & Rules

Tài liệu này xác định các quy tắc đặt tên và bộ tiêu chí quyết định (decision framework) khi xây dựng các component trong hệ thống Design System.

## A. Naming Conventions (Quy tắc đặt tên)

Để duy trì sự đồng nhất, tất cả mã nguồn liên quan đến UI phải tuân thủ các quy tắc sau:

- **File Component:** Sử dụng `PascalCase` cho tên file (ví dụ: `Button.tsx`, `PageHeader.tsx`). Các file non-component (utils, hooks) sử dụng `kebab-case`.
- **Tên Component:** Sử dụng `PascalCase` tương ứng với tên file (ví dụ: `export const Button = ...`).
- **Tên Props:** Sử dụng tên component thêm hậu tố `Props` (ví dụ: `ButtonProps`, `PageHeaderProps`). Không dùng interface prefix `I`.
- **Variant / Size (CVA):** Sử dụng `camelCase` hoặc `lowercase` chuỗi ngắn gọn cho các thuộc tính phân loại (ví dụ: `primary`, `danger`, `ghost` cho variant; `sm`, `md`, `lg`, `icon` cho size).
- **Tên Story:** Sử dụng định dạng `[ComponentName].stories.tsx` (ví dụ: `Button.stories.tsx`).
- **Tên Test:** Sử dụng định dạng `[ComponentName].test.tsx` (ví dụ: `Button.test.tsx`).
- **CSS Variable:** Định dạng `--[category]-[name]` (ví dụ: `--font-sans`, `--shadow-card`).
- **Semantic Token:** Định dạng `--color-[intent]-[state]` (ví dụ: `--color-brand-light`, `--color-danger-bg`).

---

## B. 10 Quy tắc định hướng (Decision Rules)

Khi phát triển một tính năng hoặc giao diện mới, hãy dùng 10 quy tắc sau để ra quyết định:

### 1. Khi nào tạo UI Primitive?

- Khi element đó cấu thành nên giao diện cơ bản (building block).
- Hoàn toàn độc lập (agnostic), không chứa bất kỳ business logic, API calls, hay React Context nào của một tính năng cụ thể.
- Có khả năng được sử dụng lại ở nhiều nơi trên toàn bộ ứng dụng.

### 2. Khi nào tạo Common Component?

- Khi component là sự kết hợp của 2 hoặc nhiều UI Primitives.
- Tính chất vẫn hoàn toàn độc lập với domain cụ thể (agnostic). Ví dụ: `Card` kết hợp với `Button` và `Typography` để tạo thành một Layout chung không giới hạn ngữ cảnh.

### 3. Khi nào component phải nằm trong Feature?

- Khi component có import và sử dụng Context cụ thể của feature (ví dụ: `useAuth()`).
- Khi component thực hiện Data Fetching (ví dụ: gọi API lấy thông tin Profile).
- Khi component quản lý trạng thái nghiệp vụ cụ thể.
- Khi layout hoặc chức năng đó chỉ dùng DUY NHẤT một lần cho một nghiệp vụ cụ thể mà không có ý định tái sử dụng ở feature khác.

### 4. Khi nào được dùng `className`?

- **Bên trong UI Primitive/Common:** Được dùng (thường kết hợp với `cn()` / `tailwind-merge`) để định nghĩa base styles và nhận overrides.
- **Bên ngoài (Feature):** Chỉ dùng `className` truyền vào Primitives để thay đổi các thuộc tính layout như `margin`, `position`, `width`, `height`. Hạn chế tối đa việc dùng `className` để ghi đè (override) core styling như `background-color`, `border-radius`, `font-size` của Primitives. Hãy dùng Variant thay thế.

### 5. Khi nào được dùng arbitrary value (giá trị tùy ý)?

- Hãy hạn chế tối đa.
- Chỉ dùng khi giá trị đó cực kỳ đặc thù, chỉ xuất hiện **một lần duy nhất** (ví dụ: hình ảnh có kích thước cố định cụ thể `w-[314px]` để khớp pixel-perfect).
- Nếu giá trị tùy ý xuất hiện từ 2 lần trở lên, hãy định nghĩa nó thành Design Token hoặc mở rộng theme của Tailwind.

### 6. Khi nào được dùng Radix (hoặc Headless UI)?

- Khi cần xây dựng các Complex Components (như `Dialog`, `DropdownMenu`, `Popover`, `Tabs`, `Accordion`, `Tooltip`, `Select`).
- Radix cung cấp sẵn nền tảng để đảm bảo Accessibility (WAI-ARIA chuẩn), Focus management, và Keyboard navigation mà việc tự viết từ đầu bằng HTML native là quá tốn kém và dễ sinh lỗi.

### 7. Khi nào nên dùng native HTML?

- Đối với các component đơn giản mà thẻ HTML thuần đã hỗ trợ tốt tính năng, khả năng tùy biến bằng Tailwind đơn giản (ví dụ: `<button>`, `<input type="text">`, `<a>`). Dù vậy, chúng vẫn phải được đóng gói thành UI Primitives (ví dụ: bọc `<button>` thành `components/ui/Button.tsx`).

### 8. Khi nào cần CVA (Class Variance Authority)?

- Khi component có nhiều hình thái hiển thị (visual variants) nhưng chia sẻ chung core behaviors.
- Điển hình nhất là các UI Primitives (ví dụ: Button có `variant` là primary/secondary/ghost và `size` là sm/md/lg; Badge có các màu sắc intent khác nhau).

### 9. Khi nào cần compound component?

- Khi một component có cấu trúc con cái (children) phức tạp và cần sự linh hoạt trong việc sắp xếp (VD: Không phải lúc nào cũng có Header, hoặc Footer có thể nằm trước Body).
- Mô hình Compound Component (ví dụ: `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`) cho phép người dùng lồng ghép tùy ý thay vì phải truyền một đống props phức tạp (như `headerText`, `footerNode`, `hideTitle`).

### 10. Khi nào một component được coi là "Public"?

- Bất kỳ component nào nằm ở tầng **UI Primitives**, **Common Components**, và **Application Patterns** đều được coi là Public API của Design System.
- Mọi Feature hoặc component nào trong toàn ứng dụng đều có quyền import và sử dụng chúng mà không gây ra lỗi vi phạm luồng phụ thuộc. Ngược lại, một component nằm trong thư mục feature (ví dụ `auth/LoginForm`) là "Private" đối với auth feature và các feature khác không nên import trực tiếp.

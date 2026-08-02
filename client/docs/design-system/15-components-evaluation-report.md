# Báo cáo Đánh giá Component theo "Definition of Done"

**Thời điểm đánh giá:** 2026-08
**Phạm vi:** Toàn bộ `client/components/*` (73 components).

## 1. Tổng quan (Executive Summary)

Sau khi rà soát tĩnh (static analysis) mã nguồn của toàn bộ các component, đây là kết quả tổng quát:
- **Kiến trúc & Code Quality (Đạt 95%)**: Hầu hết tuân thủ tốt việc không chứa business logic. Tuy nhiên, một số feature components (`auth/LoginForm`, `auth/RegisterForm`, `auth/LogoutButton`) đang import trực tiếp API/Store, vi phạm tiêu chí "Không chứa business logic".
- **Trạng thái & Styling (Đạt 95%)**: Các component được xây dựng dựa trên Radix UI primitives hoặc chuẩn Tailwind hiện hành nên các trạng thái (hover, focus, disabled, dark theme) đều được hỗ trợ tốt.
- **Testing & Documentation (Chưa đạt - Fail < 5%)**: **Thiếu hụt nghiêm trọng**. Ngoại trừ 1-2 component có file `.test.tsx` hoặc `.stories.tsx`, toàn bộ >70 components còn lại đều thiếu Storybook, Unit Test và tài liệu.
- **Accessibility (Đạt 80% về hỗ trợ, Chưa đạt về verify)**: Có hỗ trợ keyboard và accessible name nhờ Radix UI, nhưng thiếu "accessibility checks" tự động (aXe testing).

---

## 2. Chi tiết Đánh giá theo Giai đoạn

Một Component chỉ được tính là **Hoàn thành (Done)** nếu thỏa mãn 23 tiêu chí:
*Kiến trúc đúng tầng, không business logic, có Types, dùng semantic token, CVA, cn, không arbitrary values, có hover/focus/disabled/loading/dark/responsive, có accessible name, keyboard support, Storybook, Tests, a11y checks, Docs, và pass Lint/Typecheck/Build.*

### Phase 1: UI Primitives & Form Adapters (29 components)
> **Nhận xét:** Kiến trúc tốt, UI hoàn thiện nhưng thiếu Unit Test và Storybook.

| Component | Kiến trúc & Code | Trạng thái (States) | A11y Support | Component Tests | Storybook | Docs | Trạng thái |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Button** | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ⚠️ Gần đạt |
| **Dialog**, **DropdownMenu**, **Tabs** | ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ⚠️ Chưa đạt |
| **Các UI Primitives còn lại** (25 files)| ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ⚠️ Chưa đạt |

### Phase 2: Patterns & Layout (9 components)
> **Bao gồm:** `AppHeader`, `AppLayout`, `AppSidebar`, `NavLinks`, `DataPatterns`, `DialogPatterns`, `FeedbackPatterns`, `FormPatterns`, `LayoutPatterns`.

| Component | Kiến trúc & Code | Trạng thái (States) | A11y Support | Component Tests | Storybook | Docs | Trạng thái |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Tất cả 9 Components** | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ⚠️ Chưa đạt |

### Phase 3: Feature Components (30 components)
> **Nhóm:** `auth`, `interview`, `landing`, `profile`, `report`, `setup`.

| Component | Kiến trúc & Code | Trạng thái (States) | A11y Support | Component Tests | Storybook | Docs | Trạng thái |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **LoginForm, RegisterForm, LogoutButton** | ❌ (Chứa logic) | ✔️ | ✔️ | ❌ | ❌ | ❌ | ❌ Chưa đạt |
| **Các Feature Components còn lại** (27 files)| ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ⚠️ Chưa đạt |

---

## 3. Lộ trình Triển khai (Long-term Action Plan)

**Hiện tại, 0/73 component đạt đủ 100% tiêu chí hoàn thành.**
Vì số lượng lớn (>70 components), công việc sẽ không thực hiện cùng một lúc mà chia thành các **Task** nhỏ dài hạn. Mỗi task sẽ tập trung xử lý dứt điểm toàn bộ tiêu chí cho một nhóm cụ thể.

### Điều kiện hoàn thành chung (Definition of Done)
Một component chỉ được coi là **Hoàn thành (Done)** khi đáp ứng toàn bộ 23 tiêu chí sau:
- [ ] Đúng tầng kiến trúc
- [ ] Không chứa business logic
- [ ] Props có TypeScript type
- [ ] Dùng semantic token
- [ ] Dùng CVA khi có variants
- [ ] Dùng cn để merge class
- [ ] Không có class Tailwind động sai cách
- [ ] Hạn chế arbitrary values
- [ ] Có hover
- [ ] Có focus-visible
- [ ] Có disabled state
- [ ] Có loading state nếu cần
- [ ] Có dark theme
- [ ] Có responsive behavior nếu cần
- [ ] Có accessible name
- [ ] Có keyboard support
- [ ] Có Storybook stories
- [ ] Có component tests
- [ ] Có accessibility checks
- [ ] Có documentation
- [ ] Lint thành công
- [ ] Typecheck thành công
- [ ] Build thành công

---

### Task 1: Nhóm Auth Components (Ưu tiên cao nhất)
**Phạm vi:** `LoginForm`, `RegisterForm`, `LogoutButton`
- **Chi tiết công việc:**
  - Bóc tách toàn bộ API và routing (`useRouter`, `useAuth`) ra khỏi component, đẩy lên `app/(auth)/*`.
  - Áp dụng `react-hook-form` + `zod` để quản lý state và validation nội bộ cho form.
  - Form chỉ nhận props cấu hình và trả về data thông qua `onSubmit(data)`.
  - Khởi tạo `.stories.tsx` với các trạng thái: Form trống, Form lỗi, Đang submit.
  - Viết `.test.tsx` kiểm tra render và tương tác cơ bản.
- **Điều kiện hoàn thành:** Pass toàn bộ 23/23 tiêu chí DoD cho 3 components.

### Task 2: Nhóm Core UI Primitives 1
**Phạm vi:** `Button`, `Dialog`, `DropdownMenu`, `Tabs`, `Input`, `Label`
- **Chi tiết công việc:**
  - Cài đặt và cấu hình bộ công cụ a11y (`@storybook/addon-a11y` & `jest-axe`) cho toàn dự án.
  - Đảm bảo 100% các components cốt lõi này có file `.stories.tsx` với đầy đủ trạng thái (focus/hover/disabled).
  - Viết Unit Test `.test.tsx` chuẩn mực để làm mẫu cho các component khác.
- **Điều kiện hoàn thành:** Cấu hình xong a11y tools và pass 23/23 tiêu chí DoD cho 6 components.

### Task 3: Nhóm Core UI Primitives 2 (Forms & Feedback)
**Phạm vi:** Các UI primitives còn lại (VD: `Checkbox`, `RadioGroup`, `Select`, `Switch`, `Tooltip`, `Popover`, `Accordion`).
- **Chi tiết công việc:**
  - Rà soát lại việc sử dụng semantic tokens (tránh arbitrary values).
  - Viết Storybook và Unit Test cho tất cả các component.
  - Đặc biệt chú ý test accessibility và keyboard navigation (ví dụ: Tab qua Select, Space để mở Popover).
- **Điều kiện hoàn thành:** Pass 23/23 tiêu chí DoD cho toàn bộ components trong nhóm.

### Task 4: Nhóm Layout & Patterns
**Phạm vi:** `AppHeader`, `AppSidebar`, `AppLayout`, `NavLinks` và các `*Patterns`.
- **Chi tiết công việc:**
  - Bóc tách logic gọi data nếu có (ví dụ: NavLinks nhận props `items` thay vì tự load).
  - Viết Storybook để mô phỏng layout toàn trang, test tính responsive (Sidebar thu gọn, Header có hamburger menu).
- **Điều kiện hoàn thành:** Đảm bảo tính responsive, không chứa business logic và pass 23/23 tiêu chí DoD.

### Task 5: Nhóm Feature Components còn lại
**Phạm vi:** Các components trong `interview`, `landing`, `profile`, `report`, `setup`.
- **Chi tiết công việc:**
  - Cần audit kỹ để bóc tách triệt để business logic ra khỏi tầng UI.
  - Phủ Storybook và Unit Test 100% để đảm bảo an toàn khi refactor.
- **Điều kiện hoàn thành:** Xóa bỏ hoàn toàn business logic khỏi thư mục `components/` và pass 23/23 tiêu chí DoD.

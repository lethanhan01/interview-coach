# Repository Audit cho Design System

Báo cáo phân tích hiện trạng source code để chuẩn bị cho quá trình xây dựng Design System.

## 1. Technology Inventory
- **Framework:** Next.js 16.2.6 (App Router)
- **Library:** React 19.2.4 & React DOM 19.2.4
- **TypeScript:** v5.x
- **Package Manager:** npm (dựa trên `package-lock.json`)
- **Styling:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`)
- **Testing:** Playwright (`@playwright/test` v1.60.0), Vitest v4.1.10
- **Documentation:** Storybook v10.5.5

## 2. Existing Component Inventory
- **UI Primitives (`components/ui`):** `Button`, `Input`, `Textarea`, `Badge`, `Card`, `LoadingSpinner`, `ErrorBoundary`. (Đã được refactor cơ bản).
- **Common/Layout:** Đã tách `LogoutButton` sang `components/auth` và `NavLinks` sang `components/layout`.
- **Feature Folders:** `auth`, `interview`, `landing`, `profile`, `report`, `setup`. Chứa nhiều logic nghiệp vụ và component phức tạp.

## 3. Existing Styling Approach
- Sử dụng Tailwind CSS v4 với cấu hình biến CSS (CSS Variables) trực tiếp trong `app/globals.css` thông qua `@theme inline` và `@theme`.
- Các biến Semantic Tokens đã được định nghĩa: `--color-brand`, `--color-surface`, `--color-ink`, `--color-danger`, `--shadow-card`, v.v.
- Hàm tiện ích `cn` (`clsx` + `tailwind-merge`) đã được thiết lập trong `lib/utils.ts`.

## 4. Reusable Assets
- **Icons:** Đang sử dụng thư viện `lucide-react`.
- **UI Primitives:** Các component trong `components/ui` đã sử dụng `class-variance-authority` (CVA) và sẵn sàng để tái sử dụng.
- **Design Tokens:** Có sẵn hệ thống semantic tokens trong `globals.css` có thể áp dụng ngay vào các Feature Component.

## 5. Problems và Technical Debt
- **Raw HTML Elements:** Thay vì dùng `ui/Button` hay `ui/Input`, nhiều Feature Component tự code raw HTML:
  - `<button>`: `JdForm.tsx`, `ConfigForm.tsx`, `WorkExperienceGroup.tsx`, `VoiceRecorder.tsx`, `LoginForm.tsx`,...
  - `<input>`: `WorkExperienceGroup.tsx`, `ProjectsGroup.tsx`, `EducationGroup.tsx`, `CertificationsGroup.tsx`, `LoginForm.tsx`,...
- **Màu sắc vật lý (Physical Colors):** Rất nhiều component feature đang dùng màu Tailwind trực tiếp thay vì semantic token của dự án:
  - `blue-*`, `gray-*`: `SessionMetadataCard.tsx`, `AnnotatedTranscript.tsx`.
  - `red-*`: `VoiceRecorder.tsx`.
- **Arbitrary Values:** Lạm dụng class động hoặc class tùy chỉnh như `min-h-[200px]`, `text-[11px]`, `scale-[1.02]`.
- **Thiếu Headless UI:** Không có Radix UI hay thư viện Headless nào được dùng. Các component phức tạp tự quản lý trạng thái.
- **Form Management:** Quản lý Form state và validation hoàn toàn thủ công (bằng `useState` của React) thay vì dùng thư viện chuẩn, dẫn đến code phức tạp trong thư mục `profile/` và `setup/`.
- **Thiếu Dark Mode:** Không có config `next-themes` hoặc chiến lược dark mode rõ ràng.

## 6. Accessibility Risks
- Việc dùng raw `<button>`, `<input>` thủ công dễ dẫn đến thiếu `aria-label`, `aria-describedby` (cho thông báo lỗi), và `aria-invalid`.
- Thiếu trạng thái `focus-visible` chuẩn trên các phần tử tương tác tùy chỉnh trong Feature component.
- Hỗ trợ phím (Keyboard Navigation) chưa được chuẩn hóa trên toàn app do thiếu Headless UI (ví dụ nếu có dropdown/modal tự code).

## 7. Component Duplication
- Tính năng form (Label + Input + Error) bị phân mảnh và lặp đi lặp lại ở nhiều group trong `components/profile/` (như `EducationGroup`, `WorkExperienceGroup`, `ProjectsGroup`).
- Tồn tại nhiều "nút xóa" (Delete Button) tự code rải rác thay vì dùng một variant `danger` của `Button` chung.

## 8. Migration Risks
- **Profile & Setup Forms:** Việc thay thế raw `<input>` bằng `components/ui/Input` trong các form phức tạp (nơi dùng array states rất nhiều) có thể gây lỗi nếu props không tương thích hoàn toàn (ví dụ: thiếu forwardRef hoặc truyền type sai).
- **Layout Shift:** Việc áp dụng lại Typography hoặc Spacing chuẩn (loại bỏ Arbitrary values) có thể làm thay đổi nhẹ layout hiện tại. Cần kiểm tra lại giao diện (visual regression).

## 9. Dependency Recommendations
- NÊN cân nhắc sử dụng **`react-hook-form`** và **`zod`** nếu các form trong tương lai phức tạp hơn, giúp loại bỏ technical debt ở `components/profile/`.
- NÊN cài đặt **`next-themes`** nếu dự án có yêu cầu hỗ trợ Dark/Light mode nghiêm ngặt.
- NÊN cài đặt **Radix UI Primitives** (như `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`) khi cần làm Modal, Dropdown, Tooltip để đảm bảo Accessibility.

## 10. Những file tuyệt đối không được sửa tùy tiện
- Các file cấu hình hệ thống: `next.config.ts`, `package.json`, `playwright.config.ts`.
- File logic Auth: `lib/auth-context.tsx`, `lib/auth-redirect.ts`.
- Cấu trúc Routing cơ bản trong `app/layout.tsx` và middleware nếu có.

## 11. Đề xuất thứ tự triển khai
1. **Pha 1: Khai báo & Chuẩn hóa Semantic Tokens:** Áp dụng `--color-brand`, `--color-surface`, `--color-ink` vào `components/report/` và `components/interview/` (Thay thế toàn bộ `gray-*`, `blue-*`, `red-*`).
2. **Pha 2: Thay thế UI Primitives trong Features:** Refactor các component trong `components/profile/`, `components/auth/` và `components/setup/` để thay raw `<button>`, `<input>` bằng `ui/Button`, `ui/Input`.
3. **Pha 3: Dọn dẹp Arbitrary Values:** Rà soát và chuyển các class như `text-[11px]`, `w-[200px]` về hệ thống spacing/typography chuẩn.
4. **Pha 4: Cải tiến Form & Accessibility:** (Tùy chọn) Chuyển đổi sang `react-hook-form` hoặc chuẩn hóa prop truyền error cho `ui/Input`. Viết Storybook stories đầy đủ cho các trường hợp sử dụng.

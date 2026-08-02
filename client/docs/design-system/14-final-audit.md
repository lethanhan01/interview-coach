# Final Audit: Design System Migration

Báo cáo này thống kê tình trạng hiện tại của hệ thống sau đợt migrate Pilot (Màn hình Admin Users).

## 1. Thống kê Component Design System

- **Số component design system**: 25 (trong `client/components/ui/`)
- **Số component có stories**: 2 (Tỷ lệ coverage: ~8%)
- **Số component có tests**: 5 (Tỷ lệ coverage: 20%)
- **Số component có a11y checks**: 5 (Các component có test được gắn kèm check a11y axe)

## 2. Thống kê nợ kỹ thuật (Technical Debt)

Từ toàn bộ mã nguồn `app/` (không tính màn hình Pilot đã dọn dẹp):

- **Các raw HTML controls còn lại**: 39
  - `<button>`: 23
  - `<input>`: 3
  - `<table>`: 13
- **Các màu hard-code còn lại**: 0 (Đã sử dụng toàn bộ token màu của Tailwind)
- **Arbitrary values còn lại**: 4 (Các class có bracket như `w-[50px]`, `text-[12px]`)
- **Component trùng còn lại**:
  - `LoadingSpinner` / Spinner custom rải rác.
  - Custom form components (ở trang `setup`) chưa dùng `Input` từ design system.
  - Profile groups (EducationGroup, etc.) đang dùng bảng / layout thủ công.
- **Các màn hình chưa migrate**:
  - `app/(candidate)/profile/page.tsx`
  - `app/(candidate)/setup/page.tsx`
  - `app/(candidate)/sessions/page.tsx`
  - `app/(candidate)/jd-library/page.tsx`

## 3. Hạng mục cần làm tiếp (Backlog)

- Cập nhật Storybook cho 23 components chưa có stories (để test visual regression).
- Cập nhật Unit Tests cho các UI Primitives chưa có test case.
- Lên kế hoạch migrate `app/(candidate)/jd-library/page.tsx` (Card list, Buttons).
- Lên kế hoạch migrate `app/(candidate)/sessions/page.tsx` (Complex states).
- Lên kế hoạch cấu trúc lại màn hình `app/(candidate)/setup/page.tsx` vì có độ phức tạp cao, nhiều step forms.
- Xóa bỏ hoàn toàn thẻ native `<table>`, `<button>`, `<input>` ra khỏi `app/`.

## 4. Kết quả kiểm tra quy trình (CI Checks)

- `format:check`: **PASS**
- `lint`: **PASS**
- `typecheck`: **PASS**
- (Các command như test:a11y, visual, build sẽ được chạy trong pipeline để chốt hạ 100%).

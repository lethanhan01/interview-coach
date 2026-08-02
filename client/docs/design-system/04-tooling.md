# Tooling & Infrastructure

Tài liệu này ghi lại các cấu hình và công cụ cốt lõi (infrastructure) đã được thiết lập để phục vụ cho việc phát triển Design System. Các thiết lập này đảm bảo tính thống nhất của code, khả năng mở rộng và môi trường cô lập cho việc phát triển component.

## 1. Utility `cn` (Class Name Merger)

- **Công nghệ:** Sử dụng kết hợp `clsx` và `tailwind-merge`.
- **Vị trí:** `client/lib/utils.ts`.
- **Mục đích:** Hỗ trợ việc kết hợp class Tailwind một cách linh hoạt dựa trên điều kiện (clsx) và loại bỏ các xung đột CSS do đặc thù của CSS Cascade (tailwind-merge).
- **Trạng thái:** Đã kiểm tra và đang hoạt động đúng yêu cầu.

## 2. Formatting (Prettier + Tailwind Plugin)

- **Công nghệ:** `prettier` & `prettier-plugin-tailwindcss`.
- **Cấu hình:** `.prettierrc` đã được tạo để tự động sắp xếp (sort) class của Tailwind theo thứ tự chuẩn.
- **Tích hợp:** Hỗ trợ sắp xếp class ngay cả bên trong hàm `cn()` và `cva()`.
- **Scripts:**
  - `npm run format`: Tự động format toàn bộ mã nguồn.
  - `npm run format:check`: Kiểm tra xem mã nguồn đã được format đúng chưa (hữu ích cho CI/CD pipeline).

## 3. Headless UI & CVA (shadcn/ui & Radix UI)

- **Cấu hình:** `components.json` đã được tạo thủ công, kết nối chính xác tới cấu hình Tailwind v4 và thư mục `app/globals.css`.
- **Kiến trúc Base:** `new-york`.
- **Primitive Components:** Sẵn sàng để tích hợp các Radix UI primitives khi cần thiết (ví dụ: chạy lệnh `npx shadcn@latest add dialog` sẽ trỏ đúng vào hệ thống này).

## 4. Kiểm tra mã tĩnh (Static Analysis)

- Cập nhật script `npm run typecheck` sử dụng `tsc --noEmit` để bắt lỗi TypeScript nhanh gọn mà không ảnh hưởng tới bundle.
- Đã xác nhận `npm run lint` hoạt động ổn định và không có xung đột nghiêm trọng.

## 5. Môi trường phát triển Component (Storybook)

- **Cấu hình bổ sung:** Tệp `.storybook/preview.tsx` đã được điều chỉnh để nhập (import) `app/globals.css`.
- **Kết quả:** Storybook hiện tại có thể hiển thị chính xác toàn bộ style, semantic tokens, và font của Tailwind. Các component render trong Storybook được cách ly hoàn toàn nhưng vẫn giữ nguyên diện mạo (look & feel) của production.
- **Build Status:** Storybook build tĩnh (lệnh `npm run build-storybook`) thành công không lỗi, sẵn sàng triển khai lên Chromatic hoặc môi trường documentation tĩnh.

---

### Tiêu chí nghiệm thu (Đã đạt)

1. Hàm `cn` hoạt động chính xác bằng sự kết hợp của clsx & tailwind-merge.
2. Storybook đã có khả năng hiển thị Global CSS của Next.js app.
3. Prettier được cài đặt với chuẩn Tailwind class sorting.
4. App build thành công 100%, chứng minh quá trình tích hợp không phá vỡ mã nguồn cũ.

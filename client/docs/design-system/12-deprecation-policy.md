# Chính sách loại bỏ (Deprecation Policy)

Tài liệu này quy định cách xử lý khi một component, prop, hoặc design token không còn được sử dụng và cần loại bỏ khỏi Design System, kể cả khi Design System này chỉ dùng nội bộ trong repository.

## 1. Nguyên tắc chung

- **Không xóa đột ngột**: Không bao giờ được phép xóa thẳng tay một API hoặc Component đang được sử dụng ở nơi khác trong ứng dụng.
- **Cung cấp giải pháp thay thế**: Luôn phải có hướng dẫn rõ ràng (migration guide) để developer chuyển từ cái cũ sang cái mới.
- **Có thời gian chuyển đổi**: Đánh dấu deprecated ở một phiên bản và chỉ tiến hành xóa thực sự ở một mốc thời gian/phiên bản sau đó (thường là ở Breaking Change tiếp theo).

## 2. Các bước deprecate một Component hoặc Prop

### Bước 1: Đánh dấu Deprecated trong Code

Sử dụng JSDoc tag `@deprecated` ngay phía trên định nghĩa interface hoặc component. Ghi rõ lý do và component/prop thay thế.

```typescript
export interface ButtonProps {
  /**
   * @deprecated Prop này sẽ bị xóa. Hãy sử dụng `variant="destructive"` thay thế.
   */
  isDanger?: boolean
}
```

### Bước 2: Thêm cảnh báo (Warning) lúc Runtime hoặc Build time (Tùy chọn)

Nếu cần thiết, có thể sử dụng `console.warn` trong môi trường development để cảnh báo developer khi họ sử dụng tính năng đã bị deprecated.

### Bước 3: Cập nhật tài liệu và Storybook

- Thêm badge/label `[DEPRECATED]` vào tên component trong Storybook.
- Cập nhật file markdown documentation để ghi rõ tình trạng.

### Bước 4: Ghi nhận vào CHANGELOG

Ghi chú sự thay đổi này vào `CHANGELOG.md` dưới mục **Breaking**.

## 3. Khi nào được xóa hoàn toàn?

Việc xóa code thực sự (Breaking Change) chỉ được thực hiện khi:

1. Đã hoàn thành quá trình refactor (thay thế/xóa bỏ việc sử dụng component/prop cũ) trên TẤT CẢ các file trong repository.
2. Được thông báo trước và được xác nhận bởi team thông qua Pull Request.
3. Việc xóa được ghi nhận trong mục **Breaking** của `CHANGELOG.md`.

# Design System

Chào mừng đến với hệ thống Design System của InterviewCoach. Design System này được xây dựng để đảm bảo tính nhất quán về mặt giao diện, trải nghiệm người dùng (UX) và khả năng tái sử dụng mã nguồn trong toàn bộ ứng dụng.

## Mục tiêu

- **Nhất quán:** Mang lại giao diện đồng nhất trên tất cả các tính năng.
- **Tái sử dụng:** Tối đa hóa việc sử dụng lại code, giảm duplication.
- **Bảo trì:** Dễ dàng thay đổi style toàn cục thông qua hệ thống token.
- **Khả năng tiếp cận (A11y):** Đảm bảo mọi đối tượng người dùng đều có thể sử dụng dễ dàng.

## Tài liệu tham khảo

Hệ thống được chia thành các phần sau để dễ dàng quản lý và phát triển:

1. [Architecture (Kiến trúc)](./01-architecture.md): Mô tả 5 tầng kiến trúc của hệ thống và luồng phụ thuộc (dependency direction).
2. [Component Taxonomy (Phân loại)](./02-component-taxonomy.md): Danh mục các thành phần từ cơ bản đến phức tạp.
3. [Coding Conventions (Quy chuẩn)](./03-coding-conventions.md): Các quy tắc đặt tên, cũng như 10 bộ quy tắc định hướng khi nào nên sử dụng phương pháp nào.
4. [Tooling](./04-tooling.md): Storybook, Vitest, Playwright, Prettier, ESLint.
5. [Design Tokens](./05-design-tokens.md): Primitive và Semantic tokens, cách dùng trong Tailwind CSS 4.
6. [Component Contract (Quy chuẩn Component)](./06-component-contract.md): Checklist bắt buộc cho mọi component — API, styling, behavior, a11y, và documentation. `Button` là reference implementation.
7. [Hướng dẫn đóng góp (Contribution)](./10-contribution.md): Quy trình thêm component, pull request checklist.
8. [Mẫu yêu cầu Component](./11-component-request-template.md): Template chuẩn khi yêu cầu tạo component mới.
9. [Chính sách loại bỏ (Deprecation Policy)](./12-deprecation-policy.md): Cách xử lý khi một component, prop không còn được sử dụng.
10. [Changelog](./CHANGELOG.md): Lịch sử thay đổi các phiên bản.

## Cấu trúc thư mục hiện tại

Dựa trên repository thực tế, kiến trúc sẽ được ánh xạ trực tiếp vào thư mục `client/components/` như sau:

```text
client/
  components/
    ui/          # Chứa UI Primitives & Complex Components (ví dụ: Button, Dialog)
    common/      # Chứa Common Components (ví dụ: Layout wrappers, shared non-feature UI)
    patterns/    # Chứa Application Patterns (ví dụ: PageHeader, DataTable)
    auth/        # Feature Components của auth
    interview/   # Feature Components của interview
    profile/     # Feature Components của profile
    ...          # Các feature khác
```

Các tính năng nghiệp vụ (Feature Components) sẽ tiếp tục nằm trong các thư mục tương ứng của chúng nhưng giờ đây sẽ tận dụng tối đa các thành phần từ `ui`, `common`, và `patterns` thay vì tự implement raw HTML.

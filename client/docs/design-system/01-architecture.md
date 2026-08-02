# Kiến trúc Design System

Hệ thống Design System của dự án được xây dựng dựa trên mô hình kiến trúc phân tầng, phân tách rõ ràng trách nhiệm của từng thành phần. Điều này giúp ngăn chặn tình trạng coupling (phụ thuộc chặt chẽ) giữa logic giao diện và logic nghiệp vụ.

## 5 Tầng Kiến Trúc

Kiến trúc bao gồm 5 tầng từ thấp đến cao như sau:

### 1. Design Tokens

- **Trách nhiệm:** Lưu trữ các giá trị thiết kế nguyên thủy (core visual values) dưới dạng biến số độc lập với nền tảng. Bao gồm màu sắc, font chữ, khoảng cách (spacing), độ cong (radius), shadow.
- **Nơi lưu trữ:** Các biến CSS trong `app/globals.css` (ví dụ: `--color-brand`, `--shadow-card`).
- **Phạm vi:** Không chứa bất kỳ logic hay cấu trúc HTML nào.

### 2. UI Primitives

- **Trách nhiệm:** Các thành phần giao diện ở mức độ thấp nhất (lowest-level building blocks). Chúng có tính tái sử dụng tuyệt đối (agnostic) và không mang bất kỳ business logic nào.
- **Ví dụ:** `Button`, `Input`, `Badge`, `Checkbox`.
- **Nơi lưu trữ:** `client/components/ui/`.

### 3. Common Components

- **Trách nhiệm:** Các thành phần được cấu thành bằng cách kết hợp nhiều UI Primitives lại với nhau. Vẫn giữ tính domain-agnostic (không gắn với nghiệp vụ cụ thể), nhưng có cấu trúc phức tạp hơn.
- **Ví dụ:** `ConfirmDialog`, `Card` (với Header/Body/Footer), `EmptyState`.
- **Nơi lưu trữ:** `client/components/common/`.

### 4. Application Patterns

- **Trách nhiệm:** Các mẫu giao diện (layout/patterns) được sử dụng lặp đi lặp lại trong ứng dụng. Chúng định hình cách các thành phần sắp xếp với nhau trên một trang hoặc một bối cảnh ứng dụng lớn.
- **Ví dụ:** `PageHeader`, `FormSection`, `DataTable`.
- **Nơi lưu trữ:** `client/components/patterns/`.

### 5. Feature Components

- **Trách nhiệm:** Các thành phần gắn chặt với logic nghiệp vụ (domain-specific), data fetching, và trạng thái (state) của tính năng đó.
- **Ví dụ:** `ConfigForm`, `WorkExperienceGroup`, `SessionMetadataCard`.
- **Nơi lưu trữ:** `client/components/[feature-name]/` (ví dụ: `auth/`, `profile/`, `interview/`).

---

## Luồng phụ thuộc (Dependency Direction)

Để đảm bảo hệ thống dễ bảo trì và mở rộng, **luồng phụ thuộc (import direction) phải luôn đi từ trên xuống dưới hoặc nằm trên cùng một tầng**. Tuyệt đối tuân thủ quy tắc: **Tầng thấp KHÔNG ĐƯỢC import tầng cao.**

```text
Feature Components
       ↓
Application Patterns
       ↓
Common Components
       ↓
UI Primitives
       ↓
Design Tokens
```

### Giải thích:

- **Feature Component** có thể import từ mọi tầng bên dưới (Patterns, Common, Primitives, Tokens).
- **Application Patterns** có thể import từ Common, Primitives, Tokens, nhưng TUYỆT ĐỐI KHÔNG import từ Feature Component.
- **Common Components** chỉ có thể import từ Primitives và Tokens.
- **UI Primitives** chỉ sử dụng Design Tokens.

### Vi phạm ví dụ:

- ❌ `components/ui/Button` gọi API logout (UI Primitive chứa Business logic).
- ❌ `components/common/PageHeader` import `components/auth/UserContext` (Common phụ thuộc vào Feature).

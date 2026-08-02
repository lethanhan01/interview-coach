# Design Tokens

Design Tokens là những thành tố cơ bản nhất của Design System (màu sắc, typography, spacing, radius, shadow, v.v.). Chúng giúp đảm bảo tính nhất quán trên toàn bộ ứng dụng và cho phép thay đổi giao diện (như Light/Dark mode) một cách dễ dàng thông qua việc thay đổi token.

Trong dự án này, Design Tokens được quản lý bằng CSS Variables (Tailwind CSS 4) và chia làm 2 lớp: **Primitive Tokens** và **Semantic Tokens**.

## 1. Primitive Tokens

**Vị trí:** `client/app/styles/tokens.css`

Primitive tokens chứa các giá trị gốc rễ (core values) như bảng màu cơ bản, font chữ, kích thước bo góc. Chúng **không chứa ngữ cảnh sử dụng**. Ví dụ: `--color-brand-500`, `--color-neutral-900`, `--radius-md`.

### Bảng màu (Color Scales)

- **Neutral:** `neutral-50` đến `neutral-950` (Màu trung tính, dùng cho nền, văn bản, viền).
- **Brand:** `brand-50` đến `brand-950` (Màu xanh nhận diện thương hiệu).
- **Red (Destructive):** `red-50` đến `red-950`.
- **Green (Success):** `green-50` đến `green-950`.
- **Amber (Warning):** `amber-50` đến `amber-950`.
- **Blue (Info):** `blue-50` đến `blue-950`.

### Typography

- **Font Family:** `font-sans` (Geist), `font-mono` (Geist Mono).
- **Font Size / Line Height:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`.
- **Font Weight:** `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).

### Radius, Shadow, Motion, Layout, Z-index

(Xem chi tiết trong `tokens.css`)

> ⚠️ **Lưu ý:** TRÁNH sử dụng trực tiếp Primitive tokens trong components trừ khi thực sự cần thiết. Hãy sử dụng Semantic Tokens.

## 2. Semantic Tokens

**Vị trí:** `client/app/styles/themes.css`

Semantic tokens là các token **có ngữ cảnh sử dụng rõ ràng**, được ánh xạ từ Primitive tokens.
Chúng thay đổi linh hoạt tùy theo theme hiện tại (Light/Dark). Ví dụ: `--primary`, `--background`, `--text-muted`.

### Danh sách Semantic Tokens

| Token                    | Mô tả                                               |
| :----------------------- | :-------------------------------------------------- |
| `background`             | Màu nền chính của ứng dụng                          |
| `foreground`             | Màu chữ chính trên nền background                   |
| `surface`                | Màu nền của các thành phần nổi lên (Card, Modal)    |
| `surface-foreground`     | Màu chữ trên nền surface                            |
| `card`                   | Màu nền của Card component                          |
| `card-foreground`        | Màu chữ trong Card                                  |
| `popover`                | Màu nền của Popover, Dropdown                       |
| `popover-foreground`     | Màu chữ trong Popover                               |
| `primary`                | Màu chính (thường dùng cho nút bấm chính)           |
| `primary-hover`          | Màu chính khi hover                                 |
| `primary-active`         | Màu chính khi active/click                          |
| `primary-foreground`     | Màu chữ trên nền primary                            |
| `secondary`              | Màu phụ                                             |
| `secondary-hover`        | Màu phụ khi hover                                   |
| `secondary-foreground`   | Màu chữ trên nền secondary                          |
| `muted`                  | Màu nền cho các thành phần bị làm mờ, không nổi bật |
| `muted-foreground`       | Màu chữ mờ, ít quan trọng                           |
| `accent`                 | Màu nhấn mạnh phụ                                   |
| `accent-foreground`      | Màu chữ trên nền accent                             |
| `destructive`            | Màu cho các hành động nguy hiểm (Xóa)               |
| `destructive-hover`      | Màu destructive khi hover                           |
| `destructive-foreground` | Màu chữ trên nền destructive                        |
| `success`                | Màu cho trạng thái thành công                       |
| `success-foreground`     | Màu chữ trên nền success                            |
| `warning`                | Màu cảnh báo                                        |
| `warning-foreground`     | Màu chữ trên nền warning                            |
| `info`                   | Màu thông tin                                       |
| `info-foreground`        | Màu chữ trên nền info                               |
| `border`                 | Màu viền mặc định                                   |
| `border-strong`          | Màu viền đậm                                        |
| `input`                  | Màu viền của input field                            |
| `ring`                   | Màu vòng ring focus mặc định                        |
| `focus`                  | Màu vòng ring focus khi tab qua bàn phím (đậm hơn)  |
| `disabled`               | Màu nền cho phần tử bị vô hiệu hóa                  |
| `overlay`                | Màu lớp mờ đè lên nội dung (Dialog overlay)         |

### Cách sử dụng trong Tailwind CSS 4

Chỉ cần sử dụng các class của Tailwind tương ứng. Semantic tokens đã được cấu hình trong `@theme` và sẽ tự động hỗ trợ Light/Dark mode.

```tsx
// ❌ Sai: Sử dụng mã màu cứng hoặc primitive token
<div className="bg-white text-gray-900 border-gray-200">...</div>
<div className="bg-neutral-50 text-brand-500">...</div>

// ✅ Đúng: Sử dụng semantic tokens
<div className="bg-background text-foreground border-border">...</div>
<button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Lưu thông tin
</button>
```

## 3. Light & Dark Mode

Dự án sử dụng `next-themes` để quản lý giao diện. ThemeProvider sẽ gán class `dark` vào thẻ `<html>` khi chế độ Dark mode được bật.
Các semantic tokens trong `themes.css` đã được định nghĩa cho cả hai selector `:root` (Light) và `.dark` (Dark), do đó component không cần thiết phải dùng class `dark:` thủ công (ví dụ: `dark:bg-slate-900`).

```tsx
// ❌ Không cần thiết
<div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">

// ✅ Chỉ cần dùng Semantic Token
<div className="bg-background text-foreground">
```

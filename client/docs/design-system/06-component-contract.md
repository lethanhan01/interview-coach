# Component Contract

Tài liệu này định nghĩa **Component Contract** — tập hợp các tiêu chuẩn bắt buộc mà mọi UI Primitive và Common Component trong Design System phải tuân thủ. `Button` được sử dụng làm **reference implementation** để minh họa từng điểm.

Mỗi khi tạo component mới, hãy dùng checklist này để đảm bảo component đáp ứng đủ tiêu chuẩn trước khi merge.

---

## 1. API Contract (TypeScript)

### ✅ Checklist

- [ ] **Props interface được export**: Tên theo format `[ComponentName]Props`.
- [ ] **Không dùng `interface` prefix `I`**: Sai → `IButtonProps`, Đúng → `ButtonProps`.
- [ ] **Extends đúng HTML attribute type**: `React.ButtonHTMLAttributes<HTMLButtonElement>`, `React.HTMLAttributes<HTMLDivElement>`, v.v.
- [ ] **Extends `VariantProps<typeof [componentVariants]>`** để tự động expose `variant`, `size` dưới dạng typed props.
- [ ] **Không có prop nào chứa business logic**: Prop chỉ điều khiển appearance và behavior (ví dụ: `loading`, `disabled`, `variant`), không phải domain data (ví dụ: `userId`, `onFetchUser`).
- [ ] **Prop optional có default value hợp lý**: Ví dụ: `loading = false`, `asChild = false`.
- [ ] **Variant và Size có `defaultVariants` trong CVA**: Tránh undefined state khi không truyền prop.

### 📌 Reference (Button)

```tsx
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}
```

---

## 2. Styling Contract

### ✅ Checklist

- [ ] **Dùng CVA** (`class-variance-authority`) cho mọi component có nhiều hơn 1 visual variant.
- [ ] **Dùng `cn()`** (từ `@/lib/utils`) để merge class, hỗ trợ className override từ bên ngoài.
- [ ] **Không hard-code màu**: Tất cả màu phải qua Semantic Token Tailwind (ví dụ: `bg-primary`, `text-foreground`, `border-border`). Không được dùng `bg-blue-500`, `text-white`, `border-gray-200`.
- [ ] **Không tạo dynamic class Tailwind**: Class name không được nối chuỗi động (ví dụ: ❌ `` `bg-${color}-500` ``). Phải khai báo đầy đủ class name (ví dụ: ✅ `bg-primary`, `bg-destructive`).
- [ ] **Không đặt margin mặc định** cho component (ví dụ: `m-4`, `mt-2`). Layout spacing là trách nhiệm của component cha.
- [ ] **Focus-visible ring** dùng semantic token `ring`: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- [ ] **Light và Dark mode**: Chỉ dùng Semantic Token — không cần class `dark:` thủ công. Semantic tokens trong `themes.css` tự động xử lý light/dark.
- [ ] **Không dùng arbitrary value** trừ khi thực sự cần thiết (pixel-perfect một lần). Nếu giá trị xuất hiện 2+ lần, tạo Design Token.

### 📌 Reference (Button)

```tsx
const buttonVariants = cva(
  [
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    // ... các base styles khác
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        destructive: 'bg-destructive text-destructive-foreground',
        // ...
      },
    },
  }
)

// Trong component:
<button className={cn(buttonVariants({ variant, size, className }))} />
```

---

## 3. Behavior Contract

### ✅ Checklist

- [ ] **`forwardRef`**: Mọi UI Primitive phải wrap bằng `forwardRef` để parent có thể truy cập DOM node.
- [ ] **`displayName`**: Set `ComponentName.displayName = 'ComponentName'` sau khi định nghĩa component. Cần thiết cho React DevTools và Storybook.
- [ ] **`asChild` (nếu áp dụng)**: Các component render một element root (button, div, span) nên hỗ trợ `asChild` qua `@radix-ui/react-slot` để cho phép polymorphism.
- [ ] **Disabled state**: Prop `disabled` phải được forward xuống native element. Không trigger action khi disabled.
- [ ] **Loading state (nếu có)**: `loading` phải set `disabled` attribute, `aria-busy="true"`. Chiều rộng/chiều cao component không được thay đổi khi loading (dùng overlay spinner technique).
- [ ] **Không chứa logic nghiệp vụ**: Component không gọi API, không đọc từ Context của feature, không thực hiện side effects phụ thuộc vào domain.

### 📌 Loading Overlay Technique (Button)

```tsx
// ✅ Đúng: overlay spinner — chiều rộng không đổi
<button disabled={disabled || loading} aria-busy={loading || undefined}>
  {loading && (
    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      <Loader2 className="size-4 animate-spin" />
    </span>
  )}
  <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
    {children}
  </span>
</button>

// ❌ Sai: inline spinner — làm thay đổi chiều rộng
<button>
  {loading && <Loader2 className="size-4 animate-spin" />}
  {children}
</button>
```

---

## 4. Accessibility Contract (A11y)

### ✅ Checklist

- [ ] **Accessible name**: Mọi interactive element phải có tên có thể đọc được bởi screen reader — qua `children` text, `aria-label`, hoặc `aria-labelledby`.
- [ ] **Icon-only**: Khi component chỉ chứa icon (không có text), `aria-label` là **bắt buộc**. Phải được document rõ trong JSDoc của component.
- [ ] **Keyboard navigation**: Component có thể được tab đến và activate bằng bàn phím (Enter/Space cho button, Enter cho link). Khi `disabled` hoặc `loading`, không nhận focus.
- [ ] **Focus-visible**: Ring focus chỉ hiện với keyboard, không hiện khi click chuột (`:focus-visible` thay vì `:focus`).
- [ ] **`aria-disabled`**: Forward `aria-disabled` khi element bị vô hiệu hóa để hỗ trợ AT (Assistive Technology) trong trường hợp element vẫn cần focusable.
- [ ] **`aria-busy`**: Set `aria-busy="true"` khi loading để AT thông báo trạng thái đang xử lý.
- [ ] **Semantic HTML**: Dùng đúng thẻ HTML (`<button>` cho button, `<a>` cho link). Không dùng `<div onClick>` hay `<span onClick>` trừ khi cực kỳ cần thiết và đã thêm đủ ARIA role.
- [ ] **Color contrast**: Màu text và background đạt tối thiểu WCAG 2.1 AA (contrast ratio ≥ 4.5:1 với text thường, ≥ 3:1 với text lớn/icon).

### 📌 Reference (Button Icon-Only)

```tsx
// ✅ Icon button — aria-label bắt buộc
<Button size="icon" aria-label="Xóa mục này">
  <Trash2 className="size-4" />
</Button>

// ❌ Không có accessible name — vi phạm WCAG 2.1 SC 4.1.2
<Button size="icon">
  <Trash2 className="size-4" />
</Button>
```

---

## 5. Documentation Contract

### ✅ Checklist

#### Stories (`.stories.tsx`)

- [ ] **File đặt cạnh component**: `components/ui/Button.stories.tsx` thay vì thư mục `stories/` riêng biệt.
- [ ] **`title` theo đúng hierarchy**: Dùng format `UI/ComponentName`, `Common/ComponentName`, v.v. tương ứng với tầng kiến trúc.
- [ ] **`tags: ['autodocs']`**: Bật tính năng tự động generate docs.
- [ ] **Có story `Playground`**: Story đầu tiên, dùng Controls panel để thử toàn bộ props.
- [ ] **Có story cho mọi `variant`**: Mỗi variant ít nhất một story.
- [ ] **Có story cho mọi `size`**: Mỗi size ít nhất một story.
- [ ] **Có story so sánh (All Variants / All Sizes)**: Render tất cả variant/size cùng lúc để dễ visual regression test.
- [ ] **Có story `Loading`** (nếu component có loading state).
- [ ] **Có story `Disabled`** (nếu component có disabled state).
- [ ] **Có story với icon trái, icon phải, icon only** (nếu component hỗ trợ icon).
- [ ] **Có story `DarkMode`**: Hiển thị component ở dark theme.
- [ ] **`description` cho story phức tạp**: Dùng `parameters.docs.description.story` để giải thích ý đồ của story.

#### Tests (`.test.tsx`)

- [ ] **File đặt cạnh component**: `components/ui/Button.test.tsx`.
- [ ] **Nhóm tests bằng `describe`**: Theo chức năng (Render, Click, Disabled, Loading, A11y, Keyboard, v.v.).
- [ ] **Test render cơ bản**: Component render không có lỗi và hiện đúng nội dung.
- [ ] **Test click handler**: `onClick` được gọi khi click.
- [ ] **Test `disabled`**: Click không gọi handler. Element có `disabled` attribute.
- [ ] **Test `loading`** (nếu có): Click không gọi handler. `aria-busy="true"`.
- [ ] **Test accessible name**: `getByRole('button', { name: '...' })` để kiểm tra accessible name.
- [ ] **Test keyboard focus**: Tab focus, Enter/Space trigger action.
- [ ] **Test variant class**: Ít nhất một class CSS đặc trưng của mỗi variant được áp dụng.
- [ ] **Test `forwardRef`**: Ref trỏ đến đúng DOM element.

---

## 6. File Structure Contract

Mỗi component UI Primitive hoặc Common Component phải có đủ 3 file:

```text
components/
  ui/
    Button.tsx          ← Component implementation
    Button.stories.tsx  ← Storybook stories
    Button.test.tsx     ← Unit tests
```

Component **không cần** (và không được có):

- File CSS riêng biệt (dùng Tailwind)
- File types riêng biệt (types nằm trong `Component.tsx`)
- File index riêng biệt (chỉ tạo barrel `index.ts` ở cấp thư mục nếu có nhiều components)

---

## 7. Quick Checklist Tổng Hợp

Sử dụng checklist này trước mỗi PR:

```
API Contract
  [ ] Props interface được export với tên [Name]Props
  [ ] Extends đúng HTML attribute type
  [ ] Extends VariantProps<typeof ...> nếu dùng CVA
  [ ] Không có business logic trong props

Styling Contract
  [ ] Dùng CVA + cn()
  [ ] Chỉ dùng Semantic Token (không hard-code màu)
  [ ] Không dùng dynamic class Tailwind
  [ ] Không có margin mặc định
  [ ] focus-visible:ring-2 focus-visible:ring-ring

Behavior Contract
  [ ] forwardRef
  [ ] displayName được set
  [ ] asChild (nếu component render single root element)
  [ ] disabled/loading không trigger action
  [ ] Không chứa business logic

Accessibility Contract
  [ ] Mọi interactive element có accessible name
  [ ] Icon-only có aria-label được document
  [ ] Keyboard navigable (Tab, Enter/Space)
  [ ] aria-busy khi loading
  [ ] Dùng semantic HTML

Documentation Contract
  [ ] Button.stories.tsx cạnh component
  [ ] Playground story
  [ ] Stories cho mọi variant và size
  [ ] Loading, Disabled, Dark mode stories
  [ ] Button.test.tsx cạnh component
  [ ] Tests: render, click, disabled, loading, a11y, keyboard, variant class, forwardRef
```

---

## Tham khảo

- [01-architecture.md](./01-architecture.md) — Kiến trúc 5 tầng
- [02-component-taxonomy.md](./02-component-taxonomy.md) — Phân loại component
- [03-coding-conventions.md](./03-coding-conventions.md) — Quy tắc đặt tên và 10 decision rules
- [05-design-tokens.md](./05-design-tokens.md) — Semantic tokens và cách dùng
- [`components/ui/Button.tsx`](../../components/ui/Button.tsx) — Reference implementation
- [`components/ui/Button.stories.tsx`](../../components/ui/Button.stories.tsx) — Stories mẫu
- [`components/ui/Button.test.tsx`](../../components/ui/Button.test.tsx) — Tests mẫu

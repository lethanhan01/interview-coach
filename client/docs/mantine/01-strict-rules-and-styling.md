# Quy tắc UI chặt chẽ & Chuẩn Styling Mantine

Tài liệu này quy định các nguyên tắc bắt buộc khi phát triển giao diện trong `client/`. Mọi component mới hoặc chỉnh sửa từ mẫu [`https://ui.mantine.dev/`](https://ui.mantine.dev/) đều phải tuân thủ.

---

## 1. Mantine-First & Cách xây dựng Custom Component

Quy trình 3 bước trước khi viết UI:

1. **Dùng component/hook có sẵn của Mantine**: Tra cứu [`https://mantine.dev/core/package/`](https://mantine.dev/core/package/) và [`https://mantine.dev/hooks/package/`](https://mantine.dev/hooks/package/) trước tiên. Hạn chế tối đa cài thêm UI library bên ngoài.
2. **Tùy biến qua Theme / Style Props / Styles API**: Mở rộng giao diện từ `client/src/theme.ts`, Style Props hoặc `classNames`/`styles`/`vars`.
3. **Custom component từ Mantine primitives**: Khi Mantine chưa có widget đặc thù, **bắt buộc ghép từ các element sẵn có của Mantine** (`Box`, `Paper`, `UnstyledButton`, `Group`, `Stack`, `Input.Wrapper`, `InputBase`, polymorphic `component="..."`, `createPolymorphicComponent`) để giữ nguyên theme tokens, color scheme và style props.

### Ví dụ đối chiếu: Custom clickable card

```tsx
// SAI: Dùng raw HTML + non-semantic onClick
<div className={classes.card} onClick={onSelect}>
  <h3>{title}</h3>
  <p>{description}</p>
</div>

// ĐÚNG: Dựng từ Mantine primitives, đúng semantic tương tác
import { Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import classes from './SelectableCard.module.css';

export function SelectableCard({ title, description, active, onSelect }: SelectableCardProps) {
  return (
    <UnstyledButton
      onClick={onSelect}
      className={classes.root}
      mod={{ active }}
      w="100%"
    >
      <Paper withBorder p="md" radius="md" className={classes.card}>
        <Stack gap="xs">
          <Title order={3} size="h4">
            {title}
          </Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
}
```

---

## 2. Cấm Raw HTML Elements — Bảng thay thế bắt buộc

Không viết trực tiếp thẻ HTML thô trong JSX khi `@mantine/core` đã có component tương ứng:

| Raw HTML (Cấm) | Thành phần Mantine bắt buộc thay thế |
|---|---|
| `<div>` | `Box`, `Stack`, `Group`, `Flex`, `Center`, `Container`, `Paper`, `SimpleGrid`, `Grid` |
| `<span>` | `Text component="span"` (hoặc `<Text span>`), `Box component="span"` |
| `<p>` | `Text` (mặc định render `<p>`) |
| `<h1>` – `<h6>` | `Title order={1}` .. `Title order={6}` |
| `<button>` | `Button`, `ActionIcon`, `CloseButton`, `UnstyledButton` |
| `<a>` | `Anchor` (hoặc `Button component={Link}` / `NavLink component={Link}` với `react-router-dom`) |
| `<form>` | `Box component="form" onSubmit={...}` |
| `<input>`, `<textarea>`, `<select>` | `TextInput`, `PasswordInput`, `NumberInput`, `Textarea`, `Select`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Switch`, `Radio` |
| `<label>` | Dùng prop `label="..."` của input Mantine hoặc `Input.Label` / `Input.Wrapper` |
| `<ul>`, `<ol>`, `<li>` | `List` và `List.Item` |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | `Table`, `Table.Thead`, `Table.Tbody`, `Table.Tr`, `Table.Th`, `Table.Td` |
| `<hr>` | `Divider` |
| `<img>` | `Image` hoặc `Avatar` |
| Inline `<svg>` thủ công | Icon từ package icon chuẩn (như `@tabler/icons-react` / `@phosphor-icons/react`) |

---

## 3. Cấm Non-Semantic Elements & Chuẩn Accessibility

1. **Không gắn `onClick` vào phần tử không mang ngữ nghĩa tương tác**:
   - Cấm `<Box onClick={...}>`, `<Paper onClick={...}>`, `<Text onClick={...}>`.
   - Hành động thực thi → dùng `Button`, `ActionIcon`, hoặc `UnstyledButton`.
   - Điều hướng URL/route → dùng `Anchor`, `NavLink`, hoặc `Button component={Link}` (`react-router-dom`).
2. **Bảo toàn Landmark HTML qua prop `component`**:
   - Dùng `<AppShell.Header>`, `<AppShell.Navbar>`, `<AppShell.Main>`, `<AppShell.Footer>`, hoặc `<Box component="main">`, `<Box component="section">`, `<Box component="article">`, `<Box component="nav">`, `<Box component="aside">`.
3. **Thứ tự Heading & Nhãn truy cập**:
   - Dùng `Title order={1..6}` đúng phân cấp (không nhảy cóc chỉ vì kích thước chữ — nếu cần đổi cỡ chữ, dùng prop `fz="..."` hoặc `size="..."`).
   - Nút chỉ có icon (`ActionIcon`, `CloseButton`) **bắt buộc** có `aria-label`.
4. **Ngoại lệ kỹ thuật hiếm hoi**:
   - Khi tích hợp thư viện bên thứ 3 bắt buộc mount trực tiếp vào DOM node (chart, map, canvas), dùng `<Box ref={containerRef} />` và ghi **1 dòng comment** giải thích lý do ngay phía trên.

---

## 4. Hệ thống Styling & Quy chuẩn đơn vị

### Cấm cài đặt framework styling khác
Không cài **Tailwind CSS**, **`styled-components`**, **Emotion** hay CSS-in-JS khác khi chưa có nhu cầu kiến trúc được duyệt.

### Thứ tự ưu tiên Styling trong dự án

1. **Mantine Style Props** (cho spacing, màu, typography, kích thước nhanh gọn):
   - Ví dụ: `mt="md"`, `p="sm"`, `gap="xs"`, `c="dimmed"`, `fz="sm"`, `fw={600}`, `w={{ base: '100%', sm: '50%' }}`.
2. **CSS Modules + `postcss-preset-mantine`** (`*.module.css`, đã cấu hình tại [client/postcss.config.cjs](../../client/postcss.config.cjs)):
   - Dùng cho style phức tạp, responsive media query, trạng thái hover/active/data-attribute.
   - Các helper PostCSS bắt buộc tận dụng:
     - `rem(...)` cho font-size, padding, margin, width, radius tùy chỉnh.
     - `em(...)` hoặc biến `$mantine-breakpoint-xs|sm|md|lg|xl` cho `@media` queries (xem mẫu [MessagesPage.module.css](../../client/src/pages/MessagesPage.module.css)).
     - `light-dark(lightValue, darkValue)` hoặc `@mixin light` / `@mixin dark` cho màu thích ứng Light/Dark (ưu tiên các biến semantic tự đổi theo color scheme trước).
     - `@mixin hover` cho hiệu ứng hover an toàn trên thiết bị cảm ứng.
     - `mod={{ active }}` kết hợp selector `&[data-active]` và `:focus-visible`.
   - **Tách CSS theo component**: Mọi class riêng của component/trang (kể cả trạng thái `active`, `selected`, `focused`, `me`, `dropzoneInner`) phải đặt trong `<ComponentName>.module.css`. Không thêm class riêng của component vào [global.css](../../client/src/styles/global.css).
3. **Styles API (`classNames`, `styles`, `vars`)**:
   - Dùng khi cần chỉnh phần tử con bên trong component Mantine (xem danh sách selector tại tab **Styles API** của từng component trên `mantine.dev`).

```css
/* MessagesPage.module.css — Chuẩn CSS Module của dự án */
.threadButton {
  display: block;
  text-align: left;
  border-radius: var(--mantine-radius-md);

  &:focus-visible {
    outline: rem(2px) solid var(--mantine-primary-color-filled);
    outline-offset: rem(2px);
  }
}

.threadCard {
  background-color: var(--app-bg-subtle);
  transition: border-color 150ms ease, background-color 150ms ease;

  @mixin hover {
    background-color: var(--mantine-color-default-hover);
  }

  .threadButton[data-active] & {
    background-color: var(--mantine-primary-color-light);
    border-color: var(--mantine-primary-color-filled);
  }
}
```

### Quy tắc cấm hardcode `px` cho Font & Spacing

- **ĐÚNG**:
  - Theme scale: `p="md"`, `gap="sm"`, `fz="lg"`, `radius="md"`
  - CSS variables: `var(--mantine-spacing-md)`, `var(--mantine-font-size-sm)`, `var(--mantine-radius-default)`
  - PostCSS `rem()`: `font-size: rem(28px);`, `letter-spacing: rem(-0.5px);`
  - Numeric props trên component Mantine (`mt={100}`, `maw={580}`) vì Mantine tự chuyển số thành `rem`
- **SAI (Cấm)**:
  - String `'px'` trong style props hoặc inline style: `mt="24px"`, `style={{ fontSize: '14px', padding: '12px' }}`
  - CSS `px` trực tiếp trong `*.module.css`: `font-size: 18px;`, `margin-bottom: 16px;`, `gap: 12px;`
- **Ngoại lệ hợp lệ**: `1px` cho hairline border bên trong `*.module.css` (`border: 1px solid var(--mantine-color-default-border);`) hoặc kích thước cố định của ảnh/media.

---

## 5. Hệ thống Semantic Colors, Borders & Token Ngữ Nghĩa

Không tự ý chọn màu vật lý, shade số, hoặc viết border/style inline trong TSX. Mọi màu sắc đều đi qua vai trò ngữ nghĩa đăng ký trong [theme.ts](../../client/src/theme.ts).

### Bảng Vai trò Màu Semantic (`color` / `c` prop)

| Vai trò (Tên bắt buộc) | Ánh xạ trong `theme.ts` | Ngữ cảnh sử dụng | Tên vật lý bị cấm |
|---|---|---|---|
| `brand` | `primaryColor: 'brand'` | Hành động chính, item đang chọn, trạng thái mới (`new`), hỏi đáp | `blue`, `indigo`, `pink`, `brand-5`, `brand-6` |
| `success` | `virtualColor` → `teal` | Xác thực, khớp lịch, giờ rảnh, nút gửi hồ sơ, bài đánh giá | `teal`, `green`, `teal-0`..`teal-9` |
| `warning` | `virtualColor` → `amber` | Cảnh giác nhẹ, tuyển gấp (`urgent`), kết quả cần kiểm tra | `amber`, `yellow`, `orange` |
| `danger` | `virtualColor` → `red` | Báo cáo lừa đảo, sắp hết hạn (`expiring`), trùng lịch, giờ bận, unread badge | `red`, `rose`, `red-1`..`red-9` |
| `neutral` | `virtualColor` → `gray` | Khoảng cách, đếm số trung tính, badge phụ | `gray`, `slate`, `dark` |
| `dimmed` *(chỉ dùng trên `c`)* | `--mantine-color-dimmed` | Văn bản phụ, mô tả thời gian/địa chỉ | `white`, `black`, `--app-text-muted` |

### Bảng CSS Variables Ngữ Nghĩa được phép dùng

| Nhóm | Biến chuẩn được phép | Biến / Giá trị bị cấm |
|---|---|---|
| Nền trang & Nền phụ | `--mantine-color-body`, `--mantine-color-default`, `--mantine-color-default-hover`, `--app-bg-subtle` | `--app-bg-canvas`, `--app-bg-surface`, `#FFFFFF`, `#0F172A`, `#1E293B` |
| Viền (Border) | `--mantine-color-default-border`, `--mantine-primary-color-filled`, `--mantine-color-<role>-outline` | `--app-border-subtle`, `bd="1px solid ..."`, `bd="2px solid ..."` |
| Chữ & Tương phản | `--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-primary-color-contrast` | `--app-text-muted`, `c="white"`, `c="black"` |
| Màu vai trò trong CSS | `--mantine-primary-color-filled`, `--mantine-primary-color-light`, `--mantine-color-<role>-filled`, `--mantine-color-<role>-light` | `--mantine-color-brand-6`, `--mantine-color-teal-0`, `rgb(...)`, `rgba(...)` |

### Ví dụ đối chiếu: Border, Bubble & Inline Style

```tsx
// SAI: Dùng Box + chuỗi border shorthand + shade số + màu vật lý + hardcode white
<Box
  p="sm"
  bdrs="md"
  bg={isMe ? 'var(--mantine-color-brand-6)' : 'var(--app-bg-canvas)'}
  c={isMe ? 'white' : undefined}
  bd={isMe ? undefined : '1px solid var(--app-border-subtle)'}
>
  ...
</Box>

// SAI: Dùng style inline cho table scroll hoặc dropzone
<Box style={{ overflowX: 'auto' }}><Table /></Box>
<Group style={{ pointerEvents: 'none' }}>...</Group>

// ĐÚNG: Dùng Paper withBorder + CSS Module + mod + semantic tokens
<Paper
  withBorder={!isMe}
  p="sm"
  radius="md"
  className={classes.bubble}
  mod={{ me: isMe }}
>
  ...
</Paper>

// ĐÚNG: Dùng component chuẩn hoặc CSS Module
<Table.ScrollContainer minWidth={600}><Table /></Table.ScrollContainer>
<Group className={classes.dropzoneInner}>...</Group>
```

---

## 6. Checklist tự kiểm tra trước khi hoàn thành UI

- [ ] Đã kiểm tra component/hook có sẵn trên `mantine.dev` và block tương ứng trên `ui.mantine.dev`?
- [ ] Không còn raw HTML tag (`div`, `span`, `p`, `h1`–`h6`, `button`, `a`, `input`, `form`, `ul`, `table`, `img`, `svg`)?
- [ ] Không có `onClick` trên `Box`/`Paper`/`Card`/`Text`, đủ landmark semantic, `aria-current`/`aria-pressed` và `aria-label`?
- [ ] Không dùng prop `bd=`, `bdrs=`, `style={{...}}`, và không hardcode string/CSS `px` ở font/spacing/radius?
- [ ] Toàn bộ màu sắc dùng đúng vai trò semantic (`brand`, `success`, `warning`, `danger`, `neutral`, `dimmed`) và biến CSS semantic — không dùng tên màu vật lý, shade số `0..9`, hex hay `rgb()`?
- [ ] Custom component và style theo trạng thái đặt trong `*.module.css` (không nhét class riêng vào `global.css`) và vượt qua `yarn test` (`check` + `stylelint` + `ui:lint` + `vitest` + `build`)?

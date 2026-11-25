# Quy tắc UI chặt chẽ & Chuẩn Styling Mantine v9

Tài liệu này quy định các nguyên tắc bắt buộc khi phát triển giao diện trong `client/`. Mọi component mới, màn hình migrate hoặc snippet điều chỉnh từ [`https://ui.mantine.dev/`](https://ui.mantine.dev/) đều phải tuân thủ tuyệt đối.

---

## 1. Mantine-First & Cách xây dựng Custom Component

Quy trình 3 bước trước khi viết UI:

1. **Dùng component/hook có sẵn của Mantine**: Tra cứu [`https://mantine.dev/core/package/`](https://mantine.dev/core/package/) và [`https://mantine.dev/hooks/package/`](https://mantine.dev/hooks/package/) trước tiên. Không tạo lớp wrapper mỏng thừa trong `components/ui/` khi `@mantine/core` đã đáp ứng trực tiếp.
2. **Tùy biến qua Theme / Style Props / Styles API**: Mở rộng giao diện từ [client/theme.ts](../../theme.ts), Style Props hoặc `classNames`/`styles`/`vars`.
3. **Custom component từ Mantine primitives**: Khi Mantine chưa có widget đặc thù cho domain InterviewCoach (ví dụ thẻ phiên phỏng vấn tương tác, bộ chấm điểm STAR), **bắt buộc ghép từ các element sẵn có của Mantine** (`Box`, `Paper`, `UnstyledButton`, `Group`, `Stack`, `Input.Wrapper`, `InputBase`, polymorphic `component="..."`, `createPolymorphicComponent`) để giữ nguyên theme tokens, color scheme và style props.

### Ví dụ đối chiếu: Custom clickable card (`SessionCard`)

```tsx
// Incorrect: Dùng raw HTML + non-semantic onClick
function BadSessionCard({ title, description, onSelect }: SessionCardProps) {
  return (
    <div className={classes.card} onClick={onSelect}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// Correct: Dựng từ Mantine primitives, đúng semantic tương tác
import { Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import classes from './SessionCard.module.css'

interface SessionCardProps {
  title: string
  description: string
  active?: boolean
  onSelect: () => void
}

export function SessionCard({
  title,
  description,
  active,
  onSelect,
}: SessionCardProps) {
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
  )
}
```

---

## 2. Cấm Raw HTML Elements — Bảng thay thế bắt buộc

Không viết trực tiếp thẻ HTML thô trong JSX khi `@mantine/core` đã có component tương ứng:

| Raw HTML (Cấm)                                          | Thành phần Mantine bắt buộc thay thế                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `<div>`                                                 | `Box`, `Stack`, `Group`, `Flex`, `Center`, `Container`, `Paper`, `SimpleGrid`, `Grid`                                           |
| `<span>`                                                | `Text component="span"` (hoặc `<Text span>`), `Box component="span"`                                                            |
| `<p>`                                                   | `Text` (mặc định render `<p>`)                                                                                                  |
| `<h1>` – `<h6>`                                         | `Title order={1}` .. `Title order={6}`                                                                                          |
| `<button>`                                              | `Button`, `ActionIcon`, `CloseButton`, `UnstyledButton`                                                                         |
| `<a>`                                                   | `Anchor` (hoặc `Anchor component={Link}` / `Button component={Link}` / `NavLink component={Link}` với `next/link`)              |
| `<form>`                                                | `Box component="form" onSubmit={...} noValidate`                                                                                |
| `<input>`, `<textarea>`, `<select>`                     | `TextInput`, `PasswordInput`, `NumberInput`, `Textarea`, `Select`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Switch`, `Radio` |
| `<label>`                                               | Dùng prop `label="..."` của input Mantine hoặc `Input.Label` / `Input.Wrapper`                                                  |
| `<ul>`, `<ol>`, `<li>`                                  | `List` và `List.Item`                                                                                                           |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | `Table`, `Table.Thead`, `Table.Tbody`, `Table.Tr`, `Table.Th`, `Table.Td`                                                       |
| `<hr>`                                                  | `Divider`                                                                                                                       |
| `<img>`                                                 | `Image` (hoặc `Image component={NextImage}`) / `Avatar`                                                                         |
| Inline `<svg>` thủ công                                 | Icon từ `@tabler/icons-react` (`stroke={1.5}`)                                                                                  |

---

## 3. Cấm Non-Semantic Elements & Chuẩn Accessibility

1. **Không gắn `onClick` vào phần tử không mang ngữ nghĩa tương tác**:
   - Cấm `<Box onClick={...}>`, `<Paper onClick={...}>`, `<Card onClick={...}>`, `<Text onClick={...}>`.
   - Hành động thực thi → dùng `Button`, `ActionIcon`, hoặc `UnstyledButton`.
   - Điều hướng URL/route → dùng `Anchor`, `NavLink`, hoặc `Button component={Link}` (với `import Link from 'next/link'`).
2. **Bảo toàn Landmark HTML qua prop `component`**:
   - Dùng `<AppShell.Header>`, `<AppShell.Navbar>`, `<AppShell.Main>`, `<AppShell.Footer>`, hoặc `<Box component="main">`, `<Box component="section">`, `<Box component="article">`, `<Box component="nav">`, `<Box component="aside">`.
3. **Thứ tự Heading & Nhãn truy cập**:
   - Dùng `Title order={1..6}` đúng phân cấp (không nhảy cóc chỉ vì kích thước chữ — nếu cần đổi cỡ chữ, dùng prop `fz="..."` hoặc `size="..."`).
   - Nút chỉ có icon (`ActionIcon`, `CloseButton`) **bắt buộc** có `aria-label`.
4. **Ngoại lệ kỹ thuật hiếm hoi (`SEM-GOV-001`)**:
   - Khi tích hợp thư viện bên thứ 3 bắt buộc mount trực tiếp vào DOM node (ví dụ audio waveform canvas, chart container), dùng `<Box ref={containerRef} />` kèm chú thích lý do có thời hạn theo cú pháp:
     `// interviewcoach-convention-exempt: <RULE_ID> <Lý do ngắn gọn> until: YYYY-MM-DD`

---

## 4. Hệ thống Styling & Quy chuẩn đơn vị

### Cấm cài đặt framework styling cạnh tranh

Không sử dụng **Tailwind CSS**, **`styled-components`**, **Emotion** hay CSS-in-JS khác cho code UI mới hoặc code đang migrate. Mọi styling đi qua hệ thống Mantine v9 + CSS Modules.

### Thứ tự ưu tiên Styling 3 bậc

1. **Mantine Style Props** (cho spacing, màu ngữ nghĩa, typography, kích thước nhanh gọn):
   - Ví dụ: `mt="md"`, `p="sm"`, `gap="xs"`, `c="dimmed"`, `fz="sm"`, `fw={600}`, `w={{ base: '100%', sm: '50%' }}`.
2. **CSS Modules + `postcss-preset-mantine`** (`*.module.css`, đã cấu hình tại [postcss.config.mjs](../../postcss.config.mjs)):
   - Dùng cho style phức tạp, responsive media query, trạng thái hover/active/data-attribute.
   - Các helper PostCSS bắt buộc tận dụng:
     - `rem(...)` cho font-size, padding, margin, width, radius tùy chỉnh.
     - `em(...)` hoặc biến `$mantine-breakpoint-xs|sm|md|lg|xl` cho `@media` queries.
     - Biến CSS ngữ nghĩa tự đổi theo Light/Dark của Mantine (`--mantine-color-*`), hoặc `light-dark(...)` khi cần biểu thức chuyển đổi sáng/tối hợp lệ.
     - `@mixin hover` cho hiệu ứng hover an toàn trên thiết bị cảm ứng.
     - `mod={{ active }}` kết hợp selector `&[data-active]` và `:focus-visible`.
   - **Kiến trúc CSS Modules 2 tầng (Rule of Three)**:
     - **Tầng 1 (`client/styles/`)**: Tái sử dụng 4 shared CSS Modules (`layout.module.css`, `surfaces.module.css`, `interactions.module.css`, `typography.module.css`) cho các pattern dùng chéo `>= 2` domain; không lặp `light-dark(...)` (dùng `surfaces.subtleSurface`) hoặc `&:focus-visible` mặc định (dùng `theme.focusClassName` ở `client/theme.ts`).
     - **Tầng 2 (Domain `*.module.css`)**: Gom mọi class đặc thù nghiệp vụ (kể cả trạng thái `active`, `selected`, `focused`, `dropzoneInner`) vào `components/<domain>/<domain>.module.css` (hoặc `components/layout/app-shell.module.css`) với prefix theo widget; không tạo `<ComponentName>.module.css` nhỏ lẻ và không thêm class riêng vào [app/globals.css](../../app/globals.css).
3. **Styles API (`classNames`, `styles`, `vars`)**:
   - Dùng khi cần chỉnh phần tử con bên trong component Mantine (tra danh sách selector tại tab **Styles API** của từng component trên `mantine.dev`).

```css
/* SessionCard.module.css — Chuẩn CSS Module Zero-Hex của InterviewCoach */
.root {
  display: block;
  text-align: start;
  border-radius: var(--mantine-radius-md);

  &:focus-visible {
    outline: rem(2px) solid var(--mantine-primary-color-filled);
    outline-offset: rem(2px);
  }
}

.card {
  background-color: light-dark(
    var(--mantine-color-gray-0),
    var(--mantine-color-dark-6)
  );
  transition:
    border-color 150ms ease,
    background-color 150ms ease;

  @mixin hover {
    background-color: var(--mantine-color-default-hover);
  }

  .root[data-active] & {
    background-color: var(--mantine-primary-color-light);
    border-color: var(--mantine-primary-color-filled);
  }
}
```

### Quy tắc cấm hardcode `px` cho Font, Spacing & Radius (`SEM-TOKEN-008`)

- **ĐÚNG**:
  - Theme scale: `p="md"`, `gap="sm"`, `fz="lg"`, `radius="md"`
  - CSS variables: `var(--mantine-spacing-md)`, `var(--mantine-font-size-sm)`, `var(--mantine-radius-default)`
  - PostCSS `rem()`: `font-size: rem(28px);`, `letter-spacing: rem(-0.5px);`
  - Numeric props trên component Mantine (`mt={24}`, `maw={580}`) vì Mantine tự chuyển số thành `rem`
- **SAI (Cấm)**:
  - String `'px'` trong style props hoặc inline style: `mt="24px"`, `style={{ fontSize: '14px', padding: '12px' }}`
  - CSS `px` trực tiếp trong `*.module.css`: `font-size: 18px;`, `margin-bottom: 16px;`, `gap: 12px;`
- **Ngoại lệ hợp lệ**: `1px` cho hairline border bên trong `*.module.css` (`border: 1px solid var(--mantine-color-default-border);`) hoặc kích thước cố định của ảnh/media.

---

## 5. Chính sách Màu Zero-Hex & Semantic-Only Roles (D2)

**Zero-Hex & Semantic-Only**: Tuyệt đối không viết mã màu HEX (`#...`), `rgb()`/`rgba()`, `hsl()`/`hsla()`, `colorsTuple(...)`, `virtualColor(...)`, mảng `MantineColorsTuple` tùy chỉnh, biến `--app-*`, shade số đứng đơn lẻ (`brand.6`, `--mantine-color-gray-0`), hay bất kỳ tên màu vật lý nào (`blue`, `teal`, `yellow`, `red`, `gray`, `green`, `amber`, `orange`, `white`, `black`, `dark`...) trong JSX & CSS Modules.

Toàn bộ màu sắc đi qua **5 vai trò ngữ nghĩa** đăng ký trực tiếp từ `DEFAULT_THEME.colors` tại nguồn chân lý duy nhất [client/theme.ts](../../theme.ts):

### Bảng Vai trò Màu Ngữ Nghĩa (`color` / `c` prop)

| Vai trò (Tên bắt buộc)              | Ánh xạ mặc định tại `client/theme.ts`                 | Ngữ cảnh sử dụng trong InterviewCoach                                      | Tên vật lý / Giá trị bị cấm                             |
| ----------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `brand` _(hoặc bỏ trống = primary)_ | `primaryColor: 'brand'` → `DEFAULT_THEME.colors.blue` | Hành động chính, item đang chọn, bắt đầu phiên phỏng vấn, nút lưu          | `blue`, `indigo`, `brand.6`, `--mantine-color-blue-*`   |
| `success`                           | `DEFAULT_THEME.colors.teal`                           | Hoàn thành phiên, điểm STAR đạt chuẩn, CV/JD hợp lệ, xác thực thành công   | `teal`, `green`, `emerald`, `--mantine-color-teal-*`    |
| `warning`                           | `DEFAULT_THEME.colors.yellow`                         | Cảnh báo nhẹ, cần cải thiện câu trả lời, sắp hết giờ, trạng thái chờ xử lý | `yellow`, `amber`, `orange`, `--mantine-color-yellow-*` |
| `danger`                            | `DEFAULT_THEME.colors.red`                            | Lỗi validation/API, hành động xóa phá hủy, điểm dưới chuẩn, mất kết nối    | `red`, `rose`, `destructive`, `--mantine-color-red-*`   |
| `neutral`                           | `DEFAULT_THEME.colors.gray`                           | Metadata trung tính, badge thẻ kỹ năng phụ, trạng thái nháp/đã lưu trữ     | `gray`, `slate`, `dark`, `--mantine-color-gray-*`       |
| `dimmed` _(chỉ dùng trên `c`)_      | `--mantine-color-dimmed`                              | Văn bản phụ, timestamp, mô tả hướng dẫn, chú thích                         | `white`, `black`, `--app-text-muted`                    |

### Bảng CSS Variables Ngữ Nghĩa được phép dùng trong `*.module.css`

| Nhóm                                        | Biến / Biểu thức chuẩn được phép                                                                                                   | Biến / Giá trị bị cấm                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Nền chính & Tương tác                       | `--mantine-color-body`, `--mantine-color-default`, `--mantine-color-default-hover`                                                 | `--app-bg-*`, `#FFFFFF`, `#0F172A`, `rgb(...)`                                                |
| Nested Subtle Surface _(ngoại lệ duy nhất)_ | `light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))`                                                             | Dùng `--mantine-color-gray-0` hay `--mantine-color-dark-6` đứng đơn lẻ                        |
| Viền (Border)                               | `--mantine-color-default-border`, `--mantine-primary-color-filled`, `--mantine-color-<role>-outline`                               | `--app-border-*`, `bd="1px solid ..."`, `bd="2px solid ..."`                                  |
| Chữ & Tương phản                            | `--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-primary-color-contrast`, `--mantine-color-<role>-contrast`            | `--app-text-*`, `c="white"`, `c="black"`                                                      |
| Màu vai trò trong CSS                       | `--mantine-primary-color-filled`, `--mantine-primary-color-light`, `--mantine-color-<role>-filled`, `--mantine-color-<role>-light` | `--mantine-color-brand-6`, `--mantine-color-teal-0`, `--mantine-color-blue-light`, `hsl(...)` |

### Ví dụ đối chiếu: Border, Bubble & Inline Style (`SEM-TOKEN-003`)

```tsx
// Incorrect: Dùng Box + chuỗi border shorthand + shade số + màu vật lý + hardcode white
<Box
  p="sm"
  bdrs="md"
  bg={isCandidate ? 'brand.6' : 'gray'}
  c={isCandidate ? 'white' : undefined}
  bd={isCandidate ? undefined : '1px solid var(--mantine-color-default-border)'}
>
  ...
</Box>

// Incorrect: Dùng style inline cho table scroll hoặc dropzone
<Box style={{ overflowX: 'auto' }}><Table /></Box>
<Group style={{ pointerEvents: 'none' }}>...</Group>

// Correct: Dùng Paper withBorder + CSS Module + mod + semantic tokens
<Paper
  withBorder={!isCandidate}
  p="sm"
  radius="md"
  className={classes.bubble}
  mod={{ candidate: isCandidate }}
>
  ...
</Paper>

// Correct: Dùng component chuẩn hoặc CSS Module
<Table.ScrollContainer minWidth={600}><Table /></Table.ScrollContainer>
<Group className={classes.dropzoneInner}>...</Group>
```

---

## 6. Checklist tự kiểm tra trước khi hoàn thành UI

- [ ] Đã kiểm tra component/hook có sẵn trên `mantine.dev` và block tương ứng trên `ui.mantine.dev`?
- [ ] Không còn raw HTML tag (`div`, `span`, `p`, `h1`–`h6`, `button`, `a`, `input`, `form`, `ul`, `table`, `img`, `svg`)?
- [ ] Không có `onClick` trên `Box`/`Paper`/`Card`/`Text`, đủ landmark semantic, `aria-current`/`aria-pressed` và `aria-label`?
- [ ] Không dùng prop `bd=`, `bdrs=`, `style={{...}}`, và không hardcode string/CSS `px` ở font/spacing/radius?
- [ ] Toàn bộ màu sắc dùng đúng vai trò semantic (`brand`, `success`, `warning`, `danger`, `neutral`, `dimmed`) và biến CSS semantic — không dùng tên màu vật lý, shade số `0..9`, `virtualColor`, `--app-*`, hex hay `rgb()`?
- [ ] Custom component và style theo trạng thái đặt trong `*.module.css` (không nhét class riêng vào `app/globals.css`) và vượt qua đầy đủ lệnh kiểm tra trong `client/`:
      `npm run typecheck && npm run lint && npm run stylelint && npm run ui:lint -- <files> && npm run test:unit && npm run build`?

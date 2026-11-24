# Hướng dẫn Setup Next.js App Router, Theme, Forms & Hooks (`Mantine v9.8`)

Tài liệu này mô tả cấu hình nền tảng thực tế trong `client/` (Next.js 16 App Router + Mantine v9.8), pattern chuẩn cho **Form (`@mantine/form` + Zod v4)**, **Hooks (`@mantine/hooks`)**, và trạng thái các package mở rộng trong [package.json](../../package.json).

---

## 1. Setup Next.js App Router, CSS Layers & Theme

### Thứ tự khai báo CSS Layers trong giai đoạn chuyển tiếp ([client/app/globals.css](../../app/globals.css))

Để Mantine v9 chạy an toàn song song các trang legacy còn dùng Tailwind CSS v4 mà không gây xung đột cascade reset/utilities, dự án sử dụng **`styles.layer.css`** (`@layer mantine`) đặt sau `base` và trước `utilities`:

```css
@layer theme, base, mantine, components, utilities;

@import '@mantine/core/styles.layer.css';
@import '@mantine/notifications/styles.layer.css';
@import '@mantine/dropzone/styles.layer.css';

@import 'tailwindcss';
```

> Khi hoàn tất migrate toàn bộ trang cũ và gỡ Tailwind CSS v4, có thể xóa `@import 'tailwindcss'` cùng `@tailwindcss/postcss` trong [postcss.config.mjs](../../postcss.config.mjs).

### Root Layout ([client/app/layout.tsx](../../app/layout.tsx))

`RootLayout` là Server Component, gắn `mantineHtmlProps` lên `<html>`, `<ColorSchemeScript defaultColorScheme="auto" />` trong `<head>` để chống FOUC, và bọc `<MantineProvider>`, `<Notifications />`, `<ModalsProvider>`, `<QueryProvider>`:

```tsx
import './globals.css'

import { useState, type ReactNode } from 'react'
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@/theme'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: true,
      },
    },
  })
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications position="top-right" />
          <ModalsProvider>
            <QueryProvider>{children}</QueryProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
```

> Trong giai đoạn chuyển tiếp song song `next-themes`, [MantineColorSchemeSync](../../providers/MantineColorSchemeSync.tsx) đồng bộ `resolvedTheme` sang `useMantineColorScheme().setColorScheme(...)` để giữ Light/Dark khớp nhau 100%.

### Tối ưu Tree-Shaking ([client/next.config.ts](../../next.config.ts))

Đã khai báo `experimental.optimizePackageImports` cho toàn bộ package `@mantine/*`, `@tabler/icons-react`, và `@tanstack/react-query` nhằm giữ bundle gọn nhẹ trên Next.js 16:

```ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/form',
      '@mantine/notifications',
      '@mantine/modals',
      '@mantine/dropzone',
      '@tabler/icons-react',
      '@tanstack/react-query',
    ],
  },
}
```

### Theme tập trung, RSC-safe & Zero-Hex ([client/theme.ts](../../theme.ts))

`client/theme.ts` **không đặt `'use client'`** để 100% an toàn khi import từ Server Component (`app/layout.tsx`). Tuân thủ chính sách Zero-Hex (D2): không viết HEX/RGB/HSL, không dùng `virtualColor` hay `colorsTuple`, mà ánh xạ 5 vai trò ngữ nghĩa trực tiếp từ `DEFAULT_THEME.colors` kèm font `Geist` / `Geist_Mono`:

```ts
import {
  createTheme,
  DEFAULT_THEME,
  type DefaultMantineColor,
  type MantineColorsTuple,
} from '@mantine/core'

export type SemanticColor =
  'brand' | 'success' | 'warning' | 'danger' | 'neutral'

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<SemanticColor | DefaultMantineColor, MantineColorsTuple>
  }
}

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: DEFAULT_THEME.colors.blue,
    success: DEFAULT_THEME.colors.teal,
    warning: DEFAULT_THEME.colors.yellow,
    danger: DEFAULT_THEME.colors.red,
    neutral: DEFAULT_THEME.colors.gray,
  },
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  fontFamilyMonospace:
    'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  defaultRadius: 'md',
})
```

### Color Scheme (Light / Dark / Auto)

- Sử dụng `useMantineColorScheme()` (trong Client Component) để đổi chế độ sáng/tối.
- Trong CSS Modules, dùng các biến semantic tự thích ứng Light/Dark của Mantine (`--mantine-color-body`, `--mantine-color-default`, `--mantine-color-default-hover`, `--mantine-color-default-border`, `--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-primary-color-*`, `--mantine-color-<role>-*`).
- Ngoại lệ duy nhất cho bề mặt phụ lồng nhau (_nested subtle surface_) trong `*.module.css`:
  `background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6));`
- Khi dùng `@mantine/dropzone`, đặt `pointer-events: none;` vào class `.dropzoneInner` trong `*.module.css` thay vì `style={{ pointerEvents: 'none' }}`.

---

## 2. Hướng dẫn sử dụng Forms (`@mantine/form` v9 + Zod v4)

> **Trạng thái package**: `@mantine/form` (`^9.8.2`) và `zod` (`^4.4.3`) đã được cài sẵn trong [package.json](../../package.json).
> Tài liệu gốc đầy đủ: [`https://mantine.dev/form/use-form/`](https://mantine.dev/form/use-form/)

### Chuẩn Mantine v9: `mode: 'uncontrolled'` + `form.key()` + `schemaResolver`

- Luôn ưu tiên `mode: 'uncontrolled'` để tránh re-render toàn form mỗi lần gõ phím.
- Mỗi input gắn `key={form.key('path')}` và `{...form.getInputProps('path')}`.
- Validate bằng **Zod v4** qua `schemaResolver(schema, { sync: true })` (nhập trực tiếp từ `@mantine/form`).
- Wrapper form luôn dùng `<Box component="form" onSubmit={form.onSubmit(...)} noValidate>` (tuân thủ rule không dùng raw HTML `<form>`).

```tsx
'use client'

import {
  Box,
  Button,
  Group,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { z } from 'zod'

const setupInterviewSchema = z.object({
  roleTitle: z.string().trim().min(3, 'Vị trí ứng tuyển cần ít nhất 3 ký tự'),
  sessionType: z.enum(['HR', 'TECHNICAL', 'MIXED'], {
    error: 'Vui lòng chọn loại phiên phỏng vấn',
  }),
  jobDescription: z
    .string()
    .trim()
    .min(30, 'Mô tả công việc cần tối thiểu 30 ký tự'),
})

type SetupInterviewValues = z.infer<typeof setupInterviewSchema>

export function SetupInterviewForm({
  onSubmit,
}: {
  onSubmit: (values: SetupInterviewValues) => Promise<void>
}) {
  const form = useForm<SetupInterviewValues>({
    mode: 'uncontrolled',
    initialValues: {
      roleTitle: '',
      sessionType: 'TECHNICAL',
      jobDescription: '',
    },
    validate: schemaResolver(setupInterviewSchema, { sync: true }),
  })

  return (
    <Box component="form" onSubmit={form.onSubmit(onSubmit)} noValidate>
      <Stack gap="md">
        <TextInput
          withAsterisk
          label="Vị trí ứng tuyển"
          placeholder="Ví dụ: Backend Engineer (NestJS)"
          key={form.key('roleTitle')}
          {...form.getInputProps('roleTitle')}
        />

        <Select
          withAsterisk
          label="Loại phiên phỏng vấn"
          data={[
            { value: 'HR', label: 'Phỏng vấn HR / Behavioral' },
            { value: 'TECHNICAL', label: 'Phỏng vấn Kỹ thuật' },
            { value: 'MIXED', label: 'Kết hợp (Mixed)' },
          ]}
          key={form.key('sessionType')}
          {...form.getInputProps('sessionType')}
        />

        <Textarea
          withAsterisk
          label="Mô tả công việc (JD)"
          minRows={5}
          autosize
          key={form.key('jobDescription')}
          {...form.getInputProps('jobDescription')}
        />

        <Group justify="flex-end" mt="xs">
          <Button type="submit" color="brand" loading={form.submitting}>
            Tạo phiên phỏng vấn
          </Button>
        </Group>
      </Stack>
    </Box>
  )
}
```

### Các tính năng Form hay dùng & Nơi tra cứu trên `mantine.dev`

| Tính năng                            | API chính                                                                | Tài liệu `mantine.dev`                                                        |
| ------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Built-in validators                  | `isNotEmpty`, `isEmail`, `hasLength`, `isInRange`, `matches`             | [`/form/validators/`](https://mantine.dev/form/validators/)                   |
| Schema validation (Zod v4 / Valibot) | `schemaResolver(schema, { sync: true })`                                 | [`/form/schema-validation/`](https://mantine.dev/form/schema-validation/)     |
| Lỗi từ API server & trạng thái       | `form.setFieldError`, `form.setErrors`, `form.isDirty()`, `form.reset()` | [`/form/errors/`](https://mantine.dev/form/errors/)                           |
| Dynamic lists / Nested fields        | `form.insertListItem`, `form.removeListItem`, `form.reorderListItem`     | [`/form/nested/`](https://mantine.dev/form/nested/)                           |
| Chia nhỏ form nhiều tầng             | `createFormContext<Values>()` (`FormProvider`, `useFormContext`)         | [`/form/create-form-context/`](https://mantine.dev/form/create-form-context/) |
| Theo dõi giá trị ở uncontrolled mode | `form.watch('field', ({ value }) => ...)` hoặc `form.getValues()`        | [`/form/values/`](https://mantine.dev/form/values/)                           |

---

## 3. Hướng dẫn sử dụng Hooks (`@mantine/hooks` `^9.8.2`)

Package `@mantine/hooks` đã cài sẵn. Trước khi tự viết state helper hoặc `useEffect` lắng nghe DOM/window trong Client Component, kiểm tra bảng dưới đây hoặc tra [`https://mantine.dev/hooks/package/`](https://mantine.dev/hooks/package/):

| Nhóm                  | Hook tiêu biểu                                                                                                                                   | Dùng khi nào                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **State & UI**        | `useDisclosure`, `useToggle`, `useListState`, `usePagination`, `useCounter`                                                                      | Đóng/mở `Modal`/`Drawer`/`Popover`, quản lý mảng item, phân trang                              |
| **Responsive & DOM**  | `useMediaQuery`, `useMatches` _(từ `@mantine/core`)_, `useClickOutside`, `useElementSize`, `useIntersection`, `useFocusTrap`, `useReducedMotion` | Kiểm tra breakpoint, click ngoài dropdown, đo kích thước/scroll vào viewport, giảm chuyển động |
| **Timing**            | `useDebouncedValue`, `useDebouncedCallback`, `useThrottledValue`, `useInterval`                                                                  | Search input debounce, throttle scroll/resize, bộ đếm thời gian phiên phỏng vấn                |
| **Browser & Storage** | `useLocalStorage`, `useClipboard`, `useHotkeys`, `useDocumentTitle`, `useNetwork`                                                                | Lưu preference, nút copy, phím tắt bàn phím, theo dõi trạng thái mạng                          |

### 3 Pattern thực chiến hay dùng nhất

```tsx
// 1. Modal / Drawer với useDisclosure
'use client'

import { Button, Modal, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

export function EndSessionDialog() {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Modal opened={opened} onClose={close} title="Kết thúc phiên phỏng vấn">
        <Text size="sm" c="dimmed">
          Hệ thống sẽ tổng hợp báo cáo đánh giá STAR ngay sau khi kết thúc.
        </Text>
      </Modal>
      <Button color="danger" variant="light" onClick={open}>
        Kết thúc phiên
      </Button>
    </>
  )
}
```

```tsx
// 2. Search input với useDebouncedValue
'use client'

import { useState } from 'react'
import { TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'

export function SessionSearchBox() {
  const [value, setValue] = useState('')
  const [debounced] = useDebouncedValue(value, 300)

  // Dùng `debounced` làm tham số trong queryKeys.onet.search(debounced) của TanStack Query
  return (
    <TextInput
      label="Tìm kiếm phiên phỏng vấn"
      placeholder="Nhập vị trí hoặc công ty..."
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      data-debounced={debounced}
    />
  )
}
```

```tsx
// 3. Responsive giá trị theo breakpoint với useMatches (mantine.dev/hooks/use-matches/)
'use client'

import { Paper, Text, useMatches } from '@mantine/core'

export function ResponsiveSummaryCard({ summary }: { summary: string }) {
  const padding = useMatches({
    base: 'sm',
    sm: 'md',
    lg: 'lg',
  })

  return (
    <Paper withBorder p={padding} radius="md">
      <Text size="sm">{summary}</Text>
    </Paper>
  )
}
```

---

## 4. Trạng thái Package mở rộng trong `client/package.json`

Các package Mantine & icon **đã cài sẵn**: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dropzone` (`^9.8.2`) và `@tabler/icons-react` (`^3.52.0`).

Chỉ chạy `npm install` trong `client/` khi tính năng thực sự cần package chưa cài:

| Nhu cầu                        | Trạng thái / Lệnh `npm install` (trong `client/`) | Tích hợp bắt buộc                                                                                         | Tài liệu                                                                  |
| ------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Icons**                      | Đã cài sẵn (`@tabler/icons-react`)                | Dùng thống nhất `@tabler/icons-react` (`stroke={1.5}`), cấm inline `<svg>`                                | [`/guides/icons/`](https://mantine.dev/guides/icons/)                     |
| **Toast Notifications**        | Đã cài sẵn (`@mantine/notifications`)             | Đã import `styles.layer.css` trong `app/globals.css` & gắn `<Notifications />` tại `app/layout.tsx`       | [`/x/notifications/`](https://mantine.dev/x/notifications/)               |
| **Confirm / Promise Modals**   | Đã cài sẵn (`@mantine/modals`)                    | Đã bọc `<ModalsProvider>` trong `app/layout.tsx` & `test-utils/render.tsx`; gọi `modals.openConfirmModal` | [`/x/modals/`](https://mantine.dev/x/modals/)                             |
| **File Dropzone**              | Đã cài sẵn (`@mantine/dropzone`)                  | Đã import `styles.layer.css` trong `app/globals.css` (dùng cho upload CV/Resume)                          | [`/x/dropzone/`](https://mantine.dev/x/dropzone/)                         |
| **Date / Time Pickers**        | Chưa cài — `npm install @mantine/dates dayjs`     | Import `@mantine/dates/styles.layer.css` trong `app/globals.css`; bọc `<DatesProvider>`                   | [`/dates/getting-started/`](https://mantine.dev/dates/getting-started/)   |
| **Charts**                     | Chưa cài — `npm install @mantine/charts recharts` | Import `@mantine/charts/styles.layer.css` trong `app/globals.css`                                         | [`/charts/getting-started/`](https://mantine.dev/charts/getting-started/) |
| **Command Palette (`Ctrl+K`)** | Chưa cài — `npm install @mantine/spotlight`       | Import `@mantine/spotlight/styles.layer.css` trong `app/globals.css`                                      | [`/x/spotlight/`](https://mantine.dev/x/spotlight/)                       |

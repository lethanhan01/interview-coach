# Testing, Storybook & Toolchain (`client/`)

Tài liệu này bám sát cấu hình kiểm thử và công cụ kiểm toán tĩnh thực tế của **InterviewCoach Frontend** (`Next.js 16 + Vitest 4 + Storybook 10 + Stylelint 17 + Playwright`) trong `client/`.

---

## 1. Testing với Vitest 4 & `@test-utils`

Mọi component Mantine đều yêu cầu `<MantineProvider>`. Do đó trong unit/component test **bắt buộc** import `render`, `screen`, `userEvent` từ `@test-utils` ([client/test-utils/index.ts](../../test-utils/index.ts)), **không** import `render` trực tiếp từ `@testing-library/react`.

- File [client/test-utils/render.tsx](../../test-utils/render.tsx) tự động bọc `<MantineProvider theme={theme} env="test"><ModalsProvider>{children}</ModalsProvider></MantineProvider>` (`env="test"` tắt transition/animation để test ổn định và chạy nhanh).
- File [client/vitest.config.mts](../../vitest.config.mts) tách rõ 2 project:
  - **`unit`** (`jsdom` + `@testing-library/react` + `jest-axe`, alias `@` và `@test-utils`): chạy bằng `npm run test:unit`.
  - **`storybook`** (trình duyệt Playwright Chromium qua `@storybook/addon-vitest`): chạy bằng `npm run test:storybook`.
- Xem mẫu kiểm thử hoàn chỉnh (Mantine v9 + `@mantine/form` + Zod v4 + `jest-axe`) tại [client/test-utils/mantine-setup.test.tsx](../../test-utils/mantine-setup.test.tsx).

### Ví dụ viết test tương tác chuẩn

```tsx
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { SetupInterviewForm } from './SetupInterviewForm'

describe('SetupInterviewForm', () => {
  it('hiển thị lỗi validation Zod khi submit thiếu vị trí ứng tuyển', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    const { container } = render(<SetupInterviewForm onSubmit={onSubmit} />)

    await user.click(
      screen.getByRole('button', { name: /tạo phiên phỏng vấn/i })
    )

    expect(
      await screen.findByText(/vị trí ứng tuyển cần ít nhất 3 ký tự/i)
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

### Lưu ý môi trường Test ([client/vitest.setup.ts](../../vitest.setup.ts))

- Đã kích hoạt sẵn matcher `toHaveNoViolations` từ `jest-axe` và polyfill `window.matchMedia`, `window.getComputedStyle`, `ResizeObserver`, `PointerEvent`, `HTMLElement.prototype.scrollIntoView` (chỉ chạy khi `typeof window !== 'undefined'`, an toàn cho test `@vitest-environment node`).
- Khi test `Modal`, `Drawer`, `Menu`, `Popover`, hoặc `Select` (dùng Portal render vào `document.body`), dùng `screen.getBy...` hoặc `within(document.body)` thay vì query giới hạn trong `container`.
- Tham khảo thêm hướng dẫn test chính thức của Mantine tại [`https://mantine.dev/guides/vitest/`](https://mantine.dev/guides/vitest/).

---

## 2. Storybook 10 (`*.stories.tsx`)

- Dự án dùng **Storybook 10** với framework `@storybook/nextjs-vite` (xem [client/.storybook/main.ts](../../.storybook/main.ts)).
- Đặt file `<ComponentName>.stories.tsx` ngay cạnh component trong `components/` hoặc trong `stories/` (đúng glob `**/*.stories.@(js|jsx|mjs|ts|tsx)`).
- [client/.storybook/preview.tsx](../../.storybook/preview.tsx) import `../app/globals.css` (đã gồm `@layer` + `@mantine/*/styles.layer.css`) và gắn decorator `withMantineProvider` bọc `<MantineProvider theme={theme} forceColorScheme={scheme}><ModalsProvider>`, đồng bộ 100% với toolbar Light/Dark (`withThemeByClassName`) và chế độ Reduced Motion.
- Tích hợp sẵn `@storybook/addon-a11y` để kiểm tra khả năng tiếp cận (WCAG 2.2 AA) trực tiếp trên từng story qua lệnh `npm run test:a11y`.

---

## 3. Linting, UI Rules & Scripts trong `client/package.json`

### Kiểm toán tĩnh UI Mantine v9

- **Stylelint ([.stylelintrc.json](../../.stylelintrc.json))**: Chạy `stylelint` (`^17.16.0`) + `stylelint-config-standard` (`^40.0.0`) trên `**/*.module.css` — cấm mã màu HEX và hàm `rgb()`/`rgba()`/`hsl()`/`hsla()`, đồng thời hỗ trợ đầy đủ `rem()`, `em()`, `light-dark()`, `@mixin` và `$mantine-breakpoint-*`.
- **UI Rules Linter ([scripts/check-ui-rules.mjs](../../scripts/check-ui-rules.mjs))**: Kiểm tra tự động 8 nhóm luật Mantine v9 Zero-Hex (`SEM-HTML-001..003`, `SEM-TOKEN-001..004`, `SEM-TOKEN-008`, `SEM-GOV-001`):
  - `npm run ui:lint` — Quét phạm vi mặc định (`test-utils/`, `**/*.module.css`, `theme.ts`, `components/mantine-color-scheme-sync.tsx`).
  - `npm run ui:lint -- app/duong-dan.tsx components/moi/` — Quét các file/thư mục vừa tạo hoặc chỉnh sửa.
  - `npm run ui:lint -- --all` — Quét toàn bộ codebase UI `client/` (dùng sau khi hoàn tất migrate Tailwind).
  - `npm run ui:lint -- --strict-expiry` — Đẩy mọi chú thích ngoại lệ `interviewcoach-convention-exempt` quá hạn `until: YYYY-MM-DD` thành lỗi exit code `1`.

### Bảng lệnh CLI chuẩn (chạy từ thư mục `client/`)

| Lệnh                                      | Tác dụng                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`                             | Khởi động Next.js dev server tại `http://localhost:5173`                                       |
| `npm run dev:clean`                       | Xóa `.next` và khởi động lại Next.js dev server                                                |
| `npm run dev:all`                         | Chạy song song Next.js (`5173`) và Storybook (`6006`)                                          |
| `npm run typecheck`                       | Kiểm tra kiểu TypeScript toàn dự án (`tsc --noEmit`)                                           |
| `npm run lint`                            | Chạy ESLint 9 (`eslint-config-next` + `eslint-plugin-storybook`)                               |
| `npm run format` / `npm run format:check` | Format / kiểm tra format Prettier (`semi: false`, `singleQuote: true`, `trailingComma: 'es5'`) |
| `npm run stylelint`                       | Kiểm tra toàn bộ `**/*.module.css` theo `.stylelintrc.json`                                    |
| `npm run ui:lint`                         | Chạy `scripts/check-ui-rules.mjs` kiểm toán quy chuẩn Mantine v9 Zero-Hex                      |
| `npm run verify:docs`                     | Chạy `scripts/verify-docs-integrity.mjs` kiểm tra toàn vẹn hệ thống tài liệu Frontend          |
| `npm run test:unit`                       | Chạy toàn bộ unit/component tests trên `jsdom` (`vitest run --project unit`)                   |
| `npm run test:storybook`                  | Chạy Vitest Storybook browser tests (`vitest run --project storybook`)                         |
| `npm run test:a11y`                       | Chạy kiểm tra accessibility trên Storybook (`npx test-storybook`)                              |
| `npm run test:visual`                     | Chạy visual regression tests bằng Playwright (`playwright.visual.config.ts`)                   |
| `npm run test:e2e`                        | Chạy Playwright end-to-end tests (`e2e/`)                                                      |
| `npm run test`                            | Chạy tổng hợp `test:unit` → `test:a11y` → `test:visual`                                        |
| `npm run build`                           | Build production Next.js 16                                                                    |
| `npm run storybook`                       | Mở Storybook 10 dev server tại `http://localhost:6006`                                         |
| `npm run build-storybook`                 | Build tĩnh Storybook ra thư mục `storybook-static/`                                            |

# Testing, Storybook & Toolchain (`client/`)

Tài liệu này bám sát cấu hình thực tế của template Vite+ trong `client/`.

---

## 1. Testing với Vitest & `@test-utils`

Mọi component Mantine đều yêu cầu `<MantineProvider>`. Do đó trong test **bắt buộc** import `render`, `screen`, `userEvent` từ `@test-utils` ([client/test-utils/index.ts](../../client/test-utils/index.ts)), **không** import `render` trực tiếp từ `@testing-library/react`.

File [client/test-utils/render.tsx](../../client/test-utils/render.tsx) đã tự bọc `<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} env="test">` (`env="test"` tắt transition/animation để test ổn định và nhanh hơn).

### Ví dụ viết test tương tác chuẩn

```tsx
import { render, screen, userEvent } from '@test-utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('hiển thị lỗi validation khi submit email không hợp lệ', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### Lưu ý môi trường Test (`client/vitest.setup.mjs`)

- Đã mock sẵn `window.matchMedia`, `ResizeObserver`, `HTMLElement.prototype.scrollIntoView`, và `window.getComputedStyle` trong [client/vitest.setup.mjs](../../client/vitest.setup.mjs).
- Khi test `Modal`, `Drawer`, `Menu`, `Popover`, hoặc `Select` (dùng Portal render vào `document.body`), dùng `screen.getBy...` hoặc `within(document.body)` thay vì query giới hạn trong `container`.
- Tham khảo thêm hướng dẫn test của Mantine tại [`https://mantine.dev/guides/vitest/`](https://mantine.dev/guides/vitest/).

---

## 2. Storybook (`*.story.tsx`)

- Đặt file `<ComponentName>.story.tsx` ngay cạnh component (xem mẫu [TrustBadge.story.tsx](../../client/src/components/TrustBadge/TrustBadge.story.tsx)).
- Decorator trong [client/.storybook/preview.tsx](../../client/.storybook/preview.tsx) đã tự động bọc `<MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme={scheme}>` và `<ColorSchemeScript />`.
- Có thể bấm phím tắt `Ctrl + J` (Windows/Linux) hoặc `Cmd + J` (macOS) ngay trong Storybook để kiểm tra component ở cả 2 chế độ **Light** và **Dark**.

---

## 3. Toolchain `vite-plus` (`vp`) & Scripts trong `client/package.json`

Chạy các lệnh sau từ thư mục `client/`:

| Lệnh | Tác dụng |
|---|---|
| `yarn dev` | Khởi động dev server (`vp dev`) |
| `yarn check` | Chạy `vp check`: kiểm tra format (`oxfmt`), lint (`oxlint` theo `oxc-config-mantine`), và TypeScript typecheck |
| `yarn check:fix` | Tự sửa lỗi format và lint auto-fixable (`vp check --fix`) |
| `yarn stylelint` | Kiểm tra toàn bộ file `**/*.css` theo [client/.stylelintrc.json](../../client/.stylelintrc.json) (cấm hex/`rgb()`/`hsl()`) |
| `yarn ui:lint` | Chạy [check-ui-rules.mjs](../../client/scripts/check-ui-rules.mjs) kiểm tra Semantic Colors, cấm `bd`/`bdrs`/`style={{}}`, cấm raw HTML và non-semantic `onClick` |
| `yarn typecheck` | Kiểm tra kiểu TypeScript (`tsc --noEmit`) |
| `yarn vitest` | Chạy toàn bộ unit/component tests một lần (`vp test run`) |
| `yarn vitest:watch` | Chạy Vitest ở chế độ watch (`vp test watch`) |
| `yarn build` | Typecheck (`tsc`) + build production (`vp build`) |
| `yarn build:analyze` | Build kèm bundle size report tại `dist/stats.html` |
| `yarn test` | Pipeline kiểm tra đầy đủ: `check` → `stylelint` → `ui:lint` → `vitest` → `build` |
| `yarn storybook` | Mở Storybook dev server tại cổng `6006` |
| `yarn storybook:build` | Build tĩnh Storybook ra `storybook-static` |

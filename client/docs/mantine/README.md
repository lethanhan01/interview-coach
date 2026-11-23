# Hướng dẫn áp dụng & tra cứu Mantine UI (`client/`)

Thư mục này quy định chuẩn phát triển UI cho dự án dựa trên **Mantine v9** (`9.8.0`) và chỉ dẫn cách tra cứu chính xác trên [`https://mantine.dev/`](https://mantine.dev/) cùng [`https://ui.mantine.dev/`](https://ui.mantine.dev/).

## 1. Stack & Cấu trúc `client/` hiện có

| Thành phần | Giá trị / Vai trò thực tế |
|---|---|
| UI Core & Hooks | `@mantine/core` `9.8.0`, `@mantine/hooks` `9.8.0` ([client/package.json](../../client/package.json)) |
| Framework & Router | `react` `^19.2.0`, `react-router-dom` `^7.9.4` ([client/src/Router.tsx](../../client/src/Router.tsx)) |
| Entry & Theme | [client/src/App.tsx](../../client/src/App.tsx), [client/src/theme.ts](../../client/src/theme.ts), [client/index.html](../../client/index.html) |
| PostCSS & CSS Lint | [client/postcss.config.cjs](../../client/postcss.config.cjs) (`postcss-preset-mantine` + `$mantine-breakpoint-*`), [client/.stylelintrc.json](../../client/.stylelintrc.json) |
| Test & Storybook | [client/test-utils/render.tsx](../../client/test-utils/render.tsx), [client/vitest.setup.mjs](../../client/vitest.setup.mjs), [client/.storybook/preview.tsx](../../client/.storybook/preview.tsx) |
| Toolchain | `vite-plus` (`vp`), `oxc-config-mantine`, `yarn@4.18.1` ([client/vite.config.mjs](../../client/vite.config.mjs)) |

## 2. Bản đồ tra cứu chính thức (`mantine.dev` & `ui.mantine.dev`)

Không đoán API hoặc dùng cú pháp cũ của Mantine v6/v7/v8. Trước khi code UI, tra cứu đúng nguồn theo nhu cầu:

### A. Tra cứu API, Props, Hooks, Form & Styling (`https://mantine.dev/`)

| Nhu cầu | Đường dẫn tra cứu trên `mantine.dev` | Ghi chú cho dự án |
|---|---|---|
| Tất cả UI components (`@mantine/core`) | `https://mantine.dev/core/package/` (hoặc `/core/<ten-component>/`) | Kiểm tra props, accessibility, Styles API selectors |
| Tất cả hooks (`@mantine/hooks`) | `https://mantine.dev/hooks/package/` (hoặc `/hooks/<ten-hook>/`) | Luôn ưu tiên hook sẵn thay vì tự viết `useEffect` thủ công |
| Form & Validation (`@mantine/form`) | `https://mantine.dev/form/use-form/` | Dùng `mode: 'uncontrolled'`, `form.key()`, `schemaResolver` |
| Styles, PostCSS, `rem()`, `light-dark()` | `https://mantine.dev/styles/postcss-preset/` | Đã cấu hình sẵn trong `client/postcss.config.cjs` |
| Styles API & CSS Variables | `https://mantine.dev/styles/styles-api/`, `/styles/css-variables/` | Dùng `classNames`, `styles`, `vars`, `--mantine-*` |
| Theme & Color Scheme | `https://mantine.dev/theming/theme-object/`, `/theming/color-schemes/` | Cấu hình tập trung trong `client/src/theme.ts` |
| Extensions (`/x/`) | `https://mantine.dev/x/notifications/`, `/x/modals/`, `/dates/getting-started/` | Cài thêm qua `yarn add` khi thực sự cần |
| Tích hợp Vite | `https://mantine.dev/guides/vite/` | Template `client/` đã thiết lập sẵn chuẩn này |

### B. Tra cứu UI Blocks dựng sẵn (`https://ui.mantine.dev/`)

Khi cần layout hoàn chỉnh (navigation, auth, dashboard, landing section), tra cứu theo nhóm tại `https://ui.mantine.dev/`:

- **Application UI**: Navbars, Headers, Footers, Inputs (floating label, password strength, currency input...), Buttons/Sliders, Cards, Stats, Tables, Overlays, Dropzones.
- **Page Sections**: Hero Headers, Features, Cookie/Announcement Banners, Pricing, FAQs, Testimonials, Contact.
- **Blog & Content**: Article cards, Grids.

#### Quy trình 4 bước bắt buộc khi dùng snippet từ `ui.mantine.dev`

1. **Kiểm tra package trong `client/package.json`**: Các block trên `ui.mantine.dev` thường dùng icon package (như `@tabler/icons-react`) chưa cài sẵn — phải chạy `yarn add` nếu dùng, hoặc đổi sang icon library đã thống nhất.
2. **Rà soát quy tắc UI chặt chẽ**: Thay mọi raw HTML tag hay non-semantic `onClick` (nếu có trong mẫu cũ) bằng Mantine component theo [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md).
3. **Chuẩn hóa CSS Module**: Đảm bảo mọi đơn vị font/spacing dùng `rem()`, `light-dark()`, `$mantine-breakpoint-*`, không hardcode string/CSS `px`.
4. **Đồng bộ Theme**: Đưa các màu sắc, radius hoặc font lặp lại nhiều nơi vào `client/src/theme.ts`.

## 3. Hướng dẫn áp dụng Project Skills (`client/.agents/skills/`)

Dự án có sẵn bộ skills tại `client/.agents/skills/` (và bản đồng bộ tại `client/.aider-desk/skills/`). Khi triển khai hoặc review code React/UI trong `client/`, Agent cần đọc đúng file `SKILL.md` tương ứng trước khi làm:

| Nhu cầu / Tác vụ | Skill cần đọc (`client/.agents/skills/...`) | Cách áp dụng vào dự án Mantine Vite |
|---|---|---|
| Viết, refactor, tối ưu hiệu năng React (state, re-render, bundle, async) | [`vercel-react-best-practices`](../../client/.agents/skills/vercel-react-best-practices/SKILL.md) | Áp dụng các rule cho React/Vite SPA; **bỏ qua** các rule dành riêng cho Next.js App Router / RSC |
| Thiết kế custom component tái sử dụng, compound components, tránh phình boolean props, React 19 | [`vercel-composition-patterns`](../../client/.agents/skills/vercel-composition-patterns/SKILL.md) | Áp dụng tư duy composition nhưng **dựng trên Mantine primitives** (`Box`, `UnstyledButton`, `createPolymorphicComponent`) |
| Thêm animation chuyển trang / chuyển trạng thái UI thuần React | [`vercel-react-view-transitions`](../../client/.agents/skills/vercel-react-view-transitions/SKILL.md) | Kết hợp `<ViewTransition>` / `startViewTransition` với CSS Modules (`*.module.css`) |
| Review UI/UX, accessibility, layout & interaction | [`web-design-guidelines`](../../client/.agents/skills/web-design-guidelines/SKILL.md) | Kết hợp kiểm tra cùng checklist của [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md) |
| Review văn phong tài liệu kỹ thuật | [`writing-guidelines`](../../client/.agents/skills/writing-guidelines/SKILL.md) | Dùng khi viết hoặc rà soát tài liệu trong `docs/` |

- **Nhóm chỉ dùng khi deploy Vercel**: `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize` — chỉ kích hoạt khi có tác vụ deploy/tối ưu trên Vercel.
- **Không áp dụng**: `vercel-react-native-skills` (dự án này là web Vite + React, không phải React Native/Expo).
- **Nguyên tắc ưu tiên bắt buộc**: Quy chuẩn Mantine trong [AGENTS.md](../../AGENTS.md) và [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md) luôn có độ ưu tiên cao hơn ví dụ minh họa trong skill. Nếu skill dùng raw HTML (`<div>`, `<button>`), Tailwind, hoặc API Next.js để minh họa, phải chuyển đổi hoàn toàn sang Mantine components + CSS Modules (`rem()`).

## 4. Mục lục tài liệu trong dự án

1. [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md) — Quy tắc bắt buộc (Mantine-first, Semantic Colors & Tokens, cấm `bd`/`bdrs`/`style={{}}`, cấm raw HTML/non-semantic, cấm hardcode `px`) & chuẩn CSS Modules.
2. [02-setup-forms-hooks-guide.md](./02-setup-forms-hooks-guide.md) — Setup, CSS import order, Theme (`virtualColor` + `cssVariablesResolver`), hướng dẫn `@mantine/form`, `@mantine/hooks`, và trạng thái package.
3. [03-testing-and-tooling.md](./03-testing-and-tooling.md) — Vitest với `@test-utils`, Storybook (`*.story.tsx`), `yarn ui:lint`, và các lệnh `vp` / `yarn`.
4. [AGENTS.md](../../AGENTS.md) — Bộ rule ngắn gọn dành cho AI coding agents.

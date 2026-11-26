# Hướng dẫn áp dụng & tra cứu Mantine UI (`client/`)

Thư mục này quy định chuẩn phát triển UI cho **Intervia Frontend (`client/`)** dựa trên **Next.js 16 (App Router) + React 19 + Mantine v9 (`^9.8.2`, Zero-Hex Semantic-Only)** và chỉ dẫn cách tra cứu chính xác trên [`https://mantine.dev/`](https://mantine.dev/) cùng [`https://ui.mantine.dev/`](https://ui.mantine.dev/).

> **Cổng tài liệu chính của Frontend**: Xem thêm [Master Hub Quy chuẩn Frontend (`client/docs/docs/README.md`)](../docs/README.md) và [Bộ luật AI Agents (`AGENTS.md`)](../../../AGENTS.md).

## 1. Stack & Cấu trúc `client/` thực tế

| Thành phần                   | Giá trị / Vai trò thực tế                                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI Core & Extensions         | `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dropzone`, `@mantine/dates`, `@mantine/charts` (`^9.8.2`), `dayjs`, `recharts`, `@tabler/icons-react` (`^3.52.0`) ([package.json](../../package.json))             |
| Framework, Data & Validation | `next` `16.2.6` (App Router), `react` `19.2.4`, `@tanstack/react-query` `^5`, `zod` `^4.4.3`                                                                                                                                                                                  |
| Entry, Theme & Config        | [app/layout.tsx](../../app/layout.tsx), [app/globals.css](../../app/globals.css), [theme.ts](../../theme.ts) (RSC-safe, Zero-Hex), [next.config.ts](../../next.config.ts), [AppProviders.tsx](../../providers/AppProviders.tsx)                                               |
| PostCSS & CSS Lint           | [postcss.config.mjs](../../postcss.config.mjs) (`postcss-preset-mantine` `^1.18.0`, `postcss-simple-vars` `^7.0.1`), [.stylelintrc.json](../../.stylelintrc.json) (`stylelint` `^17.16.0`, `stylelint-config-standard` `^40.0.0`)                                             |
| Test & Storybook             | [test-utils/render.tsx](../../test-utils/render.tsx), [vitest.config.mts](../../vitest.config.mts), [vitest.setup.ts](../../vitest.setup.ts), [.storybook/preview.tsx](../../.storybook/preview.tsx) (`vitest` `^4.1.10`, `storybook` `^10.5.5` với `@storybook/nextjs-vite`) |
| Toolchain & QA               | `npm`, TypeScript `^5`, ESLint `^9`, Prettier `^3.2.5`, Playwright `^1.62.1`, [check-ui-rules.mjs](../../scripts/check-ui-rules.mjs)                                                                                                                                          |

## 2. Bản đồ tra cứu chính thức (`mantine.dev` & `ui.mantine.dev`)

Không đoán API hoặc dùng cú pháp cũ của Mantine v6/v7/v8. Trước khi code UI, tra cứu đúng nguồn theo nhu cầu:

### A. Tra cứu API, Props, Hooks, Form & Styling (`https://mantine.dev/`)

| Nhu cầu                                  | Đường dẫn tra cứu trên `mantine.dev`                                                            | Ghi chú cho dự án                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tất cả UI components (`@mantine/core`)   | `https://mantine.dev/core/package/` (hoặc `/core/<ten-component>/`)                             | Kiểm tra props, accessibility, Styles API selectors                                            |
| Tất cả hooks (`@mantine/hooks`)          | `https://mantine.dev/hooks/package/` (hoặc `/hooks/<ten-hook>/`)                                | Luôn ưu tiên hook sẵn thay vì tự viết `useEffect` thủ công                                     |
| Form & Validation (`@mantine/form`)      | `https://mantine.dev/form/use-form/`                                                            | Dùng `mode: 'uncontrolled'`, `form.key()`, `schemaResolver(schema, { sync: true })` với Zod v4 |
| Styles, PostCSS, `rem()`, `light-dark()` | `https://mantine.dev/styles/postcss-preset/`                                                    | Đã cấu hình sẵn trong [postcss.config.mjs](../../postcss.config.mjs)                           |
| Styles API & CSS Variables               | `https://mantine.dev/styles/styles-api/`, `/styles/css-variables/`                              | Dùng `classNames`, `styles`, `vars`, `--mantine-*` ngữ nghĩa                                   |
| Theme & Color Scheme                     | `https://mantine.dev/theming/theme-object/`, `/theming/color-schemes/`                          | Cấu hình tập trung trong [theme.ts](../../theme.ts) (không `'use client'`, Zero-Hex)           |
| Extensions (`/x/`)                       | `https://mantine.dev/x/notifications/`, `/x/modals/`, `/x/dropzone/`, `/dates/getting-started/` | Cài thêm bằng `npm install` trong `client/` khi thực sự cần                                    |
| Tích hợp Next.js App Router              | [`https://mantine.dev/guides/next/`](https://mantine.dev/guides/next/)                          | Đã tích hợp chuẩn `ColorSchemeScript`, `mantineHtmlProps`, `optimizePackageImports`            |

### B. Tra cứu UI Blocks dựng sẵn (`https://ui.mantine.dev/`)

Khi cần layout hoàn chỉnh (navigation, auth, dashboard, landing section), tra cứu theo nhóm tại `https://ui.mantine.dev/`:

- **Application UI**: Navbars, Headers, Footers, Inputs (floating label, password strength...), Buttons/Sliders, Cards, Stats, Tables, Overlays, Dropzones.
- **Page Sections**: Hero Headers, Features, Announcement Banners, Pricing, FAQs, Contact.
- **Blog & Content**: Article cards, Grids.

#### Quy trình 4 bước bắt buộc khi adapt snippet từ `ui.mantine.dev`

1. **Kiểm tra package trong `client/package.json`**: Các block trên `ui.mantine.dev` thường dùng `@tabler/icons-react` (đã cài sẵn) hoặc extension khác — chỉ chạy `npm install` trong `client/` khi thực sự cần package mới.
2. **Rà soát quy tắc UI chặt chẽ**: Thay mọi raw HTML tag hay non-semantic `onClick` bằng Mantine component theo [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md).
3. **Chuẩn hóa CSS Module & Zero-Hex**: Đảm bảo mọi đơn vị font/spacing dùng `rem()`, `$mantine-breakpoint-*`, biến CSS ngữ nghĩa của Mantine (không HEX/RGB/HSL, không tên màu vật lý, không hardcode `px`).
4. **Đồng bộ Theme & RSC Boundary**: Giữ cấu hình theme tập trung tại [theme.ts](../../theme.ts) và chỉ đặt `'use client'` ở component có tương tác/hooks.

## 3. Hướng dẫn áp dụng Project Skills (`client/.agents/skills/`)

Dự án có sẵn bộ skills tại `client/.agents/skills/` (và bản đồng bộ tại `client/.aider-desk/skills/`). Khi triển khai hoặc review code React/Next.js/UI trong `client/`, Agent cần đọc đúng file `SKILL.md` tương ứng trước khi làm:

| Nhu cầu / Tác vụ                                                                                | Skill cần đọc (`client/.agents/skills/...`)                                                                | Cách áp dụng vào Intervia (`Next.js 16 + Mantine v9`)                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thiết kế Server State, `queryOptions()`, caching, prefetching & invalidation với TanStack Query | [`tanstack-integration-best-practices`](../../.agents/skills/tanstack-integration-best-practices/SKILL.md) | Áp dụng `queryOptions()` factory, `cache-single-source`, `ensureQueryData` và isolated `QueryClient`; chuyển phần Router sang Next.js 16 + Mantine v9 |
| Viết, refactor, tối ưu hiệu năng React & Next.js (RSC, async, bundle, re-render)                | [`vercel-react-best-practices`](../../.agents/skills/vercel-react-best-practices/SKILL.md)                 | Áp dụng đầy đủ các rule cho **Next.js App Router, Server Components (RSC)** và client performance                                                     |
| Thiết kế custom component tái sử dụng, compound components, tránh phình boolean props, React 19 | [`vercel-composition-patterns`](../../.agents/skills/vercel-composition-patterns/SKILL.md)                 | Áp dụng tư duy composition nhưng **dựng trên Mantine primitives** (`Box`, `Paper`, `UnstyledButton`, `createPolymorphicComponent`)                    |
| Thêm animation chuyển trang / chuyển trạng thái UI thuần React                                  | [`vercel-react-view-transitions`](../../.agents/skills/vercel-react-view-transitions/SKILL.md)             | Kết hợp `<ViewTransition>` / `addTransitionType` với CSS Modules (`*.module.css`)                                                                     |
| Review UI/UX, accessibility, layout & interaction                                               | [`web-design-guidelines`](../../.agents/skills/web-design-guidelines/SKILL.md)                             | Kết hợp kiểm tra cùng checklist của [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md)                                                |
| Review văn phong tài liệu kỹ thuật                                                              | [`writing-guidelines`](../../.agents/skills/writing-guidelines/SKILL.md)                                   | Dùng khi viết hoặc rà soát tài liệu trong `client/docs/`                                                                                              |

- **Nhóm chỉ dùng khi deploy Vercel**: `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize` — chỉ kích hoạt khi có tác vụ deploy hoặc tối ưu trên Vercel.
- **Không áp dụng**: `vercel-react-native-skills` (dự án này là web Next.js App Router, không phải React Native/Expo).
- **Nguyên tắc ưu tiên bắt buộc**: Quy chuẩn Mantine v9 Zero-Hex trong [AGENTS.md](../../../AGENTS.md) và [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md) luôn có độ ưu tiên cao hơn ví dụ minh họa trong skill. Nếu skill dùng raw HTML (`<div>`, `<button>`) hoặc Tailwind class để minh họa, phải chuyển đổi hoàn toàn sang Mantine components + CSS Modules (`rem()`).

## 4. Mục lục tài liệu trong dự án

1. [01-strict-rules-and-styling.md](./01-strict-rules-and-styling.md) — Quy tắc bắt buộc (Mantine-First, Zero-Hex Semantic-Only Colors, cấm `bd`/`bdrs`/`style={{}}`, cấm raw HTML/non-semantic `onClick`, cấm hardcode `px`) & chuẩn CSS Modules.
2. [02-setup-forms-hooks-guide.md](./02-setup-forms-hooks-guide.md) — Setup Next.js App Router (`@layer` + `.layer.css`, `<QueryProvider>`), `theme.ts` RSC-safe Zero-Hex, hướng dẫn `@mantine/form` + Zod v4, `@mantine/hooks`, và trạng thái package.
3. [03-testing-and-tooling.md](./03-testing-and-tooling.md) — Vitest 4 (`unit` vs `storybook`) với `@test-utils` (`QueryClientProvider` + `MantineProvider`), Storybook 10 (`*.stories.tsx`), `stylelint`, `ui:lint`, và bảng lệnh `npm run ...`.
4. [04-tanstack-query-guide.md](./04-tanstack-query-guide.md) — Cẩm nang thực chiến TanStack Query v5 (`useQuery`, `useMutation`, `queryKeys` factory, `AbortSignal`, Optimistic Updates, và đồng bộ Realtime SSE vào `QueryClient`).
5. [05-mantine-templates-catalog.md](./05-mantine-templates-catalog.md) — Catalog 7 nhóm Full-Stack UI Templates (`ui.mantine.dev` adapted Zero-Hex kết nối sẵn TanStack Query v5 và `@mantine/form` Zod v4).
6. [client/docs/docs/README.md](../docs/README.md) — Master Hub hệ thống quy chuẩn kiến trúc Frontend toàn diện (16 chuyên đề theo 4 miền + Quick Reference).
7. [AGENTS.md](../../../AGENTS.md) — Bộ luật súc tích dành cho AI coding agents.

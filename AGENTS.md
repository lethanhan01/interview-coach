# AI Agent Guidelines — Mantine UI (`client/`)

These rules are mandatory for every UI task in `client/`.

## 1. Verified Project Stack (`client/package.json`)

- **UI Core, Hooks & Extensions**: `@mantine/core` `9.8.0`, `@mantine/hooks` `9.8.0`, `@mantine/form` `^9.8.0`, `@mantine/dropzone` `^9.8.0`, `@mantine/modals` `^9.8.0`, `@mantine/notifications` `^9.8.0`
- **Icons & Map**: `@tabler/icons-react` `^3.51.0`, `leaflet` `^1.9.4`
- **Framework & Routing**: `react` `^19.2.0`, `react-router-dom` `^7.9.4`
- **Styling Toolchain**: `postcss-preset-mantine` `1.18.0`, `postcss-simple-vars` (`$mantine-breakpoint-xs`..`xl` in `client/postcss.config.cjs`), `stylelint` (`stylelint-config-standard`)
- **Build, Lint, Format & Test**: `vite-plus` (`vp`), `oxc-config-mantine`, `vitest`, `@storybook/react-vite`, `yarn@4.18.1`
- **Not pre-installed**: `@mantine/dates`, `@mantine/charts`, `@mantine/spotlight`, `@phosphor-icons/react`. Always inspect `client/package.json` before importing an extension package; run `yarn add` in `client/` only when a feature needs it.

## 2. Official Documentation Lookup Protocol

Never guess Mantine v9 APIs or copy deprecated v6/v7/v8 patterns. Always check:

1. **API, Props, Hooks, Form, Theme & Styles (`v9`)**: Look up `https://mantine.dev/`
   - Core components: `https://mantine.dev/core/package/` (and `/core/<component>/`)
   - Hooks: `https://mantine.dev/hooks/package/` (and `/hooks/<hook>/`)
   - Forms & validation: `https://mantine.dev/form/use-form/`
   - Styling, PostCSS & Styles API: `https://mantine.dev/styles/mantine-styles/`, `/styles/postcss-preset/`, `/styles/styles-api/`
   - Theming & color schemes: `https://mantine.dev/theming/theme-object/`, `/theming/color-schemes/`
2. **Prebuilt UI Blocks & Layouts**: Look up `https://ui.mantine.dev/`
   - Browse `Application UI` (Navbars, Headers, Footers, Inputs, Cards, Stats, Tables, Dropzones), `Page Sections` (Hero, Features, Banners, Pricing, FAQs, Contact), and `Blog` before designing sections from scratch.
   - **Mandatory snippet adaptation**: Never paste `ui.mantine.dev` code verbatim without checking:
     - Install any missing dependencies (such as an icon package) or swap to what is installed.
     - Replace any raw HTML or non-semantic tags with Mantine equivalents per Section 3.
     - Convert any raw `px` spacing/font values in CSS Modules to `rem()` / `--mantine-*` tokens and keep CSS in `*.module.css`.

## 3. Strict UI Rules (Zero-Tolerance)

1. **Maximize Mantine UI**: Use `@mantine/core` and `@mantine/hooks` first. Do not add third-party UI libraries when Mantine covers the requirement.
2. **Build custom components on Mantine primitives**: When Mantine lacks a specialized widget, compose it from Mantine elements (`Box`, `Paper`, `UnstyledButton`, `Group`, `Stack`, `Input.Wrapper`, `InputBase`, polymorphic `component="..."`, `createPolymorphicComponent`) so it inherits theme tokens, style props, and Styles API.
3. **No raw HTML elements**: Never write raw `<div>`, `<span>`, `<p>`, `<h1>`-`<h6>`, `<button>`, `<a>`, `<form>`, `<input>`, `<select>`, `<textarea>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<hr>`, `<img>`, or inline `<svg>` in JSX when Mantine provides an equivalent (`Box`/`Stack`/`Group`/`Paper`, `Text`, `Title`, `Button`/`ActionIcon`/`UnstyledButton`/`CloseButton`, `Anchor`, `<Box component="form">`, `TextInput`/`Select`/`Textarea`, `List`, `Table`, `Divider`, `Image`/`Avatar`, icon library).
4. **No non-semantic elements**:
   - Never attach `onClick` to `<Box>`, `<Paper>`, or `<Text>` instead of `<Button>`, `<UnstyledButton>`, or `<Anchor>`.
   - Preserve semantic landmarks via polymorphic `component` (`<Box component="main"|"section"|"article"|"nav"|"header"|"footer">` or `AppShell.*`), sequential `<Title order={1..6}>`, and `aria-label` on icon-only buttons (`ActionIcon`, `CloseButton`).
   - Rare technical DOM mount containers (e.g., third-party canvas/map/chart ref) must use `<Box ref={...} />` with a 1-line comment explaining why.
5. **No competing styling frameworks**: Do not install Tailwind CSS, `styled-components`, Emotion, or similar CSS-in-JS libraries.
6. **No hardcoded `px` for font sizes or spacing**: Use Mantine theme scale (`xs`–`xl`), CSS variables (`--mantine-spacing-*`, `--mantine-font-size-*`, `--mantine-radius-*`), PostCSS `rem()` / `em()`, or Mantine numeric props (auto-converted to `rem`). Never hardcode string/CSS `px` for typography, padding, margin, gap, or radius (only `1px` hairline borders inside `*.module.css` or fixed media dimensions are allowed).
7. **Semantic Colors & Tokens Only (Zero Arbitrary Colors)**:
   - Color props (`color`, `c`) MUST use the semantic roles registered in `client/src/theme.ts`: `brand` (primary/interactive), `success` (verified/match/positive), `warning` (caution/urgent), `danger` (scam/error/busy), `neutral` (muted metadata), and `dimmed` (secondary text on `c`).
   - NEVER use raw/physical color names (`teal`, `amber`, `red`, `gray`, `blue`, `pink`, `yellow`, `white`, `black`), numeric shade CSS variables (`--mantine-color-*-0..9`), hex codes (`#...`), `rgb()`/`rgba()`, or `hsl()`/`hsla()` in JSX or CSS (the only exception is defining base `MantineColorsTuple` and `virtualColor` inside `client/src/theme.ts`).
   - CSS variables for surfaces, borders, and text MUST use Mantine semantic tokens (`--mantine-color-body`, `--mantine-color-default`, `--mantine-color-default-hover`, `--mantine-color-default-border`, `--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-primary-color-filled|light|contrast`, `--mantine-color-<role>-light|filled|outline`) or `--app-bg-subtle`. Do NOT invent duplicate `--app-*` color/border variables.
8. **No Inline Border, Radius-Shorthand, or `style` Props in JSX**:
   - NEVER pass CSS border shorthands to `bd="..."` (e.g., `bd="1px solid ..."`), use `bdrs="..."`, or pass `style={{...}}` in JSX.
   - Use `<Paper withBorder radius="...">` or `<Card>` for bordered surfaces, `bg="var(--app-bg-subtle)"` for nested subtle surfaces, `<Table.ScrollContainer>` for horizontal table scrolling, and `<ComponentName>.module.css` for Dropzone inner pointer-events or conditional/stateful borders (`mod={{ active, selected, focused, me }}` + `&[data-*]`).
9. **Component CSS Isolation (`*.module.css` vs `global.css`)**:
   - Place all component/page-specific classes, hover/focus-visible styles, and state selectors inside `<ComponentName>.module.css`.
   - Keep `client/src/styles/global.css` strictly for app-wide rules (`body`, `.app-tabular`, `.app-main-content`, and third-party overrides like `.leaflet-popup-*`).

## 4. Testing & Verification (`client/`)

- Import `{ render, screen, userEvent }` from `@test-utils` (`client/test-utils/render.tsx`), never `render` directly from `@testing-library/react`.
- Keep `@mantine/core/styles.css` imported first in `client/src/App.tsx`, followed by extension stylesheets, then `*.module.css`.
- After UI changes, run inside `client/`:
  - `yarn check` (typecheck + `oxlint` + `oxfmt`)
  - `yarn stylelint`
  - `yarn ui:lint` (`scripts/check-ui-rules.mjs` — enforces semantic colors/tokens, no `bd`/`bdrs`/`style={{}}`, no raw HTML, no non-semantic `onClick`)
  - `yarn vitest`
  - `yarn build` (or run the full pipeline via `yarn test`)
  - `yarn storybook:build` when adding/modifying stories or theme setup

## 5. Project Skills (`client/.agents/skills/`)

When working on a matching task in `client/`, read the relevant `client/.agents/skills/<skill-name>/SKILL.md` first before implementing or reviewing:

| Task / Trigger                                                                      | Skill to Read (`client/.agents/skills/...`) | Scope & Adaptation Notes                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Writing, refactoring, or optimizing React components, data fetching, or bundle size | `vercel-react-best-practices/SKILL.md`      | Apply React/Vite SPA rules; skip Next.js App Router / Server Components (`RSC`) rules   |
| Designing reusable/compound components, fixing boolean-prop bloat, React 19 APIs    | `vercel-composition-patterns/SKILL.md`      | Combine with Mantine primitives (`Box`, `UnstyledButton`, `createPolymorphicComponent`) |
| Adding route or UI enter/exit animations without third-party animation libs         | `vercel-react-view-transitions/SKILL.md`    | Apply `<ViewTransition>` / `startViewTransition` with CSS Modules                       |
| UI/UX, accessibility, or design compliance review                                   | `web-design-guidelines/SKILL.md`            | Use for audits alongside Section 3 Mantine rules                                        |
| Reviewing documentation or UI prose                                                 | `writing-guidelines/SKILL.md`               | Use when editing `docs/` or long-form UI copy                                           |

- **Deploy-only skills**: Use `deploy-to-vercel`, `vercel-cli-with-tokens`, and `vercel-optimize` only when explicitly deploying or auditing a Vercel deployment.
- **Not applicable**: Ignore `vercel-react-native-skills` (`client/` is a Vite web app, not React Native/Expo).
- **Precedence rule**: Section 3 (Strict Mantine-First UI Rules) always overrides generic code examples inside skills. Never copy raw HTML tags, Tailwind classes, or Next.js-only patterns from a skill; translate the React/composition pattern onto Mantine components and `*.module.css`.

## 6. Project Documentation

Read [docs/mantine/README.md](./docs/mantine/README.md) for the Vietnamese lookup map, strict rule examples, skill mapping, and setup/form/hook/testing patterns.

# AI Agent Guidelines — Mantine UI v9 + Next.js 16 (`client/`)

These rules are mandatory for every UI task in `client/`.

## 1. Verified Project Stack (`client/package.json`)

- **UI Core, Hooks & Extensions**: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dropzone`, `@mantine/modals`, `@mantine/notifications`, `@mantine/dates`, `@mantine/charts` (`^9.8.2`), `dayjs`, `recharts`
- **Icons**: `@tabler/icons-react` (`^3.52.0`)
- **Framework, Data & Validation**: `next` `16.2.6` (App Router), `react` `19.2.4`, `@tanstack/react-query` `^5`, `zod` `^4.4.3`
- **Styling Toolchain**: `postcss` `^8.5.33`, `postcss-preset-mantine` `^1.18.0`, `postcss-simple-vars` `^7.0.1` (`$mantine-breakpoint-xs`..`xl` in `client/postcss.config.mjs`), `stylelint` `^17.16.0` (`stylelint-config-standard` `^40.0.0`)
- **Build, Lint, Format & Test**: `npm`, TypeScript `^5`, ESLint `^9` (`eslint-config-next`, `eslint-plugin-storybook`), Prettier `^3.2.5`, Vitest `^4.1.10`, Storybook `^10.5.5` (`@storybook/nextjs-vite`), Playwright `^1.62.1`
- **Not pre-installed**: `@mantine/spotlight`, `@mantine/tiptap`, `@phosphor-icons/react`. Always inspect `client/package.json` before importing an extension package; run `npm install` in `client/` only when a feature needs it.

## 2. Official Documentation Lookup Protocol

Never guess Mantine v9 APIs or copy deprecated v6/v7/v8 patterns. Always check:

1. **API, Props, Hooks, Form, Theme & Styles (`v9`)**: Look up `https://mantine.dev/`
   - Next.js App Router guide: `https://mantine.dev/guides/next/`
   - Core components: `https://mantine.dev/core/package/` (and `/core/<component>/`)
   - Hooks: `https://mantine.dev/hooks/package/` (and `/hooks/<hook>/`)
   - Forms & validation: `https://mantine.dev/form/use-form/` (and `/form/schema-validation/`)
   - Styling, PostCSS & Styles API: `https://mantine.dev/styles/mantine-styles/`, `/styles/postcss-preset/`, `/styles/styles-api/`
   - Theming & color schemes: `https://mantine.dev/theming/theme-object/`, `/theming/color-schemes/`
2. **Prebuilt UI Blocks & Layouts**: Look up `https://ui.mantine.dev/`
   - Browse `Application UI` (Navbars, Headers, Footers, Inputs, Cards, Stats, Tables, Dropzones), `Page Sections` (Hero, Features, Banners, Pricing, FAQs, Contact), and `Blog` before designing sections from scratch.
   - **Mandatory 4-step snippet adaptation**: Never paste `ui.mantine.dev` code verbatim without checking:
     - Verify dependencies against `client/package.json` (use `@tabler/icons-react`).
     - Replace any raw HTML or non-semantic tags with Mantine equivalents per Section 3.
     - Convert any raw `px` spacing/font values in CSS Modules to `rem()` / `--mantine-*` semantic tokens (Zero-Hex) and keep CSS in `*.module.css`.
     - Keep theme tokens centralized in `client/theme.ts` and preserve Server/Client Component boundaries (`'use client'` only where required).

## 3. Strict UI Rules (Zero-Tolerance)

1. **Maximize Mantine UI (Direct Import)**: Use `@mantine/core`, `@mantine/hooks`, and `@mantine/form` directly. Do not create redundant thin wrapper primitives in `components/ui/` and do not add third-party UI libraries when Mantine covers the requirement.
2. **Build custom components on Mantine primitives**: When Mantine lacks a specialized domain widget, compose it from Mantine elements (`Box`, `Paper`, `UnstyledButton`, `Group`, `Stack`, `Input.Wrapper`, `InputBase`, polymorphic `component="..."`, `createPolymorphicComponent`) so it inherits theme tokens, style props, and Styles API.
3. **No raw HTML elements**: Never write raw `<div>`, `<span>`, `<p>`, `<h1>`-`<h6>`, `<button>`, `<a>`, `<form>`, `<input>`, `<select>`, `<textarea>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<hr>`, `<img>`, or inline `<svg>` in JSX when Mantine provides an equivalent (`Box`/`Stack`/`Group`/`Paper`, `Text`, `Title`, `Button`/`ActionIcon`/`UnstyledButton`/`CloseButton`, `Anchor` / `component={Link}` from `next/link`, `<Box component="form" noValidate>`, `TextInput`/`Select`/`Textarea`, `List`, `Table`, `Divider`, `Image`/`Avatar`, `@tabler/icons-react`).
4. **No non-semantic elements**:
   - Never attach `onClick` to `<Box>`, `<Paper>`, `<Card>`, or `<Text>` instead of `<Button>`, `<ActionIcon>`, `<UnstyledButton>`, or `<Anchor>` / `component={Link}`.
   - Preserve semantic landmarks via `AppShell.*` or polymorphic `component` (`<Box component="main"|"section"|"article"|"nav"|"header"|"footer">`), sequential `<Title order={1..6}>`, and `aria-label` on icon-only buttons (`ActionIcon`, `CloseButton`).
   - Rare technical DOM mount containers (e.g., third-party canvas/audio waveform/chart ref) must use `<Box ref={...} />` with a time-bound exemption comment: `// interviewcoach-convention-exempt: <RULE_ID> <reason> until: YYYY-MM-DD`.
5. **No competing styling frameworks**: Never write Tailwind CSS, `class-variance-authority` (CVA), `cn()`, `styled-components`, Emotion, or other CSS-in-JS in UI code. Always follow the 3-tier Mantine styling hierarchy (Style Props -> CSS Modules `*.module.css` -> Styles API); when modifying legacy Tailwind/Radix files, migrate them to Mantine v9.
6. **No hardcoded `px` for font sizes, spacing, or radius**: Use Mantine theme scale (`xs`–`xl`), CSS variables (`--mantine-spacing-*`, `--mantine-font-size-*`, `--mantine-radius-*`), PostCSS `rem()` / `em()`, or Mantine numeric props (auto-converted to `rem`). Never hardcode string/CSS `px` for typography, padding, margin, gap, or radius (only `1px` hairline borders inside `*.module.css` or fixed media dimensions are allowed).
7. **Zero-Hex & Semantic-Only Colors (D2)**:
   - Color props (`color`, `c`) MUST use only the 5 semantic roles registered via `DEFAULT_THEME.colors` in `client/theme.ts` (100% RSC-safe, no `'use client'`): `brand` (`cyan`), `success` (`green`), `warning` (`yellow`), `danger` (`red`), `neutral` (`gray`), plus `c="dimmed"` for secondary text.
   - NEVER use hex codes (`#...`), `rgb()`/`rgba()`, `hsl()`/`hsla()`, `colorsTuple(...)`, `virtualColor(...)`, custom `MantineColorsTuple` arrays, `--app-*` color/border variables, standalone numeric shades (`brand.6`, `--mantine-color-gray-0`), or physical color names (`blue`, `teal`, `yellow`, `red`, `gray`, `green`, `amber`, `orange`, `pink`, `white`, `black`, `dark`) anywhere in JSX, TS, or CSS (including `client/theme.ts`).
   - CSS variables for surfaces, borders, and text MUST use Mantine semantic tokens (`--mantine-color-body`, `--mantine-color-default`, `--mantine-color-default-hover`, `--mantine-color-default-border`, `--mantine-color-text`, `--mantine-color-dimmed`, `--mantine-primary-color-filled|light|contrast`, `--mantine-color-<role>-light|filled|outline|contrast`).
   - **Single allowed exception** for nested subtle surfaces in `*.module.css`: `light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))`.
8. **No Inline Border, Radius-Shorthand, or `style` Props in JSX**:
   - NEVER pass CSS border shorthands to `bd="..."`, use `bdrs="..."`, or pass `style={{...}}` in JSX.
   - Use `<Paper withBorder radius="...">` or `<Card>` for bordered surfaces, `<Table.ScrollContainer>` for horizontal table scrolling, and CSS Modules (`client/styles/*.module.css` or domain `*.module.css`) for Dropzone inner pointer-events or conditional/stateful borders (`mod={{ active, selected, focused }}` + `&[data-*]`).
9. **2-Tier CSS Modules Architecture (`client/styles/` -> Domain `*.module.css` vs `client/app/globals.css`)**:
   - **Tier 1 — Shared CSS Modules (`client/styles/`, Rule of Three)**: Always check and reuse the 4 shared CSS Modules before writing new CSS (`layout.module.css` for workspace/drawer/flex/scroll, `surfaces.module.css` for subtle/body surfaces & borders, `interactions.module.css` for focus ring/hover rows/selectable items/card links/nav links, `typography.module.css` for tabular numbers/pre-line/srOnly). Only add patterns reused across `>= 2` domains.
   - **Tier 2 — Domain CSS Modules**: Do NOT create small per-component `<ComponentName>.module.css` files; place domain-specific styles (`@mixin hover`, `&[data-*]`, layout/widget rules) inside `components/<domain>/<domain>.module.css` (or `components/layout/app-shell.module.css`) with widget-prefixed class names, and never import CSS Modules across unrelated domains.
   - Do NOT duplicate `light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))` (use `surfaces.subtleSurface`) or default `&:focus-visible` rules (rely on `theme.focusClassName` in `client/theme.ts` / `interactions.focusRing`).
   - Keep `client/app/globals.css` strictly for app-wide layer declarations (`@layer mantine, components;` + `@mantine/*/styles.layer.css`), global base rules, and View Transition keyframes.
10. **Standardized Forms, Hooks & Server State**:
    - Use `@mantine/form` (`mode: 'uncontrolled'`, `form.key('path')`, `{...form.getInputProps('path')}`, `schemaResolver(zodSchema, { sync: true })` with Zod v4) and `<Box component="form" onSubmit={form.onSubmit(...)} noValidate>`.
    - Prefer `@mantine/hooks` (`useDisclosure`, `useDebouncedValue`, `useMediaQuery`, `useReducedMotion`, `useHotkeys`, `useNetwork`, etc.) over hand-rolled DOM/window `useEffect` helpers.
    - Use `@tanstack/react-query` (`queryOptions()`, `useQuery`, `useMutation`, hierarchical `queryKeys`) combined with typed domain service functions for server state (never fetch inside `useEffect`).

## 4. Testing & Verification (`client/`)

- Import `{ render, screen, userEvent }` from `@test-utils` (`client/test-utils/index.ts`), never `render` directly from `@testing-library/react`.
- Keep `@layer mantine, components;` and `@mantine/*/styles.layer.css` at the top of `client/app/globals.css`, and keep `<ColorSchemeScript defaultColorScheme="auto" />` + `{...mantineHtmlProps}` in `client/app/layout.tsx` (zero-FOUC).
- Format all new/edited code according to `client/.prettierrc` (`semi: false`, `singleQuote: true`, `trailingComma: 'es5'`).
- After UI changes, run inside `client/`:
  - `npm run typecheck` (`tsc --noEmit`)
  - `npm run lint` (ESLint 9)
  - `npm run format:check` (Prettier)
  - `npm run stylelint` (`**/*.module.css`)
  - `npm run ui:lint` (defaults to scanning 100% of `client/` UI codebase — `app`, `components`, `hooks`, `lib`, `config`, `providers`, `queries`, `test-utils`, `stories`, `.storybook`, `theme.ts`, `**/*.module.css` — enforcing all 8 Mantine v9 Zero-Hex rules in `scripts/check-ui-rules.mjs`; or `npm run ui:lint -- <touched-files>`)
  - `npm run test:unit` (Vitest 4 `--project unit` on `jsdom`)
  - `npm run build` (Next.js 16 production build)
  - `npm run build-storybook` when adding/modifying `*.stories.tsx`, MDX docs, or theme/preview setup
  - `npm run verify:docs` when modifying frontend documentation

## 5. Project Skills (`client/.agents/skills/`)

When working on a matching task in `client/`, read the relevant `client/.agents/skills/<skill-name>/SKILL.md` first before implementing or reviewing:

| Task / Trigger                                                                                   | Skill to Read (`client/.agents/skills/...`)    | Scope & Adaptation Notes                                                                                             |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Designing TanStack Query v5 data flows, `queryOptions()`, caching, prefetching & invalidation    | `tanstack-integration-best-practices/SKILL.md` | Apply `queryOptions()`, `cache-single-source`, isolated `QueryClient` & `ensureQueryData` on Next.js 16 + Mantine v9 |
| Writing, refactoring, or optimizing React/Next.js components, RSC, data fetching, or bundle size | `vercel-react-best-practices/SKILL.md`         | Apply full **Next.js App Router, Server Components (RSC)**, and React 19 performance rules                           |
| Designing reusable/compound components, fixing boolean-prop bloat, React 19 APIs                 | `vercel-composition-patterns/SKILL.md`         | Combine with Mantine primitives (`Box`, `Paper`, `UnstyledButton`, `createPolymorphicComponent`)                     |
| Adding route or UI enter/exit animations without third-party animation libs                      | `vercel-react-view-transitions/SKILL.md`       | Apply `<ViewTransition>` / `startViewTransition` with CSS Modules (`*.module.css`)                                   |
| UI/UX, accessibility, or design compliance review                                                | `web-design-guidelines/SKILL.md`               | Use for audits alongside Section 3 Mantine v9 Zero-Hex rules                                                         |
| Reviewing documentation or UI prose                                                              | `writing-guidelines/SKILL.md`                  | Use when editing `client/docs/` or long-form UI copy                                                                 |

- **Deploy-only skills**: Use `deploy-to-vercel`, `vercel-cli-with-tokens`, and `vercel-optimize` only when explicitly deploying or auditing a Vercel deployment.
- **Not applicable**: Ignore `vercel-react-native-skills` (`client/` is a Next.js web app, not React Native/Expo).
- **Precedence rule**: Section 3 (Strict Mantine-First Zero-Hex UI Rules) always overrides generic code examples inside skills. Never copy raw HTML tags or Tailwind classes from a skill; translate the React/Next.js pattern onto Mantine v9 components and `*.module.css`.

## 6. Project Documentation

- Read [client/docs/mantine/README.md](./client/docs/mantine/README.md) for the Vietnamese Mantine v9 lookup map, Zero-Hex strict rules, setup/form/hook/testing patterns, and skill mapping.
- Read [client/docs/docs/README.md](./client/docs/docs/README.md) for the Master Hub of InterviewCoach Frontend Architecture & Engineering Conventions (16 topics across 4 domain folders + Quick Reference).

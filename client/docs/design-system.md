# InterviewCoach Design System

## Overview

This document outlines the architecture and guidelines for the InterviewCoach Design System, built with Next.js, Tailwind CSS v4, and React.

## Core Principles

- **Separation of Concerns:**
  - **Design Tokens:** Base variables defined in `globals.css`
  - **UI Primitives:** Low-level, reusable UI components in `components/ui` (e.g. `Button`, `Input`). They have no business logic.
  - **Common/Layout/Feature Components:** Higher-level components that combine primitives and may include specific logic or layouts (e.g. `NavLinks`, `LogoutButton`).
- **Semantic Styling:** Use semantic token names (e.g., `--color-brand`) instead of physical colors (e.g., `#6B3FA0`) in features.
- **Maintainability:** Avoid arbitrary values in Tailwind classes. Use `cn()` utility (`clsx` + `tailwind-merge`) to merge classes cleanly. Use `class-variance-authority` (CVA) for complex component variants.

## Design Tokens

The tokens are defined via Tailwind v4 `@theme` directive in `app/globals.css`.

### Brand Colors

- `--color-brand`: `#6B3FA0` (Primary purple)
- `--color-brand-light`: `#8B5CC8`
- `--color-brand-dark`: `#4E2D7A`
- `--color-brand-50`: `#F3EEF9` (Light background)
- `--color-brand-100`: `#E4D7F3`
- `--color-brand-200`: `#C9AFEB`
- `--color-brand-muted`: `#D4BEF0`

### Semantic Feedback Colors

- **Success:** `--color-success` (`#16A34A`), `--color-success-bg` (`#F0FDF4`)
- **Info:** `--color-info` (`#2563EB`), `--color-info-bg` (`#EFF6FF`)
- **Warning:** `--color-warning` (`#D97706`), `--color-warning-bg` (`#FFFBEB`)
- **Danger:** `--color-danger` (`#DC2626`), `--color-danger-bg` (`#FEF2F2`)

### Surface & Ink

- **Surface:** `--color-surface` (White), `--color-surface-raised` (`#F8F5FD`)
- **Ink:** `--color-ink` (`#1A0F2E`), `--color-ink-muted` (`#6B6B7B`), `--color-ink-faint` (`#9B9BAB`)
- **Border:** `--color-border` (`#E8E0F5`), `--color-border-strong` (`#C9AFEB`)

### Shadows

- `--shadow-card`: Card wrapper shadow
- `--shadow-btn`: Primary button shadow
- `--shadow-glow`: Hover glow state

## Component Guidelines

### Using the `cn` utility

Always use the `cn` utility (from `lib/utils.ts`) when a component needs to merge incoming `className` props with default styles.

```tsx
import { cn } from '@/lib/utils'

export function MyComponent({ className }: { className?: string }) {
  return <div className={cn('bg-brand rounded-xl p-4', className)} />
}
```

### Creating Variants with CVA

For components that have multiple variations (like size, color, or style), use `class-variance-authority`.

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const myVariants = cva('base-classes', {
  variants: {
    intent: {
      primary: 'bg-brand text-white',
      danger: 'bg-danger text-white',
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
})
```

## Accessibility (A11y)

- Ensure all interactive elements have focus states (e.g. `focus-visible:ring-2 focus-visible:ring-brand`).
- Forward `ref`s to the underlying DOM node on all UI primitives.
- Map `error` state props to `aria-invalid` and `aria-describedby` automatically on inputs.

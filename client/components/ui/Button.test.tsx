import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Trash2 } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { axe } from 'jest-axe'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setup = (jsx: React.ReactElement) => ({
  user: userEvent.setup(),
  ...render(jsx),
})

// ---------------------------------------------------------------------------
// 1. Render
// ---------------------------------------------------------------------------

describe('Button — Render', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders with default variant and size classes', () => {
    render(<Button>Test</Button>)
    const btn = screen.getByRole('button')
    // CVA should apply base + primary + md classes
    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('h-10')
  })

  it('sets displayName correctly', () => {
    expect(Button.displayName).toBe('Button')
  })
})

// ---------------------------------------------------------------------------
// 1.5. Accessibility (a11y)
// ---------------------------------------------------------------------------

describe('Button — Accessibility', () => {
  it('should not have basic accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('icon-only button should not have accessibility violations', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Xóa mục này">
        <Trash2 className="size-4" />
      </Button>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// 2. Variants
// ---------------------------------------------------------------------------

describe('Button — Variants', () => {
  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'bg-secondary'],
    ['outline', 'border'],
    ['ghost', 'bg-transparent'],
    ['destructive', 'bg-destructive'],
    ['link', 'underline-offset-4'],
  ] as const)(
    'variant "%s" applies expected class "%s"',
    (variant, expectedClass) => {
      render(<Button variant={variant}>Test</Button>)
      expect(screen.getByRole('button')).toHaveClass(expectedClass)
    }
  )

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
    ['icon', 'size-10'],
  ] as const)(
    'size "%s" applies expected class "%s"',
    (size, expectedClass) => {
      render(<Button size={size}>{size === 'icon' ? '×' : 'Test'}</Button>)
      expect(screen.getByRole('button')).toHaveClass(expectedClass)
    }
  )
})

// ---------------------------------------------------------------------------
// 3. Click
// ---------------------------------------------------------------------------

describe('Button — Click', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const { user } = setup(<Button onClick={handleClick}>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('calls onClick multiple times on repeated clicks', async () => {
    const handleClick = vi.fn()
    const { user } = setup(<Button onClick={handleClick}>Click</Button>)

    const btn = screen.getByRole('button')
    await user.click(btn)
    await user.click(btn)
    await user.click(btn)
    expect(handleClick).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// 4. Disabled
// ---------------------------------------------------------------------------

describe('Button — Disabled', () => {
  it('has disabled attribute when disabled=true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const { user } = setup(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 5. Loading
// ---------------------------------------------------------------------------

describe('Button — Loading', () => {
  it('has disabled attribute when loading=true', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('has aria-busy="true" when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('does not call onClick when loading', async () => {
    const handleClick = vi.fn()
    const { user } = setup(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows spinner (Loader2 icon) when loading', () => {
    render(<Button loading>Loading</Button>)
    // Spinner is aria-hidden but present in DOM
    const spinner = document.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeInTheDocument()
  })

  it('hides children text visually but keeps it in DOM when loading', () => {
    render(<Button loading>My Button</Button>)
    // Text still in DOM (for width) but hidden via opacity-0
    expect(screen.getByText('My Button')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 6. Accessible Name
// ---------------------------------------------------------------------------

describe('Button — Accessible Name', () => {
  it('has accessible name from children text', () => {
    render(<Button>Submit Form</Button>)
    expect(
      screen.getByRole('button', { name: 'Submit Form' })
    ).toBeInTheDocument()
  })

  it('has accessible name from aria-label (icon-only)', () => {
    render(
      <Button size="icon" aria-label="Xóa mục này">
        <Trash2 className="size-4" />
      </Button>
    )
    expect(
      screen.getByRole('button', { name: 'Xóa mục này' })
    ).toBeInTheDocument()
  })

  it('aria-label overrides children for accessible name', () => {
    render(<Button aria-label="Custom label">Visual text</Button>)
    expect(
      screen.getByRole('button', { name: 'Custom label' })
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 7. Keyboard Focus
// ---------------------------------------------------------------------------

describe('Button — Keyboard Focus', () => {
  it('can receive focus via Tab', async () => {
    const { user } = setup(<Button>Focus me</Button>)

    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  it('triggers onClick on Enter key press', async () => {
    const handleClick = vi.fn()
    const { user } = setup(<Button onClick={handleClick}>Press me</Button>)

    await user.tab()
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('triggers onClick on Space key press', async () => {
    const handleClick = vi.fn()
    const { user } = setup(<Button onClick={handleClick}>Press me</Button>)

    await user.tab()
    await user.keyboard('{ }')
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not receive focus when disabled', async () => {
    const { user } = setup(<Button disabled>Disabled</Button>)

    await user.tab()
    expect(screen.getByRole('button')).not.toHaveFocus()
  })

  it('has focus-visible ring class in base styles', () => {
    render(<Button>Focus ring</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('focus-visible:ring-2')
  })
})

// ---------------------------------------------------------------------------
// 8. forwardRef
// ---------------------------------------------------------------------------

describe('Button — forwardRef', () => {
  it('forwards ref to the underlying button element', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref test</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})

// ---------------------------------------------------------------------------
// 9. asChild
// ---------------------------------------------------------------------------

describe('Button — asChild', () => {
  it('renders as child element when asChild=true', () => {
    render(
      <Button asChild>
        <a href="/home">Go home</a>
      </Button>
    )
    // Should render <a>, not <button>
    const link = screen.getByRole('link', { name: 'Go home' })
    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe('A')
  })

  it('merges button variant classes directly onto the child anchor tag', () => {
    render(
      <Button variant="outline" size="sm" asChild className="custom-test-class">
        <a href="/resume">Xem hồ sơ CV</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Xem hồ sơ CV' })
    expect(link).toHaveClass('custom-test-class')
    expect(link).toHaveClass('h-8')
    expect(link).toHaveClass('border-border')
    expect(link).toHaveClass('inline-flex')
  })

  it('renders multiple children (leading icon, text, trailing icon) directly inside child anchor tag without wrapper span', () => {
    render(
      <Button variant="outline" size="sm" asChild className="gap-1.5">
        <a href="/resume">
          <span data-testid="leading-icon">📜</span>
          <span>Xem hồ sơ CV</span>
          <span data-testid="trailing-icon">→</span>
        </a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /Xem hồ sơ CV/ })
    expect(link).toBeInTheDocument()
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument()
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument()
    // Direct parent of icons must be the anchor tag itself, not an inner wrapper span
    expect(screen.getByTestId('leading-icon').parentElement).toBe(link)
  })

  it('applies disabled styling when disabled or loading is passed to asChild', () => {
    render(
      <Button asChild disabled>
        <a href="/disabled">Disabled Link</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Disabled Link' })
    expect(link).toHaveClass('pointer-events-none')
    expect(link).toHaveClass('opacity-50')
  })
})

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import { axe } from 'jest-axe'

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-surface-raised')
  })

  it('renders correctly with brand variant', () => {
    render(<Badge variant="brand">Brand Badge</Badge>)
    const badge = screen.getByText('Brand Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-brand-subtle')
  })

  it('renders correctly with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    const badge = screen.getByText('Secondary Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-secondary')
  })

  it('renders correctly with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    const badge = screen.getByText('Outline Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-transparent')
  })

  it('forwards refs correctly', () => {
    const ref = React.createRef<HTMLSpanElement>()
    render(<Badge ref={ref}>Badge</Badge>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('renders interactive badge with button role and tabIndex', () => {
    render(<Badge interactive>Clickable Badge</Badge>)
    const badge = screen.getByRole('button', { name: 'Clickable Badge' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('tabIndex', '0')
    expect(badge).toHaveClass('cursor-pointer')
  })

  it('renders onDismiss button and triggers callback', () => {
    const handleDismiss = vi.fn()
    render(
      <Badge onDismiss={handleDismiss} dismissLabel="Bỏ chọn React">
        React
      </Badge>
    )
    const dismissBtn = screen.getByRole('button', { name: 'Bỏ chọn React' })
    expect(dismissBtn).toBeInTheDocument()
    dismissBtn.click()
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('should pass a11y tests', async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge interactive>Interactive</Badge>
        <Badge onDismiss={() => {}} dismissLabel="Xóa tag">
          Dismissible
        </Badge>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})


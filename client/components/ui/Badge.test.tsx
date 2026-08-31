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
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

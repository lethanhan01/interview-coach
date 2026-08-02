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

  it('forwards refs correctly', () => {
    const ref = React.createRef<HTMLSpanElement>()
    render(<Badge ref={ref}>Badge</Badge>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('should pass a11y tests', async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

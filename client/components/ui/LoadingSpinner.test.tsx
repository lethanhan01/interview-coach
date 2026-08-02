import * as React from 'react'
import { render } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'
import { axe } from 'jest-axe'

describe('LoadingSpinner Component', () => {
  it('renders correctly with default size', () => {
    const { container } = render(<LoadingSpinner data-testid="spinner" />)
    const spinner = container.querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('size-6') // md is default
  })

  it('renders correctly with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    const spinner = container.querySelector('svg')
    expect(spinner).toHaveClass('size-4')
  })

  it('passes accessibility tests', async () => {
    // A spinner is typically an icon. It should pass a11y tests.
    // If it is used to indicate loading, it might need aria-label in real usage, 
    // but the component itself should not violate rules.
    const { container } = render(
      <div role="status" aria-label="Loading content">
        <LoadingSpinner />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

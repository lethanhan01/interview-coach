import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import ProfileEmptyState from './ProfileEmptyState'

describe('ProfileEmptyState', () => {
  it('renders correctly', () => {
    const { container } = render(<ProfileEmptyState message="No data" />)
    expect(container).toBeInTheDocument()
  })
})


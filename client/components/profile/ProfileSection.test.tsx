import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import ProfileSection from './ProfileSection'

describe('ProfileSection', () => {
  it('renders correctly', () => {
    // Basic render test
    // You may need to provide required props
    const { container } = render(<ProfileSection data={{}} onSave={vi.fn()} label="Test" message="Empty" title="Section" />)
    expect(container).toBeInTheDocument()
  })
})

import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import WorkExperienceGroup from './WorkExperienceGroup'

describe('WorkExperienceGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    const { container } = render(<WorkExperienceGroup data={[]} onSave={vi.fn()} />)
    expect(container).toBeInTheDocument()
  })
})

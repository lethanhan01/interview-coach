import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import ProjectsGroup from './ProjectsGroup'

describe('ProjectsGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    const { container } = render(<ProjectsGroup data={[]} onSave={vi.fn()} />)
    expect(container).toBeInTheDocument()
  })
})

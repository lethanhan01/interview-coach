import { render } from '@test-utils'
import { expect, it, describe, vi } from 'vitest'
import ProjectsGroup from './ProjectsGroup'

describe('ProjectsGroup (Resume)', () => {
  it('renders correctly', () => {
    const { container } = render(
      <ProjectsGroup data={[]} availableTechs={[]} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
  })
})

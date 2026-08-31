import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import EducationGroup from './EducationGroup'

describe('EducationGroup (Resume)', () => {
  it('renders correctly', () => {
    const { container } = render(
      <EducationGroup data={{}} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
  })
})

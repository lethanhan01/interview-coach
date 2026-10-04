import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import PersonalityGroup from './PersonalityGroup'

describe('PersonalityGroup (Resume)', () => {
  it('renders correctly', () => {
    const { container } = render(
      <PersonalityGroup data={{}} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
  })
})

import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import PersonalityGroup from './PersonalityGroup'

describe('PersonalityGroup', () => {
  it('renders correctly', () => {
    const { container } = render(
      <PersonalityGroup data={{ personality: 'Test' }} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
  })
})


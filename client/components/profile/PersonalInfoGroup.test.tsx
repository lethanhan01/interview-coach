import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import PersonalInfoGroup from './PersonalInfoGroup'

describe('PersonalInfoGroup', () => {
  it('renders correctly', () => {
    const { container } = render(
      <PersonalInfoGroup
        data={{ firstname: 'An', lastname: 'Nguyen' }}
        onSave={vi.fn()}
      />
    )
    expect(container).toBeInTheDocument()
  })
})


import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import PersonalInfoGroup from './PersonalInfoGroup'

describe('PersonalInfoGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    // You may need to provide required props
    const { container } = render(<PersonalInfoGroup data={{}} onSave={vi.fn()} label="Test" message="Empty" title="Section" />)
    expect(container).toBeInTheDocument()
  })
})

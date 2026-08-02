import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import EducationGroup from './EducationGroup'

describe('EducationGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    // You may need to provide required props
    const { container } = render(<EducationGroup data={{}} onSave={vi.fn()} label="Test" message="Empty" title="Section" />)
    expect(container).toBeInTheDocument()
  })
})

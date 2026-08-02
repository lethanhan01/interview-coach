import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import TechnicalSkillsGroup from './TechnicalSkillsGroup'

describe('TechnicalSkillsGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    const { container } = render(<TechnicalSkillsGroup data={[]} onSave={vi.fn()} />)
    expect(container).toBeInTheDocument()
  })
})

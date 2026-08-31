import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import EducationGroup from './EducationGroup'

describe('EducationGroup', () => {
  it('renders correctly', () => {
    const { container } = render(
      <EducationGroup
        data={{
          degree: 'BS',
          school: 'Uni',
          major: 'CS',
          gpa: '3.5',
          graduationYear: '2024',
        }}
        onSave={vi.fn()}
      />
    )
    expect(container).toBeInTheDocument()
  })
})


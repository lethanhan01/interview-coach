import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import CertificationsGroup from './CertificationsGroup'

describe('CertificationsGroup (Resume)', () => {
  it('renders correctly', () => {
    const { container } = render(
      <CertificationsGroup
        data={{ certifications: [], awards: [] }}
        onSave={vi.fn()}
      />
    )
    expect(container).toBeInTheDocument()
  })
})

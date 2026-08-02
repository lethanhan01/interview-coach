import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import CertificationsGroup from './CertificationsGroup'

describe('CertificationsGroup', () => {
  it('renders correctly', () => {
    // Basic render test
    const { container } = render(<CertificationsGroup data={{ certifications: [], awards: [] }} onSave={vi.fn()} />)
    expect(container).toBeInTheDocument()
  })
})

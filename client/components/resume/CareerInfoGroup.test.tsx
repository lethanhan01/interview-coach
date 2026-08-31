import { render } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import CareerInfoGroup from './CareerInfoGroup'

describe('CareerInfoGroup (Resume)', () => {
  it('renders correctly', () => {
    const { container } = render(
      <CareerInfoGroup data={{}} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
  })
})

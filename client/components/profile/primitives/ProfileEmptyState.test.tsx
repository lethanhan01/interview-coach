import { describe, expect, it } from 'vitest'
import { render, screen } from '@test-utils'
import ProfileEmptyState from './ProfileEmptyState'

describe('ProfileEmptyState', () => {
  it('renders empty state message and forwards className', () => {
    render(
      <ProfileEmptyState message="Chưa có thông tin" className="custom-empty" />
    )
    const node = screen.getByText('Chưa có thông tin')
    expect(node).toBeInTheDocument()
    expect(node).toHaveClass('custom-empty')
  })
})

import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen } from '@test-utils'
import ProfileEmptyState from './ProfileEmptyState'

describe('ProfileEmptyState', () => {
  it('renders empty state message and forwards className', async () => {
    const { container } = render(
      <ProfileEmptyState message="Chưa có thông tin" className="custom-empty" />
    )
    const node = screen.getByText('Chưa có thông tin')
    expect(node).toBeInTheDocument()
    expect(node).toHaveClass('custom-empty')
    expect(await axe(container)).toHaveNoViolations()
  })
})

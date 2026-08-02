import { render, screen } from '@testing-library/react'
import NavLinks from './NavLinks'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/sessions'),
}))

describe('NavLinks', () => {
  const mockItems = [
    { href: '/sessions', label: 'Phỏng vấn', match: ['/sessions'] },
    { href: '/jd-library', label: 'Tạo mới', match: ['/jd-library', '/setup'] },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<NavLinks items={mockItems} />)
    expect(screen.getByText('Phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('Tạo mới')).toBeInTheDocument()
  })

  it('highlights the active link', () => {
    render(<NavLinks items={mockItems} />)
    const activeLink = screen.getByText('Phỏng vấn')
    expect(activeLink).toHaveClass('text-brand-subtle-fg')
    
    const inactiveLink = screen.getByText('Tạo mới')
    expect(inactiveLink).not.toHaveClass('text-brand-subtle-fg font-semibold')
  })
})

import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { usePathname } from 'next/navigation'
import { vi } from 'vitest'
import { candidateNavigation } from '@/config/navigation'
import NavLinks, { isNavItemActive } from './NavLinks'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/sessions'),
}))

describe('NavLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/sessions')
  })

  it('matches exact and nested routes accurately', () => {
    expect(isNavItemActive('/sessions', ['/sessions'])).toBe(true)
    expect(isNavItemActive('/sessions/123', ['/sessions'])).toBe(true)
    expect(isNavItemActive('/sessions-archive', ['/sessions'])).toBe(false)
    expect(isNavItemActive(null, ['/sessions'])).toBe(false)
  })

  it('renders horizontal links and sets aria-current on the active route', () => {
    render(<NavLinks items={candidateNavigation} orientation="horizontal" />)

    const activeLink = screen.getByRole('link', { name: 'Phỏng vấn' })
    expect(activeLink).toHaveAttribute('aria-current', 'page')

    const inactiveLink = screen.getByRole('link', { name: 'Tạo mới' })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })

  it('renders vertical collapsed mini-rail links with accessible names and triggers onNavigate', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    vi.mocked(usePathname).mockReturnValue('/setup')

    render(
      <NavLinks
        items={candidateNavigation}
        orientation="vertical"
        collapsed
        onNavigate={onNavigate}
      />
    )

    const createLink = screen.getByRole('link', { name: 'Tạo mới' })
    expect(createLink).toHaveAttribute('aria-current', 'page')

    await user.click(createLink)
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <NavLinks items={candidateNavigation} orientation="vertical" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

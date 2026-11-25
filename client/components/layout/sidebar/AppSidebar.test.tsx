import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { usePathname } from 'next/navigation'
import { vi } from 'vitest'
import AppSidebar from './AppSidebar'

const mockReplace = vi.fn()
const mockRefresh = vi.fn()
const mockLogout = vi.fn().mockResolvedValue(undefined)

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/dashboard'),
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u-admin', email: 'admin@intervia.vn' },
    role: 'admin',
    status: 'active',
    isLoading: false,
    refresh: vi.fn(),
    logout: mockLogout,
  }),
}))

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/admin/dashboard')
  })

  it('renders admin navigation items and highlights the active route', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/users')
    render(<AppSidebar role="admin" />)

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'O*NET Browser' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'SFIA Framework' })
    ).toBeInTheDocument()

    const usersLink = screen.getByRole('link', { name: 'Quản lý User' })
    expect(usersLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders candidate navigation items', () => {
    vi.mocked(usePathname).mockReturnValue('/sessions')
    render(<AppSidebar role="candidate" />)

    expect(screen.getByRole('link', { name: 'Phỏng vấn' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'Tạo mới' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'CV / Resume' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tài khoản' })).toBeInTheDocument()
  })

  it('invokes collapse toggle and logout actions', async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()

    render(
      <AppSidebar
        role="admin"
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
      />
    )

    await user.click(
      screen.getByRole('button', { name: 'Thu gọn thanh điều hướng' })
    )
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('renders mini-rail controls when collapsed', async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()

    render(
      <AppSidebar role="admin" collapsed onToggleCollapse={onToggleCollapse} />
    )

    await user.click(
      screen.getByRole('button', { name: 'Mở rộng thanh điều hướng' })
    )
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Đăng xuất' })
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<AppSidebar role="candidate" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

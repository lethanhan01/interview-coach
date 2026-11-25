import { render, screen, userEvent, waitFor, within } from '@test-utils'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { UserMenuButton } from './UserMenuButton'

const mockReplace = vi.fn()
const mockRefresh = vi.fn()
const mockLogout = vi.fn().mockResolvedValue(undefined)

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'candidate@intervia.vn' },
    role: 'candidate',
    status: 'active',
    isLoading: false,
    refresh: vi.fn(),
    logout: mockLogout,
  }),
}))

describe('UserMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens candidate menu, displays user email and profile links, and logs out', async () => {
    const user = userEvent.setup()
    render(<UserMenuButton role="candidate" />)

    await user.click(screen.getByRole('button', { name: 'Menu tài khoản' }))

    const body = within(document.body)
    expect(await body.findByText('Hồ sơ CV')).toBeInTheDocument()
    expect(body.getByText('Cài đặt tài khoản')).toBeInTheDocument()

    await user.click(body.getByRole('menuitem', { name: 'Đăng xuất' }))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('shows admin profile link for admin role', async () => {
    const user = userEvent.setup()
    render(<UserMenuButton role="admin" />)

    await user.click(screen.getByRole('button', { name: 'Menu tài khoản' }))

    const body = within(document.body)
    expect(await body.findByText('Hồ sơ Admin')).toBeInTheDocument()
    expect(body.queryByText('Hồ sơ CV')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<UserMenuButton role="candidate" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

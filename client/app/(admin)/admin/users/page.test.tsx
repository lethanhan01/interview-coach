import { notifications } from '@mantine/notifications'
import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/queries/keys'
import { userManagementService } from '@/services/admin.service'
import type { AdminUser } from '@/types'
import AdminUsersPage from './page'

const mockAuthState = {
  user: { id: 'admin-self', email: 'admin@example.com' } as {
    id: string
    email: string
  } | null,
  role: 'admin' as string | null,
  isLoading: false,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/services/admin.service', () => ({
  userManagementService: {
    listUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}))

const mockUsers: AdminUser[] = [
  {
    id: 'admin-self',
    email: 'admin@example.com',
    firstname: 'An',
    lastname: 'Quản trị',
    role: 'admin',
    status: 'active',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'user-1',
    email: 'candidate@example.com',
    firstname: 'Minh',
    lastname: 'Nguyễn',
    role: 'candidate',
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'locked@example.com',
    firstname: 'Lan',
    lastname: 'Phạm',
    role: 'candidate',
    status: 'locked',
    createdAt: '2026-09-02T10:00:00Z',
  },
]

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notifications.clean()
    mockAuthState.user = { id: 'admin-self', email: 'admin@example.com' }
    mockAuthState.role = 'admin'
    mockAuthState.isLoading = false
    vi.mocked(userManagementService.listUsers).mockResolvedValue(mockUsers)
  })

  it('reuses cached adminList from QueryClient without refetching and passes axe', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    queryClient.setQueryData(queryKeys.users.adminList(), mockUsers)

    const { container } = render(<AdminUsersPage />, { queryClient })

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()
    expect(screen.getByText('locked@example.com')).toBeInTheDocument()
    expect(userManagementService.listUsers).not.toHaveBeenCalled()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('disables lock and delete actions for the currently logged-in admin with accessible note', async () => {
    render(<AdminUsersPage />)

    const selfRow = (await screen.findByText('admin@example.com')).closest('tr')
    expect(selfRow).not.toBeNull()

    const rowScope = within(selfRow as HTMLElement)
    const lockBtn = rowScope.getByRole('button', { name: 'Khóa' })
    const deleteBtn = rowScope.getByRole('button', { name: 'Xóa' })
    expect(lockBtn).toBeDisabled()
    expect(deleteBtn).toBeDisabled()
    expect(lockBtn).toHaveAttribute(
      'aria-describedby',
      'self-restriction-admin-self'
    )
    expect(
      rowScope.getByText(/Không thể tự khóa hoặc xóa/i)
    ).toBeInTheDocument()
  })

  it('toggles user status via mutation and invalidates adminList cache', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(userManagementService.updateUser).mockResolvedValueOnce({
      ...mockUsers[1],
      status: 'locked',
    })

    render(<AdminUsersPage />, { queryClient })

    const targetRow = (
      await screen.findByText('candidate@example.com')
    ).closest('tr')
    expect(targetRow).not.toBeNull()

    await user.click(
      within(targetRow as HTMLElement).getByRole('button', { name: 'Khóa' })
    )

    await waitFor(() => {
      expect(userManagementService.updateUser).toHaveBeenCalledWith('user-1', {
        status: 'locked',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.users.adminList(),
      })
    })
  })

  it('locks delete modal while deleteUser is pending and closes after success', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    let resolveDelete: (() => void) | undefined
    vi.mocked(userManagementService.deleteUser).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve
        })
    )

    render(<AdminUsersPage />, { queryClient })

    const targetRow = (
      await screen.findByText('candidate@example.com')
    ).closest('tr')
    expect(targetRow).not.toBeNull()

    await user.click(
      within(targetRow as HTMLElement).getByRole('button', { name: 'Xóa' })
    )

    expect(
      await screen.findByText('Xác nhận xóa tài khoản')
    ).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'Xóa tài khoản' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(confirmBtn).toHaveAttribute('data-loading', 'true')
      expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    })

    // Escape must NOT close modal while pending
    await user.keyboard('{Escape}')
    expect(screen.getByText('Xác nhận xóa tài khoản')).toBeInTheDocument()

    resolveDelete?.()

    await waitFor(() => {
      expect(userManagementService.deleteUser).toHaveBeenCalledWith('user-1')
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.users.adminList(),
      })
      expect(
        screen.queryByText('Xác nhận xóa tài khoản')
      ).not.toBeInTheDocument()
    })
  })

  it('filters users by search, status SegmentedControl, and role Select with reset button', async () => {
    const user = userEvent.setup()
    render(<AdminUsersPage />)

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()

    // 1. Click status SegmentedControl -> Đã khóa
    const statusGroup = screen.getByRole('radiogroup', {
      name: /Lọc theo trạng thái tài khoản/i,
    })
    await user.click(within(statusGroup).getByText('Đã khóa'))

    await waitFor(() => {
      expect(screen.getByText('locked@example.com')).toBeInTheDocument()
      expect(
        screen.queryByText('candidate@example.com')
      ).not.toBeInTheDocument()
      expect(screen.getByText('Hiển thị 1 / 3 tài khoản')).toBeInTheDocument()
    })

    // Switch back to Tất cả
    await user.click(within(statusGroup).getByText('Tất cả'))
    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()

    // 2. Select role -> Quản trị viên
    const roleSelect = screen.getByRole('combobox', {
      name: /Lọc theo vai trò/i,
    })
    await user.click(roleSelect)
    await user.click(screen.getByRole('option', { name: 'Quản trị viên' }))

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(
        screen.queryByText('candidate@example.com')
      ).not.toBeInTheDocument()
      expect(screen.queryByText('locked@example.com')).not.toBeInTheDocument()
    })

    // 3. Search non-matching query -> empty state with Xóa bộ lọc resets all filters
    const searchInput = screen.getByPlaceholderText(
      /Tìm theo email hoặc họ tên/i
    )
    await user.type(searchInput, 'khongtontai')

    expect(
      await screen.findByRole('button', { name: 'Xóa bộ lọc' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))

    await waitFor(() => {
      expect(screen.getByText('candidate@example.com')).toBeInTheDocument()
      expect(screen.getByText('locked@example.com')).toBeInTheDocument()
    })
  })

  it('shows Alert + Retry without fake empty state on listUsers error and recovers', async () => {
    const user = userEvent.setup()
    vi.mocked(userManagementService.listUsers)
      .mockRejectedValueOnce(new Error('Users service offline'))
      .mockResolvedValueOnce(mockUsers)

    render(<AdminUsersPage />)

    expect(
      await screen.findByText(/Không thể tải danh sách người dùng/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Users service offline')).toBeInTheDocument()
    expect(
      screen.queryByText(/Không tìm thấy người dùng/i)
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Thử lại/i }))

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()
  })

  it('displays error Alert on updateUser failure and keeps delete modal open on deleteUser failure', async () => {
    const user = userEvent.setup()
    vi.mocked(userManagementService.updateUser).mockRejectedValueOnce(
      new Error('Update denied')
    )
    vi.mocked(userManagementService.deleteUser).mockRejectedValueOnce(
      new Error('Delete denied')
    )

    render(<AdminUsersPage />)

    const targetRow = (
      await screen.findByText('candidate@example.com')
    ).closest('tr')
    expect(targetRow).not.toBeNull()

    await user.click(
      within(targetRow as HTMLElement).getByRole('button', { name: 'Khóa' })
    )
    expect(await screen.findByText('Thao tác thất bại')).toBeInTheDocument()
    expect(
      (await screen.findAllByText('Update denied')).length
    ).toBeGreaterThanOrEqual(1)

    await user.click(
      within(targetRow as HTMLElement).getByRole('button', { name: 'Xóa' })
    )
    expect(
      await screen.findByText('Xác nhận xóa tài khoản')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa tài khoản' }))

    await waitFor(() => {
      expect(screen.getByText('Xác nhận xóa tài khoản')).toBeInTheDocument()
      expect(
        screen.getAllByText('Delete denied').length
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it('does not fetch users or render page when role is not admin', () => {
    mockAuthState.role = 'candidate'
    render(<AdminUsersPage />)

    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument()
    expect(userManagementService.listUsers).not.toHaveBeenCalled()
  })
})

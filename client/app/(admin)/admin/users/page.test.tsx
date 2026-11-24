import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  fireEvent,
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

  it('disables lock and delete actions for the currently logged-in admin account', async () => {
    render(<AdminUsersPage />)

    const selfRow = (await screen.findByText('admin@example.com')).closest('tr')
    expect(selfRow).not.toBeNull()

    const rowScope = within(selfRow as HTMLElement)
    expect(rowScope.getByRole('button', { name: 'Khóa' })).toBeDisabled()
    expect(rowScope.getByRole('button', { name: 'Xóa' })).toBeDisabled()
  })

  it('toggles user status via mutation and invalidates adminList cache', async () => {
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

    fireEvent.click(
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

  it('deletes user after controlled modal confirmation and invalidates adminList cache', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(userManagementService.deleteUser).mockResolvedValueOnce(undefined)

    render(<AdminUsersPage />, { queryClient })

    const targetRow = (
      await screen.findByText('candidate@example.com')
    ).closest('tr')
    expect(targetRow).not.toBeNull()

    fireEvent.click(
      within(targetRow as HTMLElement).getByRole('button', { name: 'Xóa' })
    )

    expect(
      await screen.findByText('Xác nhận xóa tài khoản')
    ).toBeInTheDocument()

    const confirmBtn = await screen.findByRole('button', {
      name: 'Xóa tài khoản',
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(userManagementService.deleteUser).toHaveBeenCalledWith('user-1')
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.users.adminList(),
      })
    })
  })

  it('filters users by search term and status segment', async () => {
    const user = userEvent.setup()
    render(<AdminUsersPage />)

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(
      /Tìm theo email hoặc họ tên/i
    )
    await user.type(searchInput, 'Phạm Lan')

    await waitFor(() => {
      expect(screen.getByText('locked@example.com')).toBeInTheDocument()
      expect(
        screen.queryByText('candidate@example.com')
      ).not.toBeInTheDocument()
    })
  })

  it('does not fetch users or render page when role is not admin', () => {
    mockAuthState.role = 'candidate'
    render(<AdminUsersPage />)

    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument()
    expect(userManagementService.listUsers).not.toHaveBeenCalled()
  })
})

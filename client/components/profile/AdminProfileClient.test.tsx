import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { queryKeys } from '@/queries/keys'
import { userService } from '@/services/user.service'
import type { UserAccountResponse } from '@/types'
import AdminProfileClient from './AdminProfileClient'

vi.mock('@/services/user.service', () => ({
  userService: {
    getCurrentUser: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}))

const mockAdminAccount: UserAccountResponse = {
  id: 'a-1',
  email: 'admin@example.com',
  firstname: 'Quản trị',
  lastname: 'Hệ thống',
  role: 'admin',
  status: 'active',
  createdAt: '2026-01-15T07:00:00.000Z',
}

describe('AdminProfileClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads admin account, renders full-access badge, and syncs cache on update', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const updatedAccount: UserAccountResponse = {
      ...mockAdminAccount,
      firstname: 'Mới',
    }

    vi.mocked(userService.getCurrentUser).mockResolvedValueOnce(
      mockAdminAccount
    )
    vi.mocked(userService.updateCurrentUser).mockResolvedValueOnce(
      updatedAccount
    )

    const { container } = render(<AdminProfileClient />, { queryClient })

    expect(
      await screen.findByRole('heading', { name: 'Hồ sơ Quản trị viên' })
    ).toBeInTheDocument()
    expect(screen.getByText('Toàn quyền hệ thống')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    const firstnameInput = screen.getByLabelText(/Tên/i)
    await user.clear(firstnameInput)
    await user.type(firstnameInput, 'Mới')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(userService.updateCurrentUser).toHaveBeenCalledWith({
        lastname: 'Hệ thống',
        firstname: 'Mới',
      })
    })

    expect(queryClient.getQueryData(queryKeys.users.me())).toEqual(
      updatedAccount
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auth.me(),
    })
  })

  it('displays error alert when fetching admin profile fails', async () => {
    vi.mocked(userService.getCurrentUser).mockRejectedValueOnce(
      new Error('Không thể kết nối')
    )

    render(<AdminProfileClient />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối'
    )
  })
})

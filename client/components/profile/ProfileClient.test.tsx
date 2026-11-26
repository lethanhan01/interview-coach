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
import ProfileClient from './ProfileClient'

vi.mock('@/services/user.service', () => ({
  userService: {
    getCurrentUser: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}))

const mockCandidateAccount: UserAccountResponse = {
  id: 'u-1',
  email: 'candidate@example.com',
  firstname: 'An',
  lastname: 'Nguyễn',
  role: 'candidate',
  status: 'active',
  createdAt: '2026-04-01T10:00:00.000Z',
}

describe('ProfileClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads user account, updates name, syncs users.me cache, and invalidates auth.me & candidateProfile.detail', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const updatedAccount: UserAccountResponse = {
      ...mockCandidateAccount,
      lastname: 'Lê Thành',
      firstname: 'An',
    }

    vi.mocked(userService.getCurrentUser).mockResolvedValueOnce(
      mockCandidateAccount
    )
    vi.mocked(userService.updateCurrentUser).mockResolvedValueOnce(
      updatedAccount
    )

    const { container } = render(<ProfileClient />, { queryClient })

    expect(
      await screen.findByRole('heading', { name: 'Cài đặt tài khoản' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Xem hồ sơ CV/i })).toHaveAttribute(
      'href',
      '/resume'
    )
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    const lastnameInput = screen.getByLabelText(/Họ/i)
    await user.clear(lastnameInput)
    await user.type(lastnameInput, 'Lê Thành')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(userService.updateCurrentUser).toHaveBeenCalledWith({
        lastname: 'Lê Thành',
        firstname: 'An',
      })
    })

    expect(queryClient.getQueryData(queryKeys.users.me())).toEqual(
      updatedAccount
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.auth.me(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.candidateProfile.detail(),
    })
  })

  it('shows error state and retries when loading fails', async () => {
    const user = userEvent.setup()
    vi.mocked(userService.getCurrentUser)
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce(mockCandidateAccount)

    render(<ProfileClient />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(
      await screen.findByRole('heading', { name: 'Nguyễn An' })
    ).toBeInTheDocument()
  })
})

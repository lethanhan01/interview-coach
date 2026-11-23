import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button, Stack, Text } from '@mantine/core'
import {
  act,
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { queryKeys } from '@/lib/query-client'
import { authService } from '@/services/auth.service'
import type { AuthUser, UserRole } from '@/types'

vi.mock('@/services/auth.service', () => ({
  authService: {
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}))

const mockCandidateUser: AuthUser = {
  id: 'user-1',
  email: 'candidate@interviewcoach.vn',
  role: 'candidate',
  status: 'active',
  firstname: 'An',
  lastname: 'Nguyen',
  emailVerified: true,
}

const mockAdminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@interviewcoach.vn',
  role: 'admin',
  status: 'active',
  firstname: 'Admin',
  lastname: 'User',
  emailVerified: true,
}

function AuthProbe({
  onRefreshResult,
}: {
  onRefreshResult?: (role: UserRole | null) => void
}) {
  const { user, role, status, isLoading, refresh, logout } = useAuth()

  return (
    <Stack gap="xs">
      <Text>loading:{String(isLoading)}</Text>
      <Text>email:{user?.email ?? 'guest'}</Text>
      <Text>role:{role ?? 'none'}</Text>
      <Text>status:{status ?? 'none'}</Text>
      <Button
        type="button"
        color="brand"
        onClick={() => {
          void refresh().then((r) => onRefreshResult?.(r))
        }}
      >
        Refresh
      </Button>
      <Button
        type="button"
        color="danger"
        onClick={() => {
          void logout()
        }}
      >
        Logout
      </Button>
    </Stack>
  )
}

describe('AuthProvider (TanStack Query v5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.logout).mockResolvedValue(undefined)
  })

  it('loads current user from authQueries.me() and transitions isLoading false', async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce(mockCandidateUser)

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    )

    expect(screen.getByText('loading:true')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
    })

    expect(
      screen.getByText('email:candidate@interviewcoach.vn')
    ).toBeInTheDocument()
    expect(screen.getByText('role:candidate')).toBeInTheDocument()
    expect(screen.getByText('status:active')).toBeInTheDocument()
    expect(authService.getMe).toHaveBeenCalledTimes(1)
  })

  it('handles unauthenticated error cleanly without retrying', async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(
      new Error('Unauthorized')
    )

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
    })

    expect(screen.getByText('email:guest')).toBeInTheDocument()
    expect(screen.getByText('role:none')).toBeInTheDocument()
    expect(authService.getMe).toHaveBeenCalledTimes(1)
  })

  it('refresh() bypasses staleTime, updates auth state, and returns fetched UserRole', async () => {
    const user = userEvent.setup()
    const onRefreshResult = vi.fn()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 0 },
    })

    vi.mocked(authService.getMe)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockAdminUser)

    render(
      <AuthProvider>
        <AuthProbe onRefreshResult={onRefreshResult} />
      </AuthProvider>,
      { queryClient }
    )

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument()
    })
    expect(screen.getByText('email:guest')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => {
      expect(
        screen.getByText('email:admin@interviewcoach.vn')
      ).toBeInTheDocument()
    })
    expect(screen.getByText('role:admin')).toBeInTheDocument()
    expect(onRefreshResult).toHaveBeenCalledWith('admin')
    expect(authService.getMe).toHaveBeenCalledTimes(2)
  })

  it('logout() calls authService.logout(), clears query cache, and resets auth.me to null even on error', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['sessions', 'list'], [{ id: 'sess-1' }])
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')

    vi.mocked(authService.getMe).mockResolvedValueOnce(mockCandidateUser)
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('Network'))

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
      { queryClient }
    )

    await waitFor(() => {
      expect(
        screen.getByText('email:candidate@interviewcoach.vn')
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByText('email:guest')).toBeInTheDocument()
    })

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(['sessions', 'list'])).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.auth.me())).toBeNull()
  })

  it('clears cache, sets auth.me to null without refetching, and calls logout on auth:session-expired', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    queryClient.setQueryData(['sessions', 'list'], [{ id: 'sess-1' }])
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')

    vi.mocked(authService.getMe).mockResolvedValueOnce(mockCandidateUser)

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
      { queryClient }
    )

    await waitFor(() => {
      expect(
        screen.getByText('email:candidate@interviewcoach.vn')
      ).toBeInTheDocument()
    })

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
    })

    await waitFor(() => {
      expect(screen.getByText('email:guest')).toBeInTheDocument()
    })

    expect(removeSpy).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(['sessions', 'list'])).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.auth.me())).toBeNull()
    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(authService.getMe).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminUsersPage from './page'
import { queryKeys } from '@/queries/keys'
import { userManagementService } from '@/services/admin.service'
import type { AdminUser } from '@/types'

const mockAuthState = {
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
    id: 'user-1',
    email: 'candidate@example.com',
    role: 'candidate',
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'locked@example.com',
    role: 'candidate',
    status: 'locked',
    createdAt: '2026-09-02T10:00:00Z',
  },
]

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30_000,
        gcTime: 60_000,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.role = 'admin'
    mockAuthState.isLoading = false
    vi.mocked(userManagementService.listUsers).mockResolvedValue(mockUsers)
  })

  it('reuses cached adminList from QueryClient without refetching', async () => {
    const queryClient = createTestClient()
    queryClient.setQueryData(queryKeys.users.adminList(), mockUsers)

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>
    )

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()
    expect(screen.getByText('locked@example.com')).toBeInTheDocument()
    expect(userManagementService.listUsers).not.toHaveBeenCalled()
  })

  it('toggles user status via mutation and invalidates adminList cache', async () => {
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(userManagementService.updateUser).mockResolvedValueOnce({
      ...mockUsers[0],
      status: 'locked',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>
    )

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }))

    await waitFor(() => {
      expect(userManagementService.updateUser).toHaveBeenCalledWith('user-1', {
        status: 'locked',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.users.adminList(),
      })
    })
  })

  it('deletes user after confirmation and invalidates adminList cache', async () => {
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(userManagementService.deleteUser).mockResolvedValueOnce(undefined)

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>
    )

    expect(await screen.findByText('candidate@example.com')).toBeInTheDocument()

    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa' })
    fireEvent.click(deleteButtons[0])

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

  it('does not fetch users or render page when role is not admin', () => {
    mockAuthState.role = 'candidate'
    render(<AdminUsersPage />)

    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument()
    expect(userManagementService.listUsers).not.toHaveBeenCalled()
  })
})

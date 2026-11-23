import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SetupPage from './page'
import { queryKeys } from '@/lib/query-client'
import { prepService } from '@/services/prep.service'
import { sessionService } from '@/services/session.service'
import type { SavedJobDescription } from '@/types'

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/services/prep.service', () => ({
  prepService: {
    getSavedJobDescriptions: vi.fn(),
    saveJobDescription: vi.fn(),
  },
}))

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
  },
}))

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
  },
}))

const mockSavedJd: SavedJobDescription = {
  id: 'jd-1',
  userId: 'user-1',
  companyName: 'VNG Corporation',
  jobTitle: 'Backend Engineer',
  level: 'middle',
  requirements: '2+ năm kinh nghiệm Node.js, TypeScript, PostgreSQL và Redis.',
  jobContent: 'Thiết kế và vận hành các API lõi cho nền tảng thanh toán.',
  techStack: ['Node.js', 'TypeScript'],
  onetSocCode: '15-1252.00',
  onetOccupationTitle: 'Software Developers',
  targetSfiaLevel: 3,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
}

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

describe('SetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSearchParams = new URLSearchParams()
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue([
      mockSavedJd,
    ])
    vi.mocked(sessionService.getSessions).mockResolvedValue([])
  })

  it('reuses cached saved JDs from QueryClient without refetching', async () => {
    const queryClient = createTestClient()
    queryClient.setQueryData(queryKeys.prep.savedJds(), [mockSavedJd])

    render(
      <QueryClientProvider client={queryClient}>
        <SetupPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('VNG Corporation')).toBeInTheDocument()
    })

    expect(prepService.getSavedJobDescriptions).not.toHaveBeenCalled()
  })

  it('invalidates savedJds and sessions queries and blocks double-submit after success', async () => {
    mockSearchParams = new URLSearchParams('jdId=jd-1')
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(prepService.saveJobDescription).mockResolvedValue(mockSavedJd)
    vi.mocked(sessionService.createSession).mockResolvedValue({
      id: 'sess-123',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SetupPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Thông tin Job Description')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    const submitBtn = screen.getByRole('button', { name: 'Bắt đầu phỏng vấn' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sessions/sess-123')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.prep.savedJds(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.all,
    })

    // Button stays locked after success while route transition is in flight
    fireEvent.click(submitBtn)
    expect(prepService.saveJobDescription).toHaveBeenCalledTimes(1)
    expect(sessionService.createSession).toHaveBeenCalledTimes(1)
  })

  it('still invalidates savedJds and allows retry if createSession fails after JD is saved', async () => {
    mockSearchParams = new URLSearchParams('jdId=jd-1')
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(prepService.saveJobDescription).mockResolvedValue(mockSavedJd)
    vi.mocked(sessionService.createSession).mockRejectedValueOnce(
      new Error('Không thể khởi tạo phiên AI')
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Thông tin Job Description')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    const submitBtn = screen.getByRole('button', { name: 'Bắt đầu phỏng vấn' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText('Không thể khởi tạo phiên AI')
      ).toBeInTheDocument()
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.prep.savedJds(),
    })
    expect(mockPush).not.toHaveBeenCalled()
    expect(submitBtn).not.toBeDisabled()
  })
})

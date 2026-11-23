import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import InterviewPage from './page'
import { queryKeys } from '@/lib/query-client'
import { sessionService } from '@/services/session.service'
import type { Session } from '@/types'

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockEventSourceClose = vi.fn()
const mockRouter = {
  replace: mockReplace,
  push: mockPush,
}
const mockParams = { sessionId: 'sess-1' }

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => mockRouter,
}))

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSession: vi.fn(),
    getQuestions: vi.fn(),
    updateStatus: vi.fn(),
    submitTurn: vi.fn(),
    createEventSource: vi.fn(() => ({
      addEventListener: vi.fn(),
      close: mockEventSourceClose,
      onerror: null,
    })),
  },
}))

vi.mock('@/services/media.service', () => ({
  mediaService: {
    synthesizeSpeech: vi.fn(),
    transcribeAudio: vi.fn(),
  },
}))

const mockActiveSession: Session = {
  id: 'sess-1',
  userId: 'user-1',
  jobTitle: 'Backend Engineer',
  sessionType: 'technical',
  contextPackId: 'VN',
  language: 'vi',
  status: 'active',
  numQuestions: 1,
  durationMin: 30,
  remainingSeconds: 1200,
  jobDescription: 'Backend JD',
  createdAt: '2026-09-06T10:00:00Z',
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

describe('InterviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sessionService.getSession).mockResolvedValue(mockActiveSession)
    vi.mocked(sessionService.getQuestions).mockResolvedValue({
      questions: [
        {
          id: 'q-1',
          content: 'Hãy mô tả cách tối ưu truy vấn PostgreSQL.',
          orderIndex: 0,
        },
      ],
      currentIndex: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('always fetches fresh session detail on mount even when QueryClient has stale cached data', async () => {
    const queryClient = createTestClient()
    queryClient.setQueryData(queryKeys.sessions.detail('sess-1'), {
      ...mockActiveSession,
      status: 'paused',
      remainingSeconds: 300,
    })

    render(
      <QueryClientProvider client={queryClient}>
        <InterviewPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Hãy mô tả cách tối ưu truy vấn PostgreSQL.')
      ).toBeInTheDocument()
    })

    expect(sessionService.getSession).toHaveBeenCalledWith(
      'sess-1',
      expect.any(AbortSignal)
    )
    expect(sessionService.getQuestions).toHaveBeenCalledWith(
      'sess-1',
      expect.any(AbortSignal)
    )
  })

  it('pauses session via updateStatus mutation and syncs detail & list cache', async () => {
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const pausedSession: Session = {
      ...mockActiveSession,
      status: 'paused',
      remainingSeconds: 1190,
    }
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce(pausedSession)

    render(
      <QueryClientProvider client={queryClient}>
        <InterviewPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Hãy mô tả cách tối ưu truy vấn PostgreSQL.')
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }))

    await waitFor(() => {
      expect(
        screen.getByText('Phiên phỏng vấn đang tạm dừng')
      ).toBeInTheDocument()
    })

    expect(sessionService.updateStatus).toHaveBeenCalledWith('sess-1', {
      status: 'paused',
      remainingSeconds: expect.any(Number),
    })
    expect(
      queryClient.getQueryData(queryKeys.sessions.detail('sess-1'))
    ).toEqual(pausedSession)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.list(),
    })
  })

  it('submits skipped turn via mutation, completes last question, and navigates to report', async () => {
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(sessionService.submitTurn).mockResolvedValueOnce({
      turnId: 'turn-1',
      status: 'saved',
    })
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce({
      ...mockActiveSession,
      status: 'completing',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <InterviewPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Hãy mô tả cách tối ưu truy vấn PostgreSQL.')
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/sessions/sess-1/report')
    })

    expect(sessionService.submitTurn).toHaveBeenCalledWith('sess-1', {
      answerMode: 'text',
      answerText: '',
      skipQuestion: true,
      questionId: 'q-1',
    })
    expect(sessionService.updateStatus).toHaveBeenCalledWith('sess-1', {
      status: 'completed',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.detail('sess-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.list(),
    })
  })

  it('cancels question polling timer cleanly when component unmounts', async () => {
    vi.useFakeTimers()
    vi.mocked(sessionService.getQuestions).mockResolvedValue({
      questions: [],
      currentIndex: 0,
    })

    const queryClient = createTestClient()
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <InterviewPage />
      </QueryClientProvider>
    )

    await vi.waitFor(() => {
      expect(sessionService.getQuestions).toHaveBeenCalledTimes(1)
    })

    unmount()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(sessionService.getQuestions).toHaveBeenCalledTimes(1)
    expect(mockEventSourceClose).toHaveBeenCalledTimes(1)
  })
})

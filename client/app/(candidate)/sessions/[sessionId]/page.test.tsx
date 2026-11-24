import { axe } from 'jest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  createTestQueryClient,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { queryKeys } from '@/queries/keys'
import { sessionService } from '@/services/session.service'
import type { Session } from '@/types'
import InterviewPage from './page'

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

let mockSseListeners: Record<string, ((e: MessageEvent) => void)[]> = {}

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSession: vi.fn(),
    getQuestions: vi.fn(),
    updateStatus: vi.fn(),
    submitTurn: vi.fn(),
    createEventSource: vi.fn(() => ({
      addEventListener: vi.fn(
        (event: string, cb: (e: MessageEvent) => void) => {
          if (!mockSseListeners[event]) mockSseListeners[event] = []
          mockSseListeners[event].push(cb)
        }
      ),
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

function createPersistentTestClient() {
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
    mockSseListeners = {}
    window.sessionStorage.clear()

    // Mock mediaDevices so VoiceRecorder considers microphone supported
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    })

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
    const queryClient = createPersistentTestClient()
    queryClient.setQueryData(queryKeys.sessions.detail('sess-1'), {
      ...mockActiveSession,
      status: 'paused',
      remainingSeconds: 300,
    })

    render(<InterviewPage />, { queryClient })

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
    const queryClient = createPersistentTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const pausedSession: Session = {
      ...mockActiveSession,
      status: 'paused',
      remainingSeconds: 1190,
    }
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce(pausedSession)

    render(<InterviewPage />, { queryClient })

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
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(sessionService.submitTurn).mockResolvedValueOnce({
      turnId: 'turn-1',
      status: 'saved',
    })
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce({
      ...mockActiveSession,
      status: 'completing',
    })

    render(<InterviewPage />, { queryClient })

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

    const queryClient = createTestQueryClient()
    const { unmount } = render(<InterviewPage />, { queryClient })

    await vi.waitFor(() => {
      expect(sessionService.getQuestions).toHaveBeenCalledTimes(1)
    })

    unmount()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(sessionService.getQuestions).toHaveBeenCalledTimes(1)
    expect(mockEventSourceClose).toHaveBeenCalledTimes(1)
  })

  it('opens confirm modal on cancel button click and cancels session', async () => {
    const queryClient = createTestQueryClient()
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce({
      ...mockActiveSession,
      status: 'canceled',
    })

    render(<InterviewPage />, { queryClient })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }))

    expect(screen.getByText('Hủy phiên phỏng vấn?')).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'Hủy phiên' })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(sessionService.updateStatus).toHaveBeenCalledWith('sess-1', {
        status: 'canceled',
      })
    })
  })

  it('opens confirm modal on early finish button click and completes session', async () => {
    const queryClient = createTestQueryClient()
    vi.mocked(sessionService.updateStatus).mockResolvedValueOnce({
      ...mockActiveSession,
      status: 'completing',
    })

    render(<InterviewPage />, { queryClient })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Kết thúc sớm' })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Kết thúc sớm' }))

    expect(
      screen.getByText('Kết thúc sớm phiên phỏng vấn?')
    ).toBeInTheDocument()

    const finishBtn = screen.getByRole('button', {
      name: 'Kết thúc & Chấm điểm',
    })
    await userEvent.click(finishBtn)

    await waitFor(() => {
      expect(sessionService.updateStatus).toHaveBeenCalledWith('sess-1', {
        status: 'completed',
        autoSkipUnanswered: true,
        remainingSeconds: expect.any(Number),
      })
      expect(mockReplace).toHaveBeenCalledWith('/sessions/sess-1/report')
    })
  })

  it('preserves text draft per question and restores from storage', async () => {
    const queryClient = createTestQueryClient()
    render(<InterviewPage />, { queryClient })

    const textarea = await screen.findByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })

    await userEvent.type(
      textarea,
      'Bản nháp câu trả lời số 1 với hơn 10 ký tự.'
    )
    expect(textarea).toHaveValue('Bản nháp câu trả lời số 1 với hơn 10 ký tự.')

    // Switch to voice tab
    const voiceTab = screen.getByRole('tab', { name: 'Giọng nói' })
    await userEvent.click(voiceTab)

    await waitFor(() => {
      expect(screen.getByLabelText(/Transcript câu trả lời/i)).toHaveValue(
        'Bản nháp câu trả lời số 1 với hơn 10 ký tự.'
      )
    })
  })

  it('displays fatal terminal error when session.error is received', async () => {
    const queryClient = createTestQueryClient()
    render(<InterviewPage />, { queryClient })

    await waitFor(() => {
      expect(
        screen.getByText('Hãy mô tả cách tối ưu truy vấn PostgreSQL.')
      ).toBeInTheDocument()
    })

    // Simulate SSE session.error event
    const errorListeners = mockSseListeners['session.error']
    expect(errorListeners?.length).toBeGreaterThan(0)

    const eventPayload = {
      data: JSON.stringify({
        error: { code: 'FATAL_AI', message: 'Lỗi máy chủ mô hình AI.' },
      }),
    } as MessageEvent

    errorListeners?.[0]?.(eventPayload)

    await waitFor(() => {
      expect(screen.getByText('Lỗi máy chủ mô hình AI.')).toBeInTheDocument()
      expect(mockEventSourceClose).toHaveBeenCalled()
    })
  })

  it('has no accessibility violations in active interview room', async () => {
    const queryClient = createTestQueryClient()
    const { container } = render(<InterviewPage />, { queryClient })

    await waitFor(() => {
      expect(
        screen.getByText('Hãy mô tả cách tối ưu truy vấn PostgreSQL.')
      ).toBeInTheDocument()
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})

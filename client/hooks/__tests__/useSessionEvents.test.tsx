import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, createTestQueryClient, renderHook } from '@test-utils'
import { useSessionEvents } from '@/hooks/useSessionEvents'
import { queryKeys } from '@/queries/keys'
import { sessionService } from '@/services/session.service'
import type { FeedbackProgress } from '@/types'

vi.mock('@/services/session.service', () => ({
  sessionService: {
    createEventSource: vi.fn(),
  },
}))

type MockListener = (event: MessageEvent) => void

class MockEventSource {
  public onopen: (() => void) | null = null
  public onerror: (() => void) | null = null
  public close = vi.fn()
  private listeners = new Map<string, Set<MockListener>>()

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)?.add(listener as MockListener)
  }

  emit(type: string, payload: unknown) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const event = { data } as MessageEvent
    this.listeners.get(type)?.forEach((listener) => listener(event))
  }

  triggerOpen() {
    this.onopen?.()
  }

  triggerError() {
    this.onerror?.()
  }
}

const validProgress: FeedbackProgress = {
  sessionId: 'sess-1',
  status: 'completing',
  totalQuestions: 5,
  answeredQuestions: 5,
  skippedQuestions: 0,
  feedbackRequired: 5,
  feedbackCompleted: 3,
  feedbackPending: 2,
  reportReady: false,
}

describe('useSessionEvents (Zod v4 SSE validation)', () => {
  let mockEs: MockEventSource

  beforeEach(() => {
    vi.clearAllMocks()
    mockEs = new MockEventSource()
    vi.mocked(sessionService.createEventSource).mockReturnValue(
      mockEs as unknown as EventSource
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('validates session.status, strips unknown backend fields, and invalidates session queries', () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const onStatus = vi.fn()
    const onConnectionChange = vi.fn()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useSessionEvents({
          sessionId: 'sess-1',
          onStatus,
          onConnectionChange,
        }),
      { wrapper }
    )

    act(() => {
      mockEs.triggerOpen()
    })
    expect(result.current.isConnected).toBe(true)
    expect(onConnectionChange).toHaveBeenCalledWith(true)

    act(() => {
      mockEs.emit('session.status', {
        status: 'active',
        sessionId: 'sess-1',
        extraBackendField: 'ignored-safely',
      })
    })

    expect(onStatus).toHaveBeenCalledWith('active')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.status('sess-1'),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.detail('sess-1'),
    })
  })

  it('validates session.feedback_progress and writes stripped typed data to QueryClient cache', () => {
    const queryClient = createTestQueryClient()
    const onProgress = vi.fn()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    renderHook(
      () =>
        useSessionEvents({
          sessionId: 'sess-1',
          onProgress,
        }),
      { wrapper }
    )

    act(() => {
      mockEs.emit('session.feedback_progress', {
        ...validProgress,
        futureField: 123,
      })
    })

    expect(onProgress).toHaveBeenCalledWith(validProgress)
    expect(
      queryClient.getQueryData(queryKeys.sessions.feedbackProgress('sess-1'))
    ).toEqual(validProgress)
  })

  it('warns and safely ignores malformed JSON or invalid Zod payloads without closing the stream', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onStatus = vi.fn()
    const onProgress = vi.fn()
    const onError = vi.fn()
    const queryClient = createTestQueryClient()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useSessionEvents({
          sessionId: 'sess-1',
          onStatus,
          onProgress,
          onError,
        }),
      { wrapper }
    )

    act(() => {
      mockEs.triggerOpen()
      mockEs.emit('session.status', { status: 'unknown_status' })
      mockEs.emit('session.feedback_progress', { sessionId: 'sess-1' })
      mockEs.emit('session.error', '{broken-json')
    })

    expect(onStatus).not.toHaveBeenCalled()
    expect(onProgress).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledTimes(3)
    expect(mockEs.close).not.toHaveBeenCalled()
    expect(result.current.isConnected).toBe(true)
  })

  it('handles report.ready and session.error terminal events cleanly', () => {
    const queryClient = createTestQueryClient()
    const onReportReady = vi.fn()
    const onCompleted = vi.fn()
    const onError = vi.fn()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useSessionEvents({
          sessionId: 'sess-1',
          onReportReady,
          onCompleted,
          onError,
        }),
      { wrapper }
    )

    act(() => {
      mockEs.emit('report.ready', { sessionId: 'sess-1' })
    })

    expect(onReportReady).toHaveBeenCalledTimes(1)
    expect(onCompleted).toHaveBeenCalledTimes(1)
    expect(result.current.connectionState).toBe('disconnected')
    expect(mockEs.close).toHaveBeenCalledTimes(1)

    const secondEs = new MockEventSource()
    vi.mocked(sessionService.createEventSource).mockReturnValueOnce(
      secondEs as unknown as EventSource
    )

    act(() => {
      result.current.reconnect()
    })

    act(() => {
      secondEs.emit('session.error', {
        error: { code: 'AI_TIMEOUT', message: 'Timeout' },
        timestamp: '2026-11-23T00:00:00.000Z',
      })
    })

    expect(onError).toHaveBeenCalledWith(new Error('[AI_TIMEOUT] Timeout'))
    expect(secondEs.close).toHaveBeenCalledTimes(1)
  })

  it('reconnects with exponential backoff up to maxRetries and disconnects after exhaustion', () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const queryClient = createTestQueryClient()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useSessionEvents({
          sessionId: 'sess-1',
          maxRetries: 2,
          onError,
        }),
      { wrapper }
    )

    act(() => {
      mockEs.triggerError()
    })
    expect(result.current.connectionState).toBe('reconnecting')

    const retry1 = new MockEventSource()
    vi.mocked(sessionService.createEventSource).mockReturnValueOnce(
      retry1 as unknown as EventSource
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(sessionService.createEventSource).toHaveBeenCalledTimes(2)

    act(() => {
      retry1.triggerError()
    })
    expect(result.current.connectionState).toBe('reconnecting')

    const retry2 = new MockEventSource()
    vi.mocked(sessionService.createEventSource).mockReturnValueOnce(
      retry2 as unknown as EventSource
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(sessionService.createEventSource).toHaveBeenCalledTimes(3)

    act(() => {
      retry2.triggerError()
    })
    expect(result.current.connectionState).toBe('disconnected')
    expect(onError).toHaveBeenCalledWith(
      new Error('SSE connection failed after maximum retries')
    )
  })
})

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/keys'
import { sessionService } from '@/services/session.service'
import type { FeedbackProgress, SessionStatus } from '@/types'

const sessionStatusSchema = z.enum([
  'generating',
  'ready',
  'active',
  'paused',
  'completing',
  'completed',
  'canceled',
  'error',
])

const sessionStatusEventSchema = z.object({
  status: sessionStatusSchema,
  sessionId: z.string().optional(),
})

const feedbackProgressEventSchema = z.object({
  sessionId: z.string(),
  status: sessionStatusSchema,
  totalQuestions: z.number(),
  answeredQuestions: z.number(),
  skippedQuestions: z.number(),
  feedbackRequired: z.number(),
  feedbackCompleted: z.number(),
  feedbackPending: z.number(),
  reportReady: z.boolean(),
})

const sessionErrorEventSchema = z.object({
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().optional(),
})

export interface UseSessionEventsOptions {
  sessionId: string
  enabled?: boolean
  maxRetries?: number
  onStatus?: (status: SessionStatus) => void
  onProgress?: (progress: FeedbackProgress) => void
  onReportReady?: () => void
  onCompleted?: () => void
  onError?: (error: Error) => void
  onTerminalError?: (message: string, code?: string) => void
  onConnectionChange?: (connected: boolean) => void
}

export type ConnectionState =
  'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export function useSessionEvents({
  sessionId,
  enabled = true,
  maxRetries = 5,
  onStatus,
  onProgress,
  onReportReady,
  onCompleted,
  onError,
  onTerminalError,
  onConnectionChange,
}: UseSessionEventsOptions) {
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle')
  const retryCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isTerminatedRef = useRef(false)

  // Stable callback refs to prevent re-subscribing on each render
  const onStatusRef = useRef(onStatus)
  const onProgressRef = useRef(onProgress)
  const onReportReadyRef = useRef(onReportReady)
  const onCompletedRef = useRef(onCompleted)
  const onErrorRef = useRef(onError)
  const onTerminalErrorRef = useRef(onTerminalError)
  const onConnectionChangeRef = useRef(onConnectionChange)

  useEffect(() => {
    onStatusRef.current = onStatus
    onProgressRef.current = onProgress
    onReportReadyRef.current = onReportReady
    onCompletedRef.current = onCompleted
    onErrorRef.current = onError
    onTerminalErrorRef.current = onTerminalError
    onConnectionChangeRef.current = onConnectionChange
  })

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    if (!enabled || !sessionId || isTerminatedRef.current) return

    cleanup()
    setConnectionState(
      retryCountRef.current > 0 ? 'reconnecting' : 'connecting'
    )

    try {
      const es = sessionService.createEventSource(sessionId)
      eventSourceRef.current = es

      es.onopen = () => {
        retryCountRef.current = 0
        setConnectionState('connected')
        onConnectionChangeRef.current?.(true)
      }

      es.addEventListener('session.status', (event) => {
        try {
          const raw: unknown = JSON.parse((event as MessageEvent).data)
          const parsed = sessionStatusEventSchema.safeParse(raw)
          if (!parsed.success) {
            console.warn(
              'Invalid session.status SSE payload:',
              parsed.error.issues
            )
            return
          }
          void queryClient.invalidateQueries({
            queryKey: queryKeys.sessions.status(sessionId),
          })
          void queryClient.invalidateQueries({
            queryKey: queryKeys.sessions.detail(sessionId),
          })
          void queryClient.invalidateQueries({
            queryKey: queryKeys.sessions.list(),
          })
          onStatusRef.current?.(parsed.data.status)
        } catch (err) {
          console.warn('Failed to parse session.status SSE payload:', err)
        }
      })

      es.addEventListener('session.feedback_progress', (event) => {
        try {
          const raw: unknown = JSON.parse((event as MessageEvent).data)
          const parsed = feedbackProgressEventSchema.safeParse(raw)
          if (!parsed.success) {
            console.warn(
              'Invalid session.feedback_progress SSE payload:',
              parsed.error.issues
            )
            return
          }
          queryClient.setQueryData(
            queryKeys.sessions.feedbackProgress(sessionId),
            parsed.data
          )
          onProgressRef.current?.(parsed.data)
        } catch (err) {
          console.warn('Failed to parse feedback_progress SSE payload:', err)
        }
      })

      const handleFinished = () => {
        isTerminatedRef.current = true
        void queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.report(sessionId),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.detail(sessionId),
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.list(),
        })
        onReportReadyRef.current?.()
        onCompletedRef.current?.()
        cleanup()
        setConnectionState('disconnected')
        onConnectionChangeRef.current?.(false)
      }

      es.addEventListener('report.ready', handleFinished)
      es.addEventListener('session.completed', handleFinished)

      es.addEventListener('session.error', (event) => {
        try {
          const raw: unknown = JSON.parse((event as MessageEvent).data)
          const parsed = sessionErrorEventSchema.safeParse(raw)
          if (!parsed.success) {
            console.warn(
              'Invalid session.error SSE payload:',
              parsed.error.issues
            )
            return
          }
          const errMessage =
            parsed.data.error?.message || 'Lỗi xử lý phiên phỏng vấn'
          const errCode = parsed.data.error?.code
          isTerminatedRef.current = true
          cleanup()
          setConnectionState('disconnected')
          onTerminalErrorRef.current?.(errMessage, errCode)
          onErrorRef.current?.(
            new Error(`[${errCode || 'ERROR'}] ${errMessage}`)
          )
        } catch (err) {
          console.warn('Failed to parse session.error SSE payload:', err)
        }
      })

      es.onerror = () => {
        cleanup()
        onConnectionChangeRef.current?.(false)

        if (isTerminatedRef.current) {
          setConnectionState('disconnected')
          return
        }

        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            16000
          )
          retryCountRef.current += 1
          setConnectionState('reconnecting')
          reconnectTimerRef.current = setTimeout(() => {
            connectRef.current()
          }, delay)
        } else {
          setConnectionState('disconnected')
          onErrorRef.current?.(
            new Error('SSE connection failed after maximum retries')
          )
        }
      }
    } catch (err) {
      setConnectionState('disconnected')
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)))
    }
  }, [enabled, sessionId, maxRetries, cleanup, queryClient])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    isTerminatedRef.current = false
    retryCountRef.current = 0
    connect()

    return () => {
      cleanup()
    }
  }, [connect, cleanup])

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    reconnect: () => {
      isTerminatedRef.current = false
      retryCountRef.current = 0
      connect()
    },
  }
}

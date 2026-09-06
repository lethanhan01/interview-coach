'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { sessionService } from '@/services'
import type { FeedbackProgress, SessionStatus } from '@/lib/types'

export interface UseSessionEventsOptions {
  sessionId: string
  enabled?: boolean
  maxRetries?: number
  onStatus?: (status: SessionStatus) => void
  onProgress?: (progress: FeedbackProgress) => void
  onReportReady?: () => void
  onCompleted?: () => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export function useSessionEvents({
  sessionId,
  enabled = true,
  maxRetries = 5,
  onStatus,
  onProgress,
  onReportReady,
  onCompleted,
  onError,
  onConnectionChange,
}: UseSessionEventsOptions) {
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
  const onConnectionChangeRef = useRef(onConnectionChange)

  useEffect(() => {
    onStatusRef.current = onStatus
    onProgressRef.current = onProgress
    onReportReadyRef.current = onReportReady
    onCompletedRef.current = onCompleted
    onErrorRef.current = onError
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
          const data = JSON.parse((event as MessageEvent).data) as {
            status?: SessionStatus
          }
          if (data.status) {
            onStatusRef.current?.(data.status)
          }
        } catch (err) {
          console.warn('Failed to parse session.status SSE payload:', err)
        }
      })

      es.addEventListener('session.feedback_progress', (event) => {
        try {
          const data = JSON.parse(
            (event as MessageEvent).data
          ) as FeedbackProgress
          onProgressRef.current?.(data)
        } catch (err) {
          console.warn('Failed to parse feedback_progress SSE payload:', err)
        }
      })

      const handleFinished = () => {
        isTerminatedRef.current = true
        onReportReadyRef.current?.()
        onCompletedRef.current?.()
        cleanup()
        setConnectionState('disconnected')
        onConnectionChangeRef.current?.(false)
      }

      es.addEventListener('report.ready', handleFinished)
      es.addEventListener('session.completed', handleFinished)

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
      onErrorRef.current?.(
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }, [enabled, sessionId, maxRetries, cleanup])

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

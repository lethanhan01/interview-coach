'use client'

import { useEffect, useRef, useState } from 'react'
import { useInterval } from '@mantine/hooks'

interface CountdownResult {
  remainingSeconds: number
  isWarning: boolean
  isExpired: boolean
}

export function useCountdown(
  initialSeconds: number,
  active: boolean,
  onChange?: (remainingSeconds: number) => void,
  onExpire?: () => void
): CountdownResult {
  const [countdown, setCountdown] = useState({
    initialSeconds,
    remainingSeconds: initialSeconds,
  })
  const startTimeRef = useRef<number | null>(null)
  const startingRemainingRef = useRef<number>(initialSeconds)
  const remainingSeconds =
    countdown.initialSeconds === initialSeconds
      ? countdown.remainingSeconds
      : initialSeconds
  const remainingRef = useRef(remainingSeconds)
  const expireNotifiedRef = useRef(false)

  const { start, stop } = useInterval(() => {
    const startedAt = startTimeRef.current ?? Date.now()
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    const remaining = Math.max(0, startingRemainingRef.current - elapsed)
    setCountdown({ initialSeconds, remainingSeconds: remaining })
  }, 1000)

  useEffect(() => {
    remainingRef.current = remainingSeconds
    onChange?.(remainingSeconds)
  }, [remainingSeconds, onChange])

  useEffect(() => {
    if (remainingSeconds > 0) {
      expireNotifiedRef.current = false
      return
    }

    stop()

    if (active && !expireNotifiedRef.current) {
      expireNotifiedRef.current = true
      onExpire?.()
    }
  }, [active, remainingSeconds, onExpire, stop])

  useEffect(() => {
    if (!active || initialSeconds <= 0 || remainingRef.current <= 0) {
      stop()
      return
    }

    startingRemainingRef.current = remainingRef.current
    startTimeRef.current = Date.now()
    start()

    return () => {
      stop()
    }
  }, [initialSeconds, active, start, stop])

  return {
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds <= 300,
    isExpired: remainingSeconds === 0,
  }
}

import { useEffect, useRef, useState } from 'react'

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingSeconds =
    countdown.initialSeconds === initialSeconds
      ? countdown.remainingSeconds
      : initialSeconds
  const remainingRef = useRef(remainingSeconds)
  const expireNotifiedRef = useRef(false)

  useEffect(() => {
    remainingRef.current = remainingSeconds
    onChange?.(remainingSeconds)
  }, [remainingSeconds, onChange])

  useEffect(() => {
    if (remainingSeconds > 0) {
      expireNotifiedRef.current = false
      return
    }

    if (active && !expireNotifiedRef.current) {
      expireNotifiedRef.current = true
      onExpire?.()
    }
  }, [active, remainingSeconds, onExpire])

  useEffect(() => {
    if (!active || initialSeconds <= 0) return

    const startingRemaining = remainingRef.current
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - (startTimeRef.current ?? Date.now())) / 1000
      )
      const remaining = Math.max(0, startingRemaining - elapsed)
      setCountdown({ initialSeconds, remainingSeconds: remaining })
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [initialSeconds, active])

  return {
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds <= 300,
    isExpired: remainingSeconds === 0,
  }
}

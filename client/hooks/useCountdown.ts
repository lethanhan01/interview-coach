import { useEffect, useRef, useState } from 'react'

interface CountdownResult {
  remainingSeconds: number
  isWarning: boolean
  isExpired: boolean
}

export function useCountdown(totalSeconds: number, active: boolean): CountdownResult {
  const [countdown, setCountdown] = useState({
    totalSeconds,
    remainingSeconds: totalSeconds,
  })
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingSeconds =
    countdown.totalSeconds === totalSeconds
      ? countdown.remainingSeconds
      : totalSeconds
  const remainingRef = useRef(remainingSeconds)

  useEffect(() => {
    remainingRef.current = remainingSeconds
  }, [remainingSeconds])

  useEffect(() => {
    if (!active || totalSeconds <= 0) return

    const startingRemaining = remainingRef.current
    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000)
      const remaining = Math.max(0, startingRemaining - elapsed)
      setCountdown({ totalSeconds, remainingSeconds: remaining })
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [totalSeconds, active])

  return {
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds <= 300,
    isExpired: remainingSeconds === 0,
  }
}

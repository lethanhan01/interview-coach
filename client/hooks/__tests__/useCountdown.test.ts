import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@test-utils'
import { useCountdown } from '@/hooks/useCountdown'

describe('useCountdown (@mantine/hooks useInterval)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks down using Date.now() baseline when active and pauses/resumes without losing remaining seconds', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ initialSeconds, active }) =>
        useCountdown(initialSeconds, active, onChange),
      { initialProps: { initialSeconds: 10, active: true } }
    )

    expect(result.current.remainingSeconds).toBe(10)
    expect(result.current.isWarning).toBe(true)
    expect(result.current.isExpired).toBe(false)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.remainingSeconds).toBe(7)

    // Pause
    rerender({ initialSeconds: 10, active: false })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.remainingSeconds).toBe(7)

    // Resume from 7s
    rerender({ initialSeconds: 10, active: true })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remainingSeconds).toBe(5)
    expect(onChange).toHaveBeenLastCalledWith(5)
  })

  it('sets isWarning only when remainingSeconds is between 1 and 300', () => {
    const { result } = renderHook(() => useCountdown(302, true))

    expect(result.current.isWarning).toBe(false)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remainingSeconds).toBe(300)
    expect(result.current.isWarning).toBe(true)
  })

  it('fires onExpire exactly once upon reaching 0 and stops ticking', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() =>
      useCountdown(2, true, undefined, onExpire)
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isExpired).toBe(true)
    expect(result.current.isWarning).toBe(false)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('resets countdown cleanly when initialSeconds changes', () => {
    const { result, rerender } = renderHook(
      ({ initialSeconds, active }) => useCountdown(initialSeconds, active),
      { initialProps: { initialSeconds: 10, active: true } }
    )

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.remainingSeconds).toBe(6)

    rerender({ initialSeconds: 20, active: true })
    expect(result.current.remainingSeconds).toBe(20)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.remainingSeconds).toBe(18)
  })
})

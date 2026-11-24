import { act, render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CountdownTimer from './CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly with initial time', () => {
    render(<CountdownTimer initialSeconds={120} active={false} />)
    expect(screen.getByText('02:00')).toBeInTheDocument()
    expect(screen.getByText('Còn lại')).toBeInTheDocument()
  })

  it('ticks down when active', () => {
    render(<CountdownTimer initialSeconds={10} active={true} />)
    expect(screen.getByText('00:10')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('00:08')).toBeInTheDocument()
  })

  it('does not tick when inactive', () => {
    render(<CountdownTimer initialSeconds={10} active={false} />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('00:10')).toBeInTheDocument()
  })

  it('announces milestones to screen readers', () => {
    const { rerender } = render(
      <CountdownTimer initialSeconds={400} active={true} />
    )

    act(() => {
      vi.advanceTimersByTime(105000) // remaining ~295s (<= 300s)
    })
    expect(
      screen.getByText('Cảnh báo: Còn dưới 5 phút phỏng vấn')
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(240000) // remaining ~55s (<= 60s)
    })
    expect(
      screen.getByText('Cảnh báo: Còn dưới 1 phút phỏng vấn')
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60000) // remaining 0s
    })
    expect(screen.getByText('Đã hết thời gian phỏng vấn')).toBeInTheDocument()

    rerender(<CountdownTimer initialSeconds={400} active={false} />)
  })

  it('has no accessibility violations', async () => {
    vi.useRealTimers()
    const { container } = render(
      <CountdownTimer initialSeconds={180} active={false} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

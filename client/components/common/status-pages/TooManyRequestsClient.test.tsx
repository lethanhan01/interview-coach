import { act, render, screen } from '@test-utils'
import { vi } from 'vitest'
import { TooManyRequestsClient } from './TooManyRequestsClient'

describe('TooManyRequestsClient', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down using Mantine useInterval and enables retry button at 0s', () => {
    vi.useFakeTimers()
    const onRetry = vi.fn()

    render(<TooManyRequestsClient initialSeconds={3} onRetry={onRetry} />)

    const retryBtn = screen.getByRole('button', { name: 'Thử lại sau 3s' })
    expect(retryBtn).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(
      screen.getByRole('button', { name: 'Thử lại sau 2s' })
    ).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const enabledBtn = screen.getByRole('button', { name: 'Thử lại ngay' })
    expect(enabledBtn).toBeEnabled()

    act(() => {
      enabledBtn.click()
    })
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

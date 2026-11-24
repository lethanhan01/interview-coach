import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import type { ContextPack, InterviewDuration, SessionType } from '@/types'
import ConfigForm from './ConfigForm'

const DEFAULT_PROPS = {
  sessionType: 'hr' as SessionType,
  setSessionType: vi.fn(),
  contextPack: 'VN' as ContextPack,
  setContextPack: vi.fn(),
  duration: 30 as InterviewDuration,
  setDuration: vi.fn(),
}

describe('ConfigForm', () => {
  it('renders session type, context pack, and duration options cleanly', async () => {
    const { container } = render(<ConfigForm {...DEFAULT_PROPS} />)
    expect(screen.getByText('Loại phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('HR / Behavioral')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Context Pack')).toBeInTheDocument()
    expect(screen.getByText('Việt Nam')).toBeInTheDocument()
    expect(screen.getByText('Western')).toBeInTheDocument()
    expect(screen.getByText('Thời gian phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('30 phút')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng rưỡi')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('invokes callbacks when selecting radio cards', async () => {
    const user = userEvent.setup()
    const setSessionType = vi.fn()
    const setContextPack = vi.fn()
    const setDuration = vi.fn()

    render(
      <ConfigForm
        {...DEFAULT_PROPS}
        setSessionType={setSessionType}
        setContextPack={setContextPack}
        setDuration={setDuration}
      />
    )

    await user.click(screen.getByText('Technical'))
    expect(setSessionType).toHaveBeenCalledWith('technical')

    await user.click(screen.getByText('Western'))
    expect(setContextPack).toHaveBeenCalledWith('Western')

    await user.click(screen.getByText('1 tiếng'))
    expect(setDuration).toHaveBeenCalledWith(60)
  })

  it('marks selected radio cards with aria-checked true', () => {
    render(
      <ConfigForm
        {...DEFAULT_PROPS}
        sessionType="technical"
        contextPack="Western"
        duration={90}
      />
    )

    expect(screen.getByRole('radio', { name: /Technical/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: /Western/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(
      screen.getByRole('radio', { name: /1 tiếng rưỡi/i })
    ).toHaveAttribute('aria-checked', 'true')
  })
})

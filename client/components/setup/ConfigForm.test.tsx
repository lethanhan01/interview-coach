import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConfigForm from './ConfigForm'
import type { SessionType, ContextPack } from '@/lib/types'
import type { InterviewDuration } from '@/lib/setup-types'

const DEFAULT_PROPS = {
  sessionType: 'hr' as SessionType,
  setSessionType: vi.fn(),
  contextPack: 'VN' as ContextPack,
  setContextPack: vi.fn(),
  duration: 30 as InterviewDuration,
  setDuration: vi.fn(),
}

describe('ConfigForm', () => {
  it('renders session type section', () => {
    render(<ConfigForm {...DEFAULT_PROPS} />)
    expect(screen.getByText('Loại phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('HR / Behavioral')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.queryByText('Mixed (HR + Technical)')).not.toBeInTheDocument()
  })

  it('renders context pack section', () => {
    render(<ConfigForm {...DEFAULT_PROPS} />)
    expect(screen.getByText('Context Pack')).toBeInTheDocument()
    expect(screen.getByText('Việt Nam')).toBeInTheDocument()
    expect(screen.getByText('Western')).toBeInTheDocument()
  })

  it('renders duration section', () => {
    render(<ConfigForm {...DEFAULT_PROPS} />)
    expect(screen.getByText('Thời gian phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('30 phút')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng rưỡi')).toBeInTheDocument()
  })

  it('calls setSessionType when a session type card is clicked', () => {
    const setSessionType = vi.fn()
    render(<ConfigForm {...DEFAULT_PROPS} setSessionType={setSessionType} />)
    fireEvent.click(screen.getByText('Technical'))
    expect(setSessionType).toHaveBeenCalledWith('technical')
  })

  it('calls setContextPack when a context pack card is clicked', () => {
    const setContextPack = vi.fn()
    render(<ConfigForm {...DEFAULT_PROPS} setContextPack={setContextPack} />)
    fireEvent.click(screen.getByText('Western'))
    expect(setContextPack).toHaveBeenCalledWith('Western')
  })

  it('calls setDuration when a duration card is clicked', () => {
    const setDuration = vi.fn()
    render(<ConfigForm {...DEFAULT_PROPS} setDuration={setDuration} />)
    fireEvent.click(screen.getByText('1 tiếng'))
    expect(setDuration).toHaveBeenCalledWith(60)
  })

  it('visually marks the currently selected session type', () => {
    render(<ConfigForm {...DEFAULT_PROPS} sessionType="technical" />)
    const technicalText = screen.getByText('Technical')
    const card = technicalText.closest('label')
    // Selected card has border-brand class
    expect(card?.className).toContain('border-brand')
  })

  it('visually marks the currently selected context pack', () => {
    render(<ConfigForm {...DEFAULT_PROPS} contextPack="Western" />)
    const westernText = screen.getByText('Western')
    const card = westernText.closest('label')
    expect(card?.className).toContain('border-brand')
  })
})


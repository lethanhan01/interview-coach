import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import CountdownTimer from '../../components/interview/CountdownTimer'

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
})

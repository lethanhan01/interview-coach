import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LogoutButton from './LogoutButton'

describe('LogoutButton', () => {
  it('renders correctly', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /Đăng xuất/i })).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<LogoutButton onClick={handleClick} />)
    
    const button = screen.getByRole('button', { name: /Đăng xuất/i })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<LogoutButton className="custom-class" />)
    const button = screen.getByRole('button', { name: /Đăng xuất/i })
    expect(button).toHaveClass('custom-class')
  })
})

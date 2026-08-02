import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import { HeroSection } from '../../components/landing/HeroSection'

describe('HeroSection', () => {
  it('renders hero content correctly', () => {
    render(<HeroSection />)
    
    expect(screen.getByRole('heading', { name: /luyện phỏng vấn/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /bắt đầu miễn phí/i })).toBeInTheDocument()
  })
})

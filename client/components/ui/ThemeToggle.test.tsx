import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { vi } from 'vitest'
import { axe } from 'jest-axe'

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

describe('ThemeToggle Component', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly and cycles themes', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    
    // The component delays setting `mounted` to true, so we await the button
    const button = await screen.findByRole('button', { name: /Chế độ sáng. Nhấn để chuyển theme/i })
    expect(button).toBeInTheDocument()

    // Click to cycle theme
    await user.click(button)
    
    // current is 'light', THEMES = ['light', 'dark', 'system'], next should be 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('passes accessibility tests', async () => {
    const { container } = render(<ThemeToggle />)
    
    // Wait for the component to be fully mounted
    await screen.findByRole('button', { name: /Nhấn để chuyển theme/i })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

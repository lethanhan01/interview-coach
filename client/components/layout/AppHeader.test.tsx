import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppHeader from './AppHeader'
import { vi } from 'vitest'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header correctly', () => {
    render(<AppHeader role="admin" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /User Menu/i })).toBeInTheDocument()
  })

  it('renders the logout action slot', async () => {
    const user = userEvent.setup()
    render(
      <AppHeader 
        role="admin" 
        logoutActionSlot={<button>Logout Custom</button>} 
      />
    )
    
    // Click the user menu to open the dropdown
    const userMenuBtn = screen.getByRole('button', { name: /User Menu/i })
    await user.click(userMenuBtn)
    
    // Wait for the dropdown content
    expect(await screen.findByText('Logout Custom')).toBeInTheDocument()
  })
})

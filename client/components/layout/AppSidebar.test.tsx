import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import AppSidebar from './AppSidebar'
import { vi } from 'vitest'
import { usePathname } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin-dashboard'),
}))

// Mock TooltipProvider to avoid radix-ui act warnings in tests
vi.mock('@/components/ui/Tooltip', () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/admin-dashboard')
  })

  it('renders admin navigation items', async () => {
    render(<AppSidebar role="admin" />)
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Quản lý User')).toBeInTheDocument()
    expect(screen.getByText('Hồ sơ')).toBeInTheDocument()
  })

  it('renders candidate navigation items', async () => {
    render(<AppSidebar role="candidate" />)
    expect(await screen.findByText('Phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('Tạo mới')).toBeInTheDocument()
    expect(screen.getByText('Hồ sơ')).toBeInTheDocument()
  })

  it('highlights active route', async () => {
    vi.mocked(usePathname).mockReturnValue('/users')
    render(<AppSidebar role="admin" />)
    
    await screen.findByText('Quản lý User')
    const activeLink = screen.getByText('Quản lý User').closest('a')
    expect(activeLink).toHaveClass('text-brand-subtle-fg')
  })

  it('collapses and expands', async () => {
    const user = userEvent.setup()
    render(<AppSidebar role="admin" />)
    
    const collapseButton = await screen.findByRole('button', { name: /Collapse sidebar/i })
    await user.click(collapseButton)
    
    // After collapse, text should be hidden (sr-only or not rendered)
    expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument()
  })
})

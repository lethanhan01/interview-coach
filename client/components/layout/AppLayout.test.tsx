import { render, screen } from '@testing-library/react'
import AppLayout from './AppLayout'
import { vi } from 'vitest'

// Mock child components
vi.mock('./AppHeader', () => ({
  default: ({ role }: { role: string }) => <header data-testid="mock-header">{role}</header>,
}))

vi.mock('./AppSidebar', () => ({
  default: ({ role }: { role: string }) => <aside data-testid="mock-sidebar">{role}</aside>,
}))

describe('AppLayout', () => {
  it('renders sidebar, header and children correctly', () => {
    render(
      <AppLayout role="admin">
        <div data-testid="mock-content">Content Here</div>
      </AppLayout>
    )

    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-content')).toBeInTheDocument()
    expect(screen.getByText('Content Here')).toBeInTheDocument()
  })

  it('passes role to header and sidebar', () => {
    render(
      <AppLayout role="candidate">
        <div>Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('mock-header')).toHaveTextContent('candidate')
    expect(screen.getByTestId('mock-sidebar')).toHaveTextContent('candidate')
  })
})

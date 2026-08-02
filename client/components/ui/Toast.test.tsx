import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from './Toast'
import { Button } from './Button'
import { toast } from 'sonner'
import { axe } from 'jest-axe'

describe('Toast (Toaster) Component', () => {
  const TestToast = () => (
    <div>
      <Toaster />
      <Button
        onClick={() => {
          toast('My Test Toast', {
            description: 'Toast Description',
            action: {
              label: 'Undo',
              onClick: () => {},
            },
          })
        }}
      >
        Show Toast
      </Button>
    </div>
  )

  it('renders a toast when triggered', async () => {
    const user = userEvent.setup()
    render(<TestToast />)

    // Initially, no toast is visible
    expect(screen.queryByText('My Test Toast')).not.toBeInTheDocument()

    // Click to show toast
    const button = screen.getByRole('button', { name: 'Show Toast' })
    await user.click(button)

    // Wait for the toast to appear
    await waitFor(() => {
      expect(screen.getByText('My Test Toast')).toBeInTheDocument()
      expect(screen.getByText('Toast Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    })
  })

  it('passes accessibility tests', async () => {
    const user = userEvent.setup()
    const { container } = render(<TestToast />)
    
    // Click to show toast
    const button = screen.getByRole('button', { name: 'Show Toast' })
    await user.click(button)

    // Wait for the toast to appear before running a11y checks
    await waitFor(() => {
      expect(screen.getByText('My Test Toast')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './Dialog'

describe('Dialog Interaction Tests', () => {
  it('opens and closes via keyboard and mouse interaction', async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger asChild>
          <button type="button">Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>This is a dialog description.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    // 1. Initial state: Dialog is not visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 2. Open via mouse click on trigger
    const triggerBtn = screen.getByRole('button', { name: /open dialog/i })
    await user.click(triggerBtn)

    // Wait for animation or rendering
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // 3. Accessibility & Focus behavior
    // The first focusable element inside the dialog should be focused (usually the close button)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeVisible()

    // Close button should be present
    const closeBtn = screen.getByRole('button', { name: /close/i })
    expect(closeBtn).toBeInTheDocument()

    // 4. Close via Keyboard (Escape key)
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // 5. Open via Keyboard (Enter key)
    triggerBtn.focus()
    expect(triggerBtn).toHaveFocus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})

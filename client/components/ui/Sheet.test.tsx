import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './Sheet'

describe('Sheet Interaction Tests', () => {
  it('opens and closes via keyboard and mouse interaction', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger asChild>
          <button type="button">Open Sheet</button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>This is a sheet description.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    // 1. Initial state: Sheet is not visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 2. Open via mouse click on trigger
    const triggerBtn = screen.getByRole('button', { name: /open sheet/i })
    await user.click(triggerBtn)

    // Wait for animation or rendering
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // 3. Accessibility & Focus behavior
    const sheet = screen.getByRole('dialog')
    expect(sheet).toBeVisible()

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

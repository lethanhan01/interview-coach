import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './DropdownMenu'

describe('DropdownMenu Interaction Tests', () => {
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Not visible initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    // Focus trigger
    const triggerBtn = screen.getByRole('button', { name: /options/i })
    triggerBtn.focus()
    expect(triggerBtn).toHaveFocus()

    // Open via Enter
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    // Wait for internal focus management (Radix focuses first item automatically when opened via keyboard)
    const items = screen.getAllByRole('menuitem')
    await waitFor(() => {
      expect(items[0]).toHaveFocus()
    })

    // Navigation via ArrowDown
    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(items[1]).toHaveFocus()
    })

    // Close via Escape
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    // Focus should return to trigger
    expect(triggerBtn).toHaveFocus()
  })
})

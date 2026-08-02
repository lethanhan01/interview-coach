import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './Popover'

const setup = (jsx: React.ReactElement) => ({
  user: userEvent.setup(),
  ...render(jsx),
})

describe('Popover', () => {
  it('renders nothing initially but trigger', () => {
    setup(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    expect(screen.getByText('Open popover')).toBeInTheDocument()
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument()
  })

  it('shows popover when trigger is clicked', async () => {
    const { user } = setup(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    
    await user.click(screen.getByText('Open popover'))
    
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })
  })

  it('can be opened with keyboard', async () => {
    const { user } = setup(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    
    await user.tab()
    expect(screen.getByText('Open popover')).toHaveFocus()
    
    // Press Enter to open
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument()
    })
  })

  it('passes a11y checks', async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    
    // Test closed state
    let results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

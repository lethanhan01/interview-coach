import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './Tooltip'

const setup = (jsx: React.ReactElement) => ({
  user: userEvent.setup(),
  ...render(
    <TooltipProvider delayDuration={0}>
      {jsx}
    </TooltipProvider>
  ),
})

describe('Tooltip', () => {
  it('renders nothing by default', () => {
    setup(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    )
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument()
  })

  it('shows tooltip on hover', async () => {
    const { user } = setup(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    )
    
    await user.hover(screen.getByText('Hover me'))
    await waitFor(() => {
      expect(screen.getByRole('tooltip', { name: 'Tooltip text' })).toBeInTheDocument()
    })
  })

  it('shows tooltip on keyboard focus', async () => {
    const { user } = setup(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    )
    
    await user.tab()
    expect(screen.getByText('Hover me')).toHaveFocus()
    
    await waitFor(() => {
      expect(screen.getByRole('tooltip', { name: 'Tooltip text' })).toBeInTheDocument()
    })
  })

  it('passes a11y checks', async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

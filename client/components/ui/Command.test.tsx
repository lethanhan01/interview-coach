import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './Command'

import { vi } from 'vitest'

vi.mock('cmdk', () => {
  const React = require('react')
  const CommandPrimitive = React.forwardRef<HTMLDivElement, any>(
    ({ children, ...props }, ref) => (
      <div data-testid="cmdk-command" ref={ref} {...props}>
        {children}
      </div>
    )
  )
  CommandPrimitive.displayName = 'Command'

  const Input = React.forwardRef<HTMLInputElement, any>(
    ({ ...props }, ref) => (
      <input data-testid="cmdk-input" ref={ref} {...props} />
    )
  )
  Input.displayName = 'CommandInput'

  const List = React.forwardRef<HTMLDivElement, any>(
    ({ children, ...props }, ref) => (
      <div data-testid="cmdk-list" ref={ref} {...props}>
        {children}
      </div>
    )
  )
  List.displayName = 'CommandList'

  const Empty = React.forwardRef<HTMLDivElement, any>(
    ({ children, ...props }, ref) => (
      <div data-testid="cmdk-empty" ref={ref} {...props}>
        {children}
      </div>
    )
  )
  Empty.displayName = 'CommandEmpty'

  const Group = React.forwardRef<HTMLDivElement, any>(
    ({ children, heading, ...props }, ref) => (
      <div data-testid="cmdk-group" ref={ref} {...props}>
        {heading && <div cmdk-group-heading="">{heading}</div>}
        {children}
      </div>
    )
  )
  Group.displayName = 'CommandGroup'

  const Item = React.forwardRef<HTMLDivElement, any>(
    ({ children, ...props }, ref) => (
      <div data-testid="cmdk-item" ref={ref} {...props}>
        {children}
      </div>
    )
  )
  Item.displayName = 'CommandItem'

  const Separator = React.forwardRef<HTMLHRElement, any>(
    ({ ...props }, ref) => (
      <hr data-testid="cmdk-separator" ref={ref} {...props} />
    )
  )
  Separator.displayName = 'CommandSeparator'

  // Attach components to CommandPrimitive
  ;(CommandPrimitive as any).Input = Input
  ;(CommandPrimitive as any).List = List
  ;(CommandPrimitive as any).Empty = Empty
  ;(CommandPrimitive as any).Group = Group
  ;(CommandPrimitive as any).Item = Item
  ;(CommandPrimitive as any).Separator = Separator

  return { Command: CommandPrimitive }
})

describe('Command Component', () => {
  it('should render the full command structure correctly', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandItem>
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    )

    expect(screen.getByTestId('cmdk-command')).toBeInTheDocument()
    expect(screen.getByTestId('cmdk-input')).toHaveAttribute('placeholder', 'Search...')
    expect(screen.getByTestId('cmdk-list')).toBeInTheDocument()
    expect(screen.getByTestId('cmdk-empty')).toHaveTextContent('No results found.')
    expect(screen.getByTestId('cmdk-group')).toHaveTextContent('Settings')
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByTestId('cmdk-separator')).toBeInTheDocument()
    expect(screen.getAllByText('Settings')).toHaveLength(2)
    expect(screen.getByText('⌘S')).toBeInTheDocument()
  })

  it('should apply custom class names', () => {
    render(<Command className="custom-command-class" />)
    expect(screen.getByTestId('cmdk-command')).toHaveClass('custom-command-class')
  })

  it('should not have basic accessibility violations', async () => {
    const { container } = render(
      <Command>
        <CommandInput placeholder="Search..." aria-label="Search" />
        <CommandList>
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

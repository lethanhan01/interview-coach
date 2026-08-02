'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  /** Array of options to display. */
  options: ComboboxOption[]
  /** Current selected value (controlled). */
  value?: string
  /** Callback when the user selects an option. */
  onValueChange?: (value: string) => void
  /** Placeholder text for the trigger button. */
  placeholder?: string
  /** Placeholder text for the search input inside the dropdown. */
  searchPlaceholder?: string
  /** Text shown when no options match the search query. */
  emptyText?: string
  /** Disables the entire combobox. */
  disabled?: boolean
  /** aria-invalid for error state. */
  'aria-invalid'?: boolean | 'true' | 'false'
  /** aria-describedby for linking to description/error message. */
  'aria-describedby'?: string
  /** Additional class for the trigger button. */
  className?: string
  /** Accessible label for screen readers. */
  'aria-label'?: string
  id?: string
}

/**
 * Combobox — accessible searchable select.
 *
 * Built on `@radix-ui/react-popover` + `Command` (`cmdk`).
 * - Keyboard: Click or Enter to open. Arrow keys to navigate. Enter to select.
 *   Escape closes. Type to filter.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled,
  className,
  id,
  ...ariaProps
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const isInvalid =
    ariaProps['aria-invalid'] === true || ariaProps['aria-invalid'] === 'true'

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-describedby={ariaProps['aria-describedby']}
          aria-invalid={ariaProps['aria-invalid']}
          aria-label={ariaProps['aria-label']}
          disabled={disabled}
          className={cn(
            // Base
            'border-input bg-surface text-foreground ring-offset-background flex h-10 w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm',
            'transition-colors duration-150',
            // Focus ring
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Invalid
            isInvalid && 'border-destructive focus-visible:ring-destructive',
            // Placeholder
            !selectedLabel && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown
            className="text-muted-foreground ml-2 h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground z-[var(--z-index-dropdown)] w-[var(--radix-popover-trigger-width)] rounded-xl border p-0 shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          'motion-reduce:animate-none motion-reduce:transition-none'
        )}
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}

Combobox.displayName = 'Combobox'

'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Re-export simple wrappers from Radix
// ---------------------------------------------------------------------------

export const SelectGroup = RadixSelect.Group
export const SelectValue = RadixSelect.Value

// ---------------------------------------------------------------------------
// Select (root)
// ---------------------------------------------------------------------------

export type SelectProps = React.ComponentPropsWithoutRef<
  typeof RadixSelect.Root
>

/**
 * Select — pure UI primitive.
 *
 * Built on `@radix-ui/react-select`.
 * - Keyboard: Arrow keys / Enter / Space / Escape all handled by Radix.
 * - Accessible: `role="combobox"` + `listbox`, `aria-expanded`, `aria-selected`.
 *
 * Compose with sub-components:
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger aria-label="Choose country">
 *     <SelectValue placeholder="Select a country" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="vn">Vietnam</SelectItem>
 *     <SelectItem value="us">United States</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export function Select(props: SelectProps) {
  return <RadixSelect.Root {...props} />
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<
  typeof RadixSelect.Trigger
> {
  /** Pass `aria-invalid="true"` for error state styling. */
  invalid?: boolean
}

export const SelectTrigger = ({
  className,
  children,
  invalid,
  ...props
}: SelectTriggerProps) => (
  <RadixSelect.Trigger
    className={cn(
      // Base
      'border-input bg-surface text-foreground ring-offset-background flex h-10 w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm',
      'transition-colors duration-150',
      'placeholder:text-muted-foreground',
      // Focus ring
      'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Invalid
      (invalid || props['aria-invalid']) &&
        'border-destructive focus-visible:ring-destructive',
      // Truncate long option text
      '[&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      <ChevronDown
        className="text-muted-foreground h-4 w-4 shrink-0 opacity-50"
        aria-hidden="true"
      />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
)
SelectTrigger.displayName = 'SelectTrigger'

// ---------------------------------------------------------------------------
// SelectScrollUpButton / SelectScrollDownButton
// ---------------------------------------------------------------------------

export const SelectScrollUpButton = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollUpButton>) => (
  <RadixSelect.ScrollUpButton
    className={cn(
      'flex cursor-pointer items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" aria-hidden="true" />
  </RadixSelect.ScrollUpButton>
)
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

export const SelectScrollDownButton = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.ScrollDownButton>) => (
  <RadixSelect.ScrollDownButton
    className={cn(
      'flex cursor-pointer items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" aria-hidden="true" />
  </RadixSelect.ScrollDownButton>
)
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

export const SelectContent = ({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Content>) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      className={cn(
        // Base
        'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border shadow-md',
        // Animation
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <RadixSelect.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </RadixSelect.Viewport>
      <SelectScrollDownButton />
    </RadixSelect.Content>
  </RadixSelect.Portal>
)
SelectContent.displayName = 'SelectContent'

// ---------------------------------------------------------------------------
// SelectLabel
// ---------------------------------------------------------------------------

export const SelectLabel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Label>) => (
  <RadixSelect.Label
    className={cn(
      'text-muted-foreground py-1.5 pl-8 pr-2 text-xs font-medium',
      className
    )}
    {...props}
  />
)
SelectLabel.displayName = 'SelectLabel'

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Item>) => (
  <RadixSelect.Item
    className={cn(
      // Base
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none',
      // Hover / Focus
      'focus:bg-accent focus:text-accent-foreground',
      // Disabled
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    {/* Check indicator */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <Check className="h-4 w-4" aria-hidden="true" />
      </RadixSelect.ItemIndicator>
    </span>

    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
)
SelectItem.displayName = 'SelectItem'

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

export const SelectSeparator = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>) => (
  <RadixSelect.Separator
    className={cn('bg-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
)
SelectSeparator.displayName = 'SelectSeparator'

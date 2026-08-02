'use client'

import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof RadixCheckbox.Root
> {
  /** Shows an indeterminate (minus) icon instead of checkmark. */
  indeterminate?: boolean
}

/**
 * Checkbox — pure UI primitive.
 *
 * Built on `@radix-ui/react-checkbox`.
 * - Keyboard: Space to toggle.
 * - Accessible: `role="checkbox"`, `aria-checked` managed by Radix.
 * - Supports: default · checked · indeterminate · disabled · invalid.
 *
 * Use with `<Label>` for full accessible composition:
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <Checkbox id="terms" />
 *   <Label htmlFor="terms">Accept terms</Label>
 * </div>
 * ```
 */
export function Checkbox({
  className,
  indeterminate,
  checked,
  ...props
}: CheckboxProps) {
  const resolvedChecked = indeterminate ? 'indeterminate' : checked

  return (
    <RadixCheckbox.Root
      checked={resolvedChecked}
      className={cn(
        // Base
        'peer h-4 w-4 shrink-0 rounded-sm border transition-colors duration-150',
        // Default state
        'border-input bg-surface',
        // Checked / indeterminate: filled with primary color
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
        // Focus ring
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Invalid
        'aria-invalid:border-destructive',
        className
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center">
        {indeterminate || resolvedChecked === 'indeterminate' ? (
          <Minus className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Check className="h-3 w-3" aria-hidden="true" />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

Checkbox.displayName = 'Checkbox'

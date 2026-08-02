'use client'

import * as RadixRadioGroup from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// RadioGroup root
// ---------------------------------------------------------------------------

export type RadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadixRadioGroup.Root
>

/**
 * RadioGroup — pure UI primitive.
 *
 * Built on `@radix-ui/react-radio-group`.
 * - Keyboard: Arrow keys to navigate between items, Space/Enter to select.
 * - Accessible: `role="radiogroup"`, `aria-checked` managed by Radix.
 *
 * Compose with `RadioGroupItem` and `Label`:
 * ```tsx
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="a" id="a" />
 *     <Label htmlFor="a">Option A</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadixRadioGroup.Root
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

RadioGroup.displayName = 'RadioGroup'

// ---------------------------------------------------------------------------
// RadioGroupItem
// ---------------------------------------------------------------------------

export type RadioGroupItemProps = React.ComponentPropsWithoutRef<
  typeof RadixRadioGroup.Item
>

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadixRadioGroup.Item
      className={cn(
        // Base
        'aspect-square h-4 w-4 rounded-full border transition-colors duration-150',
        // Default
        'border-input bg-surface',
        // Selected
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
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
      <RadixRadioGroup.Indicator className="flex items-center justify-center">
        <Circle
          className="fill-primary-foreground text-primary-foreground h-2 w-2"
          aria-hidden="true"
        />
      </RadixRadioGroup.Indicator>
    </RadixRadioGroup.Item>
  )
}

RadioGroupItem.displayName = 'RadioGroupItem'

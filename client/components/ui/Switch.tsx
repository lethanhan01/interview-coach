'use client'

import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof RadixSwitch.Root
> {}

/**
 * Switch — pure UI primitive.
 *
 * Built on `@radix-ui/react-switch`.
 * - Keyboard: Space to toggle.
 * - Accessible: `role="switch"`, `aria-checked` managed by Radix.
 * - Supports: default · checked · disabled · invalid.
 *
 * Use with `<Label>` for full accessible composition:
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <Switch id="notifications" />
 *   <Label htmlFor="notifications">Enable notifications</Label>
 * </div>
 * ```
 *
 * Note: Switch visually differs from Checkbox — it represents a binary
 * on/off state that takes effect immediately (no form submission needed).
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cn(
        // Base track
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'transition-colors duration-150',
        // States
        'bg-input',
        'data-[state=checked]:bg-primary',
        // Focus ring
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Invalid
        'aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:ring-offset-2',
        className
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          // Thumb
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg',
          'transition-transform duration-150',
          // Position: unchecked → left, checked → right
          'translate-x-0 data-[state=checked]:translate-x-5'
        )}
      />
    </RadixSwitch.Root>
  )
}

Switch.displayName = 'Switch'

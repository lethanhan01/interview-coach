import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Icon or element rendered on the left, inside the input wrapper. */
  leadingIcon?: React.ReactNode
  /** Button or element rendered on the right, inside the input wrapper. */
  trailingAction?: React.ReactNode
}

/**
 * Input — pure UI primitive.
 *
 * Does NOT include label, error message or hint text.
 * Use `FormField` + `FormControl` from `@/components/form` for full
 * accessible form composition (label ↔ control ↔ description ↔ error).
 *
 * `aria-invalid`, `aria-describedby`, `id`, `disabled`, `readOnly`
 * are all spread-passthrough — FormControl injects them automatically.
 *
 * States supported: default · disabled · readOnly · invalid · required
 * Slots supported:  leadingIcon · trailingAction
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingAction, className, ...props }, ref) => {
    const hasLeading = !!leadingIcon
    const hasTrailing = !!trailingAction

    const isInvalid =
      props['aria-invalid'] === true || props['aria-invalid'] === 'true'

    return (
      <div className="relative flex w-full items-center">
        {hasLeading && (
          <span
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute left-3 flex items-center"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            // Base
            'border-input bg-surface text-foreground ring-offset-background flex h-10 w-full rounded-xl border text-sm transition-colors duration-150',
            'placeholder:text-muted-foreground',
            // File input reset
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            // Focus ring
            'focus-visible:ring-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Read-only: no cursor change, but clearly distinct from disabled
            'read-only:bg-muted read-only:cursor-default',
            // Invalid
            isInvalid &&
              'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
            // Padding adjusted for icon slots
            hasLeading ? 'pl-9' : 'pl-4',
            hasTrailing ? 'pr-10' : 'pr-4',
            'py-2.5',
            className
          )}
          {...props}
        />
        {hasTrailing && (
          <span className="absolute right-1 flex items-center">
            {trailingAction}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Current character count — shown alongside maxChars. */
  charCount?: number
  /** Maximum allowed characters — displayed as "{charCount}/{maxChars}". */
  maxChars?: number
  /** Icon or element rendered on the left (rare for textarea, but supported). */
  leadingIcon?: React.ReactNode
  /** Element rendered on the right of the bottom bar. */
  trailingAction?: React.ReactNode
}

/**
 * Textarea — pure UI primitive.
 *
 * Does NOT include label, error message or hint text.
 * Use `FormField` + `FormControl` from `@/components/form` for full
 * accessible form composition (label ↔ control ↔ description ↔ error).
 *
 * States supported: default · disabled · readOnly · invalid · required
 * Extras:           charCount + maxChars for character counting UX
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { charCount, maxChars, leadingIcon, trailingAction, className, ...props },
    ref
  ) => {
    const isInvalid =
      props['aria-invalid'] === true || props['aria-invalid'] === 'true'

    const showCounter = maxChars != null && charCount != null
    const isOverLimit = showCounter && charCount! >= maxChars!

    return (
      <div className="flex w-full flex-col">
        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute left-3 top-3 flex items-center"
            >
              {leadingIcon}
            </span>
          )}
          <textarea
            ref={ref}
            className={cn(
              // Base
              'border-input bg-surface text-foreground ring-offset-background flex min-h-[80px] w-full resize-none rounded-xl border px-4 py-3 text-sm transition-colors duration-150',
              'placeholder:text-muted-foreground',
              // Focus ring
              'focus-visible:ring-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Read-only: distinct from disabled
              'read-only:bg-muted read-only:cursor-default',
              // Invalid
              isInvalid &&
                'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
              // Leading icon padding
              leadingIcon ? 'pl-9' : 'pl-4',
              className
            )}
            {...props}
          />
        </div>

        {/* Character counter row */}
        {showCounter && (
          <div className="mt-1 flex justify-end">
            <span
              className={cn(
                'text-xs tabular-nums',
                isOverLimit
                  ? 'text-destructive font-medium'
                  : 'text-muted-foreground'
              )}
              aria-live="polite"
              aria-label={`${charCount} trong ${maxChars} ký tự`}
            >
              {charCount}/{maxChars}
            </span>
          </div>
        )}

        {/* Optional trailing action (e.g. clear button) */}
        {trailingAction && (
          <div className="mt-1 flex justify-end">{trailingAction}</div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

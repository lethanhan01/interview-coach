import * as RadixLabel from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.ComponentPropsWithoutRef<
  typeof RadixLabel.Root
> {
  /** Shows a red asterisk (*) after the label text to indicate required. */
  required?: boolean
  /** Reduces opacity to signal the associated control is disabled. */
  disabled?: boolean
}

/**
 * Label — pure UI primitive.
 *
 * Wraps `@radix-ui/react-label` for accessible label–control association.
 * Always link to a control via `htmlFor`.
 *
 * - Required indicator: `*` (aria-hidden) — purely visual.
 * - Screen readers get `required` from the control's own `required`/`aria-required`.
 * - Disabled state: visual opacity reduction only.
 */
export function Label({
  className,
  required,
  disabled,
  children,
  ...props
}: LabelProps) {
  return (
    <RadixLabel.Root
      className={cn(
        'text-foreground inline-flex items-center gap-1 text-sm font-medium leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        disabled && 'cursor-not-allowed opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      )}
    </RadixLabel.Root>
  )
}

Label.displayName = 'Label'

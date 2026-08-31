import { HTMLAttributes, forwardRef, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'focus-visible:ring-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised text-ink-muted border-border',
        secondary: 'bg-secondary text-secondary-foreground border-border',
        outline: 'bg-transparent text-foreground border-border',
        brand: 'bg-brand-subtle text-brand-subtle-fg border-brand-subtle-border',
        success: 'bg-success-subtle text-success-subtle-fg border-success-subtle-fg/30',
        warning: 'bg-warning-subtle text-warning-subtle-fg border-warning-subtle-fg/30',
        danger: 'bg-danger-subtle text-danger-subtle-fg border-danger-subtle-fg/30',
        destructive: 'bg-danger-subtle text-danger-subtle-fg border-danger-subtle-fg/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** If true, styles the badge as a clickable interactive element. */
  interactive?: boolean
  /** If provided, renders an accessible dismiss/remove button. */
  onDismiss?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Accessible label for the dismiss button. */
  dismissLabel?: string
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      interactive,
      onDismiss,
      dismissLabel = 'Xóa',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        className={cn(
          badgeVariants({ variant }),
          interactive &&
            'cursor-pointer hover:opacity-85 active:scale-95 transition-transform select-none',
          onDismiss && 'pr-1.5',
          className
        )}
        {...props}
      >
        <span className="min-w-0 truncate">{children}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss(e)
            }}
            aria-label={dismissLabel}
            className="hover:bg-surface-raised/50 text-current ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        )}
      </span>
    )
  }
)
Badge.displayName = 'Badge'


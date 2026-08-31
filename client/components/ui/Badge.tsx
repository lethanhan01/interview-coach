import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
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
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

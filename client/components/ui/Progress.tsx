'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const progressVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-surface-raised border border-border/50 transition-all',
  {
    variants: {
      variant: {
        default: '[&>div]:bg-ink-muted',
        brand: '[&>div]:bg-brand',
        success: '[&>div]:bg-success',
        warning: '[&>div]:bg-warning',
        danger: '[&>div]:bg-danger',
      },
      size: {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  /** The current completion value (0 - 100). */
  value?: number
  /** The maximum value (defaults to 100). */
  max?: number
  /** Optional custom class for the internal indicator bar. */
  indicatorClassName?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant,
      size,
      indicatorClassName,
      ...props
    },
    ref
  ) => {
    const validMax = max > 0 ? max : 100
    const clampedValue = Math.min(validMax, Math.max(0, value ?? 0))
    const percentage = Math.round((clampedValue / validMax) * 100)

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={validMax}
        className={cn(progressVariants({ variant, size }), className)}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 rounded-full transition-all duration-500 ease-out',
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export default Progress

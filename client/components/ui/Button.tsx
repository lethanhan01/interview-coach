import { forwardRef } from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const buttonVariants = cva(
  // Base styles — no margin, no business logic, no hardcoded colors
  [
    'relative inline-flex items-center justify-center gap-2',
    'select-none whitespace-nowrap rounded-full font-medium',
    'transition-all duration-150',
    // Hover / Active micro-animation
    'hover:scale-[1.02] active:scale-[0.98]',
    // Focus-visible ring using semantic token
    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    // Disabled & loading: block pointer events, reduce opacity
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary-hover active:bg-primary-active',
          'shadow-sm',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary-hover',
          'border-border border',
        ],
        outline: [
          'text-foreground bg-transparent',
          'border-border border',
          'hover:bg-muted',
        ],
        ghost: ['text-foreground bg-transparent', 'hover:bg-muted'],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive-hover',
          'shadow-sm',
        ],
        link: [
          'text-primary bg-transparent underline-offset-4',
          'hover:underline',
          'h-auto rounded-none px-0 py-0',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, renders as the child element (e.g. <a>, Next.js <Link>)
   * while keeping all button styles and behavior.
   */
  asChild?: boolean
  /**
   * Shows a loading spinner and disables the button.
   * The button keeps its original width using an overlay technique.
   */
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {/* Overlay spinner — sits on top, does not affect layout */}
        {loading && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="size-4 animate-spin" />
          </span>
        )}

        {/*
         * Slottable wraps children so Radix Slot can properly forward them
         * to the child element when asChild=true, while keeping the span
         * opacity technique intact for loading width stability.
         */}
        <Slottable>
          <span
            className={cn(
              'inline-flex items-center gap-2',
              loading && 'opacity-0'
            )}
          >
            {children}
          </span>
        </Slottable>
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button

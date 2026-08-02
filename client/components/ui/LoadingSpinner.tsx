import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { HTMLAttributes, forwardRef } from 'react'

export interface LoadingSpinnerProps extends HTMLAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
  xl: 'size-14',
}

export const LoadingSpinner = forwardRef<SVGSVGElement, LoadingSpinnerProps>(
  ({ size = 'md', className, ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(
          'text-ink-muted animate-spin',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
LoadingSpinner.displayName = 'LoadingSpinner'

// Default export for backward compatibility
export default LoadingSpinner

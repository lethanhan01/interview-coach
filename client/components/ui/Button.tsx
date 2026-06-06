import { ButtonHTMLAttributes, ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  const variants: Record<string, string> = {
    primary: 'bg-black px-4 py-2 text-white hover:bg-gray-800',
    secondary: 'border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:text-gray-900',
  }

  return (
    <button
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}

import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Search, X } from 'lucide-react'

export interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:gap-10', className)}>
      <div className="flex-1 md:max-w-xs">
        <h3 className="text-ink text-base font-medium">{title}</h3>
        {description && (
          <p className="text-ink-muted mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="max-w-2xl flex-1 space-y-6">{children}</div>
    </div>
  )
}

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      containerClassName,
      className,
      placeholder = 'Tìm kiếm...',
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      onChange('')
      if (onClear) onClear()
    }

    return (
      <div className={cn('relative w-full max-w-sm', containerClassName)}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="text-ink-muted h-4 w-4" />
        </div>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn('pl-9 pr-9', className)}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-ink-muted hover:text-ink absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  charCount?: number
  maxChars?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, charCount, maxChars, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full px-4 py-3 rounded-xl text-sm text-ink resize-none',
            'bg-surface border border-border',
            'placeholder:text-ink-faint',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
            error ? 'border-danger focus:ring-danger' : '',
            'disabled:opacity-50',
            className,
          ].join(' ')}
          {...props}
        />
        <div className="flex justify-between items-center">
          {error && <p className="text-xs text-danger">{error}</p>}
          {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
          {maxChars != null && charCount != null && (
            <p className={['text-xs ml-auto', charCount >= maxChars ? 'text-danger' : 'text-ink-faint'].join(' ')}>
              {charCount}/{maxChars}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

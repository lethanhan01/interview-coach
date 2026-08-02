import { cn } from '@/lib/utils'

export interface FormSectionProps {
  /** Section heading shown above the fields. */
  title?: string
  /** Supporting text below the title. */
  description?: string
  /** Whether to show a top visual divider. */
  divider?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * FormSection — groups related FormFields with an optional title and description.
 *
 * This is a layout-only component. It does NOT use `<fieldset>` or `<legend>`
 * to avoid cross-browser styling complexity. For accessible grouping of
 * radio buttons or checkboxes, use `<fieldset>` + `<legend>` directly
 * or wrap a `RadioGroup` with an accessible label.
 *
 * @example
 * ```tsx
 * <FormSection title="Personal Information" description="Your basic details.">
 *   <FormField name="name">...</FormField>
 *   <FormField name="email">...</FormField>
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  divider = false,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {divider && <hr className="border-border" />}
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && (
            <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          )}
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

FormSection.displayName = 'FormSection'

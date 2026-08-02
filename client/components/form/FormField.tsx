'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FormFieldContextValue {
  /** Unique field id — used for htmlFor, aria-describedby chains. */
  id: string
  /** Field name (for forms). */
  name?: string
  isInvalid?: boolean
  isRequired?: boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  /** ID of the description element, if present. */
  descriptionId?: string
  /** ID of the error message element, if present. */
  messageId?: string
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

export function useFormFieldContext(): FormFieldContextValue {
  const ctx = React.useContext(FormFieldContext)
  if (!ctx) {
    throw new Error('FormField sub-components must be used inside <FormField>.')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// FormField (root)
// ---------------------------------------------------------------------------

export interface FormFieldProps {
  /** Override the auto-generated field id. */
  id?: string
  /** Field name. */
  name?: string
  /** Marks the field as invalid — propagates to control and error message. */
  isInvalid?: boolean
  /** Marks the field as required — propagates to label indicator. */
  isRequired?: boolean
  /** Marks the field as disabled — propagates to label opacity. */
  isDisabled?: boolean
  /** Marks the field as read-only. */
  isReadOnly?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * FormField — form composition root.
 *
 * Provides context for child sub-components:
 * - `FormLabel` → links to control via `htmlFor`
 * - `FormControl` → injects `id`, `aria-describedby`, `aria-invalid`
 * - `FormDescription` → registers its id for `aria-describedby`
 * - `FormMessage` → registers its id for `aria-describedby`, shows error
 *
 * This component is form-library-agnostic. It does NOT depend on
 * React Hook Form. For RHF integration, use `RHFFormField` from
 * `@/components/ui/form-adapters/rhf-form-field`.
 *
 * @example
 * ```tsx
 * <FormField name="email" isRequired isInvalid={!!errors.email}>
 *   <FormLabel>Email</FormLabel>
 *   <FormControl>
 *     <Input type="email" />
 *   </FormControl>
 *   <FormDescription>We'll never share your email.</FormDescription>
 *   <FormMessage>{errors.email?.message}</FormMessage>
 * </FormField>
 * ```
 */
export function FormField({
  id: propId,
  name,
  isInvalid,
  isRequired,
  isDisabled,
  isReadOnly,
  children,
  className,
}: FormFieldProps) {
  const autoId = React.useId()
  const id = propId ?? autoId

  const descriptionId = `${id}-description`
  const messageId = `${id}-message`

  return (
    <FormFieldContext.Provider
      value={{
        id,
        name,
        isInvalid,
        isRequired,
        isDisabled,
        isReadOnly,
        descriptionId,
        messageId,
      }}
    >
      <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>
    </FormFieldContext.Provider>
  )
}

FormField.displayName = 'FormField'

// ---------------------------------------------------------------------------
// FormLabel
// ---------------------------------------------------------------------------

export type FormLabelProps = React.ComponentPropsWithoutRef<
  typeof Label
>

/**
 * FormLabel — links to the associated control via context-derived `htmlFor`.
 *
 * Automatically inherits `required` and `disabled` from `FormField` context.
 * Do NOT pass `htmlFor` manually — it is derived from FormField's id.
 */
export function FormLabel({ className, ...props }: FormLabelProps) {
  const { id, isRequired, isDisabled } = useFormFieldContext()

  return (
    <Label
      htmlFor={id}
      required={isRequired}
      disabled={isDisabled}
      className={className}
      {...props}
    />
  )
}

FormLabel.displayName = 'FormLabel'

// ---------------------------------------------------------------------------
// FormControl
// ---------------------------------------------------------------------------

export interface FormControlProps {
  children: React.ReactElement
}

/**
 * FormControl — injects accessibility attributes into its single child.
 *
 * Injects: `id`, `aria-describedby`, `aria-invalid`, `aria-required`,
 *           `disabled`, `readOnly`.
 *
 * The child MUST accept and forward these as HTML attributes.
 * Works with `Input`, `Textarea`, `Checkbox`, `Select` trigger, etc.
 */
export function FormControl({ children }: FormControlProps) {
  const {
    id,
    isInvalid,
    isRequired,
    isDisabled,
    isReadOnly,
    descriptionId,
    messageId,
  } = useFormFieldContext()

  // Build aria-describedby: include both description and message ids.
  // They'll only be rendered when the elements actually exist in DOM,
  // but it's safe to include them always for stability.
  const ariaDescribedBy =
    [descriptionId, isInvalid ? messageId : undefined]
      .filter(Boolean)
      .join(' ') || undefined

  return React.cloneElement(children, {
    id,
    'aria-describedby': ariaDescribedBy || undefined,
    'aria-invalid': isInvalid ? ('true' as const) : undefined,
    'aria-required': isRequired ? ('true' as const) : undefined,
    // Merge with existing disabled/readOnly if already set on child
    disabled:
      isDisabled || (children.props as Record<string, unknown>)['disabled'],
    readOnly:
      isReadOnly || (children.props as Record<string, unknown>)['readOnly'],
  } as React.HTMLAttributes<HTMLElement>)
}

FormControl.displayName = 'FormControl'

// ---------------------------------------------------------------------------
// FormDescription
// ---------------------------------------------------------------------------

export type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * FormDescription — helper text shown below the control.
 *
 * Gets its `id` from context so FormControl can include it in `aria-describedby`.
 * Always rendered (not conditional) to keep the layout stable.
 */
export function FormDescription({
  className,
  children,
  ...props
}: FormDescriptionProps) {
  const { descriptionId } = useFormFieldContext()

  if (!children) return null

  return (
    <p
      id={descriptionId}
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    >
      {children}
    </p>
  )
}

FormDescription.displayName = 'FormDescription'

// ---------------------------------------------------------------------------
// FormMessage
// ---------------------------------------------------------------------------

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** The error message text. If falsy, renders nothing (no layout space taken). */
  children?: React.ReactNode
}

/**
 * FormMessage — displays validation error messages.
 *
 * - Uses `role="alert"` to announce errors to screen readers.
 * - Shows XCircle icon alongside text (not color-only, per WCAG 1.4.1).
 * - Gets its `id` from context so `aria-describedby` can link to it.
 * - Renders nothing when there's no error message (avoids layout shift).
 *
 * For layout-stable forms (when needed), wrap in a fixed-height container.
 */
export function FormMessage({
  className,
  children,
  ...props
}: FormMessageProps) {
  const { messageId } = useFormFieldContext()

  if (!children) return null

  return (
    <p
      id={messageId}
      role="alert"
      aria-live="polite"
      className={cn(
        'text-destructive flex items-center gap-1.5 text-xs font-medium',
        className
      )}
      {...props}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

FormMessage.displayName = 'FormMessage'

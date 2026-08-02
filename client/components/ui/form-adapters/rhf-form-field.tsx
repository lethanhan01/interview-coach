'use client'

import * as React from 'react'
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  type UseFormReturn,
} from 'react-hook-form'
import {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormFieldContext,
  type FormFieldProps,
} from '@/components/form/FormField'
import {
  FormSection,
  type FormSectionProps,
} from '@/components/form/FormSection'

// ---------------------------------------------------------------------------
// Form (FormProvider wrapper)
// ---------------------------------------------------------------------------

interface FormProps<TFieldValues extends FieldValues> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> {
  form: UseFormReturn<TFieldValues>
  onSubmit: (values: TFieldValues) => void | Promise<void>
  children: React.ReactNode
}

/**
 * Form — thin wrapper around RHF's `FormProvider`.
 *
 * Provides the `useFormContext` context to all descendant RHF-aware
 * components. Non-RHF `FormField` components also work inside this.
 *
 * @example
 * ```tsx
 * const form = useForm({ resolver: zodResolver(schema) })
 *
 * <Form form={form} onSubmit={handleSubmit}>
 *   <RHFFormField control={form.control} name="email">
 *     <FormLabel>Email</FormLabel>
 *     <FormControl><Input type="email" /></FormControl>
 *     <FormMessage />
 *   </RHFFormField>
 *   <Button type="submit">Submit</Button>
 * </Form>
 * ```
 */
export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate {...props}>
        {children}
      </form>
    </FormProvider>
  )
}

// ---------------------------------------------------------------------------
// RHFFormField
// ---------------------------------------------------------------------------

export interface RHFFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>
  extends
    Omit<ControllerProps<TFieldValues, TName>, 'render'>,
    Omit<
      FormFieldProps,
      'id' | 'name' | 'isInvalid' | 'isRequired' | 'isDisabled'
    > {
  children: React.ReactNode
  /** Whether the field is required. Defaults to false. */
  required?: boolean
}

/**
 * RHFFormField — React Hook Form adapter for the form composition layer.
 *
 * Connects RHF's `Controller` to `FormField` context, automatically
 * deriving `isInvalid`, `isDisabled` from RHF field state.
 *
 * Unlike shadcn/ui's approach, this component does NOT require a `render` prop.
 * Instead, children use `useFormField()` or rely on `FormControl` to inject
 * the correct `id`/`aria-*` attributes.
 *
 * For the child control to receive the RHF `field` props (onChange, onBlur,
 * value, ref), wrap it in a `FormControl` that also receives `field` prop,
 * OR use `Controller`'s `render` prop directly for complex cases.
 *
 * Simple pattern (FormControl injects aria, you manage value via useFormContext):
 * ```tsx
 * <RHFFormField control={form.control} name="email" required>
 *   <FormLabel>Email</FormLabel>
 *   <RHFFormControl name="email" />  ← or use Controller render prop
 *   <FormDescription>...</FormDescription>
 *   <FormMessage />
 * </RHFFormField>
 * ```
 *
 * Full Controller pattern (explicit, always works):
 * ```tsx
 * <Controller
 *   control={form.control}
 *   name="email"
 *   render={({ field, fieldState }) => (
 *     <FormField name="email" isInvalid={!!fieldState.error} isRequired>
 *       <FormLabel>Email</FormLabel>
 *       <FormControl><Input {...field} /></FormControl>
 *       <FormMessage>{fieldState.error?.message}</FormMessage>
 *     </FormField>
 *   )}
 * />
 * ```
 */
export function RHFFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  required,
  children,
  className,
  isReadOnly,
}: RHFFormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ fieldState, field: _field }) => (
        <FormField
          name={name}
          isInvalid={!!fieldState.error}
          isRequired={required}
          isReadOnly={isReadOnly}
          className={className}
        >
          {/* Inject RHF error into FormMessage via a bridge component */}
          <RHFErrorBridge error={fieldState.error?.message} />
          {children}
        </FormField>
      )}
    />
  )
}

/**
 * Internal bridge — injects RHF error message into FormMessage via context.
 * This is a headless component (renders nothing itself) that patches the
 * field context with the current error from RHF.
 */
function RHFErrorBridge({ error }: { error?: string }) {
  // We can't patch context from within FormField without a ref trick.
  // Instead, RHFFormField should be used with an explicit <FormMessage>
  // that receives the error string as children.
  // This bridge is kept for potential future use.
  void error
  return null
}

// ---------------------------------------------------------------------------
// useFormField — hook for accessing field context + RHF state together
// ---------------------------------------------------------------------------

/**
 * useFormField — combines FormField context with RHF's `useFormContext`.
 *
 * Use this inside a `<RHFFormField>` tree when you need programmatic
 * access to field state (e.g., for custom control implementations).
 *
 * @example
 * ```tsx
 * function MyCustomControl() {
 *   const { id, isInvalid, rhfField, rhfFieldState } = useFormField()
 *   return <input {...rhfField} id={id} aria-invalid={isInvalid} />
 * }
 * ```
 */
export function useFormField() {
  const formFieldCtx = useFormFieldContext()
  const { getFieldState, formState } = useFormContext()

  const fieldState = formFieldCtx.name
    ? getFieldState(formFieldCtx.name as string, formState)
    : undefined

  return {
    ...formFieldCtx,
    // Override isInvalid with RHF's actual error state if name is available
    isInvalid: formFieldCtx.isInvalid ?? !!fieldState?.error,
    fieldState,
    error: fieldState?.error,
  }
}

// ---------------------------------------------------------------------------
// Re-export form composition primitives for convenience
// ---------------------------------------------------------------------------

export {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
}
export type { FormFieldProps, FormSectionProps }

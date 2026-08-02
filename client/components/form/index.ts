/**
 * Form composition layer — form-library-agnostic components.
 *
 * These components work with any state management approach (controlled,
 * uncontrolled, custom hooks). They do NOT depend on React Hook Form.
 *
 * For React Hook Form integration, use:
 *   `@/components/ui/form-adapters/rhf-form-field`
 */
export {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormFieldContext,
} from './FormField'
export type {
  FormFieldProps,
  FormLabelProps,
  FormControlProps,
  FormDescriptionProps,
  FormMessageProps,
} from './FormField'

export { FormSection } from './FormSection'
export type { FormSectionProps } from './FormSection'

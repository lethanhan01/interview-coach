/**
 * Shared runtime constants and helpers for the interview setup flow.
 * Used by both `components/interview-setup/*` and `app/(candidate)/setup/page.tsx`.
 */
import type { JdFormData } from '@/types'

export const EMPTY_JD: JdFormData = {
  company: '',
  website: '',
  position: '',
  level: '',
  headcount: '',
  location: '',
  requirements: '',
  jobContent: '',
  techStack: [],
  benefits: '',
  salary: '',
  bonus: '',
}

export function isJdValid(form: JdFormData): boolean {
  return (
    form.company.trim().length > 0 &&
    form.position.trim().length > 0 &&
    form.level.trim().length > 0 &&
    form.requirements.trim().length >= 30 &&
    form.jobContent.trim().length >= 30
  )
}

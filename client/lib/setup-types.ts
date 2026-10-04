/**
 * Shared types and constants for the interview setup flow.
 * Used by both `components/setup/*` and `app/(candidate)/setup/page.tsx`.
 */

// ── Duration ──────────────────────────────────────────────────────────────────

export type InterviewDuration = 30 | 60 | 90

export const DURATION_OPTIONS: {
  value: InterviewDuration
  label: string
  numQuestions: number
}[] = [
  { value: 30, label: '30 phút', numQuestions: 15 },
  { value: 60, label: '1 tiếng', numQuestions: 30 },
  { value: 90, label: '1 tiếng rưỡi', numQuestions: 45 },
]

// ── JD Form ───────────────────────────────────────────────────────────────────

export interface JdFormData {
  company: string
  website: string
  position: string
  level: string
  headcount: string
  location: string
  requirements: string
  jobContent: string
  techStack: string[]
  benefits: string
  salary: string
  bonus: string
  onetSocCode?: string
  onetOccupationTitle?: string
  targetSfiaLevel?: number
}

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

/**
 * Ánh xạ thâm niên/level từ form JD sang Cấp bậc SFIA Version 9 (Level 1-7) mặc định.
 */
export function mapJdLevelToSfia(level: string): number {
  const norm = (level || '').toLowerCase().trim()
  if (norm.includes('intern') || norm.includes('fresher') || norm.includes('thực tập')) return 1
  if (norm.includes('junior') || norm.includes('associate') || norm.includes('entry')) return 2
  if (norm.includes('senior') || norm.includes('sr') || norm.includes('cao cấp')) return 4
  if (
    norm.includes('lead') ||
    norm.includes('manager') ||
    norm.includes('director') ||
    norm.includes('principal') ||
    norm.includes('architect') ||
    norm.includes('trưởng nhóm')
  ) {
    return 5
  }
  if (norm.includes('middle') || norm.includes('mid')) return 3
  return 3
}

import { z } from 'zod'
import { fromMantineMonthDate } from '@/lib/date-time'
import type { CandidateProfileData } from '@/types'

export type ResumeSectionId =
  | 'career'
  | 'personality'
  | 'education'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'certifications'

export const RESUME_SECTION_IDS: readonly ResumeSectionId[] = [
  'career',
  'personality',
  'education',
  'skills',
  'experience',
  'projects',
  'certifications',
] as const

export function isValidResumeSection(
  value: string | null | undefined
): value is ResumeSectionId {
  if (!value) return false
  return (RESUME_SECTION_IDS as readonly string[]).includes(value)
}

export function isSectionCompleted(
  sectionId: ResumeSectionId,
  profile: CandidateProfileData | null | undefined
): boolean {
  if (!profile) return false
  switch (sectionId) {
    case 'career':
      return Boolean(
        profile.targetPosition?.trim() ||
        profile.onetOccupationTitle?.trim() ||
        profile.targetLevel?.trim()
      )
    case 'personality':
      return Boolean(profile.personality?.trim())
    case 'education':
      return Boolean(
        profile.education &&
        (profile.education.school?.trim() || profile.education.major?.trim())
      )
    case 'skills':
      return (
        Array.isArray(profile.technicalSkills) &&
        profile.technicalSkills.length > 0
      )
    case 'experience':
      return (
        Array.isArray(profile.workExperience) &&
        profile.workExperience.length > 0
      )
    case 'projects':
      return Array.isArray(profile.projects) && profile.projects.length > 0
    case 'certifications':
      return Boolean(
        (Array.isArray(profile.certifications) &&
          profile.certifications.length > 0) ||
        (Array.isArray(profile.awards) && profile.awards.length > 0)
      )
  }
}

const YM_RE = /^(\d{4})-(0[1-9]|1[0-2])$/
const ISO_RE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const HTTP_URL_RE = /^https?:\/\/.+/i
const GRAD_YEAR_RE = /^$|^(19[5-9]\d|20[0-3]\d)$/

export function formatResumeMonth(value?: string | null): string {
  if (!value) return '—'
  const trimmed = value.trim()
  const ym = YM_RE.exec(trimmed)
  if (ym) return `${ym[2]}/${ym[1]}`
  const iso = ISO_RE.exec(trimmed)
  if (iso) return `${iso[2]}/${iso[1]}`
  return trimmed || '—'
}

export function formatResumeFullDate(value?: string | null): string {
  if (!value) return ''
  const trimmed = value.trim()
  const iso = ISO_RE.exec(trimmed)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const ym = YM_RE.exec(trimmed)
  if (ym) return `${ym[2]}/${ym[1]}`
  return trimmed
}

export function formatResumeDateRange(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean
): string {
  const start = formatResumeMonth(startDate)
  const end = isCurrent ? 'Hiện tại' : formatResumeMonth(endDate)
  return `${start} → ${end}`
}

export const careerInfoSchema = z.object({
  targetPosition: z.string().trim().max(100, 'Tối đa 100 ký tự'),
  targetLevel: z.string().trim().max(100, 'Tối đa 100 ký tự'),
  onetSocCode: z.string().trim().max(10, 'Tối đa 10 ký tự').optional(),
  onetOccupationTitle: z
    .string()
    .trim()
    .max(255, 'Tối đa 255 ký tự')
    .optional(),
  targetSfiaLevel: z.number().int().min(1).max(7).optional(),
})

export type CareerInfoFormValues = z.infer<typeof careerInfoSchema>

export const educationSchema = z.object({
  degree: z.string().trim().max(60, 'Tối đa 60 ký tự'),
  school: z.string().trim().max(160, 'Tối đa 160 ký tự'),
  major: z.string().trim().max(160, 'Tối đa 160 ký tự'),
  gpa: z.string().trim().max(20, 'Tối đa 20 ký tự'),
  graduationYear: z
    .string()
    .trim()
    .regex(GRAD_YEAR_RE, 'Năm tốt nghiệp gồm 4 chữ số hợp lệ (1950–2039)'),
})

export type EducationFormValues = z.infer<typeof educationSchema>

export const workExperienceItemSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên công ty')
      .max(160, 'Tối đa 160 ký tự'),
    position: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập vị trí')
      .max(160, 'Tối đa 160 ký tự'),
    startDate: z
      .string()
      .nullable()
      .refine((v) => Boolean(v && fromMantineMonthDate(v)), {
        message: 'Vui lòng chọn tháng bắt đầu',
      }),
    endDate: z.string().nullable(),
    isCurrent: z.boolean(),
    description: z.string(),
    techStack: z.array(z.string()),
  })
  .refine(
    (v) => {
      if (v.isCurrent || !v.endDate || !v.startDate) return true
      return (
        fromMantineMonthDate(v.endDate) >= fromMantineMonthDate(v.startDate)
      )
    },
    {
      path: ['endDate'],
      message: 'Tháng kết thúc phải sau hoặc bằng tháng bắt đầu',
    }
  )

export type WorkExperienceFormValues = z.infer<typeof workExperienceItemSchema>

export const projectItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên dự án')
      .max(160, 'Tối đa 160 ký tự'),
    url: z
      .string()
      .trim()
      .max(300, 'Tối đa 300 ký tự')
      .refine(
        (v) => !v || HTTP_URL_RE.test(v),
        'Link dự án cần bắt đầu bằng http:// hoặc https://'
      ),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    isCurrent: z.boolean(),
    description: z.string(),
    techStack: z.array(z.string()),
  })
  .refine(
    (v) => {
      if (v.isCurrent || !v.endDate || !v.startDate) return true
      return (
        fromMantineMonthDate(v.endDate) >= fromMantineMonthDate(v.startDate)
      )
    },
    {
      path: ['endDate'],
      message: 'Tháng kết thúc phải sau hoặc bằng tháng bắt đầu',
    }
  )

export type ProjectFormValues = z.infer<typeof projectItemSchema>

export const certificationItemSchema = z
  .object({
    type: z.enum(['professional', 'language']),
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên chứng chỉ')
      .max(160, 'Tối đa 160 ký tự'),
    issuer: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập đơn vị cấp')
      .max(160, 'Tối đa 160 ký tự'),
    issueDate: z.string().nullable(),
    expiryDate: z.string().nullable(),
    score: z.string().trim().max(40, 'Tối đa 40 ký tự'),
  })
  .refine(
    (v) => {
      if (!v.issueDate || !v.expiryDate) return true
      return v.expiryDate >= v.issueDate
    },
    {
      path: ['expiryDate'],
      message: 'Ngày hết hạn phải sau hoặc bằng ngày cấp',
    }
  )

export type CertificationFormValues = z.infer<typeof certificationItemSchema>

export const awardItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên giải thưởng')
    .max(160, 'Tối đa 160 ký tự'),
  organization: z.string().trim().max(160, 'Tối đa 160 ký tự'),
  date: z.string().nullable(),
  description: z.string(),
})

export type AwardFormValues = z.infer<typeof awardItemSchema>

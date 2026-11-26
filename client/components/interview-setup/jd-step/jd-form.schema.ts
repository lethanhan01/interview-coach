import { z } from 'zod'
import { EMPTY_JD } from '@/lib/setup-helpers'
import type { JdFormData } from '@/types'

const HTTP_URL_RE = /^https?:\/\/.+/i

export const jdFormSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên công ty')
    .max(160, 'Tối đa 160 ký tự'),
  website: z
    .string()
    .trim()
    .max(300, 'Tối đa 300 ký tự')
    .refine(
      (val) => !val || HTTP_URL_RE.test(val),
      'Website cần bắt đầu bằng http:// hoặc https://'
    ),
  position: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn vị trí')
    .max(160, 'Tối đa 160 ký tự'),
  level: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn level yêu cầu')
    .max(40, 'Tối đa 40 ký tự'),
  headcount: z.string().trim().max(80, 'Tối đa 80 ký tự'),
  location: z.string().trim().max(160, 'Tối đa 160 ký tự'),
  requirements: z.string().trim().min(30, 'Tối thiểu 30 ký tự'),
  jobContent: z.string().trim().min(30, 'Tối thiểu 30 ký tự'),
  techStack: z.array(z.string()),
  benefits: z.string(),
  salary: z.string().trim().max(120, 'Tối đa 120 ký tự'),
  bonus: z.string().trim().max(120, 'Tối đa 120 ký tự'),
  onetSocCode: z.string().optional(),
  onetOccupationTitle: z.string().optional(),
  targetSfiaLevel: z.number().int().min(1).max(7).optional(),
})

const jdDraftRawSchema = z.object({
  company: z.unknown().optional(),
  website: z.unknown().optional(),
  position: z.unknown().optional(),
  level: z.unknown().optional(),
  headcount: z.unknown().optional(),
  location: z.unknown().optional(),
  requirements: z.unknown().optional(),
  jobContent: z.unknown().optional(),
  techStack: z.unknown().optional(),
  benefits: z.unknown().optional(),
  salary: z.unknown().optional(),
  bonus: z.unknown().optional(),
  onetSocCode: z.unknown().optional(),
  onetOccupationTitle: z.unknown().optional(),
  targetSfiaLevel: z.unknown().optional(),
})

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function normalizeJdFormData(
  value: Partial<Record<keyof JdFormData, unknown>> | null | undefined
): JdFormData {
  const level = toText(value?.level)
  const targetSfia =
    typeof value?.targetSfiaLevel === 'number' &&
    Number.isInteger(value.targetSfiaLevel) &&
    value.targetSfiaLevel >= 1 &&
    value.targetSfiaLevel <= 7
      ? value.targetSfiaLevel
      : undefined

  return {
    company: toText(value?.company),
    website: toText(value?.website),
    position: toText(value?.position),
    level,
    headcount: toText(value?.headcount),
    location: toText(value?.location),
    requirements: toText(value?.requirements),
    jobContent: toText(value?.jobContent),
    techStack: toStringArray(value?.techStack),
    benefits: toText(value?.benefits),
    salary: toText(value?.salary),
    bonus: toText(value?.bonus),
    onetSocCode: value?.onetSocCode ? toText(value.onetSocCode) : undefined,
    onetOccupationTitle: value?.onetOccupationTitle
      ? toText(value.onetOccupationTitle)
      : undefined,
    targetSfiaLevel: targetSfia,
  }
}

export function parseJdDraft(rawJson: string | null): JdFormData {
  if (!rawJson) return EMPTY_JD
  try {
    const parsed: unknown = JSON.parse(rawJson)
    const result = jdDraftRawSchema.safeParse(parsed)
    if (!result.success) return EMPTY_JD
    return normalizeJdFormData(result.data)
  } catch {
    return EMPTY_JD
  }
}

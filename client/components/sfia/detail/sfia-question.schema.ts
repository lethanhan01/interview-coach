import { z } from 'zod'
import type { SfiaLevelResponsibility } from '@/types'

export const STATIC_SFIA_QUERY_SCOPES = new Set([
  'categories',
  'subcategories',
  'levels',
  'attributes',
])

export function isDynamicSfiaQuery(query: {
  queryKey: readonly unknown[]
}): boolean {
  const scope = query.queryKey[1]
  return typeof scope !== 'string' || !STATIC_SFIA_QUERY_SCOPES.has(scope)
}

export function createInitialQuestionValues(
  minLevel: number,
  maxLevel: number,
  defaultLevel: number
): SfiaQuestionFormValues {
  return {
    targetSfiaLevel: clampSfiaLevel(minLevel, maxLevel, defaultLevel),
    type: 'TECHNICAL',
    difficulty: 'MEDIUM',
    questionText: '',
  }
}

export function clampSfiaLevel(
  minLevel: number,
  maxLevel: number,
  level: number
): string {
  return String(Math.max(minLevel, Math.min(maxLevel, level)))
}

export function buildAvailableLevelOptions(
  minLevel: number,
  maxLevel: number,
  levels?: SfiaLevelResponsibility[]
): { value: string; label: string }[] {
  return Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => {
    const lvl = minLevel + i
    const levelMeta = levels?.find((l) => l.levelId === lvl)
    const levelName = levelMeta?.nameVi || levelMeta?.name
    return {
      value: String(lvl),
      label: levelName ? `L${lvl} — ${levelName}` : `Cấp L${lvl}`,
    }
  })
}

export const SFIA_QUESTION_INTERVIEW_TYPES: { value: string; label: string }[] =
  [
    { value: 'TECHNICAL', label: 'Chuyên môn (Technical)' },
    { value: 'BEHAVIORAL', label: 'Hành vi (Behavioral)' },
    { value: 'SITUATIONAL', label: 'Tình huống (Situational)' },
    { value: 'HR', label: 'Nhân sự (HR / Cultural)' },
  ]

export const SFIA_QUESTION_DIFFICULTIES: { value: string; label: string }[] = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
]

const requiredNumber = (requiredMsg: string) =>
  z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z
      .number({ error: requiredMsg })
      .refine((n) => !Number.isNaN(n), requiredMsg)
  )

export function createSfiaQuestionSchema(minLevel: number, maxLevel: number) {
  return z.object({
    targetSfiaLevel: requiredNumber('Vui lòng chọn cấp độ SFIA').pipe(
      z
        .number()
        .int('Cấp độ phải là số nguyên')
        .min(minLevel, `Cấp độ hợp lệ từ L${minLevel} đến L${maxLevel}`)
        .max(maxLevel, `Cấp độ hợp lệ từ L${minLevel} đến L${maxLevel}`)
    ),
    type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'SITUATIONAL', 'HR']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    questionText: z
      .string()
      .trim()
      .min(15, 'Nội dung câu hỏi cần tối thiểu 15 ký tự.')
      .max(500, 'Nội dung câu hỏi không được vượt quá 500 ký tự.'),
  })
}

export interface SfiaQuestionFormValues {
  targetSfiaLevel: string
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  questionText: string
}

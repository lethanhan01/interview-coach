import { z } from 'zod'
import type { SfiaSkillDefinition } from '@/types'

const requiredNumber = (requiredMsg: string) =>
  z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z
      .number({ error: requiredMsg })
      .refine((n) => !Number.isNaN(n), requiredMsg)
  )

export function createOnetSfiaMappingSchema(minLevel = 1, maxLevel = 7) {
  return z.object({
    skillCode: z.string().trim().min(1, 'Vui lòng chọn một kỹ năng SFIA'),
    targetLevel: requiredNumber('Vui lòng chọn cấp độ SFIA').pipe(
      z
        .number()
        .int('Cấp độ phải là số nguyên')
        .min(minLevel, `Cấp độ tối thiểu cho kỹ năng này là L${minLevel}`)
        .max(maxLevel, `Cấp độ tối đa cho kỹ năng này là L${maxLevel}`)
    ),
    weight: requiredNumber('Vui lòng nhập trọng số').pipe(
      z
        .number()
        .min(0.1, 'Trọng số tối thiểu là 0.1')
        .max(5.0, 'Trọng số tối đa là 5.0')
    ),
    isCore: z.boolean(),
  })
}

export interface OnetSfiaMappingFormValues {
  skillCode: string
  targetLevel: number | string
  weight: number | string
  isCore: boolean
}

export function buildSfiaSkillSelectData(skills: SfiaSkillDefinition[]) {
  const grouped = new Map<string, Array<{ value: string; label: string }>>()
  for (const skill of skills) {
    const groupName = skill.category || 'Tổng quát'
    const list = grouped.get(groupName) ?? []
    list.push({
      value: skill.code,
      label: `${skill.code} — ${skill.name} (L${skill.minLevel}..L${skill.maxLevel})`,
    })
    grouped.set(groupName, list)
  }
  return Array.from(grouped.entries()).map(([group, items]) => ({
    group,
    items,
  }))
}

export function mapMappingServerFieldErrors(
  message: string
): Record<string, string> {
  if (/cấp độ|level/i.test(message)) return { targetLevel: message }
  if (/trọng số|weight/i.test(message)) return { weight: message }
  if (/kỹ năng|skill|tồn tại|duplicate/i.test(message)) {
    return { skillCode: message }
  }
  return {}
}

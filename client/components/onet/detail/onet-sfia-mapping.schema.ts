import { z } from 'zod'

export function createOnetSfiaMappingSchema(minLevel = 1, maxLevel = 7) {
  return z.object({
    skillCode: z.string().min(1, 'Vui lòng chọn một kỹ năng SFIA'),
    targetLevel: z.coerce
      .number({ message: 'Cấp độ phải là số' })
      .int('Cấp độ phải là số nguyên')
      .min(minLevel, `Cấp độ tối thiểu của kỹ năng này là ${minLevel}`)
      .max(maxLevel, `Cấp độ tối đa của kỹ năng này là ${maxLevel}`),
    weight: z.coerce
      .number({ message: 'Trọng số phải là số' })
      .min(0.1, 'Trọng số tối thiểu là 0.1')
      .max(5.0, 'Trọng số tối đa là 5.0'),
    isCore: z.boolean().default(true),
  })
}

export type OnetSfiaMappingFormValues = z.infer<
  ReturnType<typeof createOnetSfiaMappingSchema>
>

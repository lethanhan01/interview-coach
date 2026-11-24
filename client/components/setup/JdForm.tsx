'use client'

import { useState } from 'react'
import { Stack } from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import type { JdFormData } from '@/types'
import { jdFormSchema, normalizeJdFormData } from './jd-form.schema'
import JdBasicInfoFields from './JdBasicInfoFields'
import JdDetailsFields from './JdDetailsFields'
import JdTechStackField from './JdTechStackField'

export interface JdFormProps {
  value: JdFormData
  onChange: (data: JdFormData) => void
}

export default function JdForm({ value, onChange }: Readonly<JdFormProps>) {
  const [snapshot, setSnapshot] = useState<JdFormData>(() =>
    normalizeJdFormData(value)
  )

  const form = useForm<JdFormData>({
    mode: 'uncontrolled',
    initialValues: normalizeJdFormData(value),
    validateInputOnBlur: true,
    validate: schemaResolver(jdFormSchema, { sync: true }),
    onValuesChange: (values) => {
      const normalized = normalizeJdFormData(values)
      setSnapshot(normalized)
      onChange(normalized)
    },
  })

  return (
    <Stack gap="md">
      <JdBasicInfoFields
        form={form}
        onetSocCode={snapshot.onetSocCode}
        onetOccupationTitle={snapshot.onetOccupationTitle}
        currentPosition={snapshot.position}
      />

      <JdDetailsFields
        form={form}
        requirementsLength={snapshot.requirements.trim().length}
        jobContentLength={snapshot.jobContent.trim().length}
        techStackSlot={
          <JdTechStackField
            techStack={snapshot.techStack}
            onetSocCode={snapshot.onetSocCode}
            onetOccupationTitle={snapshot.onetOccupationTitle}
            onChange={(next) => form.setFieldValue('techStack', next)}
          />
        }
      />
    </Stack>
  )
}

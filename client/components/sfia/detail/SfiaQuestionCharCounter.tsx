'use client'

import { useState } from 'react'
import { Group, Text } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { SfiaQuestionFormValues } from './sfia-question.schema'

export interface SfiaQuestionCharCounterProps {
  form: UseFormReturnType<SfiaQuestionFormValues>
}

export function SfiaQuestionCharCounter({
  form,
}: Readonly<SfiaQuestionCharCounterProps>) {
  const [charCount, setCharCount] = useState(
    () => form.getValues().questionText.trim().length
  )

  form.watch('questionText', ({ value }) => {
    setCharCount(typeof value === 'string' ? value.trim().length : 0)
  })

  const isInvalidLength = charCount > 500 || (charCount > 0 && charCount < 15)

  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">
        Yêu cầu tối thiểu 15 ký tự, tối đa 500 ký tự.
      </Text>
      <Text size="xs" fw={600} c={isInvalidLength ? 'danger' : 'dimmed'}>
        {charCount} / 500
      </Text>
    </Group>
  )
}

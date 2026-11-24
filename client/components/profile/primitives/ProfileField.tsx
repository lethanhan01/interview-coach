import type { ReactNode } from 'react'
import { Stack, Text } from '@mantine/core'

export interface ProfileFieldProps {
  label: string
  value?: ReactNode
  emptyValue?: ReactNode
  className?: string
}

export default function ProfileField({
  label,
  value,
  emptyValue = '—',
  className,
}: Readonly<ProfileFieldProps>) {
  const displayValue =
    value === null || value === undefined || value === '' ? emptyValue : value

  return (
    <Stack gap={2} className={className}>
      <Text component="dt" size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      <Text component="dd" size="sm" m={0}>
        {displayValue}
      </Text>
    </Stack>
  )
}

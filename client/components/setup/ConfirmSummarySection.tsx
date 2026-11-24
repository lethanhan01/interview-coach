'use client'

import type { ReactNode } from 'react'
import { Group, Paper, Stack, Text } from '@mantine/core'
import type { ContextPack, SessionType } from '@/types'
import classes from './ConfirmStep.module.css'

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
}

export const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Western',
}

export const SFIA_LEVEL_DESCRIPTIONS: Record<
  number,
  { title: string; subtitle: string }
> = {
  1: { title: 'SFIA Level 1', subtitle: 'Thực thi cơ bản (Intern / Fresher)' },
  2: { title: 'SFIA Level 2', subtitle: 'Thực thi có hướng dẫn (Junior)' },
  3: { title: 'SFIA Level 3', subtitle: 'Chủ động áp dụng (Middle)' },
  4: { title: 'SFIA Level 4', subtitle: 'Chuyên sâu độc lập (Senior)' },
  5: {
    title: 'SFIA Level 5',
    subtitle: 'Dẫn dắt & Định hướng (Lead / Manager)',
  },
  6: { title: 'SFIA Level 6', subtitle: 'Khởi xướng chiến lược (Director)' },
  7: {
    title: 'SFIA Level 7',
    subtitle: 'Định hình chiến lược tổ chức (Executive)',
  },
}

export const SFIA_SELECT_DATA = [1, 2, 3, 4, 5, 6, 7].map((lvl) => ({
  value: String(lvl),
  label: `${SFIA_LEVEL_DESCRIPTIONS[lvl].title} — ${SFIA_LEVEL_DESCRIPTIONS[lvl].subtitle}`,
}))

export function SummaryRow({
  label,
  value,
  children,
}: Readonly<{ label: string; value?: string; children?: ReactNode }>) {
  return (
    <Group justify="space-between" align="center" gap="sm" wrap="wrap" py={4}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {children ?? (
        <Text size="sm" fw={500}>
          {value}
        </Text>
      )}
    </Group>
  )
}

export function SummarySection({
  title,
  icon,
  children,
}: Readonly<{ title: string; icon?: ReactNode; children: ReactNode }>) {
  return (
    <Stack gap={6}>
      <Group gap={6} wrap="nowrap">
        {icon}
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          {title}
        </Text>
      </Group>
      <Paper withBorder radius="md" p="md" className={classes.sectionCard}>
        <Stack gap="xs">{children}</Stack>
      </Paper>
    </Stack>
  )
}

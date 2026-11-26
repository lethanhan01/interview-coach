'use client'

import type { ReactNode } from 'react'
import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'

export function CatalogErrorAlert({
  onRetry,
}: Readonly<{ onRetry: () => void }>) {
  return (
    <Alert
      color="danger"
      variant="light"
      role="alert"
      title="Không thể tải danh mục cấu hình"
      icon={<IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />}
    >
      <Button
        type="button"
        variant="light"
        color="danger"
        size="xs"
        mt="xs"
        onClick={onRetry}
      >
        Thử lại
      </Button>
    </Alert>
  )
}

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
      <Paper withBorder radius="md" p="md" className={surfaces.subtleSurface}>
        <Stack gap="xs">{children}</Stack>
      </Paper>
    </Stack>
  )
}

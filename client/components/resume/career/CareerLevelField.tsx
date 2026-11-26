'use client'

import {
  Alert,
  Button,
  Group,
  Select,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { mapJdLevelToSfia } from '@/lib/interview-option-helpers'
import type { JdLevelOption } from '@/types'

export interface CareerLevelFieldProps {
  value: string
  error?: React.ReactNode
  jdLevels: readonly JdLevelOption[]
  isPending: boolean
  isError: boolean
  disabled?: boolean
  onRetry: () => void
  onChange: (value: string | null) => void
}

export default function CareerLevelField({
  value,
  error,
  jdLevels,
  isPending,
  isError,
  disabled = false,
  onRetry,
  onChange,
}: Readonly<CareerLevelFieldProps>) {
  if (isPending) {
    return (
      <Stack gap={4}>
        <Text size="sm" fw={500}>
          Mức kinh nghiệm
        </Text>
        <Skeleton h={36} radius="sm" />
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert
        color="danger"
        variant="light"
        role="alert"
        title="Không thể tải danh mục cấu hình"
        icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
      >
        <Stack gap="xs">
          <Text size="sm">
            Không thể tải danh sách mức kinh nghiệm từ máy chủ.
          </Text>
          <Group>
            <Button
              type="button"
              size="xs"
              variant="light"
              color="danger"
              onClick={onRetry}
            >
              Thử lại
            </Button>
          </Group>
        </Stack>
      </Alert>
    )
  }

  const levelSelectData = [
    ...(value && !jdLevels.some((o) => o.value === value)
      ? [{ value, label: `Giá trị hiện tại: ${value}` }]
      : []),
    ...jdLevels.map((o) => ({
      value: o.value,
      label: `${o.label} (SFIA Level ${o.defaultSfiaLevel})`,
    })),
  ]

  const mappedSfia = value ? mapJdLevelToSfia(value, jdLevels) : undefined

  return (
    <Select
      id="target-level"
      clearable
      label="Mức kinh nghiệm"
      placeholder="Chọn mức kinh nghiệm"
      description={
        mappedSfia !== undefined
          ? `Ánh xạ SFIA Level: ${mappedSfia}`
          : undefined
      }
      data={levelSelectData}
      value={value || null}
      error={error}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

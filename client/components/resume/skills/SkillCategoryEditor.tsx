'use client'

import { useMemo } from 'react'
import {
  Autocomplete,
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconPlus } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { onetQueries } from '@/queries/onet.queries'

export interface SkillCategoryEditorProps {
  customName: string
  customMonths: number | string
  disabled?: boolean
  onNameChange: (value: string) => void
  onMonthsChange: (value: number | string) => void
  onAdd: () => void
}

export default function SkillCategoryEditor({
  customName,
  customMonths,
  disabled = false,
  onNameChange,
  onMonthsChange,
  onAdd,
}: Readonly<SkillCategoryEditorProps>) {
  const [debouncedQuery] = useDebouncedValue(customName.trim(), 250)
  const techQuery = useQuery(onetQueries.technologies(debouncedQuery, 30))

  const techSuggestions = useMemo(
    () =>
      Array.from(
        new Set((techQuery.data ?? []).map((t) => t.example).filter(Boolean))
      ),
    [techQuery.data]
  )

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Thêm kỹ năng từ O*NET hoặc nhập tự do
        </Text>

        <Group align="flex-end" gap="sm" wrap="wrap">
          <Autocomplete
            flex={1}
            miw={200}
            size="sm"
            label="Tên kỹ năng"
            placeholder="VD: React, Docker, Python..."
            data={techSuggestions}
            value={customName}
            disabled={disabled}
            onChange={onNameChange}
          />

          <NumberInput
            w={{ base: '100%', sm: 120 }}
            size="sm"
            label="Số tháng"
            placeholder="12"
            min={0}
            max={600}
            allowDecimal={false}
            value={customMonths}
            disabled={disabled}
            onChange={onMonthsChange}
          />

          <Button
            type="button"
            color="brand"
            size="sm"
            disabled={disabled || !customName.trim()}
            leftSection={<IconPlus size={15} stroke={1.5} aria-hidden="true" />}
            onClick={onAdd}
          >
            Thêm
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

'use client'

import { useMemo } from 'react'
import {
  Autocomplete,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { TECH_CATEGORIES, TECH_OPTIONS, type TechCategory } from './constants'

const CATEGORY_SELECT_DATA = TECH_CATEGORIES.map((cat) => ({
  value: cat.key,
  label: cat.label,
}))

export function detectTechCategory(techName: string): TechCategory {
  const clean = techName.trim().toLowerCase()
  for (const cat of TECH_CATEGORIES) {
    const options = TECH_OPTIONS[cat.key]
    if (options && options.some((o) => o.toLowerCase() === clean)) {
      return cat.key
    }
  }
  if (
    clean.includes('sql') ||
    clean.includes('db') ||
    clean.includes('mongo') ||
    clean.includes('redis') ||
    clean.includes('oracle')
  )
    return 'database'
  if (
    clean.includes('cloud') ||
    clean.includes('aws') ||
    clean.includes('azure') ||
    clean.includes('docker') ||
    clean.includes('k8s') ||
    clean.includes('kubernetes') ||
    clean.includes('gcp')
  )
    return 'platform'
  if (
    clean.includes('git') ||
    clean.includes('jira') ||
    clean.includes('jenkins') ||
    clean.includes('test') ||
    clean.includes('ci/cd') ||
    clean.includes('postman') ||
    clean.includes('figma')
  )
    return 'devtool'
  if (
    clean.includes('linux') ||
    clean.includes('windows') ||
    clean.includes('os') ||
    clean.includes('rtos') ||
    clean.includes('unix')
  )
    return 'os'
  if (
    clean.includes('script') ||
    clean.includes('python') ||
    clean.includes('java') ||
    clean.includes('golang') ||
    clean.includes('rust')
  )
    return 'language'
  return 'framework'
}

export interface SkillCategoryEditorProps {
  customName: string
  customCategory: TechCategory
  customMonths: number | string
  disabled?: boolean
  onNameChange: (value: string) => void
  onCategoryChange: (value: TechCategory) => void
  onMonthsChange: (value: number | string) => void
  onAdd: () => void
}

export default function SkillCategoryEditor({
  customName,
  customCategory,
  customMonths,
  disabled = false,
  onNameChange,
  onCategoryChange,
  onMonthsChange,
  onAdd,
}: Readonly<SkillCategoryEditorProps>) {
  const allSuggestions = useMemo(
    () => Array.from(new Set(Object.values(TECH_OPTIONS).flat())),
    []
  )

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Thêm kỹ năng vào hồ sơ
        </Text>
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Autocomplete
            flex={1}
            miw={180}
            size="sm"
            label="Tên kỹ năng"
            placeholder="VD: React, Docker, Python..."
            data={allSuggestions}
            value={customName}
            disabled={disabled}
            onChange={onNameChange}
          />

          <Select
            w={{ base: '100%', sm: 190 }}
            size="sm"
            label="Danh mục"
            aria-label="Danh mục kỹ năng"
            data={CATEGORY_SELECT_DATA}
            value={customCategory}
            disabled={disabled}
            onChange={(val) => {
              if (val) onCategoryChange(val as TechCategory)
            }}
          />

          <NumberInput
            w={{ base: '100%', sm: 110 }}
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

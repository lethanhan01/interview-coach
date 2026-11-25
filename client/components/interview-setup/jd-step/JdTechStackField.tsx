'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { onetQueries } from '@/queries/onet.queries'
import OnetSocTechSuggestions from './OnetSocTechSuggestions'

export interface JdTechStackFieldProps {
  techStack: string[]
  onetSocCode?: string
  onetOccupationTitle?: string
  onChange: (next: string[]) => void
}

const TECH_SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6']

export default function JdTechStackField({
  techStack,
  onetSocCode,
  onetOccupationTitle,
  onChange,
}: Readonly<JdTechStackFieldProps>) {
  const [techQuery, setTechQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(techQuery, 250)

  const { data: onetTechSuggestions = [] } = useQuery({
    ...onetQueries.tech(onetSocCode ?? ''),
    enabled: Boolean(onetSocCode),
  })

  const technologiesQuery = useQuery(
    onetQueries.technologies(debouncedQuery.trim() || undefined, 30)
  )
  const technologies = useMemo(
    () => technologiesQuery.data ?? [],
    [technologiesQuery.data]
  )

  function toggleTech(tech: string) {
    if (techStack.includes(tech)) {
      onChange(techStack.filter((item) => item !== tech))
      return
    }
    onChange([...techStack, tech])
  }

  function removeTech(tech: string) {
    onChange(techStack.filter((item) => item !== tech))
  }

  function handleAddCustomTech() {
    const trimmed = techQuery.trim()
    if (!trimmed) return
    const exists = techStack.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    )
    if (!exists) {
      onChange([...techStack, trimmed])
    }
    setTechQuery('')
  }

  const canAddCustom = useMemo(() => {
    const trimmed = techQuery.trim()
    if (!trimmed) return false
    const lower = trimmed.toLowerCase()
    const inSelected = techStack.some((t) => t.toLowerCase() === lower)
    const inResults = technologies.some(
      (t) => t.example.toLowerCase() === lower
    )
    return !inSelected && !inResults
  }, [techQuery, techStack, technologies])

  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        Tech Stack
      </Text>
      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          <OnetSocTechSuggestions
            suggestions={onetTechSuggestions}
            occupationTitle={onetOccupationTitle}
            techStack={techStack}
            onToggle={toggleTech}
          />

          <Group align="flex-end" gap="xs" wrap="wrap">
            <TextInput
              flex={1}
              miw={200}
              type="search"
              label="Tìm kiếm tech stack"
              placeholder="VD: PyTorch, Terraform, Playwright..."
              value={techQuery}
              onChange={(event) => setTechQuery(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canAddCustom) {
                  event.preventDefault()
                  handleAddCustomTech()
                }
              }}
              leftSection={
                <IconSearch size={15} stroke={1.5} aria-hidden="true" />
              }
            />
            {canAddCustom ? (
              <Button
                type="button"
                variant="light"
                color="brand"
                size="sm"
                leftSection={
                  <IconPlus size={14} stroke={1.5} aria-hidden="true" />
                }
                onClick={handleAddCustomTech}
              >
                Thêm &ldquo;{techQuery.trim()}&rdquo;
              </Button>
            ) : null}
          </Group>

          {techStack.length > 0 ? (
            <Stack gap={6}>
              <Text size="xs" fw={500} c="dimmed">
                Đã chọn ({techStack.length})
              </Text>
              <Group gap={6} wrap="wrap">
                {techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="light"
                    color="brand"
                    size="md"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        variant="transparent"
                        color="brand"
                        aria-label={`Bỏ chọn ${tech}`}
                        onClick={() => removeTech(tech)}
                      >
                        <IconX size={12} stroke={1.5} aria-hidden="true" />
                      </ActionIcon>
                    }
                  >
                    {tech}
                  </Badge>
                ))}
              </Group>
            </Stack>
          ) : null}

          {technologiesQuery.isPending ? (
            <Group gap={6} wrap="wrap" aria-busy="true">
              {TECH_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} height={24} width={76} radius="sm" />
              ))}
            </Group>
          ) : technologiesQuery.isError ? (
            <Alert
              color="danger"
              variant="light"
              role="alert"
              title="Không thể tải danh mục cấu hình"
              icon={
                <IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              <Button
                type="button"
                variant="light"
                color="danger"
                size="xs"
                mt="xs"
                onClick={() => void technologiesQuery.refetch()}
              >
                Thử lại
              </Button>
            </Alert>
          ) : technologies.length === 0 ? (
            <Text size="xs" c="dimmed">
              Không tìm thấy công nghệ phù hợp trong danh mục. Bạn có thể bấm
              &ldquo;Thêm&rdquo; để nhập công nghệ tùy chỉnh.
            </Text>
          ) : (
            <Stack gap={6}>
              <Text size="xs" fw={500} c="dimmed">
                Công nghệ phổ biến (O*NET)
              </Text>
              <Group gap={6} wrap="wrap">
                {technologies.map((tech) => {
                  const selected = techStack.includes(tech.example)
                  return (
                    <Button
                      key={tech.example}
                      type="button"
                      size="compact-xs"
                      variant={selected ? 'filled' : 'default'}
                      color={selected ? 'brand' : 'neutral'}
                      aria-pressed={selected}
                      onClick={() => toggleTech(tech.example)}
                    >
                      {tech.example}
                    </Button>
                  )
                })}
              </Group>
            </Stack>
          )}

          {techStack.length > 0 ? (
            <Text size="xs" c="dimmed">
              Tech stack sẽ lưu: {techStack.join(', ')}
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  )
}

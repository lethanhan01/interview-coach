'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconPlus, IconSearch, IconSparkles, IconX } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { TECH_STACK_OPTIONS } from '@/lib/interview-options'
import { onetQueries } from '@/queries/onet.queries'

export interface JdTechStackFieldProps {
  techStack: string[]
  onetSocCode?: string
  onetOccupationTitle?: string
  onChange: (next: string[]) => void
}

export default function JdTechStackField({
  techStack,
  onetSocCode,
  onetOccupationTitle,
  onChange,
}: Readonly<JdTechStackFieldProps>) {
  const [techQuery, setTechQuery] = useState('')

  const { data: onetTechSuggestions = [] } = useQuery({
    ...onetQueries.tech(onetSocCode ?? ''),
    enabled: Boolean(onetSocCode),
  })

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

  const normalizedQuery = techQuery.trim().toLowerCase()

  const filteredTechGroups = useMemo(
    () =>
      Object.entries(TECH_STACK_OPTIONS)
        .map(
          ([category, techs]) =>
            [
              category,
              normalizedQuery
                ? techs.filter((tech) =>
                    tech.toLowerCase().includes(normalizedQuery)
                  )
                : techs,
            ] as const
        )
        .filter(([, techs]) => techs.length > 0),
    [normalizedQuery]
  )

  const canAddCustom = useMemo(() => {
    const trimmed = techQuery.trim()
    if (!trimmed) return false
    const lower = trimmed.toLowerCase()
    const inSelected = techStack.some((t) => t.toLowerCase() === lower)
    const inDictionary = Object.values(TECH_STACK_OPTIONS)
      .flat()
      .some((t) => t.toLowerCase() === lower)
    return !inSelected && !inDictionary
  }, [techQuery, techStack])

  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        Tech Stack
      </Text>
      <Paper withBorder radius="md" p="md">
        <Stack gap="md">
          {onetTechSuggestions.length > 0 ? (
            <Paper withBorder radius="md" p="sm">
              <Stack gap="xs">
                <Group justify="space-between" align="center" wrap="wrap">
                  <Group gap={6} wrap="nowrap">
                    <IconSparkles size={14} stroke={1.5} aria-hidden="true" />
                    <Text size="xs" fw={600} c="brand">
                      Gợi ý công nghệ O*NET cho {onetOccupationTitle}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Bấm để thêm nhanh vào Tech Stack
                  </Text>
                </Group>

                <Group gap={6} wrap="wrap">
                  {onetTechSuggestions.map((tech) => {
                    const selected = techStack.includes(tech.example)
                    return (
                      <Button
                        key={tech.example}
                        type="button"
                        size="compact-xs"
                        variant={selected ? 'filled' : 'light'}
                        color="brand"
                        aria-pressed={selected}
                        onClick={() => toggleTech(tech.example)}
                      >
                        {selected ? '✓ ' : '+ '}
                        {tech.example}
                      </Button>
                    )
                  })}
                </Group>
              </Stack>
            </Paper>
          ) : null}

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

          {filteredTechGroups.length === 0 ? (
            <Text size="xs" c="dimmed">
              Không tìm thấy tech stack phù hợp trong từ điển. Bạn có thể bấm
              &ldquo;Thêm&rdquo; để nhập công nghệ tùy chỉnh.
            </Text>
          ) : (
            <Stack gap="sm">
              {filteredTechGroups.map(([category, techs]) => (
                <Stack key={category} gap={6}>
                  <Text size="xs" fw={500} c="dimmed">
                    {category}
                  </Text>
                  <Group gap={6} wrap="wrap">
                    {techs.map((tech) => {
                      const selected = techStack.includes(tech)
                      return (
                        <Button
                          key={tech}
                          type="button"
                          size="compact-xs"
                          variant={selected ? 'filled' : 'default'}
                          color={selected ? 'brand' : 'neutral'}
                          aria-pressed={selected}
                          onClick={() => toggleTech(tech)}
                        >
                          {tech}
                        </Button>
                      )
                    })}
                  </Group>
                </Stack>
              ))}
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

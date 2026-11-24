'use client'

import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core'
import { IconFlame, IconPlus, IconSparkles } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { onetQueries } from '@/lib/query-client'
import type { OnetTech } from '@/types'

export interface OnetSkillSuggestionsProps {
  onetSocCode?: string | null
  existingNames: Set<string>
  onPickTech: (tech: OnetTech) => void
}

export default function OnetSkillSuggestions({
  onetSocCode,
  existingNames,
  onPickTech,
}: Readonly<OnetSkillSuggestionsProps>) {
  const { data: onetTechs = [], isFetching } = useQuery({
    ...onetQueries.tech(onetSocCode ?? ''),
    enabled: Boolean(onetSocCode),
  })

  if (!onetSocCode) {
    return (
      <Alert
        color="brand"
        variant="light"
        icon={<IconSparkles size={16} stroke={1.5} aria-hidden="true" />}
      >
        Hãy chọn Chức danh chuẩn O*NET ở mục Định hướng nghề nghiệp để nhận gợi
        ý công nghệ phù hợp vị trí mục tiêu.
      </Alert>
    )
  }

  const filtered = onetTechs.filter(
    (tech) => !existingNames.has(tech.example.toLowerCase())
  )

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={6} wrap="nowrap">
            <IconSparkles size={15} stroke={1.5} aria-hidden="true" />
            <Text size="xs" fw={600} c="brand" tt="uppercase">
              Gợi ý công nghệ O*NET [{onetSocCode}]
            </Text>
          </Group>
          {isFetching ? (
            <Group gap={6} wrap="nowrap">
              <Loader size={12} color="brand" />
              <Text size="xs" c="dimmed">
                Đang tải...
              </Text>
            </Group>
          ) : null}
        </Group>

        {filtered.length > 0 ? (
          <>
            <Text size="xs" c="dimmed">
              Bấm vào công nghệ bên dưới để điền nhanh vào ô thêm kỹ năng:
            </Text>
            <ScrollArea.Autosize mah={128} type="scroll">
              <Group gap={6} wrap="wrap">
                {filtered.slice(0, 30).map((tech) => (
                  <Button
                    key={tech.example}
                    type="button"
                    size="compact-xs"
                    variant={tech.isHotTechnology ? 'light' : 'default'}
                    color={tech.isHotTechnology ? 'brand' : 'neutral'}
                    leftSection={
                      tech.isHotTechnology ? (
                        <IconFlame size={12} stroke={1.5} aria-hidden="true" />
                      ) : undefined
                    }
                    rightSection={
                      <IconPlus size={12} stroke={1.5} aria-hidden="true" />
                    }
                    onClick={() => onPickTech(tech)}
                  >
                    {tech.example}
                  </Button>
                ))}
              </Group>
            </ScrollArea.Autosize>
          </>
        ) : (
          <Text size="xs" c="dimmed">
            {isFetching
              ? 'Đang tìm kiếm gợi ý công nghệ...'
              : 'Đã thêm hết công nghệ gợi ý hoặc chưa có dữ liệu O*NET.'}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

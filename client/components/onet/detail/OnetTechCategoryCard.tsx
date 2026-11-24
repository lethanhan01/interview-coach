'use client'

import {
  ActionIcon,
  Badge,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconBolt,
  IconCheck,
  IconCopy,
  IconFlame,
  IconFolder,
} from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetSoftwareSkill } from '@/types'

export interface OnetTechCategoryCardProps {
  category: string
  skills: OnetSoftwareSkill[]
}

export function OnetTechCategoryCard({
  category,
  skills,
}: Readonly<OnetTechCategoryCardProps>) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap={6} align="center">
            <IconFolder size={16} stroke={1.5} />
            <Title order={3} size="h6">
              {category}
            </Title>
          </Group>
          <Badge color="neutral" variant="outline" size="xs">
            {skills.length} công cụ
          </Badge>
        </Group>

        <Group gap="xs" wrap="wrap">
          {skills.map((skill, index) => (
            <Paper
              key={`${skill.name}-${index}`}
              p="xs"
              radius="sm"
              className={surfaces.subtleSurface}
            >
              <Group gap={6} align="center" wrap="nowrap">
                <Text size="xs" fw={500}>
                  {skill.name}
                </Text>

                {skill.isHotTechnology ? (
                  <Tooltip label="Công nghệ nóng" withArrow>
                    <Badge
                      color="warning"
                      variant="light"
                      size="xs"
                      p={3}
                      aria-label="Công nghệ nóng"
                    >
                      <IconFlame size={10} stroke={2} />
                    </Badge>
                  </Tooltip>
                ) : null}

                {skill.inDemand ? (
                  <Tooltip label="Nhu cầu tuyển dụng cao" withArrow>
                    <Badge
                      color="success"
                      variant="light"
                      size="xs"
                      p={3}
                      aria-label="Nhu cầu cao"
                    >
                      <IconBolt size={10} stroke={2} />
                    </Badge>
                  </Tooltip>
                ) : null}

                <CopyButton value={skill.name} timeout={1800}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? 'Đã sao chép' : 'Sao chép'}
                      withArrow
                    >
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color={copied ? 'success' : 'neutral'}
                        onClick={copy}
                        aria-label={`Sao chép ${skill.name}`}
                      >
                        {copied ? (
                          <IconCheck size={12} stroke={1.5} />
                        ) : (
                          <IconCopy size={12} stroke={1.5} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Paper>
          ))}
        </Group>
      </Stack>
    </Paper>
  )
}

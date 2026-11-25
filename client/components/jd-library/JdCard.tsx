'use client'

import Link from 'next/link'
import {
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  IconAward,
  IconBuilding,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconSparkles,
} from '@tabler/icons-react'
import { formatVietnamRelativeDate } from '@/lib/date-time'
import { getJdLevelLabel } from '@/lib/interview-option-helpers'
import type { JdLevelOption, SavedJobDescription } from '@/types'
import interactions from '@/styles/interactions.module.css'
import classes from './JdCard.module.css'

const MAX_TECH_SHOWN = 5

export interface JdCardProps {
  item: SavedJobDescription
  jdLevels?: readonly JdLevelOption[]
}

export default function JdCard({ item, jdLevels = [] }: Readonly<JdCardProps>) {
  const displayDate = item.lastUsedAt
    ? `Dùng lần cuối ${formatVietnamRelativeDate(item.lastUsedAt)}`
    : `Tạo ${formatVietnamRelativeDate(item.createdAt)}`

  const shownTechs = item.techStack.slice(0, MAX_TECH_SHOWN)
  const extraCount = item.techStack.length - MAX_TECH_SHOWN

  return (
    <UnstyledButton
      component={Link}
      href={`/setup?jdId=${item.id}`}
      transitionTypes={['nav-forward']}
      className={`${classes.cardLink} ${interactions.focusRing}`}
    >
      <Paper
        withBorder
        radius="md"
        p="lg"
        className={interactions.interactiveCard}
      >
        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="md"
        >
          <Stack gap="sm" flex={1} miw={0}>
            <Group gap="sm" align="center" wrap="nowrap">
              <ThemeIcon size={40} radius="md" variant="light" color="brand">
                <IconBuilding size={20} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
              <Stack gap={2} flex={1} miw={0}>
                <Text fw={600} truncate>
                  {item.companyName}
                </Text>
                <Group gap="xs" wrap="wrap">
                  <Text size="sm" c="dimmed" truncate>
                    {item.jobTitle}
                  </Text>
                  {item.level ? (
                    <Badge variant="outline" color="neutral" size="sm">
                      {getJdLevelLabel(item.level, jdLevels)}
                    </Badge>
                  ) : null}
                </Group>
              </Stack>
            </Group>

            {item.onetOccupationTitle || item.targetSfiaLevel ? (
              <Group gap="xs" wrap="wrap">
                {item.targetSfiaLevel ? (
                  <Badge
                    variant="light"
                    color="brand"
                    size="sm"
                    leftSection={
                      <IconAward size={12} stroke={1.5} aria-hidden="true" />
                    }
                  >
                    SFIA Level {item.targetSfiaLevel}
                  </Badge>
                ) : null}
                {item.onetOccupationTitle ? (
                  <Badge
                    variant="outline"
                    color="neutral"
                    size="sm"
                    leftSection={
                      <IconSparkles size={12} stroke={1.5} aria-hidden="true" />
                    }
                  >
                    {item.onetOccupationTitle}
                    {item.onetSocCode ? (
                      <Text
                        component="span"
                        size="xs"
                        c="dimmed"
                        ff="monospace"
                      >
                        {' '}
                        ({item.onetSocCode})
                      </Text>
                    ) : null}
                  </Badge>
                ) : null}
              </Group>
            ) : null}

            <Group gap="md" wrap="wrap">
              {item.location ? (
                <Group gap={4} wrap="nowrap">
                  <IconMapPin size={14} stroke={1.5} aria-hidden="true" />
                  <Text size="xs" c="dimmed">
                    {item.location}
                  </Text>
                </Group>
              ) : null}
              <Group gap={4} wrap="nowrap">
                <IconClock size={14} stroke={1.5} aria-hidden="true" />
                <Text size="xs" c="dimmed">
                  {displayDate}
                </Text>
              </Group>
              {item.salary ? (
                <Text size="xs" fw={500} c="success">
                  {item.salary}
                </Text>
              ) : null}
            </Group>

            {item.techStack.length > 0 ? (
              <Group gap={6} wrap="wrap">
                {shownTechs.map((tech) => (
                  <Badge key={tech} variant="light" color="brand" size="sm">
                    {tech}
                  </Badge>
                ))}
                {extraCount > 0 ? (
                  <Badge variant="light" color="neutral" size="sm">
                    +{extraCount}
                  </Badge>
                ) : null}
              </Group>
            ) : null}
          </Stack>

          <IconChevronRight
            size={20}
            stroke={1.5}
            aria-hidden="true"
            className={classes.chevron}
          />
        </Group>
      </Paper>
    </UnstyledButton>
  )
}

'use client'

import {
  Badge,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import {
  IconBuilding,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconPlus,
} from '@tabler/icons-react'
import { formatVietnamRelativeDate } from '@/lib/date-time'
import { getJdLevelLabel } from '@/lib/interview-options'
import type { SavedJobDescription } from '@/types'
import classes from './SavedJdPicker.module.css'

export interface SavedJdPickerProps {
  items: SavedJobDescription[]
  selectedId?: string
  onSelect: (item: SavedJobDescription) => void
  onNew: () => void
}

const MAX_TECH_SHOWN = 4

export default function SavedJdPicker({
  items,
  selectedId,
  onSelect,
  onNew,
}: Readonly<SavedJdPickerProps>) {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1} size="h2">
          Chọn Job Description
        </Title>
        <Text size="sm" c="dimmed">
          Tái sử dụng JD từ phiên phỏng vấn trước hoặc tạo JD mới.
        </Text>
      </Stack>

      <UnstyledButton
        type="button"
        onClick={onNew}
        className={classes.newButton}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="md">
          <Group gap="md" align="center" wrap="nowrap">
            <ThemeIcon size={40} radius="xl" variant="filled" color="brand">
              <IconPlus size={20} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Stack gap={2}>
              <Text size="sm" fw={600} c="brand">
                Thêm JD mới
              </Text>
              <Text size="xs" c="dimmed">
                Điền thông tin Job Description từ đầu
              </Text>
            </Stack>
          </Group>
          <IconChevronRight
            size={18}
            stroke={1.5}
            aria-hidden="true"
            className={classes.chevron}
          />
        </Group>
      </UnstyledButton>

      <Divider label={`JD đã lưu (${items.length})`} labelPosition="center" />

      <Stack gap="sm">
        {items.map((item) => {
          const displayDate = item.lastUsedAt
            ? `Dùng lần cuối ${formatVietnamRelativeDate(item.lastUsedAt)}`
            : `Tạo ${formatVietnamRelativeDate(item.createdAt)}`

          const shownTechs = item.techStack.slice(0, MAX_TECH_SHOWN)
          const extraCount = item.techStack.length - MAX_TECH_SHOWN
          const isSelected = selectedId === item.id

          return (
            <UnstyledButton
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={classes.itemButton}
            >
              <Paper
                withBorder
                radius="md"
                p="md"
                mod={{ selected: isSelected }}
                className={classes.itemCard}
              >
                <Group
                  justify="space-between"
                  align="flex-start"
                  wrap="nowrap"
                  gap="md"
                >
                  <Stack gap="xs" flex={1} miw={0}>
                    <Group gap="sm" align="center" wrap="nowrap">
                      <ThemeIcon
                        size={36}
                        radius="md"
                        variant="light"
                        color="brand"
                      >
                        <IconBuilding
                          size={18}
                          stroke={1.5}
                          aria-hidden="true"
                        />
                      </ThemeIcon>
                      <Stack gap={2} flex={1} miw={0}>
                        <Text size="sm" fw={600} truncate>
                          {item.companyName}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {item.jobTitle}
                        </Text>
                      </Stack>
                    </Group>

                    <Group gap="md" wrap="wrap">
                      {item.level ? (
                        <Text size="xs" fw={500} c="brand">
                          {getJdLevelLabel(item.level)}
                        </Text>
                      ) : null}
                      {item.location ? (
                        <Group gap={4} wrap="nowrap">
                          <IconMapPin
                            size={13}
                            stroke={1.5}
                            aria-hidden="true"
                          />
                          <Text size="xs" c="dimmed">
                            {item.location}
                          </Text>
                        </Group>
                      ) : null}
                      <Group gap={4} wrap="nowrap">
                        <IconClock size={13} stroke={1.5} aria-hidden="true" />
                        <Text size="xs" c="dimmed">
                          {displayDate}
                        </Text>
                      </Group>
                    </Group>

                    {item.techStack.length > 0 ? (
                      <Group gap={6} wrap="wrap">
                        {shownTechs.map((tech) => (
                          <Badge
                            key={tech}
                            variant="light"
                            color="brand"
                            size="xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {extraCount > 0 ? (
                          <Badge variant="light" color="neutral" size="xs">
                            +{extraCount}
                          </Badge>
                        ) : null}
                      </Group>
                    ) : null}
                  </Stack>

                  <IconChevronRight
                    size={18}
                    stroke={1.5}
                    aria-hidden="true"
                    className={classes.chevron}
                  />
                </Group>
              </Paper>
            </UnstyledButton>
          )
        })}
      </Stack>
    </Stack>
  )
}

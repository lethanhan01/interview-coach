'use client'

import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import type { OnetTaskStatement } from '@/types'
import { OnetTaskItem } from './OnetTaskItem'

export interface OnetTasksTabProps {
  tasks: OnetTaskStatement[]
}

type TaskFilterType = 'all' | 'core' | 'supplemental'

export function OnetTasksTab({ tasks }: Readonly<OnetTasksTabProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<TaskFilterType>('all')

  const coreCount = useMemo(() => tasks.filter((t) => t.isCore).length, [tasks])
  const supplementalCount = tasks.length - coreCount

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tasks.filter((t) => {
      if (filterType === 'core' && !t.isCore) return false
      if (filterType === 'supplemental' && t.isCore) return false
      if (!q) return true
      return t.statement.toLowerCase().includes(q)
    })
  }, [tasks, filterType, searchQuery])

  return (
    <Stack gap="sm">
      {/* Header Controls */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Title order={2} size="h6">
                Nhiệm vụ Công việc (Work Tasks)
              </Title>
              <Badge color="neutral" variant="outline" size="xs">
                {tasks.length} nhiệm vụ
              </Badge>
            </Group>

            <Text size="xs" c="dimmed">
              Hiển thị {filteredTasks.length} / {tasks.length}
            </Text>
          </Group>

          <Group gap="xs" wrap="wrap">
            <TextInput
              size="xs"
              flex={1}
              miw={200}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Tìm kiếm nội dung nhiệm vụ..."
              aria-label="Tìm kiếm nội dung nhiệm vụ"
              leftSection={<IconSearch size={14} stroke={1.5} />}
              rightSection={
                searchQuery ? (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="neutral"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchQuery('')}
                  >
                    <IconX size={12} stroke={1.5} />
                  </ActionIcon>
                ) : null
              }
            />

            <SegmentedControl
              size="xs"
              value={filterType}
              onChange={(val) => setFilterType(val as TaskFilterType)}
              aria-label="Lọc theo phân loại nhiệm vụ"
              data={[
                { value: 'all', label: `Tất cả (${tasks.length})` },
                { value: 'core', label: `Cốt lõi (${coreCount})` },
                {
                  value: 'supplemental',
                  label: `Bổ trợ (${supplementalCount})`,
                },
              ]}
            />
          </Group>
        </Stack>
      </Paper>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Paper p="xl" radius="md" className={surfaces.subtleSurface}>
          <Stack align="center" gap="xs">
            <Text size="sm" fw={600}>
              Không tìm thấy nhiệm vụ nào
            </Text>
            <Text size="xs" c="dimmed">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc.
            </Text>
            {searchQuery || filterType !== 'all' ? (
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
              >
                Đặt lại bộ lọc
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : (
        <Stack gap="xs">
          {filteredTasks.map((task, index) => (
            <OnetTaskItem
              key={task.id}
              task={task}
              searchQuery={searchQuery}
              index={index}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

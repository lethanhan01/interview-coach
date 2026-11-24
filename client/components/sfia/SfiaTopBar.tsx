'use client'

import {
  Badge,
  Box,
  Group,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconChartBar,
  IconFolderRoot,
  IconGridDots,
  IconShieldCheck,
  IconStack2,
} from '@tabler/icons-react'
import type { SfiaMainTab } from '@/types'
import classes from './SfiaWorkspaceClient.module.css'

export interface SfiaTopBarProps {
  activeTab: SfiaMainTab
  onTabChange: (tab: SfiaMainTab) => void
  totalSkills?: number
}

export function SfiaTopBar({
  activeTab,
  onTabChange,
  totalSkills,
}: Readonly<SfiaTopBarProps>) {
  return (
    <Box component="header" className={classes.topBar}>
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <Group gap="sm" align="center" wrap="nowrap">
          <ThemeIcon color="brand" variant="light" size="lg" radius="md">
            <IconStack2 size={20} stroke={1.5} />
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <Title order={1} size="h3">
                Khung Năng Lực SFIA 9
              </Title>
              <Badge color="brand" variant="light" size="xs">
                Quản trị
              </Badge>
              {totalSkills !== undefined && totalSkills > 0 ? (
                <Badge color="neutral" variant="outline" size="xs">
                  {totalSkills} kỹ năng
                </Badge>
              ) : null}
            </Group>
            <Text size="xs" c="dimmed">
              Quản trị cây kỹ năng, ma trận 2D, 5 thuộc tính chung và độ phủ
              ngân hàng câu hỏi
            </Text>
          </Stack>
        </Group>

        <SegmentedControl
          size="xs"
          value={activeTab}
          onChange={(val) => onTabChange(val as SfiaMainTab)}
          aria-label="Chuyển chế độ làm việc SFIA 9"
          data={[
            {
              value: 'taxonomy',
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  <IconFolderRoot size={14} stroke={1.5} />
                  <Text span size="xs" fw={600}>
                    Cây kỹ năng
                  </Text>
                </Group>
              ),
            },
            {
              value: 'matrix',
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  <IconGridDots size={14} stroke={1.5} />
                  <Text span size="xs" fw={600}>
                    Ma trận 2D
                  </Text>
                </Group>
              ),
            },
            {
              value: 'attributes',
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  <IconShieldCheck size={14} stroke={1.5} />
                  <Text span size="xs" fw={600}>
                    Thuộc tính chung
                  </Text>
                </Group>
              ),
            },
            {
              value: 'analytics',
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  <IconChartBar size={14} stroke={1.5} />
                  <Text span size="xs" fw={600}>
                    Phân tích độ phủ
                  </Text>
                </Group>
              ),
            },
          ]}
        />
      </Group>
    </Box>
  )
}

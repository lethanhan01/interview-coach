'use client'

import type { ReactNode } from 'react'
import {
  Box,
  Group,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import layout from '@/styles/layout.module.css'

export interface AdminWorkspaceHeaderTab {
  value: string
  label: ReactNode
}

export interface AdminWorkspaceHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  badges?: ReactNode
  tabs: AdminWorkspaceHeaderTab[]
  activeTab: string
  onTabChange: (tab: string) => void
  tabSwitcherAriaLabel: string
}

export function AdminWorkspaceHeader({
  icon,
  title,
  subtitle,
  badges,
  tabs,
  activeTab,
  onTabChange,
  tabSwitcherAriaLabel,
}: Readonly<AdminWorkspaceHeaderProps>) {
  return (
    <Box component="header" className={layout.workspaceTopBar}>
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <Group gap="sm" align="center" wrap="nowrap">
          <ThemeIcon color="brand" variant="light" size="lg" radius="md">
            {icon}
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <Title order={1} size="h3">
                {title}
              </Title>
              {badges}
            </Group>
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          </Stack>
        </Group>

        <SegmentedControl
          size="sm"
          value={activeTab}
          onChange={onTabChange}
          aria-label={tabSwitcherAriaLabel}
          data={tabs}
        />
      </Group>
    </Box>
  )
}

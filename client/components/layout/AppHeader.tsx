'use client'

import Link from 'next/link'
import { Anchor, Burger, Group, Text, ThemeIcon } from '@mantine/core'
import { IconMicrophone } from '@tabler/icons-react'
import { ColorSchemeToggle } from './ColorSchemeToggle'
import { UserMenuButton } from './UserMenuButton'

export interface AppHeaderProps {
  role: 'admin' | 'candidate'
  mobileOpened?: boolean
  onToggleMobile?: () => void
}

export default function AppHeader({
  role,
  mobileOpened = false,
  onToggleMobile,
}: Readonly<AppHeaderProps>) {
  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger
          opened={mobileOpened}
          onClick={onToggleMobile}
          hiddenFrom="md"
          size="sm"
          aria-label="Mở menu điều hướng"
        />
        <Anchor
          component={Link}
          href="/"
          underline="never"
          hiddenFrom="md"
          aria-label="AI Mock Interview — Trang chủ"
        >
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon color="brand" variant="light" size="sm" radius="md">
              <IconMicrophone size={14} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text fw={700} size="sm">
              AI Mock Interview
            </Text>
          </Group>
        </Anchor>
        <Text fw={600} size="sm" c="dimmed" visibleFrom="md">
          {role === 'admin' ? 'Cổng quản trị' : 'Không gian luyện tập'}
        </Text>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <ColorSchemeToggle />
        <UserMenuButton role={role} />
      </Group>
    </Group>
  )
}

'use client'

import Link from 'next/link'
import { Anchor, Burger, Group, Text } from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import interactions from '@/styles/interactions.module.css'
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
          className={interactions.brandLink}
          aria-label="Intervia — Trang chủ"
        >
          <BrandLogo variant="lockup" size="xs" decorative />
        </Anchor>
        <Text fw={600} size="sm" c="dimmed" visibleFrom="md">
          {role === 'admin'
            ? 'Intervia · Cổng quản trị'
            : 'Intervia · Không gian luyện tập'}
        </Text>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <ColorSchemeToggle />
        <UserMenuButton role={role} />
      </Group>
    </Group>
  )
}

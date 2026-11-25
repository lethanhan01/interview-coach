'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core'
import {
  IconChevronDown,
  IconFileText,
  IconLogout,
  IconSettings,
  IconUser,
} from '@tabler/icons-react'
import { useAuth } from '@/providers/AuthProvider'
import interactions from '@/styles/interactions.module.css'
import appShell from '../app-shell.module.css'

export interface UserMenuButtonProps {
  role: 'admin' | 'candidate'
}

function getInitials(email: string | undefined, role: 'admin' | 'candidate') {
  if (email && email.trim().length >= 2) {
    const localPart = email.split('@')[0]?.trim() ?? ''
    if (localPart.length >= 2) {
      return localPart.slice(0, 2).toUpperCase()
    }
  }
  return role === 'admin' ? 'AD' : 'UV'
}

export function UserMenuButton({ role }: Readonly<UserMenuButtonProps>) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const roleLabel = role === 'admin' ? 'Quản trị viên' : 'Ứng viên'
  const displayName = user?.email ?? roleLabel
  const initials = getInitials(user?.email, role)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <Menu position="bottom-end" width={240} shadow="md" withinPortal>
      <Menu.Target>
        <UnstyledButton
          className={`${appShell.userMenuTrigger} ${interactions.hoverRow}`}
          aria-label="Menu tài khoản"
        >
          <Group gap="xs" wrap="nowrap">
            <Avatar color="brand" radius="xl" size="sm">
              {initials}
            </Avatar>
            <Stack gap={0} visibleFrom="sm">
              <Text size="xs" fw={600} lh={1.2} maw={150} truncate>
                {displayName}
              </Text>
              <Text size="xs" c="dimmed" lh={1.2}>
                {roleLabel}
              </Text>
            </Stack>
            <IconChevronDown size={14} stroke={1.5} aria-hidden="true" />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{displayName}</Menu.Label>
        {role === 'candidate' ? (
          <>
            <Menu.Item
              component={Link}
              href="/resume"
              leftSection={
                <IconFileText size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Hồ sơ CV
            </Menu.Item>
            <Menu.Item
              component={Link}
              href="/profile"
              leftSection={
                <IconSettings size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Cài đặt tài khoản
            </Menu.Item>
          </>
        ) : (
          <Menu.Item
            component={Link}
            href="/admin/profile"
            leftSection={<IconUser size={16} stroke={1.5} aria-hidden="true" />}
          >
            Hồ sơ Admin
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item
          color="danger"
          leftSection={<IconLogout size={16} stroke={1.5} aria-hidden="true" />}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          Đăng xuất
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

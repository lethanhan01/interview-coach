'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMicrophone,
} from '@tabler/icons-react'
import { adminNavigation, candidateNavigation } from '@/config/navigation'
import { useAuth } from '@/lib/auth-context'
import NavLinks from './NavLinks'
import classes from './AppSidebar.module.css'

export interface AppSidebarProps {
  role: 'admin' | 'candidate'
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

export default function AppSidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: Readonly<AppSidebarProps>) {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const items = role === 'admin' ? adminNavigation : candidateNavigation

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
    <Stack gap={0} className={classes.root}>
      <Box className={classes.header} mod={{ collapsed }}>
        <Anchor
          component={Link}
          href="/"
          underline="never"
          className={classes.brandLink}
          onClick={onNavigate}
          aria-label="AI Mock Interview — Trang chủ"
        >
          <ThemeIcon color="brand" variant="light" size="md" radius="md">
            <IconMicrophone size={18} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
          {!collapsed ? (
            <Group gap="xs" wrap="nowrap">
              <Text fw={700} size="sm" truncate>
                AI Mock Interview
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={role === 'admin' ? 'brand' : 'neutral'}
              >
                {role === 'admin' ? 'Admin' : 'Ứng viên'}
              </Badge>
            </Group>
          ) : null}
        </Anchor>
      </Box>

      <ScrollArea className={classes.scrollArea} type="auto">
        <NavLinks
          items={items}
          orientation="vertical"
          collapsed={collapsed}
          onNavigate={onNavigate}
          asNav={false}
        />
      </ScrollArea>

      <Stack
        gap="xs"
        align={collapsed ? 'center' : 'stretch'}
        className={classes.footer}
      >
        {collapsed ? (
          <Tooltip label="Đăng xuất" position="right" withArrow>
            <ActionIcon
              variant="subtle"
              color="danger"
              size="lg"
              radius="md"
              aria-label="Đăng xuất"
              onClick={handleLogout}
              loading={isLoggingOut}
            >
              <IconLogout size={18} stroke={1.5} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="subtle"
            color="danger"
            fullWidth
            justify="flex-start"
            leftSection={
              <IconLogout size={18} stroke={1.5} aria-hidden="true" />
            }
            onClick={handleLogout}
            loading={isLoggingOut}
          >
            Đăng xuất
          </Button>
        )}

        {onToggleCollapse ? (
          collapsed ? (
            <Tooltip
              label="Mở rộng thanh điều hướng"
              position="right"
              withArrow
            >
              <ActionIcon
                variant="subtle"
                color="neutral"
                size="lg"
                radius="md"
                visibleFrom="md"
                aria-label="Mở rộng thanh điều hướng"
                onClick={onToggleCollapse}
              >
                <IconLayoutSidebarLeftExpand
                  size={18}
                  stroke={1.5}
                  aria-hidden="true"
                />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Button
              variant="subtle"
              color="neutral"
              size="xs"
              fullWidth
              justify="flex-start"
              visibleFrom="md"
              leftSection={
                <IconLayoutSidebarLeftCollapse
                  size={16}
                  stroke={1.5}
                  aria-hidden="true"
                />
              }
              onClick={onToggleCollapse}
              aria-label="Thu gọn thanh điều hướng"
            >
              Thu gọn
            </Button>
          )
        ) : null}
      </Stack>
    </Stack>
  )
}

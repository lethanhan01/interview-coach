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
  Tooltip,
} from '@mantine/core'
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
} from '@tabler/icons-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { adminNavigation, candidateNavigation } from '@/config/navigation'
import { useAuth } from '@/providers/AuthProvider'
import interactions from '@/styles/interactions.module.css'
import surfaces from '@/styles/surfaces.module.css'
import appShell from '../app-shell.module.css'
import NavLinks from './NavLinks'

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
    <Stack gap={0} h="100%" className={surfaces.bodySurface}>
      <Box className={appShell.sidebarHeader} mod={{ collapsed }}>
        <Anchor
          component={Link}
          href="/"
          underline="never"
          className={interactions.brandLink}
          onClick={onNavigate}
          aria-label="Intervia — Trang chủ"
        >
          {collapsed ? (
            <BrandLogo variant="mark" size="md" decorative />
          ) : (
            <Group gap="xs" wrap="nowrap">
              <BrandLogo variant="lockup" size="sm" decorative />
              <Badge
                size="xs"
                variant="light"
                color={role === 'admin' ? 'brand' : 'neutral'}
              >
                {role === 'admin' ? 'Admin' : 'Ứng viên'}
              </Badge>
            </Group>
          )}
        </Anchor>
      </Box>

      <ScrollArea className={appShell.sidebarScroll} type="auto">
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
        p="xs"
        align={collapsed ? 'center' : 'stretch'}
        className={surfaces.borderedTop}
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

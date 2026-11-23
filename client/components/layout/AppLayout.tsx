'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell, Box } from '@mantine/core'
import { useDisclosure, useReducedMotion } from '@mantine/hooks'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import classes from './AppLayout.module.css'

export interface AppLayoutProps {
  children: ReactNode
  role: 'admin' | 'candidate'
  isWorkspace?: boolean
}

export default function AppLayout({
  children,
  role,
  isWorkspace,
}: Readonly<AppLayoutProps>) {
  const pathname = usePathname()
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure(false)
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure(false)
  const reduceMotion = useReducedMotion()

  const isWorkspaceMode =
    isWorkspace ??
    (pathname?.startsWith('/admin/onet') ||
      pathname?.startsWith('/admin/sfia') ||
      false)

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: { base: 260, md: desktopCollapsed ? 72 : 260 },
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened },
      }}
      padding={isWorkspaceMode ? 0 : 'md'}
      transitionDuration={reduceMotion ? 0 : 200}
    >
      <AppShell.Header>
        <AppHeader
          role={role}
          mobileOpened={mobileOpened}
          onToggleMobile={toggleMobile}
        />
      </AppShell.Header>

      <AppShell.Navbar aria-label="Điều hướng chính">
        <AppSidebar
          role={role}
          collapsed={desktopCollapsed}
          onToggleCollapse={toggleDesktop}
          onNavigate={closeMobile}
        />
      </AppShell.Navbar>

      <AppShell.Main
        className={classes.main}
        mod={{ workspace: isWorkspaceMode }}
      >
        <Box className={classes.content} mod={{ workspace: isWorkspaceMode }}>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}

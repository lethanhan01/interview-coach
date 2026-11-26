'use client'

import type { ReactNode } from 'react'
import { Box, Paper } from '@mantine/core'
import layout from '@/styles/layout.module.css'

export type AdminPanelVariant = 'plain' | 'bordered'

export interface AdminMasterDetailLayoutProps {
  mobileDrawer: ReactNode
  sidebar: ReactNode
  detail: ReactNode
  sidebarAriaLabel: string
  detailAriaLabel: string
  panelVariant?: AdminPanelVariant
}

export function AdminMasterDetailLayout({
  mobileDrawer,
  sidebar,
  detail,
  sidebarAriaLabel,
  detailAriaLabel,
  panelVariant = 'plain',
}: Readonly<AdminMasterDetailLayoutProps>) {
  return (
    <Box className={layout.workspacePane}>
      {mobileDrawer}

      <Box className={layout.masterDetail}>
        {panelVariant === 'bordered' ? (
          <>
            <Paper
              component="nav"
              withBorder
              radius="md"
              visibleFrom="lg"
              className={layout.sidebarPanel}
              aria-label={sidebarAriaLabel}
            >
              {sidebar}
            </Paper>

            <Paper
              component="section"
              withBorder
              radius="md"
              className={layout.detailPanel}
              aria-label={detailAriaLabel}
            >
              {detail}
            </Paper>
          </>
        ) : (
          <>
            <Box
              component="nav"
              visibleFrom="lg"
              className={layout.sidebarPanel}
              aria-label={sidebarAriaLabel}
            >
              {sidebar}
            </Box>

            <Box
              component="section"
              className={layout.detailPanel}
              aria-label={detailAriaLabel}
            >
              {detail}
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

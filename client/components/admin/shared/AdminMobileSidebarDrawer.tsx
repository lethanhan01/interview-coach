'use client'

import type { ReactNode } from 'react'
import { Drawer, Paper, type MantineSpacing } from '@mantine/core'
import layout from '@/styles/layout.module.css'

export interface AdminMobileSidebarDrawerProps {
  opened: boolean
  onClose: () => void
  drawerTitle: string
  closeAriaLabel?: string
  drawerPosition?: 'left' | 'right'
  drawerSize?: string
  drawerPadding?: MantineSpacing | 0
  triggerBar: ReactNode
  children: ReactNode
  className?: string
}

export function AdminMobileSidebarDrawer({
  opened,
  onClose,
  drawerTitle,
  closeAriaLabel,
  drawerPosition = 'left',
  drawerSize = 'md',
  drawerPadding = 'xs',
  triggerBar,
  children,
  className,
}: Readonly<AdminMobileSidebarDrawerProps>) {
  return (
    <>
      <Paper
        withBorder
        radius="md"
        p="xs"
        hiddenFrom="lg"
        className={className}
      >
        {triggerBar}
      </Paper>

      <Drawer
        opened={opened}
        onClose={onClose}
        position={drawerPosition}
        size={drawerSize}
        padding={drawerPadding}
        title={drawerTitle}
        hiddenFrom="lg"
        closeButtonProps={
          closeAriaLabel ? { 'aria-label': closeAriaLabel } : undefined
        }
        classNames={{
          content: layout.drawerContent,
          body: layout.drawerBody,
        }}
      >
        {children}
      </Drawer>
    </>
  )
}

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  role: 'admin' | 'candidate'
  logoutActionSlot?: React.ReactNode
  isWorkspace?: boolean
}

export default function AppLayout({
  children,
  role,
  logoutActionSlot,
  isWorkspace,
}: AppLayoutProps) {
  const pathname = usePathname()
  const isWorkspaceMode =
    isWorkspace ?? (pathname?.startsWith('/admin/onet') ?? false)

  return (
    <div className="bg-surface-raised flex h-screen overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <AppSidebar role={role} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader role={role} logoutActionSlot={logoutActionSlot} />
        <main
          className={cn(
            'flex-1',
            isWorkspaceMode
              ? 'overflow-hidden p-2 sm:p-3 lg:p-4'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
          )}
        >
          <div
            className={cn(
              isWorkspaceMode ? 'h-full w-full' : 'mx-auto max-w-7xl'
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


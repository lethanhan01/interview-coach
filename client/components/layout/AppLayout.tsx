import React from 'react'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

interface AppLayoutProps {
  children: React.ReactNode
  role: 'admin' | 'candidate'
  logoutActionSlot?: React.ReactNode
}

export default function AppLayout({ children, role, logoutActionSlot }: AppLayoutProps) {
  return (
    <div className="bg-surface-raised flex h-screen overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <AppSidebar role={role} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader role={role} logoutActionSlot={logoutActionSlot} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

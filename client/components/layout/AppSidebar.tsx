'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminNavigation, candidateNavigation } from '@/config/navigation'
import { Button } from '@/components/ui/Button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'

const emptySubscribe = () => () => {}
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false)

interface AppSidebarProps {
  role: 'admin' | 'candidate'
  isMobile?: boolean
  onMobileClose?: () => void
}

export default function AppSidebar({
  role,
  isMobile = false,
  onMobileClose,
}: AppSidebarProps) {
  const items = role === 'admin' ? adminNavigation : candidateNavigation
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Prevent hydration mismatch by rendering collapsed state only after mount
  const mounted = useIsMounted()

  if (!mounted) {
    return (
      <aside className={cn('bg-surface-overlay h-full border-r', isMobile ? 'w-full' : 'w-64')} />
    )
  }

  const collapsed = !isMobile && isCollapsed

  return (
    <aside
      className={cn(
        'bg-surface-overlay relative flex h-full flex-col border-r transition-all duration-300 ease-in-out',
        isMobile ? 'w-full' : collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link
            href="/"
            className="text-brand truncate text-base font-semibold tracking-tight transition-colors hover:text-brand-light"
            onClick={() => {
              if (isMobile && onMobileClose) onMobileClose()
            }}
          >
            AI Mock Interview
          </Link>
        )}
        {collapsed && (
          <div className="text-brand mx-auto font-bold">AI</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2" aria-label="Sidebar Navigation">
          <TooltipProvider delayDuration={0}>
            {items.map(({ href, label, icon: Icon, match }) => {
              const active = pathname
                ? match.some((m) => pathname === m || pathname.startsWith(m + '/'))
                : false
              return (
                <div key={href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={href}
                          className={cn(
                            'flex h-10 w-full items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                            active
                              ? 'bg-brand-subtle text-brand-subtle-fg'
                              : 'text-ink-muted hover:bg-brand-subtle hover:text-brand-subtle-fg'
                          )}
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="sr-only">{label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                        active
                          ? 'bg-brand-subtle text-brand-subtle-fg'
                          : 'text-ink-muted hover:bg-brand-subtle hover:text-brand-subtle-fg'
                      )}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        if (isMobile && onMobileClose) onMobileClose()
                      }}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </TooltipProvider>
        </nav>
      </div>

      {!isMobile && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-ink-muted hover:text-ink',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Thu gọn</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  )
}

'use client'

import { useState } from 'react'
import { Menu, User } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/Sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import AppSidebar from './AppSidebar'

interface AppHeaderProps {
  role: 'admin' | 'candidate'
  logoutActionSlot?: React.ReactNode
}

export default function AppHeader({ role, logoutActionSlot }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-surface-overlay border-border/40 sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <AppSidebar
                role={role}
                isMobile
                onMobileClose={() => setIsMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">User Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-1">
              {logoutActionSlot}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

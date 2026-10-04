'use client'

import * as React from 'react'
import { useState } from 'react'
import { BookOpen, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet'
import { OnetSidebar } from './OnetSidebar'
import { cn } from '@/lib/utils'

export interface OnetMobileDrawerProps {
  selectedSoc: string
  selectedTitle?: string
  onSelectSoc: (socCode: string) => void
  className?: string
}

export function OnetMobileDrawer({
  selectedSoc,
  selectedTitle,
  onSelectSoc,
  className,
}: OnetMobileDrawerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (socCode: string) => {
    onSelectSoc(socCode)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised flex items-center justify-between rounded-xl border p-2.5 lg:hidden',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0 gap-1.5 text-xs font-semibold"
        >
          <Layers className="size-3.5" />
          <span>Danh mục 1.016 Nghề</span>
        </Button>

        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <Badge variant="outline" className="font-mono text-[10px]">
            {selectedSoc}
          </Badge>
          {selectedTitle && (
            <span className="text-ink line-clamp-1 text-xs font-medium">
              {selectedTitle}
            </span>
          )}
        </div>
      </div>

      {/* Slide-in Sheet Drawer from Left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-[85%] flex-col p-0 sm:max-w-md"
        >
          <SheetHeader className="border-border/60 border-b p-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold">
              <BookOpen className="text-brand size-4" />
              <span>Danh mục Nghề nghiệp O*NET</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <OnetSidebar
              selectedSoc={selectedSoc}
              onSelectSoc={handleSelect}
              className="border-0"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

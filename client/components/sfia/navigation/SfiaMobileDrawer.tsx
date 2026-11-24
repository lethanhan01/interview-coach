'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { FolderTree, Network, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet'
import type { SfiaCategory, SfiaSubcategory, SfiaSkillSummary } from '@/types'
import { getCategoryTheme } from '@/components/sfia/sfia-theme'
import { SfiaSidebarTree } from './SfiaSidebarTree'
import { cn } from '@/lib/utils'

export interface SfiaMobileDrawerProps {
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  skills: SfiaSkillSummary[]
  selectedSkill: string
  selectedLevel: number
  onSelectSkill: (skillCode: string, targetLevel?: number) => void
  className?: string
}

export function SfiaMobileDrawer({
  categories,
  subcategories,
  skills,
  selectedSkill,
  selectedLevel,
  onSelectSkill,
  className,
}: SfiaMobileDrawerProps) {
  const [open, setOpen] = useState(false)

  // Find info of currently selected skill
  const currentSkill = useMemo(() => {
    return skills.find((s) => s.code === selectedSkill) || skills[0]
  }, [skills, selectedSkill])

  const theme = useMemo(() => {
    return getCategoryTheme(currentSkill?.categoryCode || 'DEV_IMPL')
  }, [currentSkill])

  const handleSelectSkill = (code: string, targetLevel?: number) => {
    onSelectSkill(code, targetLevel)
    setOpen(false)
  }

  return (
    <div
      className={cn(
        'bg-card border-border/80 flex items-center justify-between gap-2 rounded-xl border p-2.5 shadow-sm lg:hidden',
        className
      )}
    >
      {/* Trigger Button */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 shrink-0 gap-1.5 text-xs font-semibold"
        >
          <FolderTree className="text-brand size-3.5" />
          <span>SFIA Skill Tree</span>
        </Button>

        {/* Current Active Skill Preview on Mobile */}
        {currentSkill && (
          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <span
              className={cn(
                'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                theme.badge
              )}
            >
              {currentSkill.code}
            </span>
            <span className="text-ink max-w-[120px] truncate text-xs font-medium sm:max-w-[200px]">
              {currentSkill.name}
            </span>
            <span className="text-ink-muted bg-surface-raised shrink-0 rounded px-1 py-0.5 font-mono text-[10px] font-semibold">
              L{selectedLevel}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-ink-muted hover:text-ink size-8 shrink-0 p-0"
        aria-label="Open SFIA 9 Skill Tree"
      >
        <ChevronRight className="size-4" />
      </Button>

      {/* Slide-over Sheet Drawer from Left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="border-border flex h-full w-[88vw] max-w-[380px] flex-col border-r p-0 sm:w-[400px]"
        >
          <SheetHeader className="border-border/60 bg-surface-raised/30 shrink-0 border-b p-3.5 text-left">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="bg-brand/10 text-brand flex size-6 items-center justify-center rounded-md">
                <Network className="size-3.5" />
              </div>
              <span>SFIA 9 Skill Tree</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <SfiaSidebarTree
              categories={categories}
              subcategories={subcategories}
              skills={skills}
              selectedSkill={selectedSkill}
              selectedLevel={selectedLevel}
              onSelectSkill={handleSelectSkill}
              className="h-full rounded-none border-0 shadow-none"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

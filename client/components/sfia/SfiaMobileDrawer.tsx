'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { FolderTree, Network, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet'
import {
  type SfiaCategory,
  type SfiaSubcategory,
  type SfiaSkillSummary,
  SfiaSidebarTree,
  getCategoryTheme,
  SFIA_LEVEL_DEFINITIONS,
} from './index'
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
        'bg-card border border-border/80 rounded-xl p-2.5 shadow-sm flex items-center justify-between gap-2 lg:hidden',
        className
      )}
    >
      {/* Trigger Button */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0 gap-1.5 text-xs font-semibold h-8"
        >
          <FolderTree className="size-3.5 text-brand" />
          <span>Cây Kỹ Năng SFIA</span>
        </Button>

        {/* Current Active Skill Preview on Mobile */}
        {currentSkill && (
          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <span
              className={cn(
                'font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border shrink-0',
                theme.badge
              )}
            >
              {currentSkill.code}
            </span>
            <span className="text-ink truncate text-xs font-medium max-w-[120px] sm:max-w-[200px]">
              {currentSkill.name}
            </span>
            <span className="text-[10px] font-mono font-semibold text-ink-muted bg-surface-raised px-1 py-0.5 rounded shrink-0">
              L{selectedLevel}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="size-8 p-0 shrink-0 text-ink-muted hover:text-ink"
        aria-label="Mở cây danh mục SFIA 9"
      >
        <ChevronRight className="size-4" />
      </Button>

      {/* Slide-over Sheet Drawer from Left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex h-full w-[88vw] max-w-[380px] sm:w-[400px] flex-col p-0 border-r border-border"
        >
          <SheetHeader className="border-border/60 border-b p-3.5 text-left bg-surface-raised/30 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="size-6 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                <Network className="size-3.5" />
              </div>
              <span>Khám Phá Cây Kỹ Năng SFIA 9</span>
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
              className="border-0 rounded-none shadow-none h-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

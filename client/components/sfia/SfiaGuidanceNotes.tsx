'use client'

import * as React from 'react'
import { Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion'

export interface SfiaGuidanceNotesProps {
  guidanceNotes?: string
  skillName: string
  className?: string
}

export function SfiaGuidanceNotes({
  guidanceNotes,
  skillName,
  className,
}: SfiaGuidanceNotesProps) {
  if (!guidanceNotes) return null

  return (
    <div
      className={cn(
        'bg-card border-border/80 shadow-xs overflow-hidden rounded-xl border',
        className
      )}
    >
      <Accordion
        type="single"
        collapsible
        defaultValue="guidance"
        className="w-full"
      >
        <AccordionItem value="guidance" className="border-none">
          <AccordionTrigger className="hover:bg-surface-raised/50 px-4 py-3 transition-colors hover:no-underline">
            <div className="flex items-center gap-2 text-left">
              <div className="rounded-md bg-amber-500/10 p-1 text-amber-600 dark:text-amber-400">
                <Lightbulb className="size-3.5" />
              </div>
              <div>
                <span className="text-ink block text-xs font-bold">
                  Ghi chú Hướng dẫn SFIA Foundation (Guidance Notes)
                </span>
                <span className="text-ink-muted text-[11px]">
                  Lưu ý ngữ cảnh áp dụng thực tế khi đánh giá kỹ năng{' '}
                  {skillName}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="bg-surface-raised/40 border-border/60 text-ink space-y-2 rounded-lg border p-3.5 text-xs leading-relaxed">
              <div className="text-ink-muted flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                <p className="text-ink text-xs">{guidanceNotes}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

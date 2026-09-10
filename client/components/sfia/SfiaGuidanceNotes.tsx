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
        'bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs',
        className
      )}
    >
      <Accordion type="single" collapsible defaultValue="guidance" className="w-full">
        <AccordionItem value="guidance" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-surface-raised/50 transition-colors">
            <div className="flex items-center gap-2 text-left">
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lightbulb className="size-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">
                  Ghi chú Hướng dẫn SFIA Foundation (Guidance Notes)
                </span>
                <span className="text-[11px] text-ink-muted">
                  Lưu ý ngữ cảnh áp dụng thực tế khi đánh giá kỹ năng {skillName}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="bg-surface-raised/40 border border-border/60 rounded-lg p-3.5 text-xs text-ink leading-relaxed space-y-2">
              <div className="flex items-start gap-2 text-ink-muted">
                <Info className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-ink">{guidanceNotes}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

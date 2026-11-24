'use client'

import * as React from 'react'
import { Copy, Check, FileCode, FileJson, Bot, Info } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import type { SfiaSkillDetail } from '@/types'
import {
  generateSfiaRubricMarkdownPrompt,
  generateSfiaRubricJsonSchema,
} from '@/components/sfia/sfia-prompt-helper'
import { SFIA_LEVEL_DEFINITIONS } from '@/components/sfia/sfia-theme'

export interface SfiaAiPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillDetail: SfiaSkillDetail
  selectedLevel: number
}

export function SfiaAiPromptModal({
  open,
  onOpenChange,
  skillDetail,
  selectedLevel,
}: SfiaAiPromptModalProps) {
  const [activeTab, setActiveTab] = React.useState<'markdown' | 'json'>(
    'markdown'
  )
  const [copiedMd, setCopiedMd] = React.useState(false)
  const [copiedJson, setCopiedJson] = React.useState(false)

  const markdownContent = React.useMemo(
    () => generateSfiaRubricMarkdownPrompt(skillDetail, selectedLevel),
    [skillDetail, selectedLevel]
  )

  const jsonContent = React.useMemo(
    () => generateSfiaRubricJsonSchema(skillDetail, selectedLevel),
    [skillDetail, selectedLevel]
  )

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent)
      setCopiedMd(true)
      toast.success(
        `Copied SFIA System Prompt for ${skillDetail.code} (Level ${selectedLevel}) to clipboard!`
      )
      setTimeout(() => setCopiedMd(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      setCopiedJson(true)
      toast.success(`Copied JSON Schema Rubric to clipboard!`)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const levelDef = SFIA_LEVEL_DEFINITIONS[selectedLevel]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-3.5 p-5">
        <DialogHeader className="border-border/60 border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand/10 text-brand rounded-lg p-1.5">
              <Bot className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-ink flex items-center gap-2 text-base font-bold">
                <span>AI Rubric Prompt Generator</span>
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  {skillDetail.code} — Level {selectedLevel}
                </span>
              </DialogTitle>
              <DialogDescription className="text-ink-muted mt-0.5 text-xs">
                Standardized SFIA 9 System Prompt & Rubric schema for LLM
                interview evaluation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-surface-raised/50 border-border/60 text-ink-muted flex shrink-0 items-start gap-2 rounded-lg border p-2.5 text-xs">
          <Info className="text-brand mt-0.5 size-4 shrink-0" />
          <p>
            This prompt directly embeds Level{' '}
            <strong className="text-ink">
              L{selectedLevel} ({levelDef?.name})
            </strong>{' '}
            Essence and behavioral criteria from the SFIA 9 database to ensure
            objective and accurate AI assessment.
          </p>
        </div>

        {/* Tabs Switcher & Actions */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'markdown' | 'json')}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="border-border/50 flex items-center justify-between gap-2 border-b pb-2">
            <TabsList className="bg-surface-inset h-8 p-0.5">
              <TabsTrigger
                value="markdown"
                className="gap-1.5 px-2.5 py-1 text-xs"
              >
                <FileCode className="size-3.5" />
                <span>Markdown System Prompt</span>
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5 px-2.5 py-1 text-xs">
                <FileJson className="size-3.5" />
                <span>JSON Schema Rubric</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1.5">
              {activeTab === 'markdown' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="h-8 gap-1.5 px-3 text-xs"
                >
                  {copiedMd ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-8 gap-1.5 px-3 text-xs"
                >
                  {copiedJson ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy JSON Schema</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Content Tab 1: Markdown */}
          <TabsContent value="markdown" className="mt-2 min-h-0 flex-1">
            <div className="bg-surface-inset border-border/80 text-ink h-[360px] select-all overflow-y-auto whitespace-pre-wrap rounded-lg border p-3.5 font-mono text-xs leading-relaxed">
              {markdownContent}
            </div>
          </TabsContent>

          {/* Content Tab 2: JSON */}
          <TabsContent value="json" className="mt-2 min-h-0 flex-1">
            <div className="bg-surface-inset border-border/80 text-ink h-[360px] select-all overflow-y-auto whitespace-pre-wrap rounded-lg border p-3.5 font-mono text-xs leading-relaxed">
              {jsonContent}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import * as React from 'react'
import {
  Sparkles,
  Copy,
  Check,
  FileCode,
  FileJson,
  Bot,
  Info,
} from 'lucide-react'
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
import type { SfiaSkillDetail } from './types'
import {
  generateSfiaRubricMarkdownPrompt,
  generateSfiaRubricJsonSchema,
} from './sfia-prompt-helper'
import { SFIA_LEVEL_DEFINITIONS } from './sfia-theme'

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
  const [activeTab, setActiveTab] = React.useState<'markdown' | 'json'>('markdown')
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
        `Đã sao chép System Prompt SFIA cho ${skillDetail.code} (Level ${selectedLevel}) vào bộ nhớ tạm!`
      )
      setTimeout(() => setCopiedMd(false), 2000)
    } catch {
      toast.error('Không thể sao chép vào bộ nhớ tạm')
    }
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent)
      setCopiedJson(true)
      toast.success(`Đã sao chép JSON Schema Rubric vào bộ nhớ tạm!`)
      setTimeout(() => setCopiedJson(false), 2000)
    } catch {
      toast.error('Không thể sao chép vào bộ nhớ tạm')
    }
  }

  const levelDef = SFIA_LEVEL_DEFINITIONS[selectedLevel]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-5 gap-3.5">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Bot className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-ink flex items-center gap-2">
                <span>AI Rubric Prompt Generator</span>
                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {skillDetail.code} — Level {selectedLevel}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-muted mt-0.5">
                Mẫu System Prompt & Tiêu chuẩn Rubric SFIA 9 chuẩn hóa phục vụ LLM Evaluator chấm điểm phỏng vấn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info Banner */}
        <div className="bg-surface-raised/50 border border-border/60 rounded-lg p-2.5 flex items-start gap-2 text-xs text-ink-muted shrink-0">
          <Info className="size-4 text-brand shrink-0 mt-0.5" />
          <p>
            Prompt này nhúng trực tiếp Bản chất cấp độ <strong className="text-ink">L{selectedLevel} ({levelDef?.name})</strong> và tiêu chuẩn hành vi từ cơ sở dữ liệu SFIA 9 để đảm bảo AI chấm điểm chuẩn xác, khách quan.
          </p>
        </div>

        {/* Tabs Switcher & Actions */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'markdown' | 'json')}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
            <TabsList className="bg-surface-inset h-8 p-0.5">
              <TabsTrigger value="markdown" className="gap-1.5 text-xs px-2.5 py-1">
                <FileCode className="size-3.5" />
                <span>Markdown System Prompt</span>
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5 text-xs px-2.5 py-1">
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
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {copiedMd ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Sao chép Prompt</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  {copiedJson ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Sao chép JSON Schema</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Content Tab 1: Markdown */}
          <TabsContent value="markdown" className="flex-1 min-h-0 mt-2">
            <div className="h-[360px] overflow-y-auto bg-surface-inset rounded-lg p-3.5 border border-border/80 font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap select-all">
              {markdownContent}
            </div>
          </TabsContent>

          {/* Content Tab 2: JSON */}
          <TabsContent value="json" className="flex-1 min-h-0 mt-2">
            <div className="h-[360px] overflow-y-auto bg-surface-inset rounded-lg p-3.5 border border-border/80 font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap select-all">
              {jsonContent}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

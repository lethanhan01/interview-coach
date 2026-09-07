'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import {
  Check,
  X,
  Pencil,
  Trash2,
  Info,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableRow, TableCell } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/Select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/Popover'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/Tooltip'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import type {
  OnetSfiaMapping,
  SfiaSkillDefinition,
} from './types'

export interface OnetSfiaRowProps {
  mapping: OnetSfiaMapping
  isEditing: boolean
  isInserting?: boolean
  isSaving: boolean
  availableSkills?: SfiaSkillDefinition[]
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (data: Partial<OnetSfiaMapping>) => Promise<void>
  onDelete: () => void
  onDirtyChange?: (isDirty: boolean) => void
  isHighlighted?: boolean
  className?: string
}

const SFIA_LEVEL_TITLES: Record<number, string> = {
  1: 'Follow',
  2: 'Assist',
  3: 'Apply',
  4: 'Enable',
  5: 'Ensure',
  6: 'Influence',
  7: 'Strategy',
}

const SOURCE_BADGES: Record<
  OnetSfiaMapping['source'],
  { label: string; variant: 'outline' | 'secondary' | 'default' }
> = {
  ONET_CROSSWALK: { label: 'O*NET Crosswalk', variant: 'outline' },
  EXPERT_CURATED: { label: 'Chuyên gia', variant: 'secondary' },
  USER_DEFINED: { label: 'Admin tự định nghĩa', variant: 'default' },
}

export function OnetSfiaRow({
  mapping,
  isEditing,
  isInserting = false,
  isSaving,
  availableSkills = [],
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDirtyChange,
  isHighlighted = false,
  className,
}: OnetSfiaRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null)

  // Draft Edit State
  const [selectedSkillCode, setSelectedSkillCode] = useState(mapping.skillCode)
  const [draftLevel, setDraftLevel] = useState(mapping.targetLevel)
  const [draftWeight, setDraftWeight] = useState(mapping.weight)
  const [draftIsCore, setDraftIsCore] = useState(mapping.isCore)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Find active skill definition in library
  const currentSkillDef = availableSkills.find(
    (s) => s.code === (isInserting ? selectedSkillCode : mapping.skillCode)
  )

  const minLevel = currentSkillDef?.minLevel ?? mapping.minLevel
  const maxLevel = currentSkillDef?.maxLevel ?? mapping.maxLevel

  // When inserting and selecting a skill in combobox, ensure level is inside min-max
  const handleSelectSkillInCombobox = (code: string) => {
    setSelectedSkillCode(code)
    const def = availableSkills.find((s) => s.code === code)
    if (def) {
      if (draftLevel < def.minLevel || draftLevel > def.maxLevel) {
        setDraftLevel(def.minLevel)
      }
    }
    setValidationError(null)
  }

  // Scroll into view when highlighted or inserting
  useEffect(() => {
    if ((isHighlighted || isInserting) && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted, isInserting])

  // Track isDirty
  useEffect(() => {
    if (!isEditing) return
    const isDirty =
      draftLevel !== mapping.targetLevel ||
      draftWeight !== mapping.weight ||
      draftIsCore !== mapping.isCore ||
      (isInserting && selectedSkillCode !== '')
    onDirtyChange?.(isDirty)
  }, [
    isEditing,
    isInserting,
    draftLevel,
    draftWeight,
    draftIsCore,
    selectedSkillCode,
    mapping,
    onDirtyChange,
  ])

  // Cancel handler (restores draft state)
  const handleCancelClick = () => {
    setSelectedSkillCode(mapping.skillCode)
    setDraftLevel(mapping.targetLevel)
    setDraftWeight(mapping.weight)
    setDraftIsCore(mapping.isCore)
    setValidationError(null)
    onDirtyChange?.(false)
    onCancelEdit()
  }

  // Save handler
  const handleSaveClick = async () => {
    if (isInserting && !selectedSkillCode) {
      setValidationError('Vui lòng chọn kỹ năng SFIA')
      return
    }

    if (draftWeight < 0.1 || draftWeight > 5.0) {
      setValidationError('Trọng số phải từ 0.1 đến 5.0')
      return
    }

    if (draftLevel < minLevel || draftLevel > maxLevel) {
      setValidationError(`Cấp độ phải trong dải [${minLevel} - ${maxLevel}]`)
      return
    }

    setValidationError(null)
    try {
      await onSave({
        skillCode: isInserting ? selectedSkillCode : mapping.skillCode,
        skillName: isInserting ? currentSkillDef?.name || selectedSkillCode : mapping.skillName,
        category: isInserting ? currentSkillDef?.category : mapping.category,
        targetLevel: draftLevel,
        minLevel,
        maxLevel,
        weight: draftWeight,
        isCore: draftIsCore,
        source: isInserting ? 'USER_DEFINED' : mapping.source,
      })
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Lỗi khi lưu ánh xạ')
    }
  }

  // Keyboard shortcut listener on row
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveClick()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelClick()
    }
  }

  // Combobox options
  const comboboxOptions: ComboboxOption[] = availableSkills.map((s) => ({
    value: s.code,
    label: `${s.code} — ${s.name} (L${s.minLevel}-L${s.maxLevel})`,
  }))

  const levelDescription =
    currentSkillDef?.levelDescriptions[draftLevel] ||
    `Yêu cầu thực thi trách nhiệm cấp độ ${draftLevel} theo chuẩn SFIA 9.`

  // --------------------------------------------------------------------------
  // EDIT / INSERT MODE
  // --------------------------------------------------------------------------
  if (isEditing) {
    return (
      <TableRow
        ref={rowRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'bg-surface-inset/60 transition-colors',
          validationError && 'bg-destructive/5',
          className
        )}
      >
        {/* Col 1: Skill Selection */}
        <TableCell className="flex-[2] min-w-[200px] p-3 flex-col items-start justify-center">
          {isInserting ? (
            <div className="space-y-1 w-full">
              <Combobox
                options={comboboxOptions}
                value={selectedSkillCode}
                onValueChange={handleSelectSkillInCombobox}
                placeholder="Chọn kỹ năng SFIA..."
                searchPlaceholder="Tìm mã hoặc tên kỹ năng..."
                emptyText="Không tìm thấy kỹ năng phù hợp"
                className="h-8 text-xs font-medium w-full min-w-[200px]"
              />
              {currentSkillDef && (
                <span className="text-[10px] text-ink-muted block truncate">
                  {currentSkillDef.category} • Dải level: {minLevel}-{maxLevel}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-ink">
                  {mapping.skillCode}
                </span>
                {mapping.category && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1">
                    {mapping.category}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted leading-tight">
                {mapping.skillName}
              </p>
            </div>
          )}
        </TableCell>

        {/* Col 2: Level Selection with Min-Max Limiter & Description Preview */}
        <TableCell className="flex-[2] min-w-[190px] p-3 flex-col items-start justify-center">
          <div className="space-y-1.5 w-full">
            <div className="flex items-center gap-1.5">
              <Select
                value={String(draftLevel)}
                onValueChange={(val) => setDraftLevel(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs font-semibold w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => {
                    const isValid = lvl >= minLevel && lvl <= maxLevel
                    if (!isValid) return null
                    return (
                      <SelectItem key={lvl} value={String(lvl)} className="text-xs">
                        Level {lvl} — {SFIA_LEVEL_TITLES[lvl]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Live Responsibility Preview Card */}
            <div className="rounded-lg bg-surface-1 border border-border/80 p-2 text-[11px] text-ink-muted leading-relaxed">
              <span className="font-semibold text-brand text-[10px] uppercase tracking-wider block mb-0.5">
                Tiêu chuẩn Level {draftLevel}:
              </span>
              <p className="line-clamp-2">{levelDescription}</p>
            </div>
          </div>
        </TableCell>

        {/* Col 3: Weight Input */}
        <TableCell className="w-24 p-3 flex-col items-start justify-center">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0.1"
                max="5.0"
                step="0.1"
                value={draftWeight}
                onChange={(e) => setDraftWeight(Number(e.target.value))}
                className="h-8 text-xs font-mono font-bold tabular-nums text-center w-20"
              />
              <span className="text-xs text-ink-muted">x</span>
            </div>
            <span className="text-[10px] text-ink-faint block">0.1 - 5.0</span>
          </div>
        </TableCell>

        {/* Col 4: Core Switch */}
        <TableCell className="w-28 p-3 items-center">
          <div className="flex items-center gap-2">
            <Switch
              id={`core-switch-${mapping.id}`}
              checked={draftIsCore}
              onCheckedChange={setDraftIsCore}
            />
            <Label
              htmlFor={`core-switch-${mapping.id}`}
              className={cn(
                'text-xs font-medium cursor-pointer',
                draftIsCore ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-ink-muted'
              )}
            >
              {draftIsCore ? 'Cốt lõi' : 'Bổ trợ'}
            </Label>
          </div>
        </TableCell>

        {/* Col 5: Source */}
        <TableCell className="w-28 p-3 items-center">
          <Badge variant="outline" className="text-[10px] text-ink-muted">
            Admin tự gán
          </Badge>
        </TableCell>

        {/* Col 6: Actions (Save & Cancel) */}
        <TableCell className="w-24 p-3 flex-col items-end justify-center text-right">
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="h-7 w-7 p-0 bg-brand text-brand-foreground"
              title="Lưu ánh xạ (Enter)"
              aria-label="Lưu ánh xạ"
            >
              {isSaving ? (
                <LoadingSpinner className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
              disabled={isSaving}
              className="h-7 w-7 p-0 text-ink-muted hover:text-ink"
              title="Hủy bỏ (Esc)"
              aria-label="Hủy bỏ"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {validationError && (
            <p className="text-[10px] text-destructive text-right mt-1 font-medium">
              {validationError}
            </p>
          )}
        </TableCell>
      </TableRow>
    )
  }

  // --------------------------------------------------------------------------
  // VIEW MODE
  // --------------------------------------------------------------------------
  const sourceInfo = SOURCE_BADGES[mapping.source] || SOURCE_BADGES.ONET_CROSSWALK

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'transition-colors hover:bg-surface-inset/30',
        isHighlighted && 'bg-brand/10 ring-1 ring-brand/50',
        className
      )}
    >
      {/* Col 1: Skill Code, Name, Category & Info Popover */}
      <TableCell className="flex-[2] min-w-[200px] p-3 items-center">
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-ink">
                {mapping.skillCode}
              </span>
              {mapping.category && (
                <Badge variant="outline" className="text-[10px] py-0 px-1">
                  {mapping.category}
                </Badge>
              )}
            </div>
            <p className="text-xs text-ink/90 font-medium leading-tight">
              {mapping.skillName}
            </p>
          </div>

          {/* SFIA Detail Popover */}
          {currentSkillDef && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full text-ink-muted hover:text-brand hover:bg-brand/10 transition-colors"
                  title="Xem định nghĩa kỹ năng SFIA"
                  aria-label="Xem định nghĩa kỹ năng SFIA"
                >
                  <Info className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-2 text-xs p-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-mono font-bold text-ink">
                    {currentSkillDef.code}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Level {currentSkillDef.minLevel} - {currentSkillDef.maxLevel}
                  </Badge>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  {currentSkillDef.description}
                </p>
                <div className="border-t pt-1.5 space-y-1">
                  <span className="text-[10px] font-semibold text-brand uppercase tracking-wider block">
                    Tiêu chuẩn Level {mapping.targetLevel}:
                  </span>
                  <p className="text-[11px] text-ink/80 leading-normal">
                    {currentSkillDef.levelDescriptions[mapping.targetLevel]}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </TableCell>

      {/* Col 2: Level Mini Gauge & Tooltip */}
      <TableCell className="flex-[2] min-w-[170px] p-3 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1 cursor-pointer w-full">
                {/* 7-Step Mini Gauge */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => {
                    const isTarget = lvl <= mapping.targetLevel
                    const isCurrent = lvl === mapping.targetLevel
                    const isValid = lvl >= mapping.minLevel && lvl <= mapping.maxLevel

                    return (
                      <div
                        key={lvl}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-all',
                          isTarget
                            ? mapping.isCore
                              ? 'bg-amber-500'
                              : 'bg-brand'
                            : isValid
                              ? 'bg-surface-inset border border-border/80'
                              : 'bg-surface-inset/30 opacity-40',
                          isCurrent && 'ring-1 ring-brand/60'
                        )}
                      />
                    )
                  })}
                </div>

                {/* Level Text Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-ink tabular-nums">
                    Level {mapping.targetLevel}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {SFIA_LEVEL_TITLES[mapping.targetLevel]}
                  </span>
                  <span className="text-[10px] text-ink-faint font-mono">
                    [{mapping.minLevel}-{mapping.maxLevel}]
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs p-2.5 space-y-1">
              <span className="font-bold block text-amber-300">
                Level {mapping.targetLevel} — {SFIA_LEVEL_TITLES[mapping.targetLevel]}
              </span>
              <p className="text-[11px] leading-relaxed opacity-95">
                {currentSkillDef?.levelDescriptions[mapping.targetLevel] ||
                  `Tiêu chuẩn năng lực cấp độ ${mapping.targetLevel} theo khung SFIA 9.`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Col 3: Weight Number & Mini Progress */}
      <TableCell className="w-24 p-3 items-center">
        <div className="space-y-1 w-full">
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-bold text-xs text-ink tabular-nums">
              {mapping.weight.toFixed(1)}
            </span>
            <span className="text-[10px] text-ink-muted">x</span>
          </div>
          <div className="h-1 w-16 rounded-full bg-surface-inset overflow-hidden border border-border/60">
            <div
              className="h-full bg-brand rounded-full"
              style={{ width: `${Math.min(100, (mapping.weight / 5.0) * 100)}%` }}
            />
          </div>
        </div>
      </TableCell>

      {/* Col 4: Core / Secondary Badge */}
      <TableCell className="w-28 p-3 items-center">
        {mapping.isCore ? (
          <Badge variant="warning" className="gap-1 text-[11px] font-bold">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span>Cốt lõi</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[11px] font-medium text-ink-muted">
            Bổ trợ
          </Badge>
        )}
      </TableCell>

      {/* Col 5: Source */}
      <TableCell className="w-28 p-3 items-center">
        <Badge variant={sourceInfo.variant} className="text-[10px] font-medium">
          {sourceInfo.label}
        </Badge>
      </TableCell>

      {/* Col 6: Actions */}
      <TableCell className="w-20 p-3 items-center justify-end text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEdit}
            className="h-7 w-7 p-0 text-ink-muted hover:text-ink"
            title="Chỉnh sửa ánh xạ này"
            aria-label="Chỉnh sửa ánh xạ này"
          >
            <Pencil className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-ink-muted hover:text-destructive hover:bg-destructive/10"
            title="Xóa ánh xạ này"
            aria-label="Xóa ánh xạ này"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

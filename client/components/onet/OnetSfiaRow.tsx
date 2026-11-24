'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Check, X, Pencil, Trash2, Info, Star } from 'lucide-react'
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
import type { OnetSfiaMapping, SfiaSkillDefinition } from '@/types'

export interface OnetSfiaRowProps {
  mapping: OnetSfiaMapping
  isEditing: boolean
  isInserting?: boolean
  isSaving: boolean
  availableSkills?: SfiaSkillDefinition[]
  errorField?: 'level' | 'skillCode' | 'weight' | null
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
  errorField,
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

  const handleLevelChange = (val: string) => {
    setDraftLevel(Number(val))
    setValidationError(null)
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftWeight(Number(e.target.value))
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
        skillName: isInserting
          ? currentSkillDef?.name || selectedSkillCode
          : mapping.skillName,
        category: isInserting ? currentSkillDef?.category : mapping.category,
        targetLevel: draftLevel,
        minLevel,
        maxLevel,
        weight: draftWeight,
        isCore: draftIsCore,
        source: isInserting ? 'USER_DEFINED' : mapping.source,
      })
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Lỗi khi lưu ánh xạ'
      )
    }
  }

  // Keyboard shortcut listener on row
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSaveClick()
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

  const hasLevelError =
    errorField === 'level' ||
    (validationError &&
      (validationError.toLowerCase().includes('cấp độ') ||
        validationError.toLowerCase().includes('level') ||
        validationError.toLowerCase().includes('tồn tại')))

  const hasSkillError =
    errorField === 'skillCode' ||
    (validationError && validationError.toLowerCase().includes('kỹ năng'))

  const hasWeightError =
    errorField === 'weight' ||
    (validationError && validationError.toLowerCase().includes('trọng số'))

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
          (validationError || errorField) && 'bg-destructive/5',
          className
        )}
      >
        {/* Col 1: Skill Selection */}
        <TableCell className="min-w-[200px] flex-[2] flex-col items-start justify-center p-3">
          {isInserting ? (
            <div className="w-full space-y-1">
              <Combobox
                options={comboboxOptions}
                value={selectedSkillCode}
                onValueChange={handleSelectSkillInCombobox}
                placeholder="Chọn kỹ năng SFIA..."
                searchPlaceholder="Tìm mã hoặc tên kỹ năng..."
                emptyText="Không tìm thấy kỹ năng phù hợp"
                className={cn(
                  'h-8 w-full min-w-[200px] text-xs font-medium',
                  hasSkillError &&
                    'border-critical ring-critical text-critical ring-1'
                )}
              />
              {currentSkillDef && (
                <span className="text-ink-muted block truncate text-[10px]">
                  {currentSkillDef.category} • Dải level: {minLevel}-{maxLevel}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-ink font-mono text-xs font-bold">
                  {mapping.skillCode}
                </span>
                {mapping.category && (
                  <Badge variant="outline" className="px-1 py-0 text-[10px]">
                    {mapping.category}
                  </Badge>
                )}
              </div>
              <p className="text-ink-muted text-xs leading-tight">
                {mapping.skillName}
              </p>
            </div>
          )}
        </TableCell>

        {/* Col 2: Level Selection with Min-Max Limiter & Description Preview */}
        <TableCell className="min-w-[190px] flex-[2] flex-col items-start justify-center p-3">
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Select
                value={String(draftLevel)}
                onValueChange={handleLevelChange}
              >
                <SelectTrigger
                  className={cn(
                    'h-8 w-full text-xs font-semibold',
                    hasLevelError &&
                      'border-critical ring-critical text-critical focus:ring-critical ring-1'
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => {
                    const isValid = lvl >= minLevel && lvl <= maxLevel
                    if (!isValid) return null
                    return (
                      <SelectItem
                        key={lvl}
                        value={String(lvl)}
                        className="text-xs"
                      >
                        Level {lvl} — {SFIA_LEVEL_TITLES[lvl]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Live Responsibility Preview Card */}
            <div className="bg-surface-1 border-border/80 text-ink-muted rounded-lg border p-2 text-[11px] leading-relaxed">
              <span className="text-brand mb-0.5 block text-[10px] font-semibold uppercase tracking-wider">
                Tiêu chuẩn Level {draftLevel}:
              </span>
              <p className="line-clamp-2">{levelDescription}</p>
            </div>
          </div>
        </TableCell>

        {/* Col 3: Weight Input */}
        <TableCell className="w-24 flex-col items-start justify-center p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0.1"
                max="5.0"
                step="0.1"
                value={draftWeight}
                onChange={handleWeightChange}
                className={cn(
                  'h-8 w-20 text-center font-mono text-xs font-bold tabular-nums',
                  hasWeightError &&
                    'border-critical ring-critical text-critical focus:ring-critical ring-1'
                )}
              />
              <span className="text-ink-muted text-xs">x</span>
            </div>
            <span className="text-ink-faint block text-[10px]">0.1 - 5.0</span>
          </div>
        </TableCell>

        {/* Col 4: Core Switch */}
        <TableCell className="w-28 items-center p-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`core-switch-${mapping.id}`}
              checked={draftIsCore}
              onCheckedChange={setDraftIsCore}
            />
            <Label
              htmlFor={`core-switch-${mapping.id}`}
              className={cn(
                'cursor-pointer text-xs font-medium',
                draftIsCore
                  ? 'font-bold text-amber-600 dark:text-amber-400'
                  : 'text-ink-muted'
              )}
            >
              {draftIsCore ? 'Cốt lõi' : 'Bổ trợ'}
            </Label>
          </div>
        </TableCell>

        {/* Col 5: Source */}
        <TableCell className="w-28 items-center p-3">
          <Badge variant="outline" className="text-ink-muted text-[10px]">
            Admin tự gán
          </Badge>
        </TableCell>

        {/* Col 6: Actions (Save & Cancel) */}
        <TableCell className="w-24 flex-col items-end justify-center p-3 text-right">
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="bg-brand text-brand-foreground h-7 w-7 p-0"
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
              className="text-ink-muted hover:text-ink h-7 w-7 p-0"
              title="Hủy bỏ (Esc)"
              aria-label="Hủy bỏ"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {validationError && (
            <p className="text-destructive mt-1 text-right text-[10px] font-medium">
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
  const sourceInfo =
    SOURCE_BADGES[mapping.source] || SOURCE_BADGES.ONET_CROSSWALK

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'hover:bg-surface-inset/30 transition-colors',
        isHighlighted && 'bg-brand/10 ring-brand/50 ring-1',
        className
      )}
    >
      {/* Col 1: Skill Code, Name, Category & Info Popover */}
      <TableCell className="min-w-[200px] flex-[2] items-center p-3">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-ink font-mono text-xs font-bold">
                {mapping.skillCode}
              </span>
              {mapping.category && (
                <Badge variant="outline" className="px-1 py-0 text-[10px]">
                  {mapping.category}
                </Badge>
              )}
            </div>
            <p className="text-ink/90 text-xs font-medium leading-tight">
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
                  className="text-ink-muted hover:text-brand hover:bg-brand/10 h-6 w-6 rounded-full p-0 transition-colors"
                  title="Xem định nghĩa kỹ năng SFIA"
                  aria-label="Xem định nghĩa kỹ năng SFIA"
                >
                  <Info className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-2 p-3 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-ink font-mono font-bold">
                    {currentSkillDef.code}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Level {currentSkillDef.minLevel} -{' '}
                    {currentSkillDef.maxLevel}
                  </Badge>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  {currentSkillDef.description}
                </p>
                <div className="space-y-1 border-t pt-1.5">
                  <span className="text-brand block text-[10px] font-semibold uppercase tracking-wider">
                    Tiêu chuẩn Level {mapping.targetLevel}:
                  </span>
                  <p className="text-ink/80 text-[11px] leading-normal">
                    {currentSkillDef.levelDescriptions[mapping.targetLevel]}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </TableCell>

      {/* Col 2: Level Mini Gauge & Tooltip */}
      <TableCell className="min-w-[170px] flex-[2] items-center p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full cursor-pointer space-y-1">
                {/* 7-Step Mini Gauge */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => {
                    const isTarget = lvl <= mapping.targetLevel
                    const isCurrent = lvl === mapping.targetLevel
                    const isValid =
                      lvl >= mapping.minLevel && lvl <= mapping.maxLevel

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
                              ? 'bg-surface-inset border-border/80 border'
                              : 'bg-surface-inset/30 opacity-40',
                          isCurrent && 'ring-brand/60 ring-1'
                        )}
                      />
                    )
                  })}
                </div>

                {/* Level Text Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-ink font-mono text-xs font-bold tabular-nums">
                    Level {mapping.targetLevel}
                  </span>
                  <span className="text-ink-muted text-[11px]">
                    {SFIA_LEVEL_TITLES[mapping.targetLevel]}
                  </span>
                  <span className="text-ink-faint font-mono text-[10px]">
                    [{mapping.minLevel}-{mapping.maxLevel}]
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs space-y-1 p-2.5 text-xs">
              <span className="block font-bold text-amber-300">
                Level {mapping.targetLevel} —{' '}
                {SFIA_LEVEL_TITLES[mapping.targetLevel]}
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
      <TableCell className="w-24 items-center p-3">
        <div className="w-full space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-ink font-mono text-xs font-bold tabular-nums">
              {mapping.weight.toFixed(1)}
            </span>
            <span className="text-ink-muted text-[10px]">x</span>
          </div>
          <div className="bg-surface-inset border-border/60 h-1 w-16 overflow-hidden rounded-full border">
            <div
              className="bg-brand h-full rounded-full"
              style={{
                width: `${Math.min(100, (mapping.weight / 5.0) * 100)}%`,
              }}
            />
          </div>
        </div>
      </TableCell>

      {/* Col 4: Core / Secondary Badge */}
      <TableCell className="w-28 items-center p-3">
        {mapping.isCore ? (
          <Badge variant="warning" className="gap-1 text-[11px] font-bold">
            <Star className="size-3 fill-amber-500 text-amber-500" />
            <span>Cốt lõi</span>
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-ink-muted text-[11px] font-medium"
          >
            Bổ trợ
          </Badge>
        )}
      </TableCell>

      {/* Col 5: Source */}
      <TableCell className="w-28 items-center p-3">
        <Badge variant={sourceInfo.variant} className="text-[10px] font-medium">
          {sourceInfo.label}
        </Badge>
      </TableCell>

      {/* Col 6: Actions */}
      <TableCell className="w-20 items-center justify-end p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartEdit}
            className="text-ink-muted hover:text-ink h-7 w-7 p-0"
            title="Chỉnh sửa ánh xạ này"
            aria-label="Chỉnh sửa ánh xạ này"
          >
            <Pencil className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-ink-muted hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
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

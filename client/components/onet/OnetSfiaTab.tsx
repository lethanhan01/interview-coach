'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  X,
  RotateCcw,
  Network,
  Star,
  AlertTriangle,
  FileX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog'
import { EmptyState } from '@/components/patterns/FeedbackPatterns'
import { onetAdminService } from '@/services/onet-admin.service'
import { OnetSfiaSpectrumBar } from './OnetSfiaSpectrumBar'
import { OnetSfiaRow } from './OnetSfiaRow'
import type {
  OnetSfiaMapping,
  SfiaSkillDefinition,
} from './types'

export interface OnetSfiaTabProps {
  socCode: string
  occupationTitle: string
  mappings: OnetSfiaMapping[]
  onUpdateMappings?: (newMappings: OnetSfiaMapping[]) => void
  onDirtyChange?: (isDirty: boolean) => void
  className?: string
}

type FilterChip = 'all' | 'core' | 'secondary'

export function OnetSfiaTab({
  socCode,
  occupationTitle,
  mappings,
  onUpdateMappings,
  onDirtyChange,
  className,
}: OnetSfiaTabProps) {
  // Local state for mappings (synced with parent)
  const [localMappings, setLocalMappings] = useState<OnetSfiaMapping[]>(mappings)
  const [sfiaLibrary, setSfiaLibrary] = useState<SfiaSkillDefinition[]>([])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all')

  // Edit State Machine
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isInserting, setIsInserting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCurrentRowDirty, setIsCurrentRowDirty] = useState(false)

  // Highlight skill from spectrum bar
  const [highlightedSkillCode, setHighlightedSkillCode] = useState<string | null>(null)

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<OnetSfiaMapping | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [switchRowAlert, setSwitchRowAlert] = useState<{
    targetId: string | null
    isTargetInserting: boolean
  } | null>(null)

  // Error tracking per row
  const [rowError, setRowError] = useState<{
    rowId: string | 'insert'
    field: 'level' | 'skillCode' | 'weight' | null
  } | null>(null)

  // Toast / Status Message
  const [statusMessage, setStatusMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  const [prevSocCode, setPrevSocCode] = useState(socCode)
  const [prevMappings, setPrevMappings] = useState(mappings)

  // Adjust state during render when props change to avoid effect-driven cascading renders
  if (prevSocCode !== socCode || prevMappings !== mappings) {
    setPrevSocCode(socCode)
    setPrevMappings(mappings)
    setLocalMappings(mappings)
    setEditingId(null)
    setIsInserting(false)
    setIsCurrentRowDirty(false)
    setRowError(null)
  }

  // Inform parent of dirty state
  useEffect(() => {
    onDirtyChange?.(isCurrentRowDirty)
  }, [isCurrentRowDirty, onDirtyChange])

  // Load SFIA Library
  useEffect(() => {
    onetAdminService.getSfiaLibrary().then(setSfiaLibrary)
  }, [])

  // Auto clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  // Filter available skills for Combobox (exclude already mapped ones when inserting)
  const unmappedSkills = useMemo(() => {
    const existingCodes = new Set(localMappings.map((m) => m.skillCode))
    return sfiaLibrary.filter((s) => !existingCodes.has(s.code))
  }, [sfiaLibrary, localMappings])

  // Filter mappings based on search query & chip
  const filteredMappings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return localMappings.filter((m) => {
      // Chip filter
      if (activeFilter === 'core' && !m.isCore) return false
      if (activeFilter === 'secondary' && m.isCore) return false

      // Search query
      if (!q) return true
      return (
        m.skillCode.toLowerCase().includes(q) ||
        m.skillName.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
      )
    })
  }, [localMappings, searchQuery, activeFilter])

  // Metrics for Filter Chips
  const coreCount = useMemo(
    () => localMappings.filter((m) => m.isCore).length,
    [localMappings]
  )
  const secondaryCount = localMappings.length - coreCount

  // --------------------------------------------------------------------------
  // Edit State Machine Handlers
  // --------------------------------------------------------------------------
  const handleRequestStartEdit = (targetId: string) => {
    if (isCurrentRowDirty) {
      setSwitchRowAlert({ targetId, isTargetInserting: false })
      return
    }
    setRowError(null)
    setIsInserting(false)
    setEditingId(targetId)
  }

  const handleRequestStartInsert = () => {
    if (isCurrentRowDirty) {
      setSwitchRowAlert({ targetId: null, isTargetInserting: true })
      return
    }
    setRowError(null)
    setEditingId(null)
    setIsInserting(true)
  }

  const handleConfirmSwitchRow = () => {
    setIsCurrentRowDirty(false)
    setRowError(null)
    if (!switchRowAlert) return

    if (switchRowAlert.isTargetInserting) {
      setEditingId(null)
      setIsInserting(true)
    } else {
      setIsInserting(false)
      setEditingId(switchRowAlert.targetId)
    }
    setSwitchRowAlert(null)
  }

  // --------------------------------------------------------------------------
  // CRUD Handlers
  // --------------------------------------------------------------------------
  const handleSaveExisting = async (
    id: string,
    updatedData: Partial<OnetSfiaMapping>
  ) => {
    setIsSaving(true)
    setRowError(null)
    try {
      const saved = await onetAdminService.updateSfiaMapping(socCode, id, {
        targetLevel: updatedData.targetLevel,
        weight: updatedData.weight,
        isCore: updatedData.isCore,
        source: updatedData.source,
      })
      const updated = localMappings.map((m) => (m.id === id ? saved : m))
      setLocalMappings(updated)
      onUpdateMappings?.(updated)
      setEditingId(null)
      setIsCurrentRowDirty(false)
      setRowError(null)
      setStatusMessage({
        text: `Đã cập nhật ánh xạ kỹ năng ${saved.skillCode} thành công!`,
        type: 'success',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu ánh xạ kỹ năng'
      let field: 'level' | 'skillCode' | 'weight' | null = null
      const lower = msg.toLowerCase()
      if (lower.includes('cấp độ') || lower.includes('level') || lower.includes('tồn tại') || lower.includes('409')) {
        field = 'level'
      } else if (lower.includes('trọng số') || lower.includes('weight')) {
        field = 'weight'
      }
      setRowError({ rowId: id, field })
      setStatusMessage({
        text: msg,
        type: 'error',
      })
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveInsert = async (data: Partial<OnetSfiaMapping>) => {
    setIsSaving(true)
    setRowError(null)
    try {
      const newMapping = await onetAdminService.createSfiaMapping(socCode, {
        skillCode: data.skillCode || '',
        targetLevel: data.targetLevel || 3,
        weight: data.weight || 1.0,
        isCore: data.isCore ?? true,
        source: 'USER_DEFINED',
      })
      const updated = [newMapping, ...localMappings]
      setLocalMappings(updated)
      onUpdateMappings?.(updated)
      setIsInserting(false)
      setIsCurrentRowDirty(false)
      setRowError(null)
      setStatusMessage({
        text: `Đã thêm mới ánh xạ kỹ năng ${newMapping.skillCode} thành công!`,
        type: 'success',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể thêm mới ánh xạ kỹ năng'
      let field: 'level' | 'skillCode' | 'weight' | null = null
      const lower = msg.toLowerCase()
      if (lower.includes('cấp độ') || lower.includes('level') || lower.includes('tồn tại') || lower.includes('409')) {
        field = 'level'
      } else if (lower.includes('kỹ năng') || lower.includes('skill')) {
        field = 'skillCode'
      } else if (lower.includes('trọng số') || lower.includes('weight')) {
        field = 'weight'
      }
      setRowError({ rowId: 'insert', field })
      setStatusMessage({
        text: msg,
        type: 'error',
      })
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onetAdminService.deleteSfiaMapping(socCode, deleteTarget.id)
      const updated = localMappings.filter((m) => m.id !== deleteTarget.id)
      setLocalMappings(updated)
      onUpdateMappings?.(updated)
      setStatusMessage({
        text: `Đã xóa ánh xạ kỹ năng ${deleteTarget.skillCode}!`,
        type: 'success',
      })
      setDeleteTarget(null)
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Lỗi khi xóa ánh xạ kỹ năng',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExecuteReset = async () => {
    setIsResetting(true)
    try {
      const restored = await onetAdminService.resetSfiaMappings(socCode)
      setLocalMappings(restored)
      onUpdateMappings?.(restored)
      setEditingId(null)
      setIsInserting(false)
      setIsCurrentRowDirty(false)
      setRowError(null)
      setIsResetConfirmOpen(false)
      setStatusMessage({
        text: 'Đã khôi phục dữ liệu ánh xạ từ database thành công!',
        type: 'success',
      })
    } catch {
      setStatusMessage({
        text: 'Không thể khôi phục dữ liệu ánh xạ',
        type: 'error',
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleResetToDefault = () => {
    setIsResetConfirmOpen(true)
  }

  // Temporary dummy mapping template for insert row
  const insertDummyMapping: OnetSfiaMapping = {
    id: 'temp-insert-row',
    skillCode: '',
    skillName: '',
    targetLevel: 3,
    minLevel: 1,
    maxLevel: 7,
    weight: 1.0,
    isCore: true,
    source: 'USER_DEFINED',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* TẦNG 1: THƯỚC ĐO PHỔ NĂNG LỰC & CHỈ SỐ VĨ MÔ */}
      <OnetSfiaSpectrumBar
        mappings={localMappings}
        onSelectSkill={(code) => {
          setHighlightedSkillCode(code)
          setTimeout(() => setHighlightedSkillCode(null), 3000)
        }}
      />

      {/* Floating Status Notification Feedback */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold shadow-elevation-2 animate-in fade-in slide-in-from-top-2',
            statusMessage.type === 'success'
              ? 'bg-success text-success-foreground'
              : 'bg-destructive text-destructive-foreground'
          )}
        >
          <span>{statusMessage.text}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusMessage(null)}
            className="h-6 w-6 p-0 rounded-full hover:bg-white/20 text-current"
            aria-label="Đóng thông báo"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* TẦNG 2: BẢNG QUẢN TRỊ INLINE CRUD */}
      <Card className="p-3.5 sm:p-4 space-y-3.5">
        {/* Table Controls Header: Search, Chips & Add Button */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="text-ink-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã hoặc tên kỹ năng SFIA..."
              className="bg-surface-inset h-9 pl-9 pr-8 text-xs sm:text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-ink-muted hover:text-ink rounded-full"
                title="Xóa từ khóa tìm kiếm"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="h-9 gap-1.5 px-2.5 text-xs text-ink-muted hover:text-ink"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden md:inline">Khôi phục Mẫu</span>
            </Button>

            <Button
              size="sm"
              onClick={handleRequestStartInsert}
              disabled={isInserting || isSaving}
              className="h-9 gap-1.5 px-3.5 text-xs font-semibold bg-brand text-brand-foreground shadow-sm"
            >
              <Plus className="size-4" />
              <span>Thêm Ánh xạ Mới</span>
            </Button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2.5">
          <Button
            variant={activeFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'h-7.5 px-3 text-xs rounded-full gap-1 transition-all',
              activeFilter !== 'all' && 'border-border/80 text-ink-muted hover:text-ink'
            )}
          >
            <span>Tất cả</span>
            <span className="font-mono text-[11px] tabular-nums">({localMappings.length})</span>
          </Button>

          <Button
            variant={activeFilter === 'core' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('core')}
            className={cn(
              'h-7.5 px-3 text-xs rounded-full gap-1 transition-all',
              activeFilter === 'core'
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            )}
          >
            <Star className="size-3" />
            <span>Cốt lõi (Core)</span>
            <span className="font-mono text-[11px] tabular-nums">({coreCount})</span>
          </Button>

          <Button
            variant={activeFilter === 'secondary' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('secondary')}
            className={cn(
              'h-7.5 px-3 text-xs rounded-full gap-1 transition-all',
              activeFilter !== 'secondary' && 'border-border/80 text-ink-muted hover:text-ink'
            )}
          >
            <span>Bổ trợ (Secondary)</span>
            <span className="font-mono text-[11px] tabular-nums">({secondaryCount})</span>
          </Button>
        </div>

        {/* Empty State when no mappings exist and not currently inserting */}
        {localMappings.length === 0 && !isInserting && (
          <div className="p-8">
            <EmptyState
              icon={<Network className="text-brand size-12" />}
              title="Chưa có ánh xạ năng lực SFIA"
              description={`Nghề "${occupationTitle}" chưa được liên kết với kỹ năng nào trong khung SFIA 9.`}
              action={{
                label: '+ Thêm ánh xạ SFIA đầu tiên',
                onClick: handleRequestStartInsert,
              }}
            />
          </div>
        )}

        {/* Empty State when filter/search yields 0 */}
        {localMappings.length > 0 && filteredMappings.length === 0 && !isInserting && (
          <div className="p-8">
            <EmptyState
              icon={<FileX className="text-ink-muted size-10" />}
              title="Không tìm thấy ánh xạ phù hợp"
              description={
                searchQuery
                  ? `Không có kỹ năng nào khớp với từ khóa "${searchQuery}" và bộ lọc hiện tại.`
                  : 'Không có kỹ năng nào thuộc tiêu chí lọc đã chọn.'
              }
              action={{
                label: 'Xóa bộ lọc tìm kiếm',
                onClick: () => {
                  setSearchQuery('')
                  setActiveFilter('all')
                },
              }}
            />
          </div>
        )}

        {/* Mapping Data Table */}
        {(filteredMappings.length > 0 || isInserting) && (
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-surface-inset/80 text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                  <TableHead className="flex-[2] min-w-[200px] p-3 text-left">Kỹ năng SFIA 9</TableHead>
                  <TableHead className="flex-[2] min-w-[170px] p-3 text-left">Cấp độ & Thang đo (Gauge)</TableHead>
                  <TableHead className="w-24 p-3 justify-start">Trọng số</TableHead>
                  <TableHead className="w-28 p-3 justify-start">Vai trò</TableHead>
                  <TableHead className="w-28 p-3 justify-start">Nguồn</TableHead>
                  <TableHead className="w-20 p-3 justify-end text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Inline Insert Row at Top */}
                {isInserting && (
                  <OnetSfiaRow
                    key="insert-row"
                    mapping={insertDummyMapping}
                    isEditing={true}
                    isInserting={true}
                    isSaving={isSaving}
                    availableSkills={unmappedSkills}
                    errorField={rowError?.rowId === 'insert' ? rowError.field : null}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {
                      setIsInserting(false)
                      setIsCurrentRowDirty(false)
                      setRowError(null)
                    }}
                    onSave={handleSaveInsert}
                    onDelete={() => {}}
                    onDirtyChange={setIsCurrentRowDirty}
                    className="border-2 border-brand shadow-sm bg-brand/5"
                  />
                )}

                {/* Table Data Rows */}
                {filteredMappings.map((mapping) => (
                  <OnetSfiaRow
                    key={mapping.id}
                    mapping={mapping}
                    isEditing={editingId === mapping.id}
                    isSaving={isSaving && editingId === mapping.id}
                    availableSkills={sfiaLibrary}
                    errorField={rowError?.rowId === mapping.id ? rowError.field : null}
                    onStartEdit={() => handleRequestStartEdit(mapping.id)}
                    onCancelEdit={() => {
                      setEditingId(null)
                      setIsCurrentRowDirty(false)
                      setRowError(null)
                    }}
                    onSave={(data) => handleSaveExisting(mapping.id, data)}
                    onDelete={() => setDeleteTarget(mapping)}
                    onDirtyChange={setIsCurrentRowDirty}
                    isHighlighted={highlightedSkillCode === mapping.skillCode}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal 1: Delete Confirmation Guard */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full mb-1">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-ink text-base">
              Xác nhận xóa ánh xạ kỹ năng SFIA
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-ink-muted leading-relaxed space-y-2">
              <span>
                Bạn có chắc chắn muốn xóa ánh xạ kỹ năng{' '}
                <strong className="text-ink font-semibold font-mono">
                  {deleteTarget?.skillCode} — {deleteTarget?.skillName}
                </strong>{' '}
                (Cấp độ {deleteTarget?.targetLevel}) khỏi nghề{' '}
                <strong className="text-ink font-semibold">{occupationTitle}</strong> ({socCode})?
              </span>
              <span className="block text-destructive font-medium">
                Hành động này sẽ làm thay đổi tiêu chuẩn đánh giá và ngân hàng câu hỏi phỏng vấn liên quan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs gap-1.5"
            >
              {isDeleting ? <LoadingSpinner className="size-3.5" /> : 'Xác nhận xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal 2: Unsaved Row Switch Warning */}
      <AlertDialog
        open={switchRowAlert !== null}
        onOpenChange={(open) => {
          if (!open) setSwitchRowAlert(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="bg-amber-500/10 text-amber-600 flex size-10 items-center justify-center rounded-full mb-1">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-ink text-base">
              Thay đổi chưa được lưu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-ink-muted leading-relaxed">
              Bạn đang có các thay đổi chưa được lưu trên hàng hiện tại. Nếu chuyển sang chỉnh sửa hàng khác bây giờ, các thay đổi chưa lưu sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSwitchRowAlert(null)}
              className="text-xs"
            >
              Ở lại hàng hiện tại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSwitchRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Hủy thay đổi & Tiếp tục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal 3: Reset to Default Confirmation Guard */}
      <AlertDialog
        open={isResetConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isResetting) setIsResetConfirmOpen(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="bg-brand/10 text-brand flex size-10 items-center justify-center rounded-full mb-1">
              <RotateCcw className="size-5" />
            </div>
            <AlertDialogTitle className="text-ink text-base">
              Khôi phục Ánh xạ SFIA Mặc định
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-ink-muted leading-relaxed space-y-2">
              <span>
                Bạn có chắc chắn muốn tải lại toàn bộ danh sách ánh xạ SFIA từ cơ sở dữ liệu cho nghề{' '}
                <strong className="text-ink font-semibold">{occupationTitle}</strong> ({socCode})?
              </span>
              <span className="block text-ink-muted">
                Các chỉnh sửa chưa lưu hoặc hàng nháp đang mở sẽ bị hủy bỏ.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting} className="text-xs">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteReset}
              disabled={isResetting}
              className="bg-brand text-brand-foreground hover:bg-brand/90 text-xs gap-1.5"
            >
              {isResetting ? <LoadingSpinner className="size-3.5" /> : 'Xác nhận khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

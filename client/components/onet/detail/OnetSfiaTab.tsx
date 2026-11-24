'use client'

import { useEffect, useMemo, useState } from 'react'
import { Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { onetAdminQueries } from '@/queries/onet.queries'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import { queryKeys } from '@/queries/keys'
import { onetAdminService } from '@/services'
import type {
  CreateOnetSfiaMappingPayload,
  OnetSfiaMapping,
  UpdateOnetSfiaMappingPayload,
} from '@/types'
import { OnetSfiaAddModal } from './OnetSfiaAddModal'
import { OnetSfiaResetModal } from './OnetSfiaResetModal'
import { OnetSfiaSpectrumBar } from './OnetSfiaSpectrumBar'
import { OnetSfiaSummaryBar } from './OnetSfiaSummaryBar'
import { OnetSfiaTable } from './OnetSfiaTable'

export interface OnetSfiaTabProps {
  socCode: string
  occupationTitle: string
  mappings: OnetSfiaMapping[]
  onUpdateMappings?: (newMappings: OnetSfiaMapping[]) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function OnetSfiaTab({
  socCode,
  occupationTitle,
  mappings,
  onUpdateMappings,
  onDirtyChange,
}: Readonly<OnetSfiaTabProps>) {
  const queryClient = useQueryClient()
  const [localMappings, setLocalMappings] = useState<OnetSfiaMapping[]>(mappings)
  const [prevMappings, setPrevMappings] = useState(mappings)

  if (prevMappings !== mappings) {
    setPrevMappings(mappings)
    setLocalMappings(mappings)
  }

  const { data: sfiaLibrary = [] } = useQuery(onetAdminQueries.sfiaLibrary())
  const { data: levels = [] } = useQuery(sfiaAdminQueries.levels())

  const invalidateOnetAdmin = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onetAdmin.all,
      predicate: (query) =>
        !(
          query.queryKey[0] === 'onet-admin' &&
          query.queryKey[1] === 'sfia-library'
        ),
    })
  }

  // Mutations
  const updateMappingMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateOnetSfiaMappingPayload
    }) => onetAdminService.updateSfiaMapping(socCode, id, payload),
    onSuccess: invalidateOnetAdmin,
  })

  const createMappingMutation = useMutation({
    mutationFn: (payload: CreateOnetSfiaMappingPayload) =>
      onetAdminService.createSfiaMapping(socCode, payload),
    onSuccess: invalidateOnetAdmin,
  })

  const deleteMappingMutation = useMutation({
    mutationFn: (id: string) => onetAdminService.deleteSfiaMapping(socCode, id),
    onSuccess: invalidateOnetAdmin,
  })

  const resetMappingsMutation = useMutation({
    mutationFn: () => onetAdminService.resetSfiaMappings(socCode),
    onSuccess: invalidateOnetAdmin,
  })

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'core' | 'secondary'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isRowDirty, setIsRowDirty] = useState(false)
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [resetModalOpened, setResetModalOpened] = useState(false)
  const [highlightedSkillCode, setHighlightedSkillCode] = useState<string | null>(null)

  useEffect(() => {
    onDirtyChange?.(isRowDirty)
  }, [isRowDirty, onDirtyChange])

  // Filtered mappings
  const filteredMappings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return localMappings.filter((m) => {
      if (activeFilter === 'core' && !m.isCore) return false
      if (activeFilter === 'secondary' && m.isCore) return false
      if (!q) return true
      return (
        m.skillCode.toLowerCase().includes(q) ||
        m.skillName.toLowerCase().includes(q) ||
        Boolean(m.category?.toLowerCase().includes(q))
      )
    })
  }, [localMappings, activeFilter, searchQuery])

  const coreCount = useMemo(
    () => localMappings.filter((m) => m.isCore).length,
    [localMappings]
  )
  const secondaryCount = localMappings.length - coreCount

  // Handlers with dirty guard
  const runWithRowGuard = (action: () => void) => {
    if (!isRowDirty) {
      action()
      return
    }
    modals.openConfirmModal({
      title: 'Thay đổi chưa lưu trên dòng',
      children: (
        <Text size="sm">
          Bạn đang có thay đổi chưa lưu trên dòng kỹ năng hiện tại. Bạn có chắc muốn hủy bỏ?
        </Text>
      ),
      labels: { confirm: 'Hủy thay đổi', cancel: 'Tiếp tục sửa' },
      confirmProps: { color: 'danger' },
      onConfirm: () => {
        setIsRowDirty(false)
        setEditingId(null)
        action()
      },
    })
  }

  const handleStartEdit = (id: string) => {
    if (editingId === id) return
    runWithRowGuard(() => setEditingId(id))
  }

  const handleCancelEdit = () => {
    setIsRowDirty(false)
    setEditingId(null)
  }

  const handleSave = async (id: string, payload: Partial<OnetSfiaMapping>) => {
    setSavingId(id)
    try {
      await updateMappingMutation.mutateAsync({
        id,
        payload: {
          targetLevel: payload.targetLevel,
          weight: payload.weight,
          isCore: payload.isCore,
        },
      })
      const updated = localMappings.map((m) =>
        m.id === id ? { ...m, ...payload } : m
      )
      setLocalMappings(updated)
      onUpdateMappings?.(updated)
      setIsRowDirty(false)
      setEditingId(null)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteMappingMutation.mutateAsync(id)
    const updated = localMappings.filter((m) => m.id !== id)
    setLocalMappings(updated)
    onUpdateMappings?.(updated)
    if (editingId === id) {
      setIsRowDirty(false)
      setEditingId(null)
    }
  }

  const handleAddMapping = async (payload: CreateOnetSfiaMappingPayload) => {
    const created = await createMappingMutation.mutateAsync(payload)
    const updated = [...localMappings, created]
    setLocalMappings(updated)
    onUpdateMappings?.(updated)
  }

  const handleResetMappings = async () => {
    const restored = await resetMappingsMutation.mutateAsync()
    setLocalMappings(restored)
    onUpdateMappings?.(restored)
    setResetModalOpened(false)
    setIsRowDirty(false)
    setEditingId(null)
  }

  const isMutating =
    createMappingMutation.isPending ||
    updateMappingMutation.isPending ||
    deleteMappingMutation.isPending ||
    resetMappingsMutation.isPending

  return (
    <Stack gap="sm">
      <OnetSfiaSpectrumBar
        mappings={localMappings}
        levels={levels}
        onSelectSkill={(code) => {
          setHighlightedSkillCode(code)
          setTimeout(() => setHighlightedSkillCode(null), 3000)
        }}
      />

      <OnetSfiaSummaryBar
        totalCount={localMappings.length}
        filteredCount={filteredMappings.length}
        coreCount={coreCount}
        secondaryCount={secondaryCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenAddModal={() => runWithRowGuard(() => setAddModalOpened(true))}
        onOpenResetModal={() => runWithRowGuard(() => setResetModalOpened(true))}
        isMutating={isMutating}
      />

      <OnetSfiaTable
        mappings={filteredMappings}
        availableSkills={sfiaLibrary}
        editingId={editingId}
        savingId={savingId}
        highlightedSkillCode={highlightedSkillCode}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSave={handleSave}
        onDelete={handleDelete}
        onDirtyChange={setIsRowDirty}
      />

      <OnetSfiaAddModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        availableSkills={sfiaLibrary}
        currentMappings={localMappings}
        onAddMapping={handleAddMapping}
        isPending={createMappingMutation.isPending}
      />

      <OnetSfiaResetModal
        opened={resetModalOpened}
        onClose={() => setResetModalOpened(false)}
        occupationTitle={occupationTitle}
        socCode={socCode}
        onConfirmReset={handleResetMappings}
        isResetting={resetMappingsMutation.isPending}
      />
    </Stack>
  )
}

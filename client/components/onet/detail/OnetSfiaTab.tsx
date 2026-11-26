'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useQuery } from '@tanstack/react-query'
import { onetAdminQueries } from '@/queries/onet.queries'
import { sfiaAdminQueries } from '@/queries/sfia.queries'
import type { CreateOnetSfiaMappingPayload, OnetSfiaMapping } from '@/types'
import { OnetSfiaAddModal } from './OnetSfiaAddModal'
import { OnetSfiaResetModal } from './OnetSfiaResetModal'
import { OnetSfiaSpectrumBar } from './OnetSfiaSpectrumBar'
import { OnetSfiaSummaryBar } from './OnetSfiaSummaryBar'
import { OnetSfiaTable } from './OnetSfiaTable'
import { useOnetSfiaMutations } from './useOnetSfiaMutations'

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
  const [localMappings, setLocalMappings] = useState(mappings)
  const [prevMappings, setPrevMappings] = useState(mappings)
  const [prevSoc, setPrevSoc] = useState(socCode)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'core' | 'secondary'
  >('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isRowDirty, setIsRowDirty] = useState(false)
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [resetModalOpened, setResetModalOpened] = useState(false)
  const [highlightedSkillCode, setHighlightedSkillCode] = useState<
    string | null
  >(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (prevMappings !== mappings) {
    setPrevMappings(mappings)
    setLocalMappings(mappings)
  }
  if (prevSoc !== socCode) {
    setPrevSoc(socCode)
    setEditingId(null)
    setIsRowDirty(false)
  }

  const { data: sfiaLibrary = [] } = useQuery(onetAdminQueries.sfiaLibrary())
  const { data: levels = [] } = useQuery(sfiaAdminQueries.levels())
  const {
    createMappingMutation,
    updateMappingMutation,
    deleteMappingMutation,
    resetMappingsMutation,
    isMutating,
  } = useOnetSfiaMutations(socCode)

  useEffect(() => {
    onDirtyChange?.(isRowDirty)
  }, [isRowDirty, onDirtyChange])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

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

  const commitMappings = (next: OnetSfiaMapping[]) => {
    setLocalMappings(next)
    onUpdateMappings?.(next)
  }

  const runWithRowGuard = (action: () => void) => {
    if (!isRowDirty) return action()
    modals.openConfirmModal({
      title: 'Thay đổi chưa lưu trên dòng',
      children: (
        <Text size="sm">
          Bạn đang có thay đổi chưa lưu trên dòng kỹ năng hiện tại. Bạn có chắc
          muốn hủy bỏ?
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

  const handleSelectSpectrumSkill = (code: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    setHighlightedSkillCode(code)
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedSkillCode(null)
      highlightTimerRef.current = null
    }, 3000)
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
      commitMappings(
        localMappings.map((m) => (m.id === id ? { ...m, ...payload } : m))
      )
      setIsRowDirty(false)
      setEditingId(null)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteMappingMutation.mutateAsync(id)
    commitMappings(localMappings.filter((m) => m.id !== id))
    if (editingId === id) {
      setIsRowDirty(false)
      setEditingId(null)
    }
  }

  const handleAddMapping = async (payload: CreateOnetSfiaMappingPayload) => {
    const created = await createMappingMutation.mutateAsync(payload)
    commitMappings([...localMappings, created])
  }

  const handleResetMappings = async () => {
    const restored = await resetMappingsMutation.mutateAsync()
    commitMappings(restored)
    setResetModalOpened(false)
    setIsRowDirty(false)
    setEditingId(null)
  }

  return (
    <Stack gap="xs">
      <OnetSfiaSpectrumBar
        mappings={localMappings}
        levels={levels}
        onSelectSkill={handleSelectSpectrumSkill}
      />
      <OnetSfiaSummaryBar
        totalCount={localMappings.length}
        filteredCount={filteredMappings.length}
        coreCount={coreCount}
        secondaryCount={localMappings.length - coreCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onOpenAddModal={() => runWithRowGuard(() => setAddModalOpened(true))}
        onOpenResetModal={() =>
          runWithRowGuard(() => setResetModalOpened(true))
        }
        isMutating={isMutating}
      />
      <OnetSfiaTable
        mappings={filteredMappings}
        availableSkills={sfiaLibrary}
        levels={levels}
        editingId={editingId}
        savingId={savingId}
        highlightedSkillCode={highlightedSkillCode}
        onStartEdit={(id) => {
          if (editingId !== id) runWithRowGuard(() => setEditingId(id))
        }}
        onCancelEdit={() => {
          setIsRowDirty(false)
          setEditingId(null)
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        onDirtyChange={setIsRowDirty}
      />
      <OnetSfiaAddModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        availableSkills={sfiaLibrary}
        currentMappings={localMappings}
        levels={levels}
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

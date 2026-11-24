'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Paper, Progress, SimpleGrid, Stack, Text } from '@mantine/core'
import type {
  SfiaLevelResponsibility,
  SfiaQuestionBankItem,
  SfiaSkillDetail,
} from '@/types'
import { SfiaCreateQuestionModal } from './SfiaCreateQuestionModal'
import { SfiaQuestionCard } from './SfiaQuestionCard'
import { SfiaQuestionEmptyState } from './SfiaQuestionEmptyState'
import { SfiaQuestionFilters } from './SfiaQuestionFilters'

export interface SfiaQuestionBankTabProps {
  skillDetail: SfiaSkillDetail
  selectedLevel: number
  levels?: SfiaLevelResponsibility[]
  onQuestionCreated?: (newQuestion: SfiaQuestionBankItem) => void
  className?: string
}

export function SfiaQuestionBankTab({
  skillDetail,
  selectedLevel,
  levels,
  onQuestionCreated,
  className,
}: Readonly<SfiaQuestionBankTabProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  const items = useMemo(
    () => skillDetail.questionBankItems || [],
    [skillDetail.questionBankItems]
  )

  const stats = useMemo(() => {
    let easy = 0
    let medium = 0
    let hard = 0
    let matchingCurrentLevel = 0

    items.forEach((q) => {
      if (q.difficulty === 'EASY') easy++
      else if (q.difficulty === 'MEDIUM') medium++
      else if (q.difficulty === 'HARD') hard++
      if (q.targetSfiaLevel === selectedLevel) matchingCurrentLevel++
    })

    return {
      total: items.length,
      easy,
      medium,
      hard,
      matchingCurrentLevel,
    }
  }, [items, selectedLevel])

  const filteredQuestions = useMemo(() => {
    return items.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchText = q.questionText.toLowerCase().includes(query)
        const matchId = q.id.toLowerCase().includes(query)
        if (!matchText && !matchId) return false
      }

      if (filterLevel === 'current') {
        if (q.targetSfiaLevel !== selectedLevel) return false
      } else if (filterLevel !== 'all') {
        if (q.targetSfiaLevel !== Number(filterLevel)) return false
      }

      if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) {
        return false
      }

      if (filterType !== 'ALL' && q.type !== filterType) {
        return false
      }

      return true
    })
  }, [
    items,
    searchQuery,
    filterLevel,
    filterDifficulty,
    filterType,
    selectedLevel,
  ])

  const handleQuestionCreatedInternal = (newQ: SfiaQuestionBankItem) => {
    setNewlyCreatedId(newQ.id)
    onQuestionCreated?.(newQ)
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(() => setNewlyCreatedId(null), 4000)
  }

  const easyPct = stats.total > 0 ? (stats.easy / stats.total) * 100 : 0
  const medPct = stats.total > 0 ? (stats.medium / stats.total) * 100 : 0
  const hardPct = stats.total > 0 ? (stats.hard / stats.total) * 100 : 0

  return (
    <Stack gap="sm" className={className}>
      {/* 1. Mini KPI Distribution Cards */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Tổng số câu hỏi mẫu
          </Text>
          <Text fw={700} size="sm">
            {stats.total} câu hỏi
          </Text>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Phân bổ độ khó
          </Text>
          <Progress.Root size="xs" radius="xl" mt={4}>
            <Progress.Section
              value={easyPct}
              color="success"
              withAria={false}
            />
            <Progress.Section value={medPct} color="warning" withAria={false} />
            <Progress.Section value={hardPct} color="danger" withAria={false} />
          </Progress.Root>
          <Group gap={6} mt={2}>
            <Text size="xs" c="dimmed" fz={10}>
              {stats.easy} Dễ · {stats.medium} TB · {stats.hard} Khó
            </Text>
          </Group>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Khớp cấp độ L{selectedLevel}
          </Text>
          <Text fw={700} size="sm" c="brand">
            {stats.matchingCurrentLevel} câu hỏi
          </Text>
        </Paper>

        <Paper withBorder p="xs" radius="sm">
          <Text size="xs" c="dimmed">
            Dải cấp độ áp dụng
          </Text>
          <Text fw={700} size="sm" ff="monospace">
            L{skillDetail.minLevel} ➔ L{skillDetail.maxLevel}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* 2. Filters Toolbar */}
      <SfiaQuestionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLevel={filterLevel}
        onFilterLevelChange={setFilterLevel}
        filterDifficulty={filterDifficulty}
        onFilterDifficultyChange={setFilterDifficulty}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        onOpenCreateModal={() => setModalOpen(true)}
        minLevel={skillDetail.minLevel}
        maxLevel={skillDetail.maxLevel}
        selectedLevel={selectedLevel}
      />

      {/* 3. Question Cards List */}
      {items.length === 0 ? (
        <SfiaQuestionEmptyState
          variant="blind-spot"
          skillCode={skillDetail.code}
          onOpenCreateModal={() => setModalOpen(true)}
          onResetFilters={() => {
            setSearchQuery('')
            setFilterLevel('all')
            setFilterDifficulty('ALL')
            setFilterType('ALL')
          }}
        />
      ) : filteredQuestions.length === 0 ? (
        <SfiaQuestionEmptyState
          variant="no-match"
          skillCode={skillDetail.code}
          onOpenCreateModal={() => setModalOpen(true)}
          onResetFilters={() => {
            setSearchQuery('')
            setFilterLevel('all')
            setFilterDifficulty('ALL')
            setFilterType('ALL')
          }}
        />
      ) : (
        <Stack gap="xs">
          {filteredQuestions.map((q) => (
            <SfiaQuestionCard
              key={q.id}
              question={q}
              isNewlyCreated={newlyCreatedId === q.id}
            />
          ))}
        </Stack>
      )}

      {/* Create Question Modal */}
      <SfiaCreateQuestionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        skillCode={skillDetail.code}
        skillName={skillDetail.name}
        minLevel={skillDetail.minLevel}
        maxLevel={skillDetail.maxLevel}
        defaultLevel={selectedLevel}
        levels={levels}
        onQuestionCreated={handleQuestionCreatedInternal}
      />
    </Stack>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Divider,
  Paper,
  ScrollArea,
  Text,
  Tree,
  getTreeExpandedState,
  useTree,
} from '@mantine/core'
import type { TreeNodeData } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillSummary,
  SfiaSubcategory,
} from '@/types'
import { SfiaSidebarFilters } from './SfiaSidebarFilters'
import { SfiaTreeNode } from './SfiaTreeNode'
import { buildSfiaTreeData, filterSfiaSkills } from './sfia-tree.utils'
import classes from './SfiaSidebarTree.module.css'

export interface SfiaSidebarTreeProps {
  categories: SfiaCategory[]
  subcategories: SfiaSubcategory[]
  skills: SfiaSkillSummary[]
  selectedSkill: string
  selectedLevel: number
  onSelectSkill: (skillCode: string, targetLevel?: number) => void
  levels?: SfiaLevelResponsibility[]
  className?: string
}

export function SfiaSidebarTree({
  categories,
  subcategories,
  skills,
  selectedSkill,
  selectedLevel,
  onSelectSkill,
  levels,
  className,
}: Readonly<SfiaSidebarTreeProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [blindSpotsOnly, setBlindSpotsOnly] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Global hotkeys: Ctrl+K or / to focus search
  useHotkeys([
    [
      'mod+K',
      (e) => {
        e.preventDefault()
        searchInputRef.current?.focus()
      },
    ],
    [
      '/',
      (e) => {
        const target = e.target as HTMLElement | null
        if (target?.matches('input, textarea, select, [contenteditable]'))
          return
        e.preventDefault()
        searchInputRef.current?.focus()
      },
    ],
  ])

  // Filter skills based on search, category, level, and blind spots
  const filteredSkills = useMemo(() => {
    return filterSfiaSkills(
      skills,
      searchQuery,
      categoryFilter,
      levelFilter,
      blindSpotsOnly
    )
  }, [skills, searchQuery, categoryFilter, levelFilter, blindSpotsOnly])

  // Find category and subcategory of current skill
  const currentSkillInfo = useMemo(() => {
    return skills.find((s) => s.code === selectedSkill)
  }, [skills, selectedSkill])

  // Build tree data hierarchy (Category -> Subcategory -> Skill)
  const treeData = useMemo<TreeNodeData[]>(() => {
    return buildSfiaTreeData(categories, subcategories, filteredSkills)
  }, [categories, subcategories, filteredSkills])

  // Initial expanded keys (selected skill's parent category & subcategory)
  const initialOpenKeys = useMemo(() => {
    if (!currentSkillInfo) return []
    return [
      `cat:${currentSkillInfo.categoryCode}`,
      `sub:${currentSkillInfo.subcategoryCode}`,
    ]
  }, [currentSkillInfo])

  const tree = useTree({
    initialSelectedState: selectedSkill ? [`skill:${selectedSkill}`] : [],
    initialExpandedState: Object.fromEntries(
      initialOpenKeys.map((k) => [k, true])
    ),
  })
  const treeRef = useRef(tree)
  useEffect(() => {
    treeRef.current = tree
  })

  // Synchronize selection & parent expansion when selectedSkill changes
  useEffect(() => {
    if (!selectedSkill) return
    treeRef.current.setSelectedState([`skill:${selectedSkill}`])
    if (currentSkillInfo) {
      treeRef.current.setExpandedState({
        ...treeRef.current.expandedState,
        [`cat:${currentSkillInfo.categoryCode}`]: true,
        [`sub:${currentSkillInfo.subcategoryCode}`]: true,
      })
    }
  }, [selectedSkill, currentSkillInfo])

  // Automatically expand all nodes when an active filter is applied
  const hasActiveFilter = Boolean(
    searchQuery.trim() ||
    categoryFilter ||
    levelFilter !== 'all' ||
    blindSpotsOnly
  )

  useEffect(() => {
    if (hasActiveFilter) {
      treeRef.current.setExpandedState(getTreeExpandedState(treeData, '*'))
    }
  }, [hasActiveFilter, treeData])

  // Auto-scroll selected skill into view
  useEffect(() => {
    if (!selectedSkill) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`sfia-tree-skill-${selectedSkill}`)
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedSkill])

  return (
    <Paper
      withBorder
      radius="md"
      className={`${classes.treeContainer} ${className ?? ''}`}
    >
      <SfiaSidebarFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        selectedLevel={levelFilter}
        onLevelChange={setLevelFilter}
        blindSpotsOnly={blindSpotsOnly}
        onBlindSpotsOnlyChange={setBlindSpotsOnly}
        categories={categories}
        levels={levels}
        onExpandAll={() =>
          tree.setExpandedState(getTreeExpandedState(treeData, '*'))
        }
        onCollapseAll={() => tree.collapseAllNodes()}
        searchInputRef={searchInputRef}
      />

      <Divider />

      <ScrollArea className={classes.treeScroll} p="xs">
        {treeData.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="xl">
            Không tìm thấy kỹ năng phù hợp
          </Text>
        ) : (
          <Tree
            data={treeData}
            tree={tree}
            levelOffset="sm"
            renderNode={(payload) => (
              <SfiaTreeNode
                payload={payload}
                selectedSkill={selectedSkill}
                selectedLevel={selectedLevel}
                onSelectSkill={onSelectSkill}
              />
            )}
          />
        )}
      </ScrollArea>
    </Paper>
  )
}

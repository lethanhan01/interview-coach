import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SfiaMatrixView } from './SfiaMatrixView'
import type { SfiaCategory, SfiaSkillSummary, SfiaMatrixCellData } from './types'

describe('SfiaMatrixView', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả',
      displayOrder: 1,
      skillCount: 2,
    },
  ]

  const mockSkills: SfiaSkillSummary[] = [
    {
      code: 'PROG',
      name: 'Programming/software development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      minLevel: 2,
      maxLevel: 6,
      questionCount: 10,
      onetCount: 4,
    },
    {
      code: 'TEST',
      name: 'Testing',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      minLevel: 1,
      maxLevel: 4,
      questionCount: 0, // All blind spots
      onetCount: 2,
    },
  ]

  const mockCells: Record<string, SfiaMatrixCellData> = {
    PROG_L1: { skillCode: 'PROG', levelId: 1, isAvailable: false, questionCount: 0, onetCount: 0 },
    PROG_L2: { skillCode: 'PROG', levelId: 2, isAvailable: true, questionCount: 4, onetCount: 2 },
    PROG_L3: { skillCode: 'PROG', levelId: 3, isAvailable: true, questionCount: 6, onetCount: 2 },
    PROG_L4: { skillCode: 'PROG', levelId: 4, isAvailable: true, questionCount: 0, onetCount: 0 }, // Blind spot
    PROG_L5: { skillCode: 'PROG', levelId: 5, isAvailable: true, questionCount: 0, onetCount: 0 }, // Blind spot
    PROG_L6: { skillCode: 'PROG', levelId: 6, isAvailable: true, questionCount: 0, onetCount: 0 }, // Blind spot
    PROG_L7: { skillCode: 'PROG', levelId: 7, isAvailable: false, questionCount: 0, onetCount: 0 },
    TEST_L1: { skillCode: 'TEST', levelId: 1, isAvailable: true, questionCount: 0, onetCount: 1 },
    TEST_L2: { skillCode: 'TEST', levelId: 2, isAvailable: true, questionCount: 0, onetCount: 1 },
    TEST_L3: { skillCode: 'TEST', levelId: 3, isAvailable: true, questionCount: 0, onetCount: 0 },
    TEST_L4: { skillCode: 'TEST', levelId: 4, isAvailable: true, questionCount: 0, onetCount: 0 },
    TEST_L5: { skillCode: 'TEST', levelId: 5, isAvailable: false, questionCount: 0, onetCount: 0 },
    TEST_L6: { skillCode: 'TEST', levelId: 6, isAvailable: false, questionCount: 0, onetCount: 0 },
    TEST_L7: { skillCode: 'TEST', levelId: 7, isAvailable: false, questionCount: 0, onetCount: 0 },
  }

  const defaultProps = {
    skills: mockSkills,
    categories: mockCategories,
    cells: mockCells,
    displayMode: 'level' as const,
    blindSpotsOnly: false,
    inspectedCell: null,
    onSelectCell: vi.fn(),
    onClearFilters: vi.fn(),
  }

  it('renders table headers for Skill and all 7 SFIA levels', () => {
    const { container } = render(<SfiaMatrixView {...defaultProps} />)

    const thead = container.querySelector('thead')
    expect(thead).toBeInTheDocument()

    expect(screen.getByText('SFIA 9 Skills')).toBeInTheDocument()
    for (let l = 1; l <= 7; l++) {
      expect(screen.getAllByText(`L${l}`).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders category header row with category name', () => {
    render(<SfiaMatrixView {...defaultProps} />)

    expect(screen.getByTestId('category-header-DEV_IMPL')).toBeInTheDocument()
    expect(screen.getByText(/Development and implementation/)).toBeInTheDocument()
  })

  it('correctly marks inactive cells and active cells based on min/max level', () => {
    render(<SfiaMatrixView {...defaultProps} />)

    // PROG L1 should be inactive
    expect(screen.getByTestId('cell-PROG-L1-inactive')).toBeInTheDocument()
    // PROG L2 should be active button
    expect(screen.getByTestId('cell-PROG-L2')).toBeInTheDocument()
    // PROG L7 should be inactive
    expect(screen.getByTestId('cell-PROG-L7-inactive')).toBeInTheDocument()
  })

  it('calls onSelectCell with (skillCode, levelId) when active cell is clicked', () => {
    const onSelectCell = vi.fn()
    render(<SfiaMatrixView {...defaultProps} onSelectCell={onSelectCell} />)

    const cellL2 = screen.getByTestId('cell-PROG-L2')
    fireEvent.click(cellL2)

    expect(onSelectCell).toHaveBeenCalledWith('PROG', 2)
  })

  it('displays question counts when displayMode is "questions"', () => {
    render(<SfiaMatrixView {...defaultProps} displayMode="questions" />)

    // PROG L2 has 4 questions
    expect(screen.getByText('4 Qs')).toBeInTheDocument()
    // PROG L3 has 6 questions
    expect(screen.getByText('6 Qs')).toBeInTheDocument()
    // Blind spot has 0 Q
    expect(screen.getAllByText('0 Q').length).toBeGreaterThan(0)
  })

  it('displays O*NET count when displayMode is "onet"', () => {
    render(<SfiaMatrixView {...defaultProps} displayMode="onet" />)

    expect(screen.getAllByText('2 SOC').length).toBeGreaterThan(0)
  })

  it('renders empty state when skills list is empty', () => {
    const onClearFilters = vi.fn()
    render(
      <SfiaMatrixView
        {...defaultProps}
        skills={[]}
        onClearFilters={onClearFilters}
      />
    )

    expect(screen.getByTestId('matrix-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No matching SFIA skills found')).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: 'Clear filters' })
    fireEvent.click(clearBtn)
    expect(onClearFilters).toHaveBeenCalled()
  })
})

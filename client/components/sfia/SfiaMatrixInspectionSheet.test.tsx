import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaMatrixInspectionSheet } from './SfiaMatrixInspectionSheet'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type { SfiaSkillDetail } from './types'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('SfiaMatrixInspectionSheet', () => {
  const mockDetail: SfiaSkillDetail = {
    code: 'PROG',
    name: 'Programming/software development',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 2,
    maxLevel: 6,
    questionCount: 12,
    onetCount: 4,
    overallDescription: 'Mô tả tổng quan lập trình.',
    guidanceNotes: 'Ghi chú hướng dẫn.',
    skillLevels: [
      {
        skillCode: 'PROG',
        levelId: 3,
        essence: 'Phát triển phần mềm độc lập với các module phức tạp vừa phải.',
        description: 'Thiết kế, lập trình, kiểm thử các chương trình phức tạp vừa phải.',
      },
    ],
    onetMappings: [
      {
        socCode: '15-1252.00',
        occupationTitle: 'Software Developers',
        targetLevel: 3,
        weight: 2.0,
        isCore: true,
      },
    ],
    questionBankItems: [
      {
        id: 'Q-PROG-01',
        questionText: 'Giải thích Memory Leak trong Node.js?',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      },
    ],
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    skillCode: 'PROG',
    levelId: 3,
    categories: [],
    onOpenInTaxonomy: vi.fn(),
    onCreateQuestion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(sfiaAdminService, 'getSkillDetail').mockResolvedValue(mockDetail)
  })

  it('renders skill information and level statement after loading', async () => {
    render(<SfiaMatrixInspectionSheet {...defaultProps} />)

    expect(screen.getByText(/Loading skill information/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Programming/software development')).toBeInTheDocument()
    })

    expect(screen.getByText(/Phát triển phần mềm độc lập/)).toBeInTheDocument()
    expect(screen.getByText(/Thiết kế, lập trình, kiểm thử/)).toBeInTheDocument()
    expect(screen.getByText('Giải thích Memory Leak trong Node.js?')).toBeInTheDocument()
    expect(screen.getByText('15-1252.00')).toBeInTheDocument()
  })

  it('triggers onOpenInTaxonomy and onClose when "Open in Tree" is clicked', async () => {
    const onOpenInTaxonomy = vi.fn()
    const onClose = vi.fn()

    render(
      <SfiaMatrixInspectionSheet
        {...defaultProps}
        onOpenInTaxonomy={onOpenInTaxonomy}
        onClose={onClose}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Programming/software development')).toBeInTheDocument()
    })

    const openTaxonomyBtn = screen.getByRole('button', { name: /Open in Tree/i })
    fireEvent.click(openTaxonomyBtn)

    expect(onOpenInTaxonomy).toHaveBeenCalledWith('PROG', 3)
    expect(onClose).toHaveBeenCalled()
  })

  it('triggers onCreateQuestion when "Create Question" is clicked', async () => {
    const onCreateQuestion = vi.fn()

    render(
      <SfiaMatrixInspectionSheet
        {...defaultProps}
        onCreateQuestion={onCreateQuestion}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Programming/software development')).toBeInTheDocument()
    })

    const createBtn = screen.getByRole('button', { name: /Create Question/i })
    fireEvent.click(createBtn)

    expect(onCreateQuestion).toHaveBeenCalledWith('PROG', 3)
  })

  it('copies prompt rubric to clipboard when "Copy AI Prompt" is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<SfiaMatrixInspectionSheet {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Programming/software development')).toBeInTheDocument()
    })

    const copyBtn = screen.getByRole('button', { name: /Copy AI Prompt/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalled()
  })
})

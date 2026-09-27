import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaQuestionBankTab } from './SfiaQuestionBankTab'
import type { SfiaSkillDetail } from './types'

const mockDetail: SfiaSkillDetail = {
  code: 'PROG',
  name: 'Programming/software development',
  categoryCode: 'DEV_IMPL',
  subcategoryCode: 'SYS_DEV',
  minLevel: 2,
  maxLevel: 6,
  questionCount: 3,
  onetCount: 2,
  overallDescription: 'Description of programming',
  skillLevels: [],
  onetMappings: [],
  questionBankItems: [
    {
      id: 'Q-PROG-01',
      questionText: 'Explain how to handle memory leaks in React applications.',
      type: 'TECHNICAL',
      difficulty: 'HARD',
      targetSfiaLevel: 4,
    },
    {
      id: 'Q-PROG-02',
      questionText: 'Describe concurrency vs parallelism in systems.',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSfiaLevel: 3,
    },
    {
      id: 'Q-PROG-03',
      questionText: 'Tell me about a time you resolved a git merge conflict.',
      type: 'BEHAVIORAL',
      difficulty: 'EASY',
      targetSfiaLevel: 3,
    },
  ],
}

describe('SfiaQuestionBankTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('renders 4 KPI mini cards with accurate metric counts', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    // Total questions: 3
    expect(screen.getByText('Tổng câu hỏi mẫu')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)

    // Difficulty breakdown
    expect(screen.getByText('Phân bổ độ khó')).toBeInTheDocument()
    expect(screen.getByText(/1 Dễ/)).toBeInTheDocument()
    expect(screen.getByText(/1 Vừa/)).toBeInTheDocument()
    expect(screen.getByText(/1 Khó/)).toBeInTheDocument()

    // Matching selectedLevel 3: 2 questions (Q-PROG-02 and Q-PROG-03)
    expect(screen.getByText('Tại Level 3 đang chọn')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('filters questions by search query text', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm nội dung hoặc mã câu hỏi/i)
    fireEvent.change(searchInput, { target: { value: 'memory leaks' } })

    expect(
      screen.getByText('Explain how to handle memory leaks in React applications.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Describe concurrency vs parallelism in systems.')
    ).not.toBeInTheDocument()
  })

  it('filters questions by quick Level toggle', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={4}
      />
    )

    // Initially all 3 are displayed
    expect(screen.getByText('Q-PROG-01')).toBeInTheDocument()
    expect(screen.getByText('Q-PROG-02')).toBeInTheDocument()
    expect(screen.getByText('Q-PROG-03')).toBeInTheDocument()

    // Click 'Chỉ Level 4' toggle
    const toggleButton = screen.getByRole('button', { name: /Chỉ Level 4/i })
    fireEvent.click(toggleButton)

    // Only Q-PROG-01 is Level 4
    expect(screen.getByText('Q-PROG-01')).toBeInTheDocument()
    expect(screen.queryByText('Q-PROG-02')).not.toBeInTheDocument()
    expect(screen.queryByText('Q-PROG-03')).not.toBeInTheDocument()
  })

  it('copies question text when clicking the copy button', async () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    const copyButtons = screen.getAllByRole('button', { name: /Sao chép/i })
    expect(copyButtons.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Explain how to handle memory leaks in React applications.'
      )
    })
  })

  it('invokes onSelectLevel when clicking the target level badge on a card', () => {
    const handleSelectLevel = vi.fn()
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
        onSelectLevel={handleSelectLevel}
      />
    )

    // Click on Target L4 button on first question
    const levelButton = screen.getByRole('button', {
      name: /Bấm để chuyển Thước đo sang Level 4/i,
    })
    fireEvent.click(levelButton)

    expect(handleSelectLevel).toHaveBeenCalledWith(4)
  })

  it('opens create question modal when clicking [+ Tạo câu hỏi mới]', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    const createBtn = screen.getByRole('button', { name: /Tạo câu hỏi mới/i })
    fireEvent.click(createBtn)

    expect(screen.getByText('Tạo câu hỏi phỏng vấn mới')).toBeInTheDocument()
    expect(
      screen.getByText(/Thêm câu hỏi mới vào ngân hàng câu hỏi gắn nhãn kỹ năng/i)
    ).toBeInTheDocument()
  })
})

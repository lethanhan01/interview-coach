import React from 'react'
import { render, screen, userEvent, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaQuestionBankTab } from './SfiaQuestionBankTab'
import type { SfiaSkillDetail } from '@/types'

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
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
      configurable: true,
      writable: true,
    })
  })

  it('renders 4 KPI mini cards with accurate metric counts', () => {
    render(<SfiaQuestionBankTab skillDetail={mockDetail} selectedLevel={3} />)

    // Total questions: 3
    expect(screen.getByText('Tổng số câu hỏi mẫu')).toBeInTheDocument()
    expect(screen.getAllByText(/3 câu hỏi/).length).toBeGreaterThanOrEqual(1)

    // Difficulty breakdown
    expect(screen.getByText('Phân bổ độ khó')).toBeInTheDocument()
    expect(screen.getByText(/1 Dễ · 1 TB · 1 Khó/)).toBeInTheDocument()

    // Matching selectedLevel 3: 2 questions (Q-PROG-02 and Q-PROG-03)
    expect(screen.getByText('Khớp cấp độ L3')).toBeInTheDocument()
    expect(screen.getByText('2 câu hỏi')).toBeInTheDocument()
  })

  it('filters questions by search query text', async () => {
    const user = userEvent.setup()
    render(<SfiaQuestionBankTab skillDetail={mockDetail} selectedLevel={3} />)

    const searchInput = screen.getByPlaceholderText(
      /Tìm kiếm câu hỏi hoặc mã ID/i
    )
    await user.type(searchInput, 'memory leaks')

    expect(
      screen.getByText(
        'Explain how to handle memory leaks in React applications.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Describe concurrency vs parallelism in systems.')
    ).not.toBeInTheDocument()
  })

  it('filters questions by level select', async () => {
    const user = userEvent.setup()
    render(<SfiaQuestionBankTab skillDetail={mockDetail} selectedLevel={4} />)

    // Initially all 3 are displayed
    expect(screen.getByText('Q-PROG-01')).toBeInTheDocument()
    expect(screen.getByText('Q-PROG-02')).toBeInTheDocument()
    expect(screen.getByText('Q-PROG-03')).toBeInTheDocument()

    // Select Level 4
    const levelSelect = screen.getByPlaceholderText('Cấp độ')
    await user.click(levelSelect)

    const level4Option = await screen.findByRole('option', { name: /Cấp L4/i })
    await user.click(level4Option)

    // Only Q-PROG-01 is Level 4
    expect(screen.getByText('Q-PROG-01')).toBeInTheDocument()
    expect(screen.queryByText('Q-PROG-02')).not.toBeInTheDocument()
    expect(screen.queryByText('Q-PROG-03')).not.toBeInTheDocument()
  })

  it('copies question text when clicking the copy button', async () => {
    render(<SfiaQuestionBankTab skillDetail={mockDetail} selectedLevel={3} />)

    const copyButtons = screen.getAllByRole('button', {
      name: /Sao chép nội dung câu hỏi/i,
    })
    expect(copyButtons.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Explain how to handle memory leaks in React applications.'
      )
    })
  })

  it('opens create question modal when clicking [+ Thêm câu hỏi] and passes accessibility', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SfiaQuestionBankTab skillDetail={mockDetail} selectedLevel={3} />
    )

    const createBtn = screen.getByRole('button', { name: /Thêm câu hỏi/i })
    await user.click(createBtn)

    expect(
      await screen.findByText('Tạo Câu Hỏi Phỏng Vấn Mới')
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders Blind Spot empty state when skill has 0 questions and opens create modal', async () => {
    const user = userEvent.setup()
    const blindSpotDetail: SfiaSkillDetail = {
      ...mockDetail,
      questionCount: 0,
      questionBankItems: [],
    }

    const { container } = render(
      <SfiaQuestionBankTab skillDetail={blindSpotDetail} selectedLevel={3} />
    )

    expect(
      screen.getByText('Chưa có câu hỏi nào cho kỹ năng này')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Không tìm thấy câu hỏi phù hợp')
    ).not.toBeInTheDocument()

    const ctaBtn = screen.getByRole('button', {
      name: /Tạo câu hỏi đầu tiên/i,
    })
    await user.click(ctaBtn)

    expect(
      await screen.findByText('Tạo Câu Hỏi Phỏng Vấn Mới')
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

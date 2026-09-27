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
    expect(screen.getByText('Total Sample Questions')).toBeInTheDocument()
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)

    // Difficulty breakdown
    expect(screen.getByText('Difficulty Breakdown')).toBeInTheDocument()
    expect(screen.getByText(/1 Easy/)).toBeInTheDocument()
    expect(screen.getByText(/1 Medium/)).toBeInTheDocument()
    expect(screen.getByText(/1 Hard/)).toBeInTheDocument()

    // Matching selectedLevel 3: 2 questions (Q-PROG-02 and Q-PROG-03)
    expect(screen.getByText('At Selected Level 3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('filters questions by search query text', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Search question content or ID/i)
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

    // Click 'Level 4 only' toggle
    const toggleButton = screen.getByRole('button', { name: /Level 4 only/i })
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

    const copyButtons = screen.getAllByRole('button', { name: /Copy/i })
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
      name: /Click to set Stepper to Level 4/i,
    })
    fireEvent.click(levelButton)

    expect(handleSelectLevel).toHaveBeenCalledWith(4)
  })

  it('opens create question modal when clicking [+ Create Question]', () => {
    render(
      <SfiaQuestionBankTab
        skillDetail={mockDetail}
        selectedLevel={3}
      />
    )

    const createBtn = screen.getByRole('button', { name: /Create Question/i })
    fireEvent.click(createBtn)

    expect(screen.getByText('Create Interview Question')).toBeInTheDocument()
    expect(
      screen.getByText(/Add a new question to the bank/i)
    ).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen, userEvent } from '@test-utils'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaDetailPanel } from './SfiaDetailPanel'
import type { SfiaSkillDetail, SfiaCategory, SfiaSubcategory } from '@/types'

const mockCat: SfiaCategory[] = [
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    nameVi: 'Phát triển & Triển khai',
    description: '',
    displayOrder: 1,
    skillCount: 1,
  },
]

const mockSub: SfiaSubcategory[] = [
  {
    code: 'SYS_DEV',
    categoryCode: 'DEV_IMPL',
    name: 'Systems development',
    nameVi: 'Phát triển hệ thống',
    description: '',
    skillCount: 1,
  },
]

const mockDetail: SfiaSkillDetail = {
  code: 'PROG',
  name: 'Programming/software development',
  categoryCode: 'DEV_IMPL',
  subcategoryCode: 'SYS_DEV',
  minLevel: 2,
  maxLevel: 6,
  questionCount: 4,
  onetCount: 2,
  overallDescription: 'Overview of programming skill.',
  guidanceNotes: 'Guidance on programming.',
  skillLevels: [
    {
      skillCode: 'PROG',
      levelId: 2,
      essence: 'Essence 2',
      description: 'Description 2',
    },
    {
      skillCode: 'PROG',
      levelId: 3,
      essence: 'Essence 3',
      description: 'Description 3',
    },
  ],
  onetMappings: [
    {
      socCode: '15-1252.00',
      occupationTitle: 'Software Developers',
      targetLevel: 4,
      weight: 2.0,
      isCore: true,
    },
  ],
  questionBankItems: [
    {
      id: 'Q-PROG-01',
      questionText: 'Explain how to handle memory leaks in React applications.',
      type: 'TECHNICAL',
      difficulty: 'HARD',
      targetSfiaLevel: 4,
    },
  ],
}

describe('SfiaDetailPanel Integration', () => {
  it('renders all three sub-tabs including [Ngân hàng câu hỏi]', () => {
    render(
      <SfiaDetailPanel
        skillDetail={mockDetail}
        categories={mockCat}
        subcategories={mockSub}
        selectedLevel={3}
        onSelectLevel={vi.fn()}
      />
    )

    expect(
      screen.getByRole('tab', { name: /Tiêu chí hành vi & Hướng dẫn/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /Nghề nghiệp O\*NET/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /Ngân hàng câu hỏi/i })
    ).toBeInTheDocument()
  })

  it('switches to O*NET tab and displays mappings', async () => {
    const user = userEvent.setup()
    render(
      <SfiaDetailPanel
        skillDetail={mockDetail}
        categories={mockCat}
        subcategories={mockSub}
        selectedLevel={3}
        onSelectLevel={vi.fn()}
      />
    )

    const onetTab = screen.getByRole('tab', { name: /Nghề nghiệp O\*NET/i })
    await user.click(onetTab)

    expect(screen.getAllByText('15-1252.00').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText('Software Developers').length
    ).toBeGreaterThanOrEqual(1)
  })

  it('switches to Question Bank tab, displays question items, and passes accessibility', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <SfiaDetailPanel
        skillDetail={mockDetail}
        categories={mockCat}
        subcategories={mockSub}
        selectedLevel={3}
        onSelectLevel={vi.fn()}
      />
    )

    const questionsTab = screen.getByRole('tab', {
      name: /Ngân hàng câu hỏi/i,
    })
    await user.click(questionsTab)

    expect(
      screen.getByText(
        'Explain how to handle memory leaks in React applications.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Thêm câu hỏi/i })
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('distinguishes unique occupations in header KPI from total mapping rows in tab badge', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const multiLevelDetail: SfiaSkillDetail = {
        ...mockDetail,
        onetCount: 2,
        onetMappings: [
          {
            id: 'map-1',
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 3,
            weight: 1.5,
            isCore: true,
          },
          {
            id: 'map-2',
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 4,
            weight: 2.0,
            isCore: true,
          },
          {
            id: 'map-3',
            socCode: '15-1253.00',
            occupationTitle: 'Software Quality Assurance Analysts',
            targetLevel: 3,
            weight: 1.2,
            isCore: false,
          },
        ],
      }

      render(
        <SfiaDetailPanel
          skillDetail={multiLevelDetail}
          categories={mockCat}
          subcategories={mockSub}
          selectedLevel={3}
          onSelectLevel={vi.fn()}
        />
      )

      expect(screen.getByText(/2 nghề nghiệp/)).toBeInTheDocument()
      expect(screen.getByText(/\(3 ánh xạ\)/)).toBeInTheDocument()

      const onetTab = screen.getByRole('tab', { name: /Nghề nghiệp O\*NET/i })
      expect(onetTab).toHaveTextContent('3')

      await user.click(onetTab)

      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key'))
      )
      expect(duplicateKeyCalls).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('does not show redundant mapping count caption when each occupation has a single mapping', () => {
    render(
      <SfiaDetailPanel
        skillDetail={mockDetail}
        categories={mockCat}
        subcategories={mockSub}
        selectedLevel={3}
        onSelectLevel={vi.fn()}
      />
    )

    expect(screen.getByText(/1 nghề nghiệp/)).toBeInTheDocument()
    expect(screen.queryByText(/ánh xạ\)/)).not.toBeInTheDocument()
  })
})

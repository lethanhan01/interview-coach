import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SfiaSidebarTree } from './SfiaSidebarTree'
import type { SfiaCategory, SfiaSubcategory, SfiaSkillSummary } from './types'

const mockCategories: SfiaCategory[] = [
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    nameVi: 'Development and implementation',
    description: 'Dev desc',
    displayOrder: 1,
    skillCount: 2,
  },
  {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    nameVi: 'Strategy and architecture',
    description: 'Strat desc',
    displayOrder: 2,
    skillCount: 1,
  },
]

const mockSubcategories: SfiaSubcategory[] = [
  {
    code: 'SYS_DEV',
    categoryCode: 'DEV_IMPL',
    name: 'Systems development',
    nameVi: 'Systems development',
    description: 'Systems dev desc',
    skillCount: 2,
  },
  {
    code: 'STRAT',
    categoryCode: 'STRAT_ARCH',
    name: 'Strategy and planning',
    nameVi: 'Strategy and planning',
    description: 'Strat planning desc',
    skillCount: 1,
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
    questionCount: 8,
    onetCount: 3,
  },
  {
    code: 'SWDN',
    name: 'Software design',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 3,
    maxLevel: 6,
    questionCount: 4,
    onetCount: 2,
  },
  {
    code: 'ARCH',
    name: 'Solution architecture',
    categoryCode: 'STRAT_ARCH',
    subcategoryCode: 'STRAT',
    minLevel: 5,
    maxLevel: 7,
    questionCount: 0,
    onetCount: 1,
  },
]

describe('SfiaSidebarTree (Deep Linking, Auto-Expansion & Auto-Scroll)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. auto-expands the branch containing selectedSkill and renders button with DOM ID', async () => {
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        selectedSkill="PROG"
        selectedLevel={3}
        onSelectSkill={vi.fn()}
      />
    )

    // Verify PROG skill button exists with id sfia-tree-skill-PROG
    const progBtn = await screen.findByRole('button', { name: /PROG/i })
    expect(progBtn).toBeDefined()
    expect(progBtn.id).toBe('sfia-tree-skill-PROG')

    // Verify auto-scroll was triggered
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled()
    })
  })

  it('2. handles skill click and calls onSelectSkill with clamped level', async () => {
    const onSelectSkillMock = vi.fn()

    render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        selectedSkill="PROG"
        selectedLevel={1} // L1 is below SWDN minLevel (3)
        onSelectSkill={onSelectSkillMock}
      />
    )

    // SWDN is in the already-expanded SYS_DEV subcategory
    const swdnBtn = await screen.findByRole('button', { name: /SWDN/i })
    fireEvent.click(swdnBtn)

    // Expect clamped level to minLevel 3 since 1 < 3
    expect(onSelectSkillMock).toHaveBeenCalledWith('SWDN', 3)
  })

  it('3. filters tree on search query and auto-expands matching branches', async () => {
    render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        selectedSkill="PROG"
        selectedLevel={3}
        onSelectSkill={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search code/i)
    fireEvent.change(searchInput, { target: { value: 'ARCH' } })

    // ARCH should be visible, PROG should not be matched
    expect(await screen.findByText('Solution architecture')).toBeDefined()
    expect(screen.queryByText('Programming/software development')).toBeNull()
  })

  it('4. filters tree by level dropdown', async () => {
    render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        selectedSkill="PROG"
        selectedLevel={3}
        onSelectSkill={vi.fn()}
      />
    )

    const levelSelect = screen.getByRole('combobox')
    fireEvent.change(levelSelect, { target: { value: '7' } })

    // Only ARCH is available at Level 7
    expect(await screen.findByText('Solution architecture')).toBeDefined()
    expect(screen.queryByText('Programming/software development')).toBeNull()
  })
})

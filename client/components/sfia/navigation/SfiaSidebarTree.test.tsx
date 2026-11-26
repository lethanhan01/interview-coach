import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { SfiaSidebarTree } from './SfiaSidebarTree'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillSummary,
  SfiaSubcategory,
} from '@/types'

const mockLevels: SfiaLevelResponsibility[] = [
  {
    levelId: 2,
    name: 'Assist',
    nameVi: 'Hỗ trợ',
    essence: 'Assists',
    description: 'Assists',
  },
  {
    levelId: 3,
    name: 'Apply',
    nameVi: 'Áp dụng',
    essence: 'Applies',
    description: 'Applies',
  },
  {
    levelId: 7,
    name: 'Set strategy',
    nameVi: 'Định hình chiến lược',
    essence: 'Sets strategy',
    description: 'Sets strategy',
  },
]

const mockCategories: SfiaCategory[] = [
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    nameVi: 'Phát triển & Triển khai',
    description: 'Dev desc',
    displayOrder: 1,
    skillCount: 2,
  },
  {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    nameVi: 'Chiến lược & Kiến trúc',
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
    nameVi: 'Phát triển hệ thống',
    description: 'Systems dev desc',
    skillCount: 2,
  },
  {
    code: 'STRAT',
    categoryCode: 'STRAT_ARCH',
    name: 'Strategy and planning',
    nameVi: 'Chiến lược & Kế hoạch',
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

    // Skill nodes omit redundant CH count and L2-6 range labels
    expect(screen.queryByText(/CH$/i)).toBeNull()
    expect(screen.queryByText(/L2–6/)).toBeNull()

    // Verify auto-scroll was triggered
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled()
    })
  })

  it('6. toggles expand all / collapse all via a single button', async () => {
    const user = userEvent.setup()

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

    const toggleBtn = screen.getByRole('button', { name: /Mở tất cả/i })
    await user.click(toggleBtn)

    expect(
      await screen.findByRole('button', { name: /ARCH/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thu gọn/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Thu gọn/i }))
    expect(
      screen.getByRole('button', { name: /Mở tất cả/i })
    ).toBeInTheDocument()
  })

  it('2. handles skill click and calls onSelectSkill with clamped level', async () => {
    const user = userEvent.setup()
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
    await user.click(swdnBtn)

    // Expect clamped level to minLevel 3 since 1 < 3
    expect(onSelectSkillMock).toHaveBeenCalledWith('SWDN', 3)
  })

  it('3. filters tree on search query and auto-expands matching branches', async () => {
    const user = userEvent.setup()

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

    const searchInput = screen.getByPlaceholderText(/Tìm mã hoặc tên kỹ năng/i)
    await user.type(searchInput, 'ARCH')

    // ARCH should be visible, PROG should not be matched
    expect(await screen.findByText('Solution architecture')).toBeDefined()
    expect(screen.queryByText('Programming/software development')).toBeNull()
  })

  it('4. filters tree by level dropdown and passes accessibility', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        levels={mockLevels}
        selectedSkill="PROG"
        selectedLevel={3}
        onSelectSkill={vi.fn()}
      />
    )

    const levelSelect = screen.getByPlaceholderText('Cấp độ')
    await user.click(levelSelect)

    const level7Option = await screen.findByRole('option', {
      name: /L7 — Định hình chiến lược/i,
    })
    await user.click(level7Option)

    // Only ARCH is available at Level 7
    expect(await screen.findByText('Solution architecture')).toBeDefined()
    expect(screen.queryByText('Programming/software development')).toBeNull()

    // A11y verification
    expect(await axe(container)).toHaveNoViolations()
  })

  it('5. auto-expands parent category and subcategory when selectedSkill changes', async () => {
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    const { rerender, container } = render(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        levels={mockLevels}
        selectedSkill="PROG"
        selectedLevel={3}
        onSelectSkill={vi.fn()}
      />
    )

    expect(
      await screen.findByRole('button', { name: /PROG/i })
    ).toBeInTheDocument()

    rerender(
      <SfiaSidebarTree
        categories={mockCategories}
        subcategories={mockSubcategories}
        skills={mockSkills}
        levels={mockLevels}
        selectedSkill="ARCH"
        selectedLevel={5}
        onSelectSkill={vi.fn()}
      />
    )

    const archBtn = await screen.findByRole('button', { name: /ARCH/i })
    expect(archBtn).toBeInTheDocument()
    expect(archBtn).toHaveAttribute('data-selected', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
})

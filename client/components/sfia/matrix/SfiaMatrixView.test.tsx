import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'
import { SfiaMatrixView } from './SfiaMatrixView'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaMatrixCellData,
  SfiaSkillSummary,
} from '@/types'

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

  const mockLevels: SfiaLevelResponsibility[] = [
    {
      levelId: 1,
      name: 'Follow',
      nameVi: 'Tuân thủ',
      essence: 'Follows',
      description: 'Follows',
    },
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
      levelId: 4,
      name: 'Enable',
      nameVi: 'Chủ động',
      essence: 'Enables',
      description: 'Enables',
    },
    {
      levelId: 5,
      name: 'Ensure',
      nameVi: 'Đảm bảo',
      essence: 'Ensures',
      description: 'Ensures',
    },
    {
      levelId: 6,
      name: 'Initiate',
      nameVi: 'Khởi xướng',
      essence: 'Initiates',
      description: 'Initiates',
    },
    {
      levelId: 7,
      name: 'Set strategy',
      nameVi: 'Chiến lược',
      essence: 'Sets strategy',
      description: 'Sets strategy',
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
      questionCount: 11,
      onetCount: 4,
    },
    {
      code: 'TEST',
      name: 'Testing',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYS_DEV',
      minLevel: 1,
      maxLevel: 4,
      questionCount: 0,
      onetCount: 2,
    },
  ]

  const mockCells: Record<string, SfiaMatrixCellData> = {
    PROG_L2: {
      skillCode: 'PROG',
      levelId: 2,
      isAvailable: true,
      questionCount: 4,
      onetCount: 2,
      statementSnippet:
        'Thiết kế, lập trình và kiểm thử các module cơ bản theo tiêu chuẩn.',
    },
    PROG_L3: {
      skillCode: 'PROG',
      levelId: 3,
      isAvailable: true,
      questionCount: 6,
      onetCount: 2,
      statementSnippet: 'Phát triển các thành phần phần mềm phức tạp vừa phải.',
    },
    PROG_L4: {
      skillCode: 'PROG',
      levelId: 4,
      isAvailable: true,
      questionCount: 1,
      onetCount: 0,
    },
    PROG_L5: {
      skillCode: 'PROG',
      levelId: 5,
      isAvailable: true,
      questionCount: 0,
      onetCount: 0,
    },
    PROG_L6: {
      skillCode: 'PROG',
      levelId: 6,
      isAvailable: true,
      questionCount: 0,
      onetCount: 0,
    },
    TEST_L1: {
      skillCode: 'TEST',
      levelId: 1,
      isAvailable: true,
      questionCount: 0,
      onetCount: 1,
    },
    TEST_L2: {
      skillCode: 'TEST',
      levelId: 2,
      isAvailable: true,
      questionCount: 0,
      onetCount: 1,
    },
    TEST_L3: {
      skillCode: 'TEST',
      levelId: 3,
      isAvailable: true,
      questionCount: 0,
      onetCount: 0,
    },
    TEST_L4: {
      skillCode: 'TEST',
      levelId: 4,
      isAvailable: true,
      questionCount: 0,
      onetCount: 0,
    },
  }

  const defaultProps = {
    skills: mockSkills,
    categories: mockCategories,
    cells: mockCells,
    levels: mockLevels,
    displayMode: 'level' as const,
    blindSpotsOnly: false,
    onBlindSpotsOnlyChange: vi.fn(),
    inspectedCell: null,
    onSelectCell: vi.fn(),
    onClearFilters: vi.fn(),
  }

  it('renders table headers, category banner, and passes accessibility', async () => {
    const { container } = render(<SfiaMatrixView {...defaultProps} />)

    expect(screen.getByText('Kỹ năng SFIA 9')).toBeInTheDocument()
    for (let l = 1; l <= 7; l++) {
      expect(screen.getAllByText(`L${l}`).length).toBeGreaterThanOrEqual(1)
    }
    expect(screen.getAllByText('Tuân thủ').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('category-header-DEV_IMPL')).toBeInTheDocument()
    expect(screen.getByText('Phát triển & Triển khai')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders heatmap summary counts and toggles blindSpotsOnly on button click', async () => {
    const user = userEvent.setup()
    const onBlindSpotsOnlyChange = vi.fn()
    render(
      <SfiaMatrixView
        {...defaultProps}
        onBlindSpotsOnlyChange={onBlindSpotsOnlyChange}
      />
    )

    expect(screen.getByText('Dồi dào 6+: 1')).toBeInTheDocument()
    expect(screen.getByText('Tốt 3–5: 1')).toBeInTheDocument()
    expect(screen.getByText('Mỏng 1–2: 1')).toBeInTheDocument()

    const blindSpotToggle = screen.getByRole('button', {
      name: /Điểm mù \(0\): 6/i,
    })
    expect(blindSpotToggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(blindSpotToggle)
    expect(onBlindSpotsOnlyChange).toHaveBeenCalledWith(true)
  })

  it('marks inactive and active cells with correct data-heat tiers', () => {
    render(<SfiaMatrixView {...defaultProps} />)

    expect(screen.getByTestId('cell-PROG-L1-inactive')).toBeInTheDocument()
    expect(screen.getByTestId('cell-PROG-L7-inactive')).toBeInTheDocument()

    expect(screen.getByTestId('cell-PROG-L2')).toHaveAttribute(
      'data-heat',
      'good'
    )
    expect(screen.getByTestId('cell-PROG-L3')).toHaveAttribute(
      'data-heat',
      'rich'
    )
    expect(screen.getByTestId('cell-PROG-L4')).toHaveAttribute(
      'data-heat',
      'low'
    )
    expect(screen.getByTestId('cell-PROG-L5')).toHaveAttribute(
      'data-heat',
      'blind'
    )
  })

  it('calls onSelectCell when active cell is clicked and shows HoverCard snippet on hover', async () => {
    const user = userEvent.setup()
    const onSelectCell = vi.fn()
    render(<SfiaMatrixView {...defaultProps} onSelectCell={onSelectCell} />)

    const cellL2 = screen.getByTestId('cell-PROG-L2')
    await user.hover(cellL2)

    await waitFor(() => {
      expect(
        screen.getByText(
          'Thiết kế, lập trình và kiểm thử các module cơ bản theo tiêu chuẩn.'
        )
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Câu hỏi: 4')).toBeInTheDocument()
    expect(screen.getByText('Nghề O*NET: 2')).toBeInTheDocument()

    await user.click(cellL2)
    expect(onSelectCell).toHaveBeenCalledWith('PROG', 2)
  })

  it('displays Vietnamese question counts and O*NET counts by displayMode', () => {
    const { rerender } = render(
      <SfiaMatrixView {...defaultProps} displayMode="questions" />
    )

    expect(screen.getByText('4 CH')).toBeInTheDocument()
    expect(screen.getByText('6 CH')).toBeInTheDocument()
    expect(screen.getAllByText('0 CH').length).toBeGreaterThan(0)

    rerender(<SfiaMatrixView {...defaultProps} displayMode="onet" />)
    expect(screen.getAllByText('2 nghề').length).toBeGreaterThan(0)
  })

  it('renders Vietnamese empty state and calls onClearFilters', async () => {
    const user = userEvent.setup()
    const onClearFilters = vi.fn()
    render(
      <SfiaMatrixView
        {...defaultProps}
        skills={[]}
        onClearFilters={onClearFilters}
      />
    )

    expect(screen.getByTestId('matrix-empty-state')).toBeInTheDocument()
    expect(
      screen.getByText('Không tìm thấy kỹ năng SFIA phù hợp')
    ).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' })
    await user.click(clearBtn)
    expect(onClearFilters).toHaveBeenCalled()
  })

  it('collapses and expands a category on header click and supports collapse/expand all', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <SfiaMatrixView {...defaultProps} filterKey="::" />
    )

    const categoryToggle = screen.getByRole('button', {
      name: /Phát triển & Triển khai/i,
    })
    expect(categoryToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('matrix-row-PROG')).toBeInTheDocument()

    await user.click(categoryToggle)
    expect(categoryToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('matrix-row-PROG')).not.toBeInTheDocument()

    const expandAllBtn = screen.getByRole('button', {
      name: 'Mở rộng tất cả',
    })
    await user.click(expandAllBtn)
    expect(categoryToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('matrix-row-PROG')).toBeInTheDocument()

    const collapseAllBtn = screen.getByRole('button', {
      name: 'Thu gọn tất cả',
    })
    await user.click(collapseAllBtn)
    expect(screen.queryByTestId('matrix-row-PROG')).not.toBeInTheDocument()

    rerender(<SfiaMatrixView {...defaultProps} filterKey="prog::" />)
    expect(screen.getByTestId('matrix-row-PROG')).toBeInTheDocument()
  })
})

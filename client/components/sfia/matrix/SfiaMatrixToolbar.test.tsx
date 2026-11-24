import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'
import { SfiaMatrixToolbar } from './SfiaMatrixToolbar'
import type { SfiaCategory } from '@/types'

describe('SfiaMatrixToolbar', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả',
      displayOrder: 1,
      skillCount: 42,
    },
    {
      code: 'STRAT_ARCH',
      name: 'Strategy and architecture',
      nameVi: 'Chiến lược & Kiến trúc',
      description: 'Mô tả',
      displayOrder: 2,
      skillCount: 24,
    },
  ]

  const defaultProps = {
    categories: mockCategories,
    selectedCategory: '',
    onCategoryChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    displayMode: 'level' as const,
    onDisplayModeChange: vi.fn(),
    blindSpotsOnly: false,
    onBlindSpotsOnlyChange: vi.fn(),
    onExportCsv: vi.fn(),
    totalSkillsCount: 147,
    displayedSkillsCount: 147,
    blindSpotsCount: 5,
  }

  it('renders all Vietnamese toolbar elements and passes accessibility', async () => {
    const { container } = render(<SfiaMatrixToolbar {...defaultProps} />)

    expect(
      screen.getByPlaceholderText('Tìm mã (PROG) hoặc tên kỹ năng...')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Lọc theo danh mục' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Xuất Ma trận CSV/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Cấp độ')).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('O*NET')).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: 'Chỉ hiện điểm mù (0 câu hỏi)' })
    ).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/Đang hiển thị:/)).toBeInTheDocument()
    expect(screen.getByText(/147 kỹ năng/)).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('triggers onSearchChange when user types in search input', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <SfiaMatrixToolbar {...defaultProps} onSearchChange={onSearchChange} />
    )

    const input = screen.getByPlaceholderText(
      'Tìm mã (PROG) hoặc tên kỹ năng...'
    )
    await user.type(input, 'P')

    expect(onSearchChange).toHaveBeenCalledWith('P')
  })

  it('clears search when close button is clicked', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        searchQuery="PROG"
        onSearchChange={onSearchChange}
      />
    )

    const clearBtn = screen.getByRole('button', {
      name: 'Xóa từ khóa tìm kiếm',
    })
    await user.click(clearBtn)

    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('selects and clears category filter mapping null to empty string', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    const { rerender, container } = render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onCategoryChange={onCategoryChange}
      />
    )

    const selectInput = screen.getByRole('combobox', {
      name: 'Lọc theo danh mục',
    })
    await user.click(selectInput)
    const option = await screen.findByRole('option', {
      name: /Phát triển & Triển khai/i,
    })
    await user.click(option)

    expect(onCategoryChange).toHaveBeenCalledWith('DEV_IMPL')

    rerender(
      <SfiaMatrixToolbar
        {...defaultProps}
        selectedCategory="DEV_IMPL"
        onCategoryChange={onCategoryChange}
      />
    )

    const clearCategoryBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Xóa bộ lọc danh mục"]'
    )
    expect(clearCategoryBtn).not.toBeNull()
    await user.click(clearCategoryBtn!)

    expect(onCategoryChange).toHaveBeenCalledWith('')
  })

  it('triggers onDisplayModeChange when user clicks display mode options', async () => {
    const user = userEvent.setup()
    const onDisplayModeChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onDisplayModeChange={onDisplayModeChange}
      />
    )

    await user.click(screen.getByText('Câu hỏi'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('questions')

    await user.click(screen.getByText('O*NET'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('onet')
  })

  it('triggers onBlindSpotsOnlyChange when switch is toggled', async () => {
    const user = userEvent.setup()
    const onBlindSpotsOnlyChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onBlindSpotsOnlyChange={onBlindSpotsOnlyChange}
      />
    )

    const switchEl = screen.getByRole('switch', {
      name: 'Chỉ hiện điểm mù (0 câu hỏi)',
    })
    await user.click(switchEl)

    expect(onBlindSpotsOnlyChange).toHaveBeenCalledWith(true)
  })

  it('triggers onExportCsv when user clicks export button', async () => {
    const user = userEvent.setup()
    const onExportCsv = vi.fn()
    render(<SfiaMatrixToolbar {...defaultProps} onExportCsv={onExportCsv} />)

    const exportBtn = screen.getByRole('button', {
      name: /Xuất Ma trận CSV/i,
    })
    await user.click(exportBtn)

    expect(onExportCsv).toHaveBeenCalled()
  })
})

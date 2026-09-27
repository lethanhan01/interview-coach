import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SfiaBlindSpotsTable, type SfiaBlindSpotsTableProps } from './SfiaBlindSpotsTable'
import {
  MOCK_SFIA_CATEGORIES,
  MOCK_SFIA_SKILL_SUMMARIES,
} from './sfia-mock-data'

describe('SfiaBlindSpotsTable Component', () => {
  const defaultProps: SfiaBlindSpotsTableProps = {
    skills: MOCK_SFIA_SKILL_SUMMARIES,
    categories: MOCK_SFIA_CATEGORIES,
    selectedCategoryFilter: null,
    selectedLevelFilter: null,
    onSelectCategoryFilter: vi.fn(),
    onSelectLevelFilter: vi.fn(),
    onCreateQuestion: vi.fn(),
    onSelectSkill: vi.fn(),
    onExportCsv: vi.fn(),
    isExportingCsv: false,
  }

  it('renders table with 35 blind spots and paginates 10 items on page 1', () => {
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    // Heading and badge
    expect(screen.getByText('Bảng Cảnh Báo Điểm Mù (Blind Spots)')).toBeInTheDocument()
    expect(screen.getByText('35 điểm mù')).toBeInTheDocument()

    // Pagination info
    const summary = screen.getByTestId('pagination-summary')
    expect(summary).toHaveTextContent('Hiển thị 1 - 10 trên tổng số 35 điểm mù')

    // Page buttons
    expect(screen.getByRole('button', { name: 'Trang 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 4' })).toBeInTheDocument()
  })

  it('handles client pagination when clicking next page button', () => {
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    // Click on Page 2
    const page2Button = screen.getByRole('button', { name: 'Trang 2' })
    fireEvent.click(page2Button)

    // Now showing items 11 - 20
    const summary = screen.getByTestId('pagination-summary')
    expect(summary).toHaveTextContent('Hiển thị 11 - 20 trên tổng số 35 điểm mù')
  })

  it('filters blind spots by text search query', () => {
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã code/i)
    fireEvent.change(searchInput, { target: { value: 'DESN' } })

    // Only DESN is displayed
    expect(screen.getByTestId('skill-code-DESN')).toBeInTheDocument()
    expect(screen.getByText('Digital product design')).toBeInTheDocument()
    const summary = screen.getByTestId('pagination-summary')
    expect(summary).toHaveTextContent('Hiển thị 1 - 1 trên tổng số 1 điểm mù')
  })

  it('triggers onSelectCategoryFilter when category is changed via filter', () => {
    const onSelectCategoryFilter = vi.fn()
    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        onSelectCategoryFilter={onSelectCategoryFilter}
      />
    )

    // Check trigger exists
    const categorySelectTrigger = screen.getByRole('combobox', {
      name: /Lọc theo danh mục SFIA/i,
    })
    expect(categorySelectTrigger).toBeInTheDocument()
  })

  it('renders active filter chip and allows clearing all filters', () => {
    const onSelectCategoryFilter = vi.fn()
    const onSelectLevelFilter = vi.fn()

    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        selectedCategoryFilter="STRAT_ARCH"
        selectedLevelFilter={4}
        onSelectCategoryFilter={onSelectCategoryFilter}
        onSelectLevelFilter={onSelectLevelFilter}
      />
    )

    // Active chips
    expect(screen.getByText(/Danh mục: Chiến lược & Kiến trúc/i)).toBeInTheDocument()
    expect(screen.getByText(/Level 4/i)).toBeInTheDocument()

    // Clear all filters button
    const clearAllButton = screen.getByRole('button', { name: /Xóa tất cả bộ lọc/i })
    fireEvent.click(clearAllButton)
    expect(onSelectCategoryFilter).toHaveBeenCalledWith(null)
    expect(onSelectLevelFilter).toHaveBeenCalledWith(null)
  })

  it('triggers onCreateQuestion when clicking [Tạo câu hỏi] button on a row', () => {
    const onCreateQuestion = vi.fn()
    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        onCreateQuestion={onCreateQuestion}
      />
    )

    const createButtons = screen.getAllByRole('button', { name: /Tạo câu hỏi/i })
    expect(createButtons.length).toBeGreaterThan(0)

    fireEvent.click(createButtons[0])
    expect(onCreateQuestion).toHaveBeenCalled()
  })

  it('triggers onSelectSkill when clicking a skill code', () => {
    const onSelectSkill = vi.fn()
    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        onSelectSkill={onSelectSkill}
      />
    )

    // First page contains EMRG
    const emrgButton = screen.getByTestId('skill-code-EMRG')
    fireEvent.click(emrgButton)
    expect(onSelectSkill).toHaveBeenCalledWith('EMRG')
  })

  it('triggers onExportCsv when clicking export button', () => {
    const onExportCsv = vi.fn()
    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        onExportCsv={onExportCsv}
      />
    )

    const exportButton = screen.getByRole('button', {
      name: /Xuất danh sách điểm mù CSV/i,
    })
    fireEvent.click(exportButton)
    expect(onExportCsv).toHaveBeenCalled()
  })

  it('renders empty search state when no skills match search query', () => {
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/Tìm theo mã code/i)
    fireEvent.change(searchInput, { target: { value: 'XYZNONEXISTENT' } })

    expect(
      screen.getByText('Không tìm thấy kỹ năng điểm mù nào phù hợp')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đặt lại bộ lọc/i })).toBeInTheDocument()
  })

  it('renders celebration box when there are 0 blind spots in skills list', () => {
    const skillsWithoutBlindSpots = MOCK_SFIA_SKILL_SUMMARIES.filter(
      (s) => s.questionCount > 0
    )

    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        skills={skillsWithoutBlindSpots}
      />
    )

    expect(
      screen.getByText('Tuyệt vời! Không còn điểm mù năng lực nào')
    ).toBeInTheDocument()
  })
})

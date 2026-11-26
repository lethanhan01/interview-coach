import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  MOCK_SFIA_CATEGORIES,
  MOCK_SFIA_RESPONSIBILITY_LEVELS,
  MOCK_SFIA_SKILL_SUMMARIES,
} from '@/test-utils/fixtures/sfia.fixture'
import {
  SfiaBlindSpotsTable,
  type SfiaBlindSpotsTableProps,
} from './SfiaBlindSpotsTable'

describe('SfiaBlindSpotsTable Component', () => {
  const defaultProps: SfiaBlindSpotsTableProps = {
    skills: MOCK_SFIA_SKILL_SUMMARIES,
    categories: MOCK_SFIA_CATEGORIES,
    levels: MOCK_SFIA_RESPONSIBILITY_LEVELS,
    selectedCategoryFilter: null,
    selectedLevelFilter: null,
    onSelectCategoryFilter: vi.fn(),
    onSelectLevelFilter: vi.fn(),
    onCreateQuestion: vi.fn(),
    onSelectSkill: vi.fn(),
    onExportCsv: vi.fn(),
    isExportingCsv: false,
  }

  it('renders table with 35 Vietnamese blind spots, container id, pagination and passes axe', async () => {
    const { container } = render(<SfiaBlindSpotsTable {...defaultProps} />)

    expect(
      container.querySelector('#sfia-blind-spots-table-container')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Bảng Cảnh Báo Điểm Mù Kỹ Năng')
    ).toBeInTheDocument()
    expect(screen.getByText('35 điểm mù')).toBeInTheDocument()

    const summary = screen.getByTestId('pagination-summary')
    expect(summary).toHaveTextContent(
      'Hiển thị 1 - 10 trong tổng số 35 điểm mù'
    )

    expect(screen.getByRole('button', { name: 'Trang 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang 4' })).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('handles client pagination when clicking page 2', async () => {
    const user = userEvent.setup()
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Trang 2' }))

    expect(screen.getByTestId('pagination-summary')).toHaveTextContent(
      'Hiển thị 11 - 20 trong tổng số 35 điểm mù'
    )
  })

  it('filters blind spots by text search query and clears search', async () => {
    const user = userEvent.setup()
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(
      /Tìm mã \(PROG\) hoặc tên kỹ năng/i
    )
    await user.type(searchInput, 'DESN')

    expect(screen.getByTestId('skill-code-DESN')).toBeInTheDocument()
    expect(screen.getByText('Digital product design')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên cao')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-summary')).toHaveTextContent(
      'Hiển thị 1 - 1 trong tổng số 1 điểm mù'
    )

    await user.click(
      screen.getByRole('button', { name: 'Xóa từ khóa tìm kiếm' })
    )
    expect(screen.getByTestId('pagination-summary')).toHaveTextContent(
      'Hiển thị 1 - 10 trong tổng số 35 điểm mù'
    )
  })

  it('exposes Vietnamese category and level Select filters', () => {
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    expect(
      screen.getByRole('combobox', { name: 'Lọc theo danh mục SFIA' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Lọc theo cấp độ SFIA' })
    ).toBeInTheDocument()
  })

  it('renders active filter chips and clears all filters on click', async () => {
    const user = userEvent.setup()
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

    expect(
      screen.getByText(/Danh mục: Chiến lược & Kiến trúc/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Cấp L4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Xóa tất cả bộ lọc/i }))
    expect(onSelectCategoryFilter).toHaveBeenCalledWith(null)
    expect(onSelectLevelFilter).toHaveBeenCalledWith(null)
  })

  it('triggers onCreateQuestion, onSelectSkill and onExportCsv callbacks', async () => {
    const user = userEvent.setup()
    const onCreateQuestion = vi.fn()
    const onSelectSkill = vi.fn()
    const onExportCsv = vi.fn()

    render(
      <SfiaBlindSpotsTable
        {...defaultProps}
        onCreateQuestion={onCreateQuestion}
        onSelectSkill={onSelectSkill}
        onExportCsv={onExportCsv}
      />
    )

    const createButtons = screen.getAllByRole('button', {
      name: /Tạo câu hỏi/i,
    })
    await user.click(createButtons[0])
    expect(onCreateQuestion).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId('skill-code-EMRG'))
    expect(onSelectSkill).toHaveBeenCalledWith('EMRG')

    await user.click(screen.getByRole('button', { name: /Xuất CSV Điểm mù/i }))
    expect(onExportCsv).toHaveBeenCalledTimes(1)
  })

  it('renders empty filtered state and resets filters', async () => {
    const user = userEvent.setup()
    render(<SfiaBlindSpotsTable {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(
      /Tìm mã \(PROG\) hoặc tên kỹ năng/i
    )
    await user.type(searchInput, 'XYZNONEXISTENT')

    expect(
      screen.getByText('Không tìm thấy điểm mù nào khớp bộ lọc')
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đặt lại bộ lọc' }))

    expect(screen.getByTestId('pagination-summary')).toHaveTextContent(
      'Hiển thị 1 - 10 trong tổng số 35 điểm mù'
    )
  })

  it('renders celebration card when 0 blind spots remain', async () => {
    const skillsWithoutBlindSpots = MOCK_SFIA_SKILL_SUMMARIES.filter(
      (s) => s.questionCount > 0
    )

    const { container } = render(
      <SfiaBlindSpotsTable {...defaultProps} skills={skillsWithoutBlindSpots} />
    )

    expect(
      screen.getByText('Xuất sắc! Không còn điểm mù kỹ năng nào')
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

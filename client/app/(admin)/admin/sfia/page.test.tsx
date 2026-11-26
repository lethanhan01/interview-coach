import React from 'react'
import { Box } from '@mantine/core'
import { render, screen, userEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import SfiaAdminPage from './page'

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function MockDynamicChart() {
      return <Box data-testid="mock-mantine-chart" />
    },
}))

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockRouter = {
  replace: mockReplace,
  push: mockPush,
}
let mockSearchParams = new URLSearchParams('tab=matrix')

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/admin/sfia',
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/services/sfia-admin.service', async () => {
  const {
    MOCK_SFIA_CATEGORIES,
    MOCK_SFIA_SUBCATEGORIES,
    MOCK_SFIA_SKILL_SUMMARIES,
    MOCK_SFIA_SKILL_DETAILS,
    MOCK_SFIA_RESPONSIBILITY_LEVELS,
    MOCK_SFIA_GENERIC_ATTRIBUTES,
    MOCK_SFIA_COVERAGE_STATS,
  } = await import('@/test-utils/fixtures/sfia.fixture')

  return {
    sfiaAdminService: {
      getCategories: vi.fn().mockResolvedValue(MOCK_SFIA_CATEGORIES),
      getSubcategories: vi.fn().mockResolvedValue(MOCK_SFIA_SUBCATEGORIES),
      getSkills: vi.fn().mockResolvedValue(MOCK_SFIA_SKILL_SUMMARIES),
      getSkillDetail: vi
        .fn()
        .mockImplementation((code: string) =>
          Promise.resolve(MOCK_SFIA_SKILL_DETAILS[code] || null)
        ),
      getCoverageStats: vi.fn().mockResolvedValue(MOCK_SFIA_COVERAGE_STATS),
      getMatrixData: vi.fn().mockResolvedValue({
        skills: MOCK_SFIA_SKILL_SUMMARIES.filter(
          (skill, idx) => idx < 10 || skill.code === 'PROG'
        ),
        categories: MOCK_SFIA_CATEGORIES,
        cells: {
          PROG_L3: {
            skillCode: 'PROG',
            levelId: 3,
            isAvailable: true,
            questionCount: 5,
            onetCount: 3,
            statementSnippet: 'Designs, codes, verifies, tests and documents.',
          },
        },
      }),
      getResponsibilityLevels: vi
        .fn()
        .mockResolvedValue(MOCK_SFIA_RESPONSIBILITY_LEVELS),
      getGenericAttributes: vi
        .fn()
        .mockResolvedValue(MOCK_SFIA_GENERIC_ATTRIBUTES),
      createQuestion: vi.fn().mockResolvedValue({
        id: 'new-q-1',
        questionText: 'Mock question about software design',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      }),
    },
  }
})

describe('SfiaAdminPage — Matrix Tab & Tab-Scoped Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('tab=matrix')
  })

  it('renders SFIA 9 header & Matrix workspace without eagerly fetching other tab queries', async () => {
    const { container } = render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Khung Năng Lực SFIA 9')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Tìm mã (PROG) hoặc tên kỹ năng...')
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Xuất Ma trận CSV')).toBeInTheDocument()
    expect(screen.getByText('Chỉ hiện điểm mù (0 câu hỏi)')).toBeInTheDocument()

    // Tab-scoped fetching (Q22): Matrix tab must NOT fetch subcategories or generic attributes
    expect(sfiaAdminService.getMatrixData).toHaveBeenCalledTimes(1)
    expect(sfiaAdminService.getSubcategories).not.toHaveBeenCalled()
    expect(sfiaAdminService.getGenericAttributes).not.toHaveBeenCalled()

    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('filters matrix skills when typing search query in toolbar', async () => {
    const user = userEvent.setup()
    render(<SfiaAdminPage />)

    const searchInput = await screen.findByPlaceholderText(
      'Tìm mã (PROG) hoặc tên kỹ năng...'
    )
    await user.type(searchInput, 'PROG')

    expect(
      await screen.findByText('Programming/software development')
    ).toBeInTheDocument()
  })

  it('opens Drawer on cell click, navigates atomically to taxonomy, and keeps Drawer open on Create Question', async () => {
    const user = userEvent.setup()
    render(<SfiaAdminPage />)

    const cellL3 = await screen.findByTestId('cell-PROG-L3')
    await user.click(cellL3)

    expect(
      await screen.findByRole('button', { name: /Mở trong Cây kỹ năng/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Sao chép AI Rubric/i })
    ).toBeInTheDocument()

    // Click Create Question -> modal opens while Drawer remains open (Q-B4)
    await user.click(screen.getByRole('button', { name: /^Tạo câu hỏi$/i }))
    expect(
      await screen.findByText('Tạo Câu Hỏi Phỏng Vấn Mới')
    ).toBeInTheDocument()

    // Close modal and click Open in Tree -> single atomic URL update without ?tab=taxonomy
    await user.click(screen.getByRole('button', { name: /^Hủy$/i }))
    await user.click(
      screen.getByRole('button', { name: /Mở trong Cây kỹ năng/i })
    )
    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?skill=PROG&level=3', {
      scroll: false,
    })
  })

  it('isolates matrix query failure to Matrix tab without crashing workspace header', async () => {
    vi.mocked(sfiaAdminService.getMatrixData).mockRejectedValueOnce(
      new Error('Matrix API timeout')
    )
    render(<SfiaAdminPage />)

    expect(await screen.findByText('Matrix API timeout')).toBeInTheDocument()
    expect(screen.getByText('Khung Năng Lực SFIA 9')).toBeInTheDocument()
    expect(screen.getByText('Phân tích độ phủ')).toBeInTheDocument()
  })
})

describe('SfiaAdminPage — Analytics & Attributes Tabs Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('tab=analytics')
  })

  it('renders Vietnamese Coverage Analytics Dashboard and Blind Spots Table', async () => {
    render(<SfiaAdminPage />)

    expect(await screen.findByText('Tổng kỹ năng SFIA 9')).toBeInTheDocument()
    expect(screen.getByText('147')).toBeInTheDocument()
    expect(screen.getByText('76.2%')).toBeInTheDocument()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
    expect(
      screen.getByText('Phân bổ & Độ phủ theo 6 Danh mục SFIA')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Phân bổ câu hỏi theo 7 Cấp độ SFIA')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Bảng Cảnh Báo Điểm Mù Kỹ Năng')
    ).toBeInTheDocument()
    expect(screen.getByText('35 điểm mù')).toBeInTheDocument()
    expect(screen.getByText('Xuất CSV Điểm mù')).toBeInTheDocument()
  })

  it('opens Create Question modal when clicking Tạo câu hỏi in Blind Spots Table', async () => {
    const user = userEvent.setup()
    render(<SfiaAdminPage />)

    await screen.findByText('Bảng Cảnh Báo Điểm Mù Kỹ Năng')
    const createButtons = screen.getAllByRole('button', {
      name: /^Tạo câu hỏi$/i,
    })
    expect(createButtons.length).toBeGreaterThan(0)

    await user.click(createButtons[0])
    expect(
      await screen.findByText('Tạo Câu Hỏi Phỏng Vấn Mới')
    ).toBeInTheDocument()
  })

  it('navigates atomically from Attributes tab to Matrix tab with level and shows AnatomyBanner collapsed by default', async () => {
    const user = userEvent.setup()
    mockSearchParams = new URLSearchParams('tab=attributes&level=4')
    render(<SfiaAdminPage />)

    expect(
      await screen.findByText('Cấu Trúc Khung Năng Lực SFIA 9')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Mở rộng cấu trúc khung năng lực SFIA 9/i,
      })
    ).toBeInTheDocument()

    const jumpButton = await screen.findByRole('button', {
      name: /Xem kỹ năng Cấp L4/i,
    })
    await user.click(jumpButton)

    expect(mockReplace).toHaveBeenCalledWith('/admin/sfia?tab=matrix&level=4', {
      scroll: false,
    })
  })

  it('omits AnatomyBanner and coverage query on default taxonomy tab', async () => {
    mockSearchParams = new URLSearchParams('')
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Tìm mã hoặc tên kỹ năng/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByText('Cấu Trúc Khung Năng Lực SFIA 9')
    ).not.toBeInTheDocument()
    expect(sfiaAdminService.getCoverageStats).not.toHaveBeenCalled()
  })
})

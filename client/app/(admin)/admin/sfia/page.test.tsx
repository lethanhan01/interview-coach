import React from 'react'
import { render, screen, waitFor, fireEvent } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SfiaAdminPage from './page'

// Mock next/navigation
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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
        skills: MOCK_SFIA_SKILL_SUMMARIES,
        categories: MOCK_SFIA_CATEGORIES,
        cells: {
          'PROG-3': {
            skillCode: 'PROG',
            levelId: 3,
            questionCount: 5,
            onetCount: 3,
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
        questionText: 'Mock question',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
        createdAt: new Date().toISOString(),
      }),
    },
  }
})

describe('SfiaAdminPage - Matrix Tab Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('tab=matrix')
  })

  it('renders SFIA Knowledge Browser header and Matrix tab workspace', async () => {
    render(<SfiaAdminPage />)

    // Wait for mock data to load
    await waitFor(() => {
      expect(screen.getByText('SFIA 9 Knowledge Browser')).toBeInTheDocument()
      expect(screen.getByText('SFIA Matrix (2D Grid)')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Search code (PROG) or skill name...')
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Export Matrix CSV')).toBeInTheDocument()
    expect(
      screen.getByText('Blind spots only (0 questions)')
    ).toBeInTheDocument()
  })

  it('filters matrix skills when search query is typed in toolbar', async () => {
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search code (PROG) or skill name...')
      ).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(
      'Search code (PROG) or skill name...'
    )
    fireEvent.change(searchInput, { target: { value: 'PROG' } })

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })
  })

  it('opens inspection sheet when active cell is clicked', async () => {
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(screen.getByTestId('cell-PROG-L3')).toBeInTheDocument()
    })

    const cellL3 = screen.getByTestId('cell-PROG-L3')
    fireEvent.click(cellL3)

    await waitFor(() => {
      expect(screen.getByText('Open in Tree')).toBeInTheDocument()
      expect(screen.getByText('Copy AI Prompt')).toBeInTheDocument()
      expect(screen.getByText('Create Question')).toBeInTheDocument()
    })
  })
})

describe('SfiaAdminPage - Phase 7 Analytics Tab Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('tab=analytics')
  })

  it('renders Coverage Analytics Dashboard and Blind Spots Table in Tab 4', async () => {
    render(<SfiaAdminPage />)

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Tổng kỹ năng SFIA 9')).toBeInTheDocument()
    })

    // 4 KPI Cards
    expect(screen.getByText('147')).toBeInTheDocument()
    expect(screen.getByText('76.2%')).toBeInTheDocument()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
    expect(screen.getAllByText('35').length).toBeGreaterThanOrEqual(1)

    // Distribution charts & Leaderboard
    expect(
      screen.getByText('Phân bổ & Độ phủ theo 6 Danh mục SFIA')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Phân bổ câu hỏi theo 7 Cấp độ SFIA')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET')
    ).toBeInTheDocument()

    // Blind Spots Table
    expect(screen.getByText('Blind Spots Warning Table')).toBeInTheDocument()
    expect(screen.getByText('35 blind spots')).toBeInTheDocument()
    expect(screen.getByText('Export Blind Spots CSV')).toBeInTheDocument()
  })

  it('opens create question modal when clicking [Create Question] in blind spots table', async () => {
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Blind Spots Warning Table')).toBeInTheDocument()
    })

    const createButtons = screen.getAllByRole('button', {
      name: /Create Question/i,
    })
    expect(createButtons.length).toBeGreaterThan(0)

    fireEvent.click(createButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Create Interview Question/i)).toBeInTheDocument()
    })
  })
})

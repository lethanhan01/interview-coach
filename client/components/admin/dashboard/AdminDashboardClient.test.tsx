import { Box } from '@mantine/core'
import { axe } from 'jest-axe'
import { render, screen, userEvent, waitFor } from '@test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userManagementService } from '@/services/admin.service'
import { onetAdminService } from '@/services/onet-admin.service'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type {
  AdminUser,
  OnetAnalyticsSummary,
  SfiaCoverageStats,
} from '@/types'
import { AdminDashboardClient } from './AdminDashboardClient'

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function MockMantineChart() {
      return <Box data-testid="mock-mantine-chart" />
    },
}))

const mockAuthState = {
  user: { id: 'admin-1', email: 'admin@example.com' } as {
    id: string
    email: string
  } | null,
  role: 'admin' as string | null,
  isLoading: false,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/services/admin.service', () => ({
  userManagementService: {
    listUsers: vi.fn(),
  },
}))

vi.mock('@/services/onet-admin.service', () => ({
  onetAdminService: {
    getAnalyticsSummary: vi.fn(),
  },
}))

vi.mock('@/services/sfia-admin.service', () => ({
  sfiaAdminService: {
    getCoverageStats: vi.fn(),
  },
}))

const mockUsers: AdminUser[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    firstname: 'An',
    lastname: 'Nguyễn',
    role: 'admin',
    status: 'active',
    createdAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'user-2',
    email: 'candidate@example.com',
    firstname: 'Bình',
    lastname: 'Trần',
    role: 'candidate',
    status: 'active',
    createdAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'user-3',
    email: 'locked@example.com',
    firstname: 'Chi',
    lastname: 'Lê',
    role: 'candidate',
    status: 'locked',
    createdAt: '2026-10-05T11:00:00Z',
  },
]

const mockOnetSummary: OnetAnalyticsSummary = {
  totalOccupations: 1016,
  totalMajorGroups: 23,
  totalMappedOccupations: 184,
  overallMappingCoveragePercent: 18,
  itGroupOccupations: 41,
  itGroupMappedOccupations: 38,
  itGroupCoveragePercent: 93,
  totalSoftwareSkills: 18420,
  hotTechCount: 420,
  inDemandTechCount: 810,
  totalAlternateTitles: 54000,
  totalMockInterviews: 420,
  totalLinkedJobDescriptions: 150,
}

const mockSfiaCoverage: SfiaCoverageStats = {
  totalSkills: 147,
  totalCategories: 6,
  totalSubcategories: 22,
  totalLevels: 7,
  skillsWithQuestions: 112,
  skillsWithOnet: 98,
  blindSpotsCount: 35,
  totalQuestions: 240,
  totalActiveMatrixCells: 580,
  categoryDistribution: [],
  levelDistribution: [],
  topOnetMappedSkills: [],
}

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.role = 'admin'
    mockAuthState.isLoading = false
    vi.mocked(userManagementService.listUsers).mockResolvedValue(mockUsers)
    vi.mocked(onetAdminService.getAnalyticsSummary).mockResolvedValue(
      mockOnetSummary
    )
    vi.mocked(sfiaAdminService.getCoverageStats).mockResolvedValue(
      mockSfiaCoverage
    )
  })

  it('renders exact KPIs, software skills, charts, health blocks, recent users, no fake AI card, and passes axe', async () => {
    const { container } = render(<AdminDashboardClient />)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Tổng quan hệ thống InterviewCoach/i,
      })
    ).toBeInTheDocument()

    // Exact KPI counts and percentages: 3 total, 2 active (67%), 1 locked (33%), 1 admin (33%)
    expect(await screen.findByText('Tổng người dùng')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getAllByText('33%').length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText('Nguyễn An')).toBeInTheDocument()
    expect(screen.getByText('Trần Bình')).toBeInTheDocument()
    expect(screen.getAllByTestId('mock-mantine-chart').length).toBe(2)

    // O*NET totalSoftwareSkills + Vietnamese labels
    const softwareSkillsEl = await screen.findByText('18.420')
    expect(softwareSkillsEl.parentElement?.textContent).toMatch(
      /18\.420\s+công nghệ/i
    )
    expect(screen.getByText(/Nhóm CNTT \(15\): 93%/i)).toBeInTheDocument()
    expect(screen.getByText(/Công nghệ nóng:/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Mở Trình duyệt O\*NET/i })
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/35 điểm mù \(0 câu hỏi\)/i)
    ).toBeInTheDocument()

    // Fake static AI Session Engine card must not exist
    expect(screen.queryByText(/AI Session Engine/i)).not.toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders 0-user empty states cleanly for charts and recent users', async () => {
    vi.mocked(userManagementService.listUsers).mockResolvedValueOnce([])

    render(<AdminDashboardClient />)

    expect(
      await screen.findByText(
        /Chưa có dữ liệu đăng ký trong khoảng thời gian này/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Chưa có tài khoản nào/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Chưa có người dùng nào đăng ký trong hệ thống/i)
    ).toBeInTheDocument()
    expect(screen.queryAllByTestId('mock-mantine-chart')).toHaveLength(0)
  })

  it('shows summary fallback when all users fall into a single time bucket', async () => {
    vi.mocked(userManagementService.listUsers).mockResolvedValueOnce([
      mockUsers[0],
    ])

    render(<AdminDashboardClient />)

    expect(
      await screen.findByText(
        /Cần tối thiểu 2 mốc thời gian để hiển thị đường xu hướng tăng trưởng/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Mốc 08\/2026/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('mock-mantine-chart').length).toBe(1)
  })

  it('switches registration chart range when clicking 30 ngày toggle', async () => {
    const user = userEvent.setup()
    const recentIso = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const oldIso = new Date(Date.now() - 120 * 86_400_000).toISOString()
    vi.mocked(userManagementService.listUsers).mockResolvedValueOnce([
      { ...mockUsers[0], createdAt: oldIso },
      { ...mockUsers[1], createdAt: recentIso },
    ])

    render(<AdminDashboardClient />)

    // Monthly mode has 2 distinct months -> AreaChart + DonutChart (2 charts)
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-mantine-chart')).toHaveLength(2)
    })

    // Toggle to 30 ngày -> only 1 recent day bucket remains -> single-bucket summary replaces AreaChart
    await user.click(screen.getByText('30 ngày'))

    expect(
      await screen.findByText(
        /Cần tối thiểu 2 mốc thời gian để hiển thị đường xu hướng tăng trưởng/i
      )
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('mock-mantine-chart')).toHaveLength(1)
  })

  it('isolates O*NET query failure without blocking Users KPIs or SFIA health card', async () => {
    vi.mocked(onetAdminService.getAnalyticsSummary).mockRejectedValueOnce(
      new Error('O*NET service unavailable')
    )

    render(<AdminDashboardClient />)

    expect(
      await screen.findByText(/Không thể tải thống kê O\*NET/i)
    ).toBeInTheDocument()
    expect(screen.getByText('O*NET service unavailable')).toBeInTheDocument()
    expect(await screen.findByText('Nguyễn An')).toBeInTheDocument()
    expect(
      await screen.findByText(/35 điểm mù \(0 câu hỏi\)/i)
    ).toBeInTheDocument()
  })

  it('isolates SFIA query failure and recovers on retry', async () => {
    const user = userEvent.setup()
    vi.mocked(sfiaAdminService.getCoverageStats)
      .mockRejectedValueOnce(new Error('SFIA coverage timeout'))
      .mockResolvedValueOnce(mockSfiaCoverage)

    render(<AdminDashboardClient />)

    expect(
      await screen.findByText(/Không thể tải thống kê SFIA 9/i)
    ).toBeInTheDocument()
    expect(screen.getByText('SFIA coverage timeout')).toBeInTheDocument()
    // Users & O*NET stay healthy
    expect(await screen.findByText('Nguyễn An')).toBeInTheDocument()
    expect(screen.getByText(/Nhóm CNTT \(15\): 93%/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Thử lại/i }))

    expect(
      await screen.findByText(/35 điểm mù \(0 câu hỏi\)/i)
    ).toBeInTheDocument()
  })

  it('hides RecentUsersTable on users query error (no fake empty state) and recovers on retry', async () => {
    const user = userEvent.setup()
    vi.mocked(userManagementService.listUsers)
      .mockRejectedValueOnce(new Error('Users API down'))
      .mockResolvedValueOnce(mockUsers)

    render(<AdminDashboardClient />)

    expect(
      await screen.findByText(/Không thể tải thống kê người dùng/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Users API down')).toBeInTheDocument()
    expect(
      screen.queryByText(/Người dùng mới đăng ký/i)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Chưa có người dùng nào đăng ký trong hệ thống/i)
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Thử lại/i }))

    expect(await screen.findByText('Nguyễn An')).toBeInTheDocument()
    expect(screen.getByText(/Người dùng mới đăng ký/i)).toBeInTheDocument()
  })

  it('does not fetch data or render content when role is not admin', async () => {
    mockAuthState.role = 'candidate'

    render(<AdminDashboardClient />)

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', {
          name: /Tổng quan hệ thống InterviewCoach/i,
        })
      ).not.toBeInTheDocument()
    })
    expect(userManagementService.listUsers).not.toHaveBeenCalled()
    expect(onetAdminService.getAnalyticsSummary).not.toHaveBeenCalled()
    expect(sfiaAdminService.getCoverageStats).not.toHaveBeenCalled()
  })
})

import { Box } from '@mantine/core'
import { axe } from 'jest-axe'
import { render, screen, waitFor } from '@test-utils'
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

  it('renders executive KPIs, charts, knowledge health blocks, recent users and passes axe', async () => {
    const { container } = render(<AdminDashboardClient />)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Tổng quan hệ thống InterviewCoach/i,
      })
    ).toBeInTheDocument()

    expect(await screen.findByText('Nguyễn An')).toBeInTheDocument()
    expect(screen.getByText('Trần Bình')).toBeInTheDocument()
    expect(screen.getAllByTestId('mock-mantine-chart').length).toBe(2)

    expect(
      await screen.findByText(/Nhóm CNTT \(15\): 93%/i)
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/35 điểm mù \(0 câu hỏi\)/i)
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows summary fallback instead of AreaChart when all users fall into a single time bucket', async () => {
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
    // Only DonutChart renders; AreaChart is replaced by summary card
    expect(screen.getAllByTestId('mock-mantine-chart').length).toBe(1)
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
    // Users and SFIA blocks remain intact
    expect(await screen.findByText('Nguyễn An')).toBeInTheDocument()
    expect(
      await screen.findByText(/35 điểm mù \(0 câu hỏi\)/i)
    ).toBeInTheDocument()
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

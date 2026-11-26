import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/queries/keys'
import { catalogService } from '@/services/catalog.service'
import { prepService } from '@/services/prep.service'
import { sessionService } from '@/services/session.service'
import { CATALOG_INTERVIEW_OPTIONS_FIXTURE } from '@/test-utils/fixtures/catalog.fixture'
import type { SavedJobDescription } from '@/types'
import SetupWizardClient from '@/components/interview-setup/SetupWizardClient'
import { JD_DRAFT_KEY } from '@/components/interview-setup/useSetupDraft'

const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/services/prep.service', () => ({
  prepService: {
    getSavedJobDescriptions: vi.fn(),
    saveJobDescription: vi.fn(),
  },
}))

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
  },
}))

vi.mock('@/services/catalog.service', () => ({
  catalogService: {
    getInterviewOptions: vi.fn(),
  },
}))

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
    searchTechnologies: vi.fn().mockResolvedValue([]),
  },
}))

const mockSavedJd: SavedJobDescription = {
  id: 'jd-1',
  userId: 'user-1',
  companyName: 'VNG Corporation',
  jobTitle: 'Backend Engineer',
  level: 'middle',
  requirements: '2+ năm kinh nghiệm Node.js, TypeScript, PostgreSQL và Redis.',
  jobContent: 'Thiết kế và vận hành các API lõi cho nền tảng thanh toán.',
  techStack: ['Node.js', 'TypeScript'],
  onetSocCode: '15-1252.00',
  onetOccupationTitle: 'Software Developers',
  targetSfiaLevel: 3,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
}

describe('SetupWizardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    mockSearchParams = new URLSearchParams()
    vi.mocked(catalogService.getInterviewOptions).mockResolvedValue(
      CATALOG_INTERVIEW_OPTIONS_FIXTURE
    )
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue([
      mockSavedJd,
    ])
    vi.mocked(sessionService.getSessions).mockResolvedValue([])
  })

  it('reuses cached saved JDs from QueryClient without refetching', async () => {
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000 },
    })
    queryClient.setQueryData(queryKeys.prep.savedJds(), [mockSavedJd])

    const { container } = render(<SetupWizardClient />, { queryClient })

    expect(await screen.findByText('VNG Corporation')).toBeInTheDocument()
    expect(prepService.getSavedJobDescriptions).not.toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('completes 3-step flow, invalidates queries, clears localStorage draft, and blocks double-submit', async () => {
    const user = userEvent.setup()
    mockSearchParams = new URLSearchParams('jdId=jd-1')
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(prepService.saveJobDescription).mockResolvedValue(mockSavedJd)
    vi.mocked(sessionService.createSession).mockResolvedValue({
      id: 'sess-123',
    })

    render(<SetupWizardClient />, { queryClient })

    expect(
      await screen.findByText('Thông tin Job Description')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    const submitBtn = screen.getByRole('button', {
      name: 'Bắt đầu phỏng vấn',
    })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sessions/sess-123')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.prep.savedJds(),
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.sessions.all,
    })
    expect(window.localStorage.getItem(JD_DRAFT_KEY)).toBeNull()

    await user.click(submitBtn)
    expect(prepService.saveJobDescription).toHaveBeenCalledTimes(1)
    expect(sessionService.createSession).toHaveBeenCalledTimes(1)
  }, 15_000)

  it('shows error alert and allows retry when createSession fails', async () => {
    const user = userEvent.setup()
    mockSearchParams = new URLSearchParams('jdId=jd-1')
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(prepService.saveJobDescription).mockResolvedValue(mockSavedJd)
    vi.mocked(sessionService.createSession).mockRejectedValueOnce(
      new Error('Không thể khởi tạo phiên AI')
    )

    render(<SetupWizardClient />, { queryClient })

    await screen.findByText('Thông tin Job Description')
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))

    const submitBtn = screen.getByRole('button', {
      name: 'Bắt đầu phỏng vấn',
    })
    await user.click(submitBtn)

    const alerts = await screen.findAllByRole('alert')
    expect(
      alerts.some((el) =>
        el.textContent?.includes('Không thể khởi tạo phiên AI')
      )
    ).toBe(true)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.prep.savedJds(),
    })
    expect(mockPush).not.toHaveBeenCalled()
    expect(submitBtn).not.toBeDisabled()
  }, 15_000)
})

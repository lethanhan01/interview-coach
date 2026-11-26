import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import {
  CATALOG_INTERVIEW_OPTIONS_FIXTURE,
  seedCatalogQuery,
} from '@/test-utils/fixtures/catalog.fixture'
import CareerInfoGroup from './CareerInfoGroup'

vi.mock('@/services/catalog.service', () => ({
  catalogService: {
    getInterviewOptions: vi.fn(),
  },
}))

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        description: 'Develop software',
      },
      {
        socCode: '15-1254.00',
        title: 'Frontend Developer',
        description: 'Build web interfaces',
      },
    ]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
    searchTechnologies: vi.fn().mockResolvedValue([]),
  },
}))

describe('CareerInfoGroup (Resume)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(catalogService.getInterviewOptions).mockResolvedValue(
      CATALOG_INTERVIEW_OPTIONS_FIXTURE
    )
  })

  it('renders view mode with raw trimmed position, O*NET SOC, SFIA badges and passes jest-axe', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <CareerInfoGroup
        data={{
          targetPosition: '  Software Developers  ',
          targetLevel: 'senior',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
          targetSfiaLevel: 4,
        }}
        onSave={vi.fn()}
      />,
      { queryClient }
    )

    expect(screen.getByText('Định hướng nghề nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('SOC: 15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('SFIA Level 4')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('edits career info via O*NET quick-pick chips, tracks dirty state, and saves updated payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDirtyChange = vi.fn()
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Software Developers',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
        }}
        onSave={onSave}
        onDirtyChange={onDirtyChange}
      />,
      { queryClient }
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(screen.getByText('Mã O*NET SOC: 15-1252.00')).toBeInTheDocument()

    const quickPickBtn = await screen.findByRole('button', {
      name: 'Frontend Developer',
    })
    expect(await axe(container)).toHaveNoViolations()

    await user.click(quickPickBtn)
    expect(onDirtyChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          targetPosition: 'Frontend Developer',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
        })
      )
    })
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  }, 15_000)

  it('preserves form values while catalog is pending in edit mode', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogService.getInterviewOptions).mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Backend Engineer',
          targetLevel: 'senior',
        }}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('senior')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))

    expect(
      screen.getByRole('combobox', { name: /Vị trí mục tiêu/i })
    ).toHaveValue('Backend Engineer')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows danger Alert with retry button when catalog fails and recovers on retry', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogService.getInterviewOptions)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(CATALOG_INTERVIEW_OPTIONS_FIXTURE)

    render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Backend Engineer',
          targetLevel: 'senior',
        }}
        onSave={vi.fn()}
      />
    )

    expect(
      await screen.findByText('Không thể tải danh mục cấu hình')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('Senior')).toBeInTheDocument()
    expect(
      screen.queryByText('Không thể tải danh mục cấu hình')
    ).not.toBeInTheDocument()
  })
})

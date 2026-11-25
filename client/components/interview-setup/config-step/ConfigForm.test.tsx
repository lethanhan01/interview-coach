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
import type { ContextPack, InterviewDuration, SessionType } from '@/types'
import ConfigForm from './ConfigForm'

vi.mock('@/services/catalog.service', () => ({
  catalogService: {
    getInterviewOptions: vi.fn(),
  },
}))

const DEFAULT_PROPS = {
  sessionType: 'hr' as SessionType,
  setSessionType: vi.fn(),
  contextPack: 'VN' as ContextPack,
  setContextPack: vi.fn(),
  duration: 30 as InterviewDuration,
  setDuration: vi.fn(),
}

describe('ConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders session type, context pack, and duration options cleanly', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(<ConfigForm {...DEFAULT_PROPS} />, {
      queryClient,
    })
    expect(screen.getByText('Loại phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('HR / Behavioral')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Context Pack')).toBeInTheDocument()
    expect(screen.getByText('Việt Nam')).toBeInTheDocument()
    expect(screen.getByText('Western')).toBeInTheDocument()
    expect(screen.getByText('Thời gian phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('30 phút')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng rưỡi')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('invokes callbacks when selecting radio cards', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)
    const setSessionType = vi.fn()
    const setContextPack = vi.fn()
    const setDuration = vi.fn()

    render(
      <ConfigForm
        {...DEFAULT_PROPS}
        setSessionType={setSessionType}
        setContextPack={setContextPack}
        setDuration={setDuration}
      />,
      { queryClient }
    )

    await user.click(screen.getByText('Technical'))
    expect(setSessionType).toHaveBeenCalledWith('technical')

    await user.click(screen.getByText('Western'))
    expect(setContextPack).toHaveBeenCalledWith('Western')

    await user.click(screen.getByText('1 tiếng'))
    expect(setDuration).toHaveBeenCalledWith(60)
  })

  it('marks selected radio cards with aria-checked true', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    render(
      <ConfigForm
        {...DEFAULT_PROPS}
        sessionType="technical"
        contextPack="Western"
        duration={90}
      />,
      { queryClient }
    )

    expect(screen.getByRole('radio', { name: /Technical/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: /Western/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(
      screen.getByRole('radio', { name: /1 tiếng rưỡi/i })
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('renders loading skeletons while catalog is pending without clearing state', () => {
    vi.mocked(catalogService.getInterviewOptions).mockImplementation(
      () => new Promise(() => {})
    )
    const setSessionType = vi.fn()
    const setContextPack = vi.fn()
    const setDuration = vi.fn()

    const { container } = render(
      <ConfigForm
        {...DEFAULT_PROPS}
        setSessionType={setSessionType}
        setContextPack={setContextPack}
        setDuration={setDuration}
      />
    )

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(setSessionType).not.toHaveBeenCalled()
    expect(setContextPack).not.toHaveBeenCalled()
    expect(setDuration).not.toHaveBeenCalled()
  })

  it('shows danger alert and retries when catalog fetch fails', async () => {
    const user = userEvent.setup()
    vi.mocked(catalogService.getInterviewOptions)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(CATALOG_INTERVIEW_OPTIONS_FIXTURE)

    render(<ConfigForm {...DEFAULT_PROPS} />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Không thể tải danh mục cấu hình')
    expect(screen.queryByText('HR / Behavioral')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => {
      expect(screen.getByText('HR / Behavioral')).toBeInTheDocument()
    })
    expect(catalogService.getInterviewOptions).toHaveBeenCalledTimes(2)
  })
})

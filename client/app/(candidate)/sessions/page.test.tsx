import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionService } from '@/services/session.service'
import type { Session } from '@/types'
import SessionsClient from '@/components/sessions/SessionsClient'

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getSessions: vi.fn(),
  },
}))

const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-active',
    userId: 'u1',
    jobTitle: 'Frontend Engineer',
    sessionType: 'technical',
    contextPackId: 'VN',
    status: 'active',
    numQuestions: 15,
    durationMin: 30,
    jobDescription: 'Tên công ty: FPT Software\nVị trí: Frontend Engineer',
    createdAt: '2026-06-07T10:00:00.000Z',
  },
  {
    id: 'sess-done-1',
    userId: 'u1',
    jobTitle: 'Backend Engineer',
    sessionType: 'hr',
    contextPackId: 'Western',
    status: 'completed',
    numQuestions: 30,
    durationMin: 60,
    jobDescription: 'Tên công ty: VNG Corporation\nVị trí: Backend Engineer',
    createdAt: '2026-06-06T08:00:00.000Z',
    overallScore: 84,
  },
  {
    id: 'sess-done-2',
    userId: 'u1',
    jobTitle: 'Data Engineer',
    sessionType: 'technical',
    contextPackId: 'VN',
    status: 'completed',
    numQuestions: 15,
    durationMin: 30,
    jobDescription: 'Tên công ty: Shopee\nVị trí: Data Engineer',
    createdAt: '2026-06-05T08:00:00.000Z',
    overallScore: 66,
  },
  {
    id: 'sess-completing',
    userId: 'u1',
    jobTitle: 'Fullstack Engineer',
    sessionType: 'technical',
    contextPackId: 'VN',
    status: 'completing',
    numQuestions: 15,
    jobDescription: 'Tên công ty: ACME\nVị trí: Fullstack Engineer',
    createdAt: '2026-06-07T09:00:00.000Z',
  },
  {
    id: 'sess-generating',
    userId: 'u1',
    jobTitle: 'DevOps Engineer',
    sessionType: 'technical',
    contextPackId: 'VN',
    status: 'generating',
    numQuestions: 15,
    jobDescription: 'Tên công ty: CloudCo\nVị trí: DevOps Engineer',
    createdAt: '2026-06-07T11:00:00.000Z',
  },
  {
    id: 'sess-canceled',
    userId: 'u1',
    jobTitle: 'QA Engineer',
    sessionType: 'hr',
    contextPackId: 'VN',
    status: 'canceled',
    numQuestions: 15,
    jobDescription: 'Tên công ty: TestCo\nVị trí: QA Engineer',
    createdAt: '2026-06-04T08:00:00.000Z',
  },
]

describe('SessionsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders accessible loading state initially', () => {
    vi.mocked(sessionService.getSessions).mockReturnValue(new Promise(() => {}))
    render(<SessionsClient />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Đang tải danh sách phiên phỏng vấn...'
    )
  })

  it('shows friendly message on Failed to fetch and retries on click', async () => {
    const user = userEvent.setup()
    vi.mocked(sessionService.getSessions)
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce([MOCK_SESSIONS[0]])

    render(<SessionsClient />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể kết nối đến server. Kiểm tra server có đang chạy không.'
    )

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()
    expect(sessionService.getSessions).toHaveBeenCalledTimes(2)
  })

  it('renders empty state with link to /setup', async () => {
    vi.mocked(sessionService.getSessions).mockResolvedValue([])
    const { container } = render(<SessionsClient />)

    expect(
      await screen.findByRole('heading', {
        name: 'Chưa có phiên phỏng vấn nào',
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Bắt đầu phỏng vấn' })
    ).toHaveAttribute('href', '/setup')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders KPI stats, status badges, score rings, and correct action links', async () => {
    vi.mocked(sessionService.getSessions).mockResolvedValue(MOCK_SESSIONS)
    const { container } = render(<SessionsClient />)

    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()

    // KPI stats: 6 total, 2 completed, average = (84 + 66) / 2 = 75
    expect(screen.getByText('6 phiên')).toBeInTheDocument()
    expect(screen.getByText('75/100')).toBeInTheDocument()

    // Action links per status
    expect(screen.getByRole('link', { name: 'Tiếp tục' })).toHaveAttribute(
      'href',
      '/sessions/sess-active'
    )
    expect(
      screen.getByRole('link', { name: 'Theo dõi báo cáo' })
    ).toHaveAttribute('href', '/sessions/sess-completing/report')
    expect(screen.getByRole('link', { name: 'Xem tiến độ' })).toHaveAttribute(
      'href',
      '/sessions/sess-generating'
    )
    const reportLinks = screen.getAllByRole('link', { name: 'Xem báo cáo' })
    expect(reportLinks[0]).toHaveAttribute(
      'href',
      '/sessions/sess-done-1/report'
    )
    expect(screen.getByText('Phiên đã bị hủy')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('filters sessions by status and search query with reset button', async () => {
    const user = userEvent.setup()
    vi.mocked(sessionService.getSessions).mockResolvedValue(MOCK_SESSIONS)
    render(<SessionsClient />)

    await screen.findByText('Frontend Engineer')

    await user.click(screen.getByRole('radio', { name: 'Hoàn thành' }))
    await waitFor(() => {
      expect(screen.queryByText('Frontend Engineer')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Data Engineer')).toBeInTheDocument()

    const searchInput = screen.getByLabelText('Tìm kiếm phiên phỏng vấn')
    await user.type(searchInput, 'VNG')
    await waitFor(() => {
      expect(screen.queryByText('Data Engineer')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()

    await user.type(searchInput, 'no-match-xyz')
    expect(
      screen.getByText('Không tìm thấy phiên phỏng vấn phù hợp')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()
  })
})

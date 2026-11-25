import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { catalogService } from '@/services/catalog.service'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'
import type { Session } from '@/types'
import SessionMetadataCard from './SessionMetadataCard'

const mockSession: Session = {
  id: 'session-123',
  userId: 'user-1',
  sessionType: 'technical',
  contextPackId: 'VN',
  numQuestions: 5,
  jobTitle: 'Frontend Developer',
  jobDescription: '',
  status: 'completed',
  createdAt: '2023-10-01T10:00:00Z',
}

describe('SessionMetadataCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders correctly with seeded catalog labels', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <SessionMetadataCard session={mockSession} />,
      { queryClient }
    )
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Kỹ thuật')).toBeInTheDocument()
    expect(screen.getByText('Việt Nam')).toBeInTheDocument()
  })

  it('parses JD sections and tech stack case-insensitively', () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const sessionWithJd: Session = {
      ...mockSession,
      jobDescription: [
        'Tên công ty: Acme Corp',
        'Vị trí tuyển dụng: Senior Fullstack Engineer',
        'Level yêu cầu: Senior',
        'Số lượng tuyển: 2',
        'Tech stack: React, Node.js, PostgreSQL',
        'Yêu cầu:',
        'Có ít nhất 4 năm kinh nghiệm.',
        'Nội dung công việc:',
        'Phát triển ứng dụng web hiện đại.',
      ].join('\n'),
    }

    render(<SessionMetadataCard session={sessionWithJd} />, { queryClient })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(
      screen.getByText('Có ít nhất 4 năm kinh nghiệm.')
    ).toBeInTheDocument()
  })

  it('falls back to raw codes while catalog is pending', () => {
    vi.spyOn(catalogService, 'getInterviewOptions').mockImplementation(
      () => new Promise(() => {})
    )

    render(<SessionMetadataCard session={mockSession} />)
    expect(screen.getByText('technical')).toBeInTheDocument()
    expect(screen.getByText('VN')).toBeInTheDocument()
  })

  it('shows compact error alert with retry when catalog fails', async () => {
    const spy = vi
      .spyOn(catalogService, 'getInterviewOptions')
      .mockRejectedValue(new Error('Catalog error'))
    const user = userEvent.setup()

    render(<SessionMetadataCard session={mockSession} />)

    await waitFor(() => {
      expect(
        screen.getByText(/Không thể tải danh mục nhãn phiên phỏng vấn/)
      ).toBeInTheDocument()
    })
    expect(screen.getByText('technical')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  it('has no accessibility violations', async () => {
    const queryClient = createTestQueryClient()
    seedCatalogQuery(queryClient)

    const { container } = render(
      <SessionMetadataCard session={mockSession} />,
      { queryClient }
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

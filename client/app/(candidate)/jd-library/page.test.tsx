import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prepService } from '@/services/prep.service'
import type { SavedJobDescription } from '@/types'
import JdLibraryClient from '@/components/jd-library/JdLibraryClient'

vi.mock('@/services/prep.service', () => ({
  prepService: {
    getSavedJobDescriptions: vi.fn(),
  },
}))

const mockJdList: SavedJobDescription[] = [
  {
    id: 'jd-1',
    userId: 'user-1',
    companyName: 'VNG Corporation',
    jobTitle: 'Backend Engineer',
    level: 'middle',
    headcount: '2',
    location: 'TP. Hồ Chí Minh',
    requirements: '2+ năm kinh nghiệm Node.js, Golang, microservices.',
    jobContent: 'Thiết kế API hệ thống thanh toán ZaloPay.',
    techStack: ['Node.js', 'Go', 'Docker', 'PostgreSQL', 'Redis', 'Kafka'],
    salary: '30-45 triệu VNĐ',
    onetSocCode: '15-1252.00',
    onetOccupationTitle: 'Software Developers',
    targetSfiaLevel: 3,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    lastUsedAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'jd-2',
    userId: 'user-1',
    companyName: 'Shopee',
    jobTitle: 'Frontend Engineer',
    level: 'senior',
    requirements: '4+ năm kinh nghiệm React, Next.js, Performance.',
    jobContent: 'Tối ưu trải nghiệm trang chủ ứng dụng mua sắm.',
    techStack: ['React', 'TypeScript', 'Next.js'],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  },
]

describe('JdLibraryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders accessible loading state initially', () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockReturnValue(
      new Promise(() => {})
    )
    render(<JdLibraryClient />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Đang tải danh sách Job Descriptions...'
    )
  })

  it('renders error alert and retries when clicking Thử lại', async () => {
    const user = userEvent.setup()
    vi.mocked(prepService.getSavedJobDescriptions)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(mockJdList)

    render(<JdLibraryClient />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Lỗi kết nối máy chủ'
    )

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('VNG Corporation')).toBeInTheDocument()
    expect(prepService.getSavedJobDescriptions).toHaveBeenCalledTimes(2)
  })

  it('renders empty state with semantic links to /setup?new=1', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue([])
    const { container } = render(<JdLibraryClient />)

    expect(
      await screen.findByRole('heading', {
        name: 'Chưa có Job Description nào',
      })
    ).toBeInTheDocument()

    const createLinks = screen.getAllByRole('link', { name: /Tạo phiên mới/i })
    expect(createLinks).toHaveLength(2)
    for (const link of createLinks) {
      expect(link).toHaveAttribute('href', '/setup?new=1')
    }

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders saved JDs with O*NET/SFIA badges, tech overflow, and semantic links', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue(mockJdList)
    const { container } = render(<JdLibraryClient />)

    expect(await screen.findByText('VNG Corporation')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Shopee')).toBeInTheDocument()
    expect(screen.getByText('SFIA Level 3')).toBeInTheDocument()
    expect(screen.getByText(/Software Developers/i)).toBeInTheDocument()
    expect(screen.getByText('(15-1252.00)')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()

    const vngLink = screen.getByRole('link', { name: /VNG Corporation/i })
    expect(vngLink).toHaveAttribute('href', '/setup?jdId=jd-1')

    const shopeeLink = screen.getByRole('link', { name: /Shopee/i })
    expect(shopeeLink).toHaveAttribute('href', '/setup?jdId=jd-2')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('filters JDs by search query and level filter, with reset button', async () => {
    const user = userEvent.setup()
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue(mockJdList)
    render(<JdLibraryClient />)

    await screen.findByText('VNG Corporation')

    const searchInput = screen.getByLabelText('Tìm kiếm Job Description')
    await user.type(searchInput, 'Next.js')

    await waitFor(() => {
      expect(screen.queryByText('VNG Corporation')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Shopee')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Xóa từ khóa tìm kiếm' })
    )
    expect(await screen.findByText('VNG Corporation')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Senior' }))
    await waitFor(() => {
      expect(screen.queryByText('VNG Corporation')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Shopee')).toBeInTheDocument()

    await user.type(searchInput, 'nonexistent-company')
    expect(
      screen.getByText('Không tìm thấy Job Description phù hợp')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(await screen.findByText('VNG Corporation')).toBeInTheDocument()
    expect(screen.getByText('Shopee')).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import JdLibraryPage from './page'
import { prepService } from '@/services'
import type { SavedJobDescription } from '@/lib/types'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/services', () => ({
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
    techStack: ['Node.js', 'Go', 'Docker', 'PostgreSQL'],
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

describe('JdLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockReturnValue(
      new Promise(() => {})
    )
    render(<JdLibraryPage />)
    expect(
      screen.getByText('Đang tải danh sách Job Descriptions...')
    ).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockRejectedValue(
      new Error('Lỗi kết nối máy chủ')
    )
    render(<JdLibraryPage />)
    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()
    })
  })

  it('renders empty state when no saved JDs exist', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue([])
    render(<JdLibraryPage />)
    await waitFor(() => {
      expect(
        screen.getByText('Chưa có Job Description nào')
      ).toBeInTheDocument()
    })
    const createBtns = screen.getAllByRole('button', { name: /Tạo phiên mới/i })
    expect(createBtns.length).toBeGreaterThan(0)
    fireEvent.click(createBtns[0])
    expect(mockPush).toHaveBeenCalledWith('/setup?new=1')
  })

  it('renders list of saved JDs with O*NET and SFIA badges', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue(mockJdList)
    render(<JdLibraryPage />)

    await waitFor(() => {
      expect(screen.getByText('VNG Corporation')).toBeInTheDocument()
    })

    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Shopee')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()

    // Kiểm tra huy hiệu O*NET & SFIA Level cho jd-1
    expect(screen.getByText('SFIA Level 3')).toBeInTheDocument()
    expect(screen.getByText(/Software Developers/i)).toBeInTheDocument()
    expect(screen.getByText('(15-1252.00)')).toBeInTheDocument()

    // Kiểm tra tech stack chips
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('navigates to setup page with jdId when a card is clicked', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue(mockJdList)
    render(<JdLibraryPage />)

    await waitFor(() => {
      expect(screen.getByText('VNG Corporation')).toBeInTheDocument()
    })

    const vngCard = screen.getByText('VNG Corporation').closest('[role="button"]')!
    fireEvent.click(vngCard)

    expect(mockPush).toHaveBeenCalledWith('/setup?jdId=jd-1')
  })

  it('navigates to setup page when pressing Enter on card', async () => {
    vi.mocked(prepService.getSavedJobDescriptions).mockResolvedValue(mockJdList)
    render(<JdLibraryPage />)

    await waitFor(() => {
      expect(screen.getByText('Shopee')).toBeInTheDocument()
    })

    const shopeeCard = screen.getByText('Shopee').closest('[role="button"]')!
    fireEvent.keyDown(shopeeCard, { key: 'Enter' })

    expect(mockPush).toHaveBeenCalledWith('/setup?jdId=jd-2')
  })
})

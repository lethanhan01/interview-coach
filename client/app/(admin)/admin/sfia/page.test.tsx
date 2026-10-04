import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SfiaAdminPage from './page'

// Mock next/navigation
const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams('tab=matrix')

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  usePathname: () => '/admin/sfia',
  useSearchParams: () => mockSearchParams,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('SfiaAdminPage - Matrix Tab Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('tab=matrix')
  })

  it('renders SFIA Knowledge Browser header and Matrix tab workspace', async () => {
    render(<SfiaAdminPage />)

    expect(screen.getByText('SFIA 9 Knowledge Browser')).toBeInTheDocument()
    expect(screen.getByText('Ma trận 2D')).toBeInTheDocument()

    // Wait for mock data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tìm mã hoặc tên kỹ năng...')).toBeInTheDocument()
    })

    expect(screen.getByText('Kỹ Năng SFIA 9')).toBeInTheDocument()
    expect(screen.getByText('Xuất Ma trận CSV')).toBeInTheDocument()
    expect(screen.getByText('Lọc điểm mù (0 câu hỏi)')).toBeInTheDocument()
  })

  it('filters matrix skills when search query is typed in toolbar', async () => {
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tìm mã hoặc tên kỹ năng...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Tìm mã hoặc tên kỹ năng...')
    fireEvent.change(searchInput, { target: { value: 'PROG' } })

    await waitFor(() => {
      expect(screen.getByText('Programming/software development')).toBeInTheDocument()
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
      expect(screen.getByText('Mở Cây kỹ năng')).toBeInTheDocument()
      expect(screen.getByText('Sao chép Prompt AI')).toBeInTheDocument()
      expect(screen.getByText('Tạo câu hỏi')).toBeInTheDocument()
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
    expect(screen.getByText('Phân bổ & Độ phủ theo 6 Danh mục SFIA')).toBeInTheDocument()
    expect(screen.getByText('Phân bổ câu hỏi theo 7 Cấp độ SFIA')).toBeInTheDocument()
    expect(screen.getByText('Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET')).toBeInTheDocument()

    // Blind Spots Table
    expect(screen.getByText('Bảng Cảnh Báo Điểm Mù (Blind Spots)')).toBeInTheDocument()
    expect(screen.getByText('35 điểm mù')).toBeInTheDocument()
    expect(screen.getByText('Xuất danh sách điểm mù CSV')).toBeInTheDocument()
  })

  it('opens create question modal when clicking [Tạo câu hỏi] in blind spots table', async () => {
    render(<SfiaAdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Bảng Cảnh Báo Điểm Mù (Blind Spots)')).toBeInTheDocument()
    })

    const createButtons = screen.getAllByRole('button', { name: /Tạo câu hỏi/i })
    expect(createButtons.length).toBeGreaterThan(0)

    fireEvent.click(createButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Tạo câu hỏi phỏng vấn mới/i)).toBeInTheDocument()
    })
  })
})


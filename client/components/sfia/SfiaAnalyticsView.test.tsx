import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SfiaAnalyticsView, type SfiaAnalyticsViewProps } from './SfiaAnalyticsView'
import {
  MOCK_SFIA_CATEGORIES,
  MOCK_SFIA_COVERAGE_STATS,
  MOCK_SFIA_SKILL_SUMMARIES,
} from './sfia-mock-data'

describe('SfiaAnalyticsView Component', () => {
  const defaultProps: SfiaAnalyticsViewProps = {
    stats: MOCK_SFIA_COVERAGE_STATS,
    categories: MOCK_SFIA_CATEGORIES,
    skills: MOCK_SFIA_SKILL_SUMMARIES,
    selectedCategoryFilter: null,
    selectedLevelFilter: null,
    onSelectCategory: vi.fn(),
    onSelectLevel: vi.fn(),
    onSelectSkill: vi.fn(),
    onScrollToBlindSpots: vi.fn(),
    loading: false,
    error: null,
  }

  it('renders all 4 executive KPI cards with accurate metric counts', () => {
    render(<SfiaAnalyticsView {...defaultProps} />)

    // KPI 1: Total SFIA Skills (147)
    expect(screen.getByText('Tổng kỹ năng SFIA 9')).toBeInTheDocument()
    expect(screen.getByText('147')).toBeInTheDocument()
    expect(screen.getByText('6 Danh mục')).toBeInTheDocument()

    // KPI 2: Question Coverage Rate (76.2%)
    expect(screen.getByText('Độ phủ câu hỏi phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('76.2%')).toBeInTheDocument()
    expect(screen.getByText('(112/147)')).toBeInTheDocument()
    expect(screen.getByText('486 Qs')).toBeInTheDocument()

    // KPI 3: O*NET Mapping Rate (66.7%)
    expect(screen.getByText('Ánh xạ nghề nghiệp O*NET')).toBeInTheDocument()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
    expect(screen.getByText('(98/147)')).toBeInTheDocument()

    // KPI 4: Blind Spots (35)
    expect(screen.getByText('Điểm mù cần hành động')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('kỹ năng (0 câu hỏi)')).toBeInTheDocument()
  })

  it('renders all 6 categories in category distribution chart and handles category selection', () => {
    const onSelectCategory = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        onSelectCategory={onSelectCategory}
      />
    )

    // Heading exists
    expect(
      screen.getByText('Phân bổ & Độ phủ theo 6 Danh mục SFIA')
    ).toBeInTheDocument()

    // Categories are rendered
    expect(screen.getByText('Phát triển & Triển khai')).toBeInTheDocument()
    expect(screen.getByText('Chiến lược & Kiến trúc')).toBeInTheDocument()
    expect(screen.getByText('Vận hành & Cung cấp dịch vụ')).toBeInTheDocument()

    // Click on DEV_IMPL category button
    const devImplButton = screen.getByRole('button', {
      name: /Lọc theo danh mục Phát triển & Triển khai/i,
    })
    fireEvent.click(devImplButton)
    expect(onSelectCategory).toHaveBeenCalledWith('DEV_IMPL')
  })

  it('renders clear category filter button when a category filter is active', () => {
    const onSelectCategory = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        selectedCategoryFilter="DEV_IMPL"
        onSelectCategory={onSelectCategory}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Bỏ lọc danh mục/i })
    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)
    expect(onSelectCategory).toHaveBeenCalledWith(null)
  })

  it('renders all 7 responsibility levels in level distribution chart and handles level selection', () => {
    const onSelectLevel = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        onSelectLevel={onSelectLevel}
      />
    )

    // Heading exists
    expect(
      screen.getByText('Phân bổ câu hỏi theo 7 Cấp độ SFIA')
    ).toBeInTheDocument()

    // Levels are rendered
    expect(screen.getByText('Follow')).toBeInTheDocument()
    expect(screen.getByText('Apply')).toBeInTheDocument()
    expect(screen.getByText('Set strategy / Inspire')).toBeInTheDocument()

    // Click on Level 3 button
    const level3Button = screen.getByRole('button', { name: /Lọc theo Level 3/i })
    fireEvent.click(level3Button)
    expect(onSelectLevel).toHaveBeenCalledWith(3)
  })

  it('renders clear level filter button when a level filter is active', () => {
    const onSelectLevel = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        selectedLevelFilter={4}
        onSelectLevel={onSelectLevel}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Bỏ lọc Level 4/i })
    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)
    expect(onSelectLevel).toHaveBeenCalledWith(null)
  })

  it('renders Top 10 O*NET skills leaderboard and triggers onSelectSkill on click', () => {
    const onSelectSkill = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        onSelectSkill={onSelectSkill}
      />
    )

    // Heading exists
    expect(
      screen.getByText('Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET')
    ).toBeInTheDocument()

    // Top skills exist
    expect(screen.getByText('PPLM')).toBeInTheDocument()
    expect(screen.getByText('People management')).toBeInTheDocument()
    expect(screen.getByText('PROG')).toBeInTheDocument()
    expect(screen.getByText('Programming/software development')).toBeInTheDocument()

    // Click jump action
    const viewButton = screen.getByRole('button', {
      name: /Xem chi tiết PPLM/i,
    })
    fireEvent.click(viewButton)
    expect(onSelectSkill).toHaveBeenCalledWith('PPLM')
  })

  it('renders loading skeleton when loading is true', () => {
    const { container } = render(
      <SfiaAnalyticsView {...defaultProps} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders error state and handles retry', () => {
    const onRetry = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        stats={null}
        error="Lỗi kết nối máy chủ"
        onRetry={onRetry}
      />
    )

    expect(
      screen.getByText('Không thể tải dữ liệu Thống kê Phân tích SFIA')
    ).toBeInTheDocument()
    expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()

    const retryButton = screen.getByRole('button', {
      name: /Thử tải lại dữ liệu/i,
    })
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalled()
  })

  it('triggers onScrollToBlindSpots when clicking blind spots KPI card', () => {
    const onScrollToBlindSpots = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        onScrollToBlindSpots={onScrollToBlindSpots}
      />
    )

    const blindSpotCard = screen.getByTitle('Nhấp để cuộn nhanh đến Bảng Điểm mù')
    fireEvent.click(blindSpotCard)
    expect(onScrollToBlindSpots).toHaveBeenCalled()
  })
})

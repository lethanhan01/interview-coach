import { Box } from '@mantine/core'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  MOCK_SFIA_COVERAGE_STATS,
  MOCK_SFIA_RESPONSIBILITY_LEVELS,
} from '@/test-utils/fixtures/sfia.fixture'
import {
  SfiaAnalyticsView,
  type SfiaAnalyticsViewProps,
} from './SfiaAnalyticsView'

vi.mock('next/dynamic', () => ({
  default: () => {
    function MockDynamicChart(props: Record<string, unknown>) {
      const mode = typeof props.chartMode === 'string' ? props.chartMode : 'bar'
      return <Box data-testid="mock-mantine-chart" data-mode={mode} />
    }
    return MockDynamicChart
  },
}))

describe('SfiaAnalyticsView Component', () => {
  const defaultProps: SfiaAnalyticsViewProps = {
    stats: MOCK_SFIA_COVERAGE_STATS,
    levels: MOCK_SFIA_RESPONSIBILITY_LEVELS,
    selectedCategoryFilter: null,
    selectedLevelFilter: null,
    onSelectCategory: vi.fn(),
    onSelectLevel: vi.fn(),
    onSelectSkill: vi.fn(),
    onScrollToBlindSpots: vi.fn(),
    loading: false,
    error: null,
  }

  it('renders all 4 executive KPI cards with accurate metric counts and passes axe', async () => {
    const { container } = render(<SfiaAnalyticsView {...defaultProps} />)

    expect(screen.getByText('Tổng kỹ năng SFIA 9')).toBeInTheDocument()
    expect(screen.getByText('147')).toBeInTheDocument()
    expect(screen.getByText('6 Danh mục')).toBeInTheDocument()
    expect(screen.getByText('22 Phân nhóm')).toBeInTheDocument()

    expect(screen.getByText('Độ phủ câu hỏi phỏng vấn')).toBeInTheDocument()
    expect(screen.getByText('76.2%')).toBeInTheDocument()
    expect(screen.getByText('(112/147)')).toBeInTheDocument()
    expect(screen.getByText(/Tổng số câu hỏi:\s*486/)).toBeInTheDocument()

    expect(screen.getByText('Ánh xạ nghề nghiệp O*NET')).toBeInTheDocument()
    expect(screen.getByText('66.7%')).toBeInTheDocument()
    expect(screen.getByText('(98/147)')).toBeInTheDocument()

    expect(screen.getByText('Điểm mù cần hành động')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('kỹ năng (0 câu hỏi)')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên bổ sung')).toBeInTheDocument()

    expect(screen.getAllByTestId('mock-mantine-chart')).toHaveLength(2)
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('handles category pill cross-filtering and clear button', async () => {
    const user = userEvent.setup()
    const onSelectCategory = vi.fn()
    const { rerender } = render(
      <SfiaAnalyticsView
        {...defaultProps}
        onSelectCategory={onSelectCategory}
      />
    )

    expect(
      screen.getByText('Phân bổ & Độ phủ theo 6 Danh mục SFIA')
    ).toBeInTheDocument()
    expect(screen.getByText('Phát triển & Triển khai')).toBeInTheDocument()

    const devImplButton = screen.getByRole('button', {
      name: /Lọc theo danh mục Phát triển & Triển khai \(DEV_IMPL\)/i,
    })
    expect(devImplButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(devImplButton)
    expect(onSelectCategory).toHaveBeenCalledWith('DEV_IMPL')

    rerender(
      <SfiaAnalyticsView
        {...defaultProps}
        selectedCategoryFilter="DEV_IMPL"
        onSelectCategory={onSelectCategory}
      />
    )

    expect(
      screen.getByRole('button', {
        name: /Lọc theo danh mục Phát triển & Triển khai \(DEV_IMPL\)/i,
      })
    ).toHaveAttribute('aria-pressed', 'true')

    const clearButton = screen.getByRole('button', { name: /Bỏ lọc danh mục/i })
    await user.click(clearButton)
    expect(onSelectCategory).toHaveBeenCalledWith(null)
  })

  it('toggles level chart between Cột and Tỷ trọng and handles level pill cross-filtering', async () => {
    const user = userEvent.setup()
    const onSelectLevel = vi.fn()
    const { rerender } = render(
      <SfiaAnalyticsView {...defaultProps} onSelectLevel={onSelectLevel} />
    )

    expect(
      screen.getByText('Phân bổ câu hỏi theo 7 Cấp độ SFIA')
    ).toBeInTheDocument()
    expect(screen.getByText('Tuân thủ & Thực thi cơ bản')).toBeInTheDocument()
    expect(screen.getByText('Áp dụng độc lập')).toBeInTheDocument()

    const donutRadio = screen.getByRole('radio', { name: 'Tỷ trọng' })
    const barRadio = screen.getByRole('radio', { name: 'Cột' })
    expect(barRadio).toBeChecked()

    await user.click(donutRadio)
    expect(donutRadio).toBeChecked()
    const charts = screen.getAllByTestId('mock-mantine-chart')
    expect(charts[1]).toHaveAttribute('data-mode', 'donut')

    const level3Button = screen.getByRole('button', {
      name: /Lọc theo Cấp L3/i,
    })
    await user.click(level3Button)
    expect(onSelectLevel).toHaveBeenCalledWith(3)

    rerender(
      <SfiaAnalyticsView
        {...defaultProps}
        selectedLevelFilter={4}
        onSelectLevel={onSelectLevel}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Bỏ lọc Cấp L4/i })
    await user.click(clearButton)
    expect(onSelectLevel).toHaveBeenCalledWith(null)
  })

  it('renders Top 10 O*NET leaderboard and triggers onSelectSkill', async () => {
    const user = userEvent.setup()
    const onSelectSkill = vi.fn()
    render(
      <SfiaAnalyticsView {...defaultProps} onSelectSkill={onSelectSkill} />
    )

    expect(
      screen.getByText('Top 10 Kỹ Năng SFIA Phổ Biến Nhất trong O*NET')
    ).toBeInTheDocument()
    expect(screen.getByText('PPLM')).toBeInTheDocument()
    expect(screen.getByText('People management')).toBeInTheDocument()

    const viewButton = screen.getByRole('button', {
      name: /Xem chi tiết PPLM/i,
    })
    await user.click(viewButton)
    expect(onSelectSkill).toHaveBeenCalledWith('PPLM')
  })

  it('renders Mantine skeleton state when loading is true', () => {
    render(<SfiaAnalyticsView {...defaultProps} loading={true} />)
    expect(screen.getByTestId('sfia-analytics-loading')).toBeInTheDocument()
    expect(screen.queryByText('Tổng kỹ năng SFIA 9')).not.toBeInTheDocument()
  })

  it('renders danger alert error state and triggers retry', async () => {
    const user = userEvent.setup()
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
    await user.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('triggers onScrollToBlindSpots when clicking blind spots KPI button', async () => {
    const user = userEvent.setup()
    const onScrollToBlindSpots = vi.fn()
    render(
      <SfiaAnalyticsView
        {...defaultProps}
        onScrollToBlindSpots={onScrollToBlindSpots}
      />
    )

    const blindSpotBtn = screen.getByRole('button', {
      name: /Điểm mù cần hành động/i,
    })
    expect(blindSpotBtn).toHaveAttribute(
      'title',
      'Nhấp để cuộn nhanh đến Bảng Điểm mù'
    )
    await user.click(blindSpotBtn)
    expect(onScrollToBlindSpots).toHaveBeenCalledTimes(1)
  })
})

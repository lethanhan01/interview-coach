import { render, screen, userEvent } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaGenericAttributesView } from './SfiaGenericAttributesView'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'

describe('SfiaGenericAttributesView', () => {
  const mockLevels: SfiaLevelResponsibility[] = [
    {
      levelId: 1,
      name: 'Follow',
      nameVi: 'Tuân thủ',
      essence: 'Giám sát trực tiếp.',
      description: 'Tác vụ cơ bản.',
    },
    {
      levelId: 2,
      name: 'Assist',
      nameVi: 'Hỗ trợ',
      essence: 'Hoạt động độc lập quen.',
      description: 'Hỗ trợ đồng nghiệp.',
    },
    {
      levelId: 3,
      name: 'Apply',
      nameVi: 'Áp dụng',
      essence: 'Tự chủ chuyên môn.',
      description: 'Chịu trách nhiệm đầu ra.',
    },
  ]

  const mockAttributes: SfiaGenericAttribute[] = [
    {
      code: 'AUTONOMY',
      name: 'Autonomy',
      nameVi: 'Mức độ tự chủ',
      description: 'Mức độ độc lập công việc.',
      levels: {
        1: 'Chỉ đạo trực tiếp.',
        2: 'Giám sát định kỳ.',
        3: 'Làm việc độc lập trong phạm vi nhiệm vụ.',
      },
    },
  ]

  const defaultProps = {
    levels: mockLevels,
    attributes: mockAttributes,
    selectedLevel: 3,
    onSelectLevel: vi.fn(),
    viewMode: 'level' as const,
    onViewModeChange: vi.fn(),
    onNavigateToMatrixWithLevel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Vietnamese header bar, SegmentedControl, and passes accessibility', async () => {
    const { container } = render(
      <SfiaGenericAttributesView {...defaultProps} />
    )
    expect(
      screen.getByText(/7 Cấp độ Trách nhiệm & 5 Thuộc tính Chung Cốt lõi/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /Theo Cấp độ/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /Ma trận Tiến triển 5×7/i })
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders level-centric view when viewMode is level', () => {
    render(<SfiaGenericAttributesView {...defaultProps} viewMode="level" />)
    expect(screen.getByText(/Thước Đo Cấp Độ Trách Nhiệm/i)).toBeInTheDocument()
    expect(screen.getByText(/Tinh hoa Cấp độ 3/i)).toBeInTheDocument()
  })

  it('renders progression matrix view when viewMode is matrix and jumps back to level view', async () => {
    const user = userEvent.setup()
    const onViewModeChange = vi.fn()
    const { container } = render(
      <SfiaGenericAttributesView
        {...defaultProps}
        viewMode="matrix"
        onViewModeChange={onViewModeChange}
      />
    )
    expect(
      screen.getByText(/Ma trận Tiến triển 5 Thuộc tính Chung \(5×7\)/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Tìm kiếm tiêu chí thuộc tính.../i)
    ).toBeInTheDocument()

    const jumpBtn = screen.getByRole('button', {
      name: /Xem chi tiết Cấp L3/i,
    })
    await user.click(jumpBtn)
    expect(onViewModeChange).toHaveBeenCalledWith('level')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('calls onViewModeChange when toggling SegmentedControl', async () => {
    const user = userEvent.setup()
    const onViewModeChange = vi.fn()
    render(
      <SfiaGenericAttributesView
        {...defaultProps}
        onViewModeChange={onViewModeChange}
      />
    )
    const matrixOption = screen.getByText(/Ma trận Tiến triển 5×7/i)
    await user.click(matrixOption)
    expect(onViewModeChange).toHaveBeenCalledWith('matrix')
  })

  it('renders Mantine Skeleton loading state without .animate-pulse', () => {
    const { container } = render(
      <SfiaGenericAttributesView {...defaultProps} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByText(/7 Cấp độ Trách nhiệm/i)).not.toBeInTheDocument()
  })

  it('renders Vietnamese error Alert and handles Thử lại click', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { container } = render(
      <SfiaGenericAttributesView
        {...defaultProps}
        error="Lỗi kết nối máy chủ"
        onRetry={onRetry}
      />
    )
    expect(
      screen.getByText(/Không thể tải dữ liệu Cấp độ & Thuộc tính chung SFIA/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i })
    await user.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    expect(await axe(container)).toHaveNoViolations()
  })
})

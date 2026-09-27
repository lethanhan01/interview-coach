import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaGenericAttributesView } from './SfiaGenericAttributesView'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'

describe('SfiaGenericAttributesView', () => {
  const mockLevels: SfiaLevelResponsibility[] = [
    { levelId: 1, name: 'Follow', nameVi: 'Tuân thủ', essence: 'Giám sát trực tiếp.', description: 'Tác vụ cơ bản.' },
    { levelId: 2, name: 'Assist', nameVi: 'Hỗ trợ', essence: 'Hoạt động độc lập quen.', description: 'Hỗ trợ đồng nghiệp.' },
    { levelId: 3, name: 'Apply', nameVi: 'Áp dụng', essence: 'Tự chủ chuyên môn.', description: 'Chịu trách nhiệm đầu ra.' },
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

  it('renders header bar and view switcher tabs', () => {
    render(<SfiaGenericAttributesView {...defaultProps} />)
    expect(screen.getByText(/7 Cấp Độ Trách Nhiệm & 5 Thuộc Tính Năng Lực Nền Tảng/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Chế độ xem theo cấp độ/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Chế độ xem ma trận tiến trình/i })).toBeInTheDocument()
  })

  it('renders level-centric view when viewMode is level', () => {
    render(<SfiaGenericAttributesView {...defaultProps} viewMode="level" />)
    expect(screen.getByText(/Chọn Cấp Độ Trách Nhiệm/i)).toBeInTheDocument()
    expect(screen.getByText(/Bản chất cốt lõi/i)).toBeInTheDocument()
  })

  it('renders progression matrix view when viewMode is matrix', () => {
    render(<SfiaGenericAttributesView {...defaultProps} viewMode="matrix" />)
    expect(screen.getByText(/Ma Trận Tiến Hóa 5 Thuộc Tính Năng Lực Nền Tảng/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Tìm kiếm nội dung tiêu chuẩn.../i)).toBeInTheDocument()
  })

  it('calls onViewModeChange when switching tabs', async () => {
    const user = userEvent.setup()
    const onViewModeChange = vi.fn()
    render(<SfiaGenericAttributesView {...defaultProps} onViewModeChange={onViewModeChange} />)
    const matrixTab = screen.getByRole('tab', { name: /Chế độ xem ma trận tiến trình/i })
    await user.click(matrixTab)
    expect(onViewModeChange).toHaveBeenCalledWith('matrix')
  })

  it('renders loading skeleton when loading prop is true', () => {
    const { container } = render(<SfiaGenericAttributesView {...defaultProps} loading={true} />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText(/Chọn Cấp Độ Trách Nhiệm/i)).not.toBeInTheDocument()
  })

  it('renders error state and handles retry button click', () => {
    const onRetry = vi.fn()
    render(
      <SfiaGenericAttributesView
        {...defaultProps}
        error="Lỗi kết nối máy chủ"
        onRetry={onRetry}
      />
    )
    expect(screen.getByText(/Không thể tải dữ liệu Cấp độ & Thuộc tính SFIA/i)).toBeInTheDocument()
    expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalled()
  })
})

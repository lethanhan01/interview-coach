import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaAttributesProgressionMatrix } from './SfiaAttributesProgressionMatrix'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'

describe('SfiaAttributesProgressionMatrix', () => {
  const mockLevels: SfiaLevelResponsibility[] = [
    { levelId: 1, name: 'Follow', nameVi: 'Tuân thủ', essence: 'Giám sát trực tiếp.', description: 'Tác vụ cơ bản.' },
    { levelId: 2, name: 'Assist', nameVi: 'Hỗ trợ', essence: 'Hoạt động độc lập quen.', description: 'Hỗ trợ đồng nghiệp.' },
    { levelId: 3, name: 'Apply', nameVi: 'Áp dụng', essence: 'Tự chủ chuyên môn.', description: 'Chịu trách nhiệm đầu ra.' },
    { levelId: 4, name: 'Enable', nameVi: 'Chủ động', essence: 'Hướng dẫn người khác.', description: 'Phụ trách nhóm nhỏ.' },
    { levelId: 5, name: 'Ensure', nameVi: 'Đảm bảo', essence: 'Định hình kỹ thuật.', description: 'Cố vấn chuyên môn.' },
    { levelId: 6, name: 'Initiate', nameVi: 'Khởi xướng', essence: 'Chuyển đổi chiến lược.', description: 'Tiêu chuẩn toàn diện.' },
    { levelId: 7, name: 'Set strategy', nameVi: 'Chiến lược', essence: 'Tầm nhìn tối cao.', description: 'Cấp tập đoàn.' },
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
        4: 'Tự chủ hoàn toàn trong chuyên môn.',
        5: 'Chỉ đạo phân quyền.',
        6: 'Quyết định chiến lược cấp khối.',
        7: 'Toàn quyền quyết định.',
      },
    },
    {
      code: 'INFLUENCE',
      name: 'Influence',
      nameVi: 'Mức độ ảnh hưởng',
      description: 'Tác động đến người khác.',
      levels: {
        1: 'Tương tác người hướng dẫn.',
        2: 'Tương tác nhóm.',
        3: 'Ảnh hưởng sản phẩm nhóm.',
        4: 'Ảnh hưởng nhiều nhóm.',
        5: 'Ảnh hưởng chính sách.',
        6: 'Định hình chiến lược.',
        7: 'Dẫn dắt xu thế.',
      },
    },
  ]

  const defaultProps = {
    levels: mockLevels,
    attributes: mockAttributes,
    selectedLevel: 3,
    onSelectLevel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-uuid')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders all 7 level column headers in the table', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)
    expect(screen.getByRole('columnheader', { name: /Level 1: Follow/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Level 3: Apply/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Level 7: Set strategy/i })).toBeInTheDocument()
  })

  it('renders rows for all provided generic attributes', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)
    expect(screen.getByText('Autonomy')).toBeInTheDocument()
    expect(screen.getByText('Mức độ tự chủ')).toBeInTheDocument()
    expect(screen.getByText('Influence')).toBeInTheDocument()
    expect(screen.getByText('Mức độ ảnh hưởng')).toBeInTheDocument()
  })

  it('displays the level statements in the matrix cells', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)
    expect(screen.getByText('Chỉ đạo trực tiếp.')).toBeInTheDocument()
    expect(screen.getByText('Làm việc độc lập trong phạm vi nhiệm vụ.')).toBeInTheDocument()
    expect(screen.getByText('Toàn quyền quyết định.')).toBeInTheDocument()
  })

  it('calls onSelectLevel when a level column header is clicked', () => {
    const onSelectLevel = vi.fn()
    render(<SfiaAttributesProgressionMatrix {...defaultProps} onSelectLevel={onSelectLevel} />)
    const headerL4 = screen.getByRole('columnheader', { name: /Level 4: Enable/i })
    fireEvent.click(headerL4)
    expect(onSelectLevel).toHaveBeenCalledWith(4)
  })

  it('highlights the selected level column', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} selectedLevel={3} />)
    // The selected column has "Đang chọn" indicators
    const activeIndicators = screen.getAllByText('Đang chọn')
    expect(activeIndicators.length).toBeGreaterThan(0)
  })

  it('filters rows based on search input', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Tìm kiếm nội dung tiêu chuẩn...')
    fireEvent.change(searchInput, { target: { value: 'xu thế' } })

    // "Influence" has "Dẫn dắt xu thế", "Autonomy" does not
    expect(screen.getByText('Influence')).toBeInTheDocument()
    expect(screen.queryByText('Autonomy')).not.toBeInTheDocument()
  })

  it('handles CSV export button click and downloads file', () => {
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)
    const exportBtn = screen.getByRole('button', { name: /Xuất CSV/i })
    fireEvent.click(exportBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})

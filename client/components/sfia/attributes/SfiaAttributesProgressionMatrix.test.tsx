import { render, screen, userEvent, within } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaAttributesProgressionMatrix } from './SfiaAttributesProgressionMatrix'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'

describe('SfiaAttributesProgressionMatrix', () => {
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
    {
      levelId: 4,
      name: 'Enable',
      nameVi: 'Chủ động',
      essence: 'Hướng dẫn người khác.',
      description: 'Phụ trách nhóm nhỏ.',
    },
    {
      levelId: 5,
      name: 'Ensure',
      nameVi: 'Đảm bảo',
      essence: 'Định hình kỹ thuật.',
      description: 'Cố vấn chuyên môn.',
    },
    {
      levelId: 6,
      name: 'Initiate',
      nameVi: 'Khởi xướng',
      essence: 'Chuyển đổi chiến lược.',
      description: 'Tiêu chuẩn toàn diện.',
    },
    {
      levelId: 7,
      name: 'Set strategy',
      nameVi: 'Chiến lược',
      essence: 'Tầm nhìn tối cao.',
      description: 'Cấp tập đoàn.',
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
    onSwitchToLevelView: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi
      .fn()
      .mockReturnValue('blob:http://localhost/mock-uuid')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders all 7 level column header buttons, attribute rows, statements, and passes axe', async () => {
    const { container } = render(
      <SfiaAttributesProgressionMatrix {...defaultProps} />
    )

    expect(
      screen.getByRole('button', { name: /Cấp độ 1: Tuân thủ/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cấp độ 3: Áp dụng/i })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /Cấp độ 7: Chiến lược/i })
    ).toBeInTheDocument()

    expect(screen.getByText('Mức độ tự chủ')).toBeInTheDocument()
    expect(screen.getByText('AUTONOMY')).toBeInTheDocument()
    expect(screen.getByText('Mức độ ảnh hưởng')).toBeInTheDocument()
    expect(screen.getByText('INFLUENCE')).toBeInTheDocument()

    expect(screen.getByText('Chỉ đạo trực tiếp.')).toBeInTheDocument()
    expect(
      screen.getByText('Làm việc độc lập trong phạm vi nhiệm vụ.')
    ).toBeInTheDocument()
    expect(screen.getByText('Toàn quyền quyết định.')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('calls onSelectLevel when clicking UnstyledButton inside column header, while body cells stay selectable', async () => {
    const user = userEvent.setup()
    const onSelectLevel = vi.fn()
    render(
      <SfiaAttributesProgressionMatrix
        {...defaultProps}
        onSelectLevel={onSelectLevel}
      />
    )

    const headerL4 = screen.getByRole('columnheader', {
      name: /Cấp độ 4: Chủ động/i,
    })
    await user.click(within(headerL4).getByRole('button'))
    expect(onSelectLevel).toHaveBeenCalledWith(4)

    onSelectLevel.mockClear()
    const bodyStatement = screen.getByText('Toàn quyền quyết định.')
    await user.click(bodyStatement)
    expect(onSelectLevel).not.toHaveBeenCalled()
  })

  it('filters rows and highlights matched query text with Highlight', async () => {
    const user = userEvent.setup()
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(
      'Tìm kiếm tiêu chí thuộc tính...'
    )
    await user.type(searchInput, 'xu thế')

    expect(screen.getByText('Mức độ ảnh hưởng')).toBeInTheDocument()
    expect(screen.queryByText('Mức độ tự chủ')).not.toBeInTheDocument()
    expect(screen.getByText('xu thế').tagName).toBe('MARK')

    const clearBtn = screen.getByRole('button', {
      name: /Xóa từ khóa tìm kiếm/i,
    })
    await user.click(clearBtn)
    expect(screen.getByText('Mức độ tự chủ')).toBeInTheDocument()
  })

  it('calls onSwitchToLevelView when clicking Xem chi tiết Cấp L{n}', async () => {
    const user = userEvent.setup()
    const onSwitchToLevelView = vi.fn()
    render(
      <SfiaAttributesProgressionMatrix
        {...defaultProps}
        selectedLevel={5}
        onSwitchToLevelView={onSwitchToLevelView}
      />
    )

    const jumpBtn = screen.getByRole('button', {
      name: /Xem chi tiết Cấp L5/i,
    })
    await user.click(jumpBtn)
    expect(onSwitchToLevelView).toHaveBeenCalledTimes(1)
  })

  it('handles CSV export button click and downloads file', async () => {
    const user = userEvent.setup()
    render(<SfiaAttributesProgressionMatrix {...defaultProps} />)

    const exportBtn = screen.getByRole('button', {
      name: /Xuất CSV Ma trận/i,
    })
    await user.click(exportBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})

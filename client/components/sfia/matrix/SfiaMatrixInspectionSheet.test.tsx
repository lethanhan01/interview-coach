import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { notifications } from '@mantine/notifications'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaMatrixInspectionSheet } from './SfiaMatrixInspectionSheet'
import { sfiaAdminService } from '@/services/sfia-admin.service'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillDetail,
} from '@/types'

describe('SfiaMatrixInspectionSheet', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả',
      displayOrder: 1,
      skillCount: 42,
    },
  ]

  const mockLevels: SfiaLevelResponsibility[] = [
    {
      levelId: 3,
      name: 'Apply',
      nameVi: 'Áp dụng độc lập',
      essence: 'Tự chủ trong công việc chuyên môn.',
      description: 'Làm việc độc lập.',
    },
  ]

  const mockDetail: SfiaSkillDetail = {
    code: 'PROG',
    name: 'Programming/software development',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 2,
    maxLevel: 6,
    questionCount: 12,
    onetCount: 4,
    overallDescription: 'Mô tả tổng quan lập trình.',
    guidanceNotes: 'Ghi chú hướng dẫn.',
    skillLevels: [
      {
        skillCode: 'PROG',
        levelId: 3,
        essence:
          'Phát triển phần mềm độc lập với các module phức tạp vừa phải.',
        description:
          'Thiết kế, lập trình, kiểm thử các chương trình phức tạp vừa phải.',
      },
    ],
    onetMappings: [
      {
        socCode: '15-1252.00',
        occupationTitle: 'Software Developers',
        targetLevel: 3,
        weight: 2.0,
        isCore: true,
      },
    ],
    questionBankItems: [
      {
        id: 'Q-PROG-01',
        questionText: 'Giải thích Memory Leak trong Node.js?',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      },
    ],
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    skillCode: 'PROG',
    levelId: 3,
    levels: mockLevels,
    categories: mockCategories,
    onOpenInTaxonomy: vi.fn(),
    onCreateQuestion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(sfiaAdminService, 'getSkillDetail').mockResolvedValue(mockDetail)
    vi.spyOn(notifications, 'show').mockImplementation(() => '')
  })

  it('renders loading state, Vietnamese skill details, and passes accessibility', async () => {
    const { container } = render(
      <SfiaMatrixInspectionSheet {...defaultProps} />
    )

    expect(
      screen.getByText(/Đang tải thông tin kỹ năng PROG/)
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Phát triển & Triển khai')).toBeInTheDocument()
    expect(screen.getByText('Áp dụng độc lập')).toBeInTheDocument()
    expect(screen.getByText(/Phát triển phần mềm độc lập/)).toBeInTheDocument()
    expect(
      screen.getByText(/Thiết kế, lập trình, kiểm thử/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Giải thích Memory Leak trong Node.js?')
    ).toBeInTheDocument()
    expect(screen.getByText('15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('Cốt lõi')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders error alert and retries when getSkillDetail fails', async () => {
    const user = userEvent.setup()
    const spy = vi
      .spyOn(sfiaAdminService, 'getSkillDetail')
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(mockDetail)

    render(<SfiaMatrixInspectionSheet {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('triggers onOpenInTaxonomy and onClose when "Mở trong Cây kỹ năng" is clicked', async () => {
    const user = userEvent.setup()
    const onOpenInTaxonomy = vi.fn()
    const onClose = vi.fn()

    render(
      <SfiaMatrixInspectionSheet
        {...defaultProps}
        onOpenInTaxonomy={onOpenInTaxonomy}
        onClose={onClose}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /Mở trong Cây kỹ năng/i })
    )

    expect(onOpenInTaxonomy).toHaveBeenCalledWith('PROG', 3)
    expect(onClose).toHaveBeenCalled()
  })

  it('triggers onCreateQuestion and keeps Drawer open when "Tạo câu hỏi" is clicked', async () => {
    const user = userEvent.setup()
    const onCreateQuestion = vi.fn()
    const onClose = vi.fn()

    render(
      <SfiaMatrixInspectionSheet
        {...defaultProps}
        onCreateQuestion={onCreateQuestion}
        onClose={onClose}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Tạo câu hỏi/i }))

    expect(onCreateQuestion).toHaveBeenCalledWith('PROG', 3)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('copies AI Rubric to clipboard and shows Mantine notification', async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    render(<SfiaMatrixInspectionSheet {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByText('Programming/software development')
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /Sao chép AI Rubric/i })
    )

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled()
    })
    expect(notifications.show).toHaveBeenCalledWith({
      color: 'success',
      message: 'Đã sao chép AI Rubric vào bộ nhớ tạm',
    })
  })

  it('renders level-filtered ONET mappings with and without ids without duplicate key errors', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const detailWithMultiLevels: SfiaSkillDetail = {
        ...mockDetail,
        onetMappings: [
          {
            id: 'map-dev-l3',
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 3,
            weight: 1.8,
            isCore: true,
          },
          {
            id: 'map-dev-l4',
            socCode: '15-1252.00',
            occupationTitle: 'Software Developers',
            targetLevel: 4,
            weight: 2.0,
            isCore: true,
          },
          {
            socCode: '15-1253.00',
            occupationTitle: 'Software Quality Assurance Analysts',
            targetLevel: 3,
            weight: 1.2,
            isCore: false,
          },
        ],
      }
      vi.spyOn(sfiaAdminService, 'getSkillDetail').mockResolvedValueOnce(
        detailWithMultiLevels
      )

      render(<SfiaMatrixInspectionSheet {...defaultProps} />)

      await waitFor(() => {
        expect(
          screen.getByText(/Nghề O\*NET yêu cầu cấp độ này \(2\)/)
        ).toBeInTheDocument()
      })

      expect(screen.getByText('15-1252.00')).toBeInTheDocument()
      expect(screen.getByText('15-1253.00')).toBeInTheDocument()

      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key'))
      )
      expect(duplicateKeyCalls).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})

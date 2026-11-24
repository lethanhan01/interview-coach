import { render, screen, userEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaLevelAttributesView } from './SfiaLevelAttributesView'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'

describe('SfiaLevelAttributesView', () => {
  const mockLevels: SfiaLevelResponsibility[] = [
    {
      levelId: 1,
      name: 'Follow',
      nameVi: 'Tuân thủ',
      essence: 'Làm việc dưới sự giám sát trực tiếp.',
      description: 'Thực hiện các tác vụ cơ bản theo hướng dẫn rõ ràng.',
    },
    {
      levelId: 2,
      name: 'Assist',
      nameVi: 'Hỗ trợ',
      essence: 'Hoạt động độc lập trong các tác vụ thông thường.',
      description: 'Hỗ trợ đồng nghiệp trong các bài toán phức tạp.',
    },
    {
      levelId: 3,
      name: 'Apply',
      nameVi: 'Áp dụng độc lập',
      essence: 'Tự chủ trong công việc chuyên môn.',
      description: 'Chịu trách nhiệm về chất lượng đầu ra cá nhân.',
    },
    {
      levelId: 4,
      name: 'Enable',
      nameVi: 'Chủ động & Tạo điều kiện',
      essence: 'Hướng dẫn và tạo điều kiện cho người khác hoàn thành mục tiêu.',
      description:
        'Chịu trách nhiệm về mảng công việc lớn hoặc nhóm kỹ thuật nhỏ.',
    },
    {
      levelId: 5,
      name: 'Ensure / Advise',
      nameVi: 'Đảm bảo & Cố vấn',
      essence: 'Định hình phương hướng kỹ thuật cho dự án quan trọng.',
      description: 'Đưa ra các quyết định kiến trúc có tầm ảnh hưởng lớn.',
    },
    {
      levelId: 6,
      name: 'Initiate / Influence',
      nameVi: 'Khởi xướng & Gây ảnh hưởng',
      essence: 'Khởi xướng các sáng kiến chuyển đổi công nghệ.',
      description: 'Dẫn dắt các chương trình chuyển đổi chiến lược.',
    },
    {
      levelId: 7,
      name: 'Set strategy / Inspire',
      nameVi: 'Định hình chiến lược',
      essence: 'Xác lập tầm nhìn chiến lược công nghệ tối cao.',
      description: 'Quyết định chiến lược công nghệ cấp tập đoàn.',
    },
  ]

  const mockAttributes: SfiaGenericAttribute[] = [
    {
      code: 'AUTONOMY',
      name: 'Autonomy',
      nameVi: 'Mức độ tự chủ',
      description: 'Mức độ độc lập khi thực hiện công việc.',
      levels: {
        1: 'Hoạt động dưới chỉ đạo trực tiếp.',
        2: 'Hoạt động dưới giám sát định kỳ.',
        3: 'Làm việc độc lập trong phạm vi nhiệm vụ.',
        4: 'Tự chủ hoàn toàn trong chuyên môn.',
        5: 'Chỉ đạo và phân quyền cho người khác.',
        6: 'Có quyền quyết định chiến lược cấp khối.',
        7: 'Toàn quyền quyết định chiến lược tổ chức.',
      },
    },
    {
      code: 'INFLUENCE',
      name: 'Influence',
      nameVi: 'Mức độ ảnh hưởng',
      description: 'Tác động của cá nhân đến đồng nghiệp và đối tác.',
      levels: {
        1: 'Tương tác với người hướng dẫn.',
        2: 'Tương tác với nhóm làm việc.',
        3: 'Ảnh hưởng đến chất lượng sản phẩm của nhóm.',
        4: 'Ảnh hưởng đến quyết định kỹ thuật của nhiều nhóm.',
        5: 'Ảnh hưởng sâu rộng đến chính sách kỹ thuật.',
        6: 'Định hình chiến lược công nghệ.',
        7: 'Dẫn dắt xu thế ngành công nghệ.',
      },
    },
    {
      code: 'COMPLEXITY',
      name: 'Complexity',
      nameVi: 'Độ phức tạp',
      description: 'Tính chất và độ phi cấu trúc của bài toán.',
      levels: {
        1: 'Tác vụ đơn giản lặp lại.',
        2: 'Bài toán tiêu chuẩn.',
        3: 'Vấn đề kỹ thuật phi cấu trúc.',
        4: 'Bài toán kỹ thuật phức tạp đa chiều.',
        5: 'Thách thức kiến trúc quy mô lớn.',
        6: 'Vấn đề đột phá chiến lược.',
        7: 'Thách thức cốt lõi doanh nghiệp.',
      },
    },
    {
      code: 'BUSINESS_SKILLS',
      name: 'Business skills',
      nameVi: 'Kỹ năng kinh doanh',
      description: 'Khả năng giao tiếp và đạo đức số.',
      levels: {
        1: 'Giao tiếp rõ ràng cơ bản.',
        2: 'Trình bày giải pháp mạch lạc.',
        3: 'Giao tiếp chuyên nghiệp với bên liên quan.',
        4: 'Thuyết phục và đàm phán giải pháp kỹ thuật.',
        5: 'Tư duy chiến lược kinh doanh kết hợp công nghệ.',
        6: 'Đàm phán thương mại cấp cao.',
        7: 'Tầm nhìn kinh doanh xuất chúng.',
      },
    },
    {
      code: 'KNOWLEDGE',
      name: 'Knowledge',
      nameVi: 'Kiến thức chuyên môn',
      description: 'Phạm vi và chiều sâu tri thức.',
      levels: {
        1: 'Kiến thức nền tảng cơ bản.',
        2: 'Hiểu rõ các công cụ áp dụng thực tế.',
        3: 'Kiến thức sâu sắc về chuyên môn.',
        4: 'Chuyên gia sâu về lĩnh vực kỹ thuật.',
        5: 'Kiến thức chuyên sâu toàn diện.',
        6: 'Tri thức chuyên gia hàng đầu.',
        7: 'Tri thức đỉnh cao tầm nhìn chiến lược.',
      },
    },
  ]

  const defaultProps = {
    levels: mockLevels,
    attributes: mockAttributes,
    selectedLevel: 3,
    onSelectLevel: vi.fn(),
    onNavigateToMatrixWithLevel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reused SfiaLevelSpanStepper with all 7 level buttons and active step', () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)

    const btnL1 = screen.getByRole('button', {
      name: /Chọn Cấp độ 1 - Tuân thủ/i,
    })
    const btnL3 = screen.getByRole('button', {
      name: /Chọn Cấp độ 3 - Áp dụng độc lập/i,
    })
    const btnL7 = screen.getByRole('button', {
      name: /Chọn Cấp độ 7 - Định hình chiến lược/i,
    })

    expect(btnL1).toBeInTheDocument()
    expect(btnL3).toHaveAttribute('aria-current', 'step')
    expect(btnL1).not.toHaveAttribute('aria-current')
    expect(btnL7).toBeInTheDocument()
  })

  it('calls onSelectLevel when a different stepper button is clicked', async () => {
    const user = userEvent.setup()
    const onSelectLevel = vi.fn()
    render(
      <SfiaLevelAttributesView
        {...defaultProps}
        onSelectLevel={onSelectLevel}
      />
    )
    const btnL5 = screen.getByRole('button', {
      name: /Chọn Cấp độ 5 - Đảm bảo & Cố vấn/i,
    })
    await user.click(btnL5)
    expect(onSelectLevel).toHaveBeenCalledWith(5)
  })

  it('renders Hero Card with Vietnamese title, Blockquote essence, description, and passes axe', async () => {
    const { container } = render(
      <SfiaLevelAttributesView {...defaultProps} selectedLevel={4} />
    )
    expect(
      screen.getByText(/Cấp độ 4 — Chủ động & Tạo điều kiện/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/\(Enable\)/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /"Hướng dẫn và tạo điều kiện cho người khác hoàn thành mục tiêu."/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Tinh hoa Cấp độ 4/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Chịu trách nhiệm về mảng công việc lớn hoặc nhóm kỹ thuật nhỏ./i
      )
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders all 5 generic attribute cards with Vietnamese names and level statements', () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)
    expect(screen.getByText('Mức độ tự chủ')).toBeInTheDocument()
    expect(screen.getByText('Mức độ ảnh hưởng')).toBeInTheDocument()
    expect(screen.getByText('Độ phức tạp')).toBeInTheDocument()
    expect(screen.getByText('Kỹ năng kinh doanh')).toBeInTheDocument()
    expect(screen.getByText('Kiến thức chuyên môn')).toBeInTheDocument()

    expect(
      screen.getByText('Làm việc độc lập trong phạm vi nhiệm vụ.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ảnh hưởng đến chất lượng sản phẩm của nhóm.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Vấn đề kỹ thuật phi cấu trúc.')
    ).toBeInTheDocument()
  })

  it('opens Xuất AI Rubric Menu and copies both Markdown and JSON rubrics', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined)
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)

    const menuTrigger = screen.getByRole('button', { name: /Xuất AI Rubric/i })
    await user.click(menuTrigger)

    const markdownItem = await screen.findByRole('menuitem', {
      name: /Sao chép Markdown/i,
    })
    await user.click(markdownItem)

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledTimes(1)
      expect(writeTextSpy.mock.calls[0][0]).toContain(
        '# AI INTERVIEW EVALUATION SYSTEM PROMPT'
      )
    })

    await user.click(menuTrigger)
    const jsonItem = await screen.findByRole('menuitem', {
      name: /Sao chép JSON/i,
    })
    await user.click(jsonItem)

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledTimes(2)
      const parsed = JSON.parse(writeTextSpy.mock.calls[1][0])
      expect(parsed.framework).toBe('SFIA 9')
      expect(parsed.targetLevel).toBe(3)
    })
  })

  it('calls onNavigateToMatrixWithLevel when clicking Xem kỹ năng Cấp L4', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <SfiaLevelAttributesView
        {...defaultProps}
        selectedLevel={4}
        onNavigateToMatrixWithLevel={onNavigate}
      />
    )
    const navBtn = screen.getByRole('button', {
      name: /Xem kỹ năng Cấp L4/i,
    })
    await user.click(navBtn)
    expect(onNavigate).toHaveBeenCalledWith(4)
  })
})

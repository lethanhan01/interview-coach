import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaLevelAttributesView } from './SfiaLevelAttributesView'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from './types'

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
      description: 'Chịu trách nhiệm về mảng công việc lớn hoặc nhóm kỹ thuật nhỏ.',
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
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders all 7 level buttons on the stepper', () => {
    render(<SfiaLevelAttributesView {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Select Level 1 - Follow/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Level 3 - Apply/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Level 7 - Set strategy \/ Inspire/i })).toBeInTheDocument()
  })

  it('indicates active state on the selected level button', () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)
    const btnL3 = screen.getByRole('button', { name: /Select Level 3 - Apply/i })
    expect(btnL3).toHaveAttribute('aria-pressed', 'true')

    const btnL4 = screen.getByRole('button', { name: /Select Level 4 - Enable/i })
    expect(btnL4).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelectLevel when a different level button is clicked', () => {
    const onSelectLevel = vi.fn()
    render(<SfiaLevelAttributesView {...defaultProps} onSelectLevel={onSelectLevel} />)
    const btnL5 = screen.getByRole('button', { name: /Select Level 5 - Ensure \/ Advise/i })
    fireEvent.click(btnL5)
    expect(onSelectLevel).toHaveBeenCalledWith(5)
  })

  it('renders the Hero Card with selected level essence and description', () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={4} />)
    expect(screen.getByText(/Level 4 — Enable/i)).toBeInTheDocument()
    expect(screen.getByText(/"Hướng dẫn và tạo điều kiện cho người khác hoàn thành mục tiêu."/i)).toBeInTheDocument()
    expect(screen.getByText(/Chịu trách nhiệm về mảng công việc lớn hoặc nhóm kỹ thuật nhỏ./i)).toBeInTheDocument()
  })

  it('renders all 5 generic attribute cards with correct level statements', () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)
    expect(screen.getByText('Autonomy')).toBeInTheDocument()
    expect(screen.getByText('Influence')).toBeInTheDocument()
    expect(screen.getByText('Complexity')).toBeInTheDocument()
    expect(screen.getByText('Business skills')).toBeInTheDocument()
    expect(screen.getByText('Knowledge')).toBeInTheDocument()

    // Level 3 statements
    expect(screen.getByText('Làm việc độc lập trong phạm vi nhiệm vụ.')).toBeInTheDocument()
    expect(screen.getByText('Ảnh hưởng đến chất lượng sản phẩm của nhóm.')).toBeInTheDocument()
    expect(screen.getByText('Vấn đề kỹ thuật phi cấu trúc.')).toBeInTheDocument()
  })

  it('copies AI prompt rubric to clipboard when clicking copy button', async () => {
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={3} />)
    const copyBtn = screen.getByRole('button', { name: /Copy AI Prompt/i })
    fireEvent.click(copyBtn)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
    })
  })

  it('calls onNavigateToMatrixWithLevel when clicking view skills button', () => {
    const onNavigate = vi.fn()
    render(<SfiaLevelAttributesView {...defaultProps} selectedLevel={4} onNavigateToMatrixWithLevel={onNavigate} />)
    const navBtn = screen.getByRole('button', { name: /View Level 4 Skills/i })
    fireEvent.click(navBtn)
    expect(onNavigate).toHaveBeenCalledWith(4)
  })
})

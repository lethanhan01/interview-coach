import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import type { JdFormData } from '@/types'
import ConfirmStep from './ConfirmStep'

const FULL_JD: JdFormData = {
  company: 'FPT Software',
  website: 'https://fpt-software.com',
  position: 'Frontend Developer',
  level: 'junior',
  headcount: '2 người',
  location: 'Hà Nội',
  requirements:
    'Tốt nghiệp đại học chuyên ngành CNTT. Thành thạo React, TypeScript. Ít nhất 1 năm kinh nghiệm.',
  jobContent:
    'Xây dựng giao diện người dùng cho sản phẩm nội bộ. Phối hợp với backend và designer.',
  techStack: ['React', 'TypeScript', 'Next.js'],
  benefits: 'Bảo hiểm sức khỏe',
  salary: '15-22 triệu VNĐ',
  bonus: 'Tháng 13 (1 lần/năm)',
}

const MINIMAL_JD: JdFormData = {
  company: 'Startup XYZ',
  website: '',
  position: 'Backend Developer',
  level: 'senior',
  headcount: '',
  location: '',
  requirements:
    'Tối thiểu 3 năm kinh nghiệm backend. Thành thạo Node.js và PostgreSQL.',
  jobContent:
    'Thiết kế và xây dựng API cho nền tảng. Tối ưu hiệu năng hệ thống.',
  techStack: [],
  benefits: '',
  salary: '',
  bonus: '',
}

describe('ConfirmStep', () => {
  it('renders full JD summary, AI profile, and session config without a11y issues', async () => {
    const onetJd: JdFormData = {
      ...FULL_JD,
      onetSocCode: '15-1252.00',
      onetOccupationTitle: 'Software Developers',
      targetSfiaLevel: 2,
    }
    const { container } = render(
      <ConfirmStep
        jd={onetJd}
        sessionType="technical"
        contextPack="Western"
        duration={90}
        error={null}
      />
    )

    expect(
      screen.getByText('Hồ sơ Vị trí Tuyển dụng (AI Job Profile)')
    ).toBeInTheDocument()
    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('FPT Software')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Junior')).toBeInTheDocument()
    expect(screen.getByText('https://fpt-software.com')).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Western')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng rưỡi')).toBeInTheDocument()
    expect(screen.getByText('45 câu')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('omits empty optional fields and shows fallback when O*NET is missing', () => {
    render(
      <ConfirmStep
        jd={MINIMAL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )

    expect(screen.getByText('Tự do (chưa chuẩn hóa O*NET)')).toBeInTheDocument()
    expect(screen.queryByText('Website')).not.toBeInTheDocument()
    expect(screen.queryByText('Số lượng tuyển')).not.toBeInTheDocument()
    expect(screen.queryByText('Địa điểm')).not.toBeInTheDocument()
  })

  it('renders alert when error prop is provided', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error="Không thể tạo phiên phỏng vấn. Thử lại sau."
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Không thể tạo phiên phỏng vấn. Thử lại sau.'
    )
  })

  it('exposes SFIA levels 1 through 7 and updates targetSfiaLevel via onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="technical"
        contextPack="VN"
        duration={30}
        error={null}
        onChange={onChange}
      />
    )

    const select = screen.getByRole('textbox', {
      name: 'Cấp bậc SFIA mục tiêu',
    })
    await user.click(select)

    const level7Option = await screen.findByRole('option', {
      name: /SFIA Level 7/i,
    })
    await user.click(level7Option)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ targetSfiaLevel: 7 })
    )
  })
})

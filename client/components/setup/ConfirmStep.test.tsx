import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConfirmStep from './ConfirmStep'
import type { JdFormData } from '@/lib/setup-types'

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
  techStack: ['React', 'TypeScript', 'Tailwind CSS'],
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
  it('renders JD section title', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(screen.getByText('Thông tin JD')).toBeInTheDocument()
    expect(screen.getByText('Cấu hình phiên phỏng vấn')).toBeInTheDocument()
  })

  it('renders company name and position', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(screen.getByText('FPT Software')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
  })

  it('renders optional fields when they have values', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(screen.getByText('https://fpt-software.com')).toBeInTheDocument()
    expect(screen.getByText('2 người')).toBeInTheDocument()
    expect(screen.getByText('Hà Nội')).toBeInTheDocument()
    expect(screen.getByText('15-22 triệu VNĐ')).toBeInTheDocument()
  })

  it('does not render optional fields when empty', () => {
    render(
      <ConfirmStep
        jd={MINIMAL_JD}
        sessionType="technical"
        contextPack="Western"
        duration={60}
        error={null}
      />
    )
    expect(screen.queryByText('Website')).not.toBeInTheDocument()
    expect(screen.queryByText('Số lượng tuyển')).not.toBeInTheDocument()
    expect(screen.queryByText('Địa điểm')).not.toBeInTheDocument()
  })

  it('renders session config rows correctly', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="technical"
        contextPack="Western"
        duration={90}
        error={null}
      />
    )
    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Western')).toBeInTheDocument()
    expect(screen.getByText('1 tiếng rưỡi')).toBeInTheDocument()
    expect(screen.getByText('45 câu')).toBeInTheDocument()
  })

  it('shows error message when error prop is set', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error="Không thể tạo phiên phỏng vấn. Thử lại sau."
      />
    )
    expect(
      screen.getByText('Không thể tạo phiên phỏng vấn. Thử lại sau.')
    ).toBeInTheDocument()
  })

  it('does not show error message when error is null', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(
      screen.queryByText('Không thể tạo phiên phỏng vấn.')
    ).not.toBeInTheDocument()
  })

  it('renders level label (Junior) correctly', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="hr"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(screen.getByText('Junior')).toBeInTheDocument()
  })

  it('renders AI Job Profile section with O*NET info and tech stack', () => {
    const onetJd: JdFormData = {
      ...FULL_JD,
      onetSocCode: '15-1252.00',
      onetOccupationTitle: 'Software Developers',
      targetSfiaLevel: 2,
    }
    render(
      <ConfirmStep
        jd={onetJd}
        sessionType="technical"
        contextPack="Western"
        duration={60}
        error={null}
      />
    )
    expect(
      screen.getByText('Hồ sơ Vị trí Tuyển dụng (AI Job Profile)')
    ).toBeInTheDocument()
    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders fallback when O*NET is not linked', () => {
    render(
      <ConfirmStep
        jd={MINIMAL_JD}
        sessionType="technical"
        contextPack="VN"
        duration={30}
        error={null}
      />
    )
    expect(
      screen.getByText('Tự do (chưa chuẩn hóa O*NET)')
    ).toBeInTheDocument()
  })

  it('renders SFIA Level select when onChange is provided', () => {
    render(
      <ConfirmStep
        jd={FULL_JD}
        sessionType="technical"
        contextPack="VN"
        duration={30}
        error={null}
        onChange={() => {}}
      />
    )
    expect(
      screen.getByRole('combobox', { name: 'Cấp bậc SFIA mục tiêu' })
    ).toBeInTheDocument()
  })
})


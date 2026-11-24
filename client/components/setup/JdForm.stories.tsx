import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EMPTY_JD } from '@/lib/setup-helpers'
import type { JdFormData } from '@/types'
import JdForm from './JdForm'

const meta: Meta<typeof JdForm> = {
  title: 'Feature/Setup/JdForm',
  component: JdForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof JdForm>

function JdFormController({ initial }: Readonly<{ initial: JdFormData }>) {
  const [value, setValue] = useState<JdFormData>(initial)
  return <JdForm value={value} onChange={setValue} />
}

export const Default: Story = {
  render: () => <JdFormController initial={EMPTY_JD} />,
}

export const WithInitialData: Story = {
  render: () => (
    <JdFormController
      initial={{
        company: 'FPT Software',
        website: 'https://fpt-software.com',
        position: 'Frontend Developer',
        level: 'junior',
        headcount: '2',
        location: 'Hà Nội',
        requirements:
          'Tốt nghiệp đại học chuyên ngành CNTT. Thành thạo React, TypeScript. Ít nhất 1 năm kinh nghiệm làm việc thực tế.',
        jobContent:
          'Xây dựng và bảo trì giao diện người dùng cho hệ thống nội bộ. Phối hợp với đội backend và designer.',
        techStack: ['React', 'TypeScript', 'Next.js'],
        benefits: 'Bảo hiểm sức khỏe, 12 ngày phép năm',
        salary: '15-22 triệu VNĐ',
        bonus: 'Tháng 13 (1 lần/năm)',
      }}
    />
  ),
}

export const WithValidationHints: Story = {
  render: () => (
    <JdFormController
      initial={{
        ...EMPTY_JD,
        company: 'Shopee',
        position: 'Backend Developer',
        level: 'senior',
        requirements: 'Yêu cầu',
        jobContent: 'Công việc',
      }}
    />
  ),
}

export const WithOnetOccupation: Story = {
  render: () => (
    <JdFormController
      initial={{
        ...EMPTY_JD,
        company: 'VNG Corporation',
        position: 'Software Developers',
        level: 'middle',
        onetSocCode: '15-1252.00',
        onetOccupationTitle: 'Software Developers',
        targetSfiaLevel: 3,
        requirements:
          'Yêu cầu tối thiểu 2 năm kinh nghiệm phát triển backend bằng Node.js hoặc Go. Nắm chắc kiến trúc vi dịch vụ.',
        jobContent:
          'Tham gia thiết kế và triển khai API backend cho các sản phẩm game và payment. Tối ưu hóa hiệu năng cơ sở dữ liệu.',
        techStack: ['Node.js', 'PostgreSQL', 'Docker'],
      }}
    />
  ),
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import SavedJdPicker from './SavedJdPicker'
import type { SavedJobDescription } from '@/lib/types'

const MOCK_JDS: SavedJobDescription[] = [
  {
    id: '1',
    userId: 'user-1',
    companyName: 'FPT Software',
    companyWebsite: 'https://fpt-software.com',
    jobTitle: 'Frontend Developer',
    level: 'junior',
    headcount: '2',
    location: 'Hà Nội',
    requirements:
      'Tốt nghiệp CNTT, thành thạo React, TypeScript. Ít nhất 1 năm kinh nghiệm.',
    jobContent:
      'Phát triển UI cho các sản phẩm nội bộ, phối hợp với BE và Designer.',
    techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'],
    benefits: 'Bảo hiểm sức khỏe, 12 ngày phép',
    salary: '15-22 triệu VNĐ',
    bonus: 'Tháng 13 (1 lần/năm)',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '2',
    userId: 'user-1',
    companyName: 'Shopee Vietnam',
    companyWebsite: 'https://shopee.vn',
    jobTitle: 'Backend Developer',
    level: 'senior',
    headcount: '1',
    location: 'TP. Hồ Chí Minh',
    requirements:
      'Tối thiểu 3 năm kinh nghiệm backend, thành thạo Node.js/NestJS và PostgreSQL.',
    jobContent:
      'Thiết kế và xây dựng API cho hệ thống thương mại điện tử quy mô lớn.',
    techStack: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    benefits: null,
    salary: '30-50 triệu VNĐ',
    bonus: 'Theo KPI',
    lastUsedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    companyName: 'VNG Corporation',
    companyWebsite: null,
    jobTitle: 'AI/ML Engineer',
    level: 'middle',
    headcount: null,
    location: null,
    requirements:
      'Kinh nghiệm làm việc với các mô hình ML/DL, thành thạo Python.',
    jobContent:
      'Nghiên cứu và triển khai các mô hình AI cho sản phẩm game và nền tảng giải trí.',
    techStack: ['Python', 'PyTorch', 'TensorFlow', 'Docker', 'Kubernetes'],
    benefits: null,
    salary: null,
    bonus: null,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
]

const meta: Meta<typeof SavedJdPicker> = {
  title: 'Feature/Setup/SavedJdPicker',
  component: SavedJdPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onSelect: { action: 'selected' },
    onNew: { action: 'new clicked' },
  },
}

export default meta
type Story = StoryObj<typeof SavedJdPicker>

export const WithItems: Story = {
  args: {
    items: MOCK_JDS,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

export const SingleItem: Story = {
  args: {
    items: [MOCK_JDS[0]],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<SavedJobDescription | null>(null)
    return (
      <div>
        <SavedJdPicker
          {...args}
          onSelect={(item) => setSelected(item)}
          onNew={() => setSelected(null)}
        />
        {selected && (
          <div className="bg-success-subtle text-success-subtle-fg border-success-subtle-fg/30 mt-4 rounded-lg border p-3 text-sm">
            Đã chọn: <strong>{selected.companyName}</strong> —{' '}
            {selected.jobTitle}
          </div>
        )}
      </div>
    )
  },
  args: {
    items: MOCK_JDS,
  },
}

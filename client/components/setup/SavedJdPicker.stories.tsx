import { useState } from 'react'
import { Alert, Stack, Text } from '@mantine/core'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { SavedJobDescription } from '@/types'
import SavedJdPicker from './SavedJdPicker'

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
    techStack: ['React', 'TypeScript', 'Next.js', 'Mantine', 'Redux'],
    benefits: 'Bảo hiểm sức khỏe, 12 ngày phép',
    salary: '15-22 triệu VNĐ',
    bonus: 'Tháng 13 (1 lần/năm)',
    lastUsedAt: '2026-09-05T10:00:00.000Z',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-09-05T10:00:00.000Z',
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
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
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

function InteractiveDemo(args: React.ComponentProps<typeof SavedJdPicker>) {
  const [selected, setSelected] = useState<SavedJobDescription | null>(null)
  return (
    <Stack gap="md">
      <SavedJdPicker
        {...args}
        selectedId={selected?.id}
        onSelect={(item) => setSelected(item)}
        onNew={() => setSelected(null)}
      />
      {selected ? (
        <Alert color="success" variant="light">
          <Text size="sm">
            Đã chọn: {selected.companyName} — {selected.jobTitle}
          </Text>
        </Alert>
      ) : null}
    </Stack>
  )
}

export const Interactive: Story = {
  render: (args) => <InteractiveDemo {...args} />,
  args: {
    items: MOCK_JDS,
  },
}

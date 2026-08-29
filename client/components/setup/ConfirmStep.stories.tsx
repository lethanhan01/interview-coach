import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ConfirmStep from './ConfirmStep'
import type { JdFormData } from '@/lib/setup-types'

const MOCK_JD: JdFormData = {
  company: 'FPT Software',
  website: 'https://fpt-software.com',
  position: 'Frontend Developer',
  level: 'junior',
  headcount: '2 người',
  location: 'Hà Nội',
  requirements:
    'Tốt nghiệp đại học chuyên ngành CNTT hoặc tương đương. Thành thạo React, TypeScript. Có ít nhất 1 năm kinh nghiệm thực tế.',
  jobContent:
    'Xây dựng và bảo trì giao diện người dùng cho các sản phẩm nội bộ. Làm việc với đội backend và designer.',
  techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
  benefits: 'Bảo hiểm sức khỏe, 12 ngày phép năm',
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
    'Tối thiểu 3 năm kinh nghiệm. Thành thạo Node.js và hệ thống phân tán.',
  jobContent:
    'Thiết kế và xây dựng API cho nền tảng thương mại điện tử. Tối ưu hiệu năng hệ thống.',
  techStack: [],
  benefits: '',
  salary: '',
  bonus: '',
}

const meta: Meta<typeof ConfirmStep> = {
  title: 'Feature/Setup/ConfirmStep',
  component: ConfirmStep,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof ConfirmStep>

export const FullData: Story = {
  args: {
    jd: MOCK_JD,
    sessionType: 'hr',
    contextPack: 'VN',
    duration: 30,
    error: null,
  },
}

export const MinimalData: Story = {
  args: {
    jd: MINIMAL_JD,
    sessionType: 'technical',
    contextPack: 'Western',
    duration: 60,
    error: null,
  },
}

export const WithError: Story = {
  args: {
    jd: MOCK_JD,
    sessionType: 'hr',
    contextPack: 'VN',
    duration: 90,
    error: 'Không thể tạo phiên phỏng vấn. Vui lòng thử lại sau.',
  },
}

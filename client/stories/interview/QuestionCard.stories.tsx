import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import QuestionCard from '../../components/interview/QuestionCard'

const meta: Meta<typeof QuestionCard> = {
  title: 'Feature/Interview/QuestionCard',
  component: QuestionCard,
  tags: ['autodocs'],
  args: {
    questionText: 'Hãy kể về một lần bạn phải giải quyết mâu thuẫn trong nhóm.',
    orderIndex: 0,
    totalQuestions: 5,
  },
}

export default meta
type Story = StoryObj<typeof QuestionCard>

export const Default: Story = {}

export const WithSfiaSkill: Story = {
  args: {
    questionText:
      'Trình bày cách bạn áp dụng nguyên lý SOLID khi thiết kế một module microservice.',
    orderIndex: 1,
    totalQuestions: 6,
    skillCode: 'PROG',
    skillName: 'Phát triển Phần mềm',
    techContext: ['TypeScript', 'NestJS', 'Docker'],
  },
}

export const SkillNameOnly: Story = {
  args: {
    questionText:
      'Làm thế nào bạn thuyết phục stakeholder khi họ muốn thay đổi deadline gấp?',
    orderIndex: 2,
    totalQuestions: 6,
    skillName: 'Giao tiếp & Đàm phán',
  },
}

export const SkillCodeOnly: Story = {
  args: {
    questionText:
      'Chiến lược viết unit test và integration test của bạn cho API authentication là gì?',
    orderIndex: 3,
    totalQuestions: 6,
    skillCode: 'TEST',
  },
}

export const LongQuestionWithSkill: Story = {
  args: {
    questionText:
      'Hãy mô tả một sự cố nghiêm trọng trên production mà bạn từng tham gia điều tra và xử lý. Bạn đã áp dụng quy trình root cause analysis nào, làm sao để cô lập tác động và biện pháp nào đã được áp dụng để ngăn ngừa tái diễn?',
    orderIndex: 4,
    totalQuestions: 6,
    skillCode: 'PBMG',
    skillName: 'Quản lý Vấn đề & Sự cố',
    techContext: ['Prometheus', 'Grafana', 'Kubernetes'],
  },
}

export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    questionText:
      'Bạn tối ưu hiệu năng cơ sở dữ liệu quan hệ có quy mô hàng triệu bản ghi như thế nào?',
    orderIndex: 0,
    totalQuestions: 8,
    skillCode: 'DBDS',
    skillName: 'Thiết kế Cơ sở Dữ liệu Quan hệ',
  },
}

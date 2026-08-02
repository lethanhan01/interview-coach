import type { Meta, StoryObj } from '@storybook/react'
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

export const LongQuestion: Story = {
  args: {
    questionText:
      'Hãy mô tả một dự án phức tạp nhất mà bạn từng tham gia. Bạn đã đóng vai trò gì, những thách thức lớn nhất là gì và bạn đã vượt qua chúng như thế nào để đạt được thành công cuối cùng?',
    orderIndex: 2,
    totalQuestions: 10,
  },
}

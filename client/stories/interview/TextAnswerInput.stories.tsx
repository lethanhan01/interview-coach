import type { Meta, StoryObj } from '@storybook/react'
import TextAnswerInput from '../../components/interview/TextAnswerInput'

const meta: Meta<typeof TextAnswerInput> = {
  title: 'Feature/Interview/TextAnswerInput',
  component: TextAnswerInput,
  tags: ['autodocs'],
  args: {
    onSubmit: async (text: string) => {
      console.log('Submitted:', text)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
  },
}

export default meta
type Story = StoryObj<typeof TextAnswerInput>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const ErrorState: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      throw new Error('Đã xảy ra lỗi kết nối, vui lòng thử lại.')
    },
  },
}

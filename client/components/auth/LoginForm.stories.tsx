import type { Meta, StoryObj } from '@storybook/react'
import LoginForm from './LoginForm'

const meta: Meta<typeof LoginForm> = {
  title: 'Feature/Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  args: {
    onSubmit: async (data) => {
      console.log('Form submitted:', data)
      return new Promise((resolve) => setTimeout(resolve, 1000))
    },
  },
}

export default meta
type Story = StoryObj<typeof LoginForm>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const WithServerError: Story = {
  args: {
    serverError: 'Email hoặc mật khẩu không chính xác',
  },
}

export const AccountInactive: Story = {
  args: {
    inactiveMessage: 'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.',
  },
}

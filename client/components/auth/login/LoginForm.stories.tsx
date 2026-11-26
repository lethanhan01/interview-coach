import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Container, Paper } from '@mantine/core'
import LoginForm from './LoginForm'

const meta: Meta<typeof LoginForm> = {
  title: 'Feature/Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Container size={440} py="xl">
        <Paper withBorder shadow="sm" p="xl" radius="md">
          <Story />
        </Paper>
      </Container>
    ),
  ],
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
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
    serverError: 'Email hoặc mật khẩu không chính xác.',
  },
}

export const AccountInactive: Story = {
  args: {
    inactiveMessage:
      'Tài khoản của bạn đã bị khóa hoặc xóa. Vui lòng liên hệ quản trị viên.',
  },
}

export const SessionExpired: Story = {
  args: {
    sessionExpiredMessage:
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  },
}

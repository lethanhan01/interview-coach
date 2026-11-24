import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Container, Paper } from '@mantine/core'
import RegisterForm from './RegisterForm'

const meta: Meta<typeof RegisterForm> = {
  title: 'Feature/Auth/RegisterForm',
  component: RegisterForm,
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
type Story = StoryObj<typeof RegisterForm>

export const Default: Story = {
  args: {
    loading: false,
    serverError: null,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    serverError: null,
  },
}

export const WithServerError: Story = {
  args: {
    loading: false,
    serverError: 'Email này đã được sử dụng. Vui lòng chọn email khác.',
  },
}

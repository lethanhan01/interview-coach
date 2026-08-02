import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import RegisterForm from './RegisterForm'

const meta: Meta<typeof RegisterForm> = {
  title: 'Feature/Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
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

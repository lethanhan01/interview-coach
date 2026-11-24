import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import VoiceRecorder from '@/components/interview/voice/VoiceRecorder'

const meta: Meta<typeof VoiceRecorder> = {
  title: 'Feature/Interview/VoiceRecorder',
  component: VoiceRecorder,
  tags: ['autodocs'],
  args: {
    onSubmit: async (transcript: string, durationSeconds: number) => {
      console.log('Submitted transcript:', { transcript, durationSeconds })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    sessionId: 'session-123',
    language: 'vi',
  },
}

export default meta
type Story = StoryObj<typeof VoiceRecorder>

export const Default: Story = {}

export const WithDraft: Story = {
  args: {
    initialDraft:
      'Tôi có hơn ba năm kinh nghiệm phát triển hệ thống backend phân tán với NestJS, PostgreSQL và Redis.',
  },
}

export const EnglishLanguage: Story = {
  args: {
    language: 'en',
    initialDraft:
      'I have designed multiple microservice architectures with Docker and Kubernetes.',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

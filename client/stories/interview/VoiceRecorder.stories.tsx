import type { Meta, StoryObj } from '@storybook/react'
import VoiceRecorder from '../../components/interview/VoiceRecorder'

const meta: Meta<typeof VoiceRecorder> = {
  title: 'Feature/Interview/VoiceRecorder',
  component: VoiceRecorder,
  tags: ['autodocs'],
  args: {
    onSubmit: async (url: string, duration: number, size: number, transcript: string) => {
      console.log('Submitted:', { url, duration, size, transcript })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    onUploadAudio: async (blob: Blob) => {
      console.log('Uploading blob:', blob)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return {
        audioFileUrl: 'https://example.com/audio.webm',
        audioSizeBytes: blob.size,
        transcript: 'Đây là nội dung mô phỏng trả về từ server sau khi nhận diện giọng nói.',
        transcriptDurationSeconds: 10,
      }
    },
    sessionId: 'session-123',
  },
}

export default meta
type Story = StoryObj<typeof VoiceRecorder>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import AnnotatedTranscript from '../../components/report/AnnotatedTranscript'

const meta: Meta<typeof AnnotatedTranscript> = {
  title: 'Feature/Report/AnnotatedTranscript',
  component: AnnotatedTranscript,
  tags: ['autodocs'],
  args: {
    items: [
      {
        orderIndex: 1,
        questionText: 'Bạn hãy giới thiệu về bản thân?',
        answerText: 'Tôi là một lập trình viên có 2 năm kinh nghiệm...',
        overallScore: 85,
        modelAnswer: 'Một câu trả lời tốt nên bắt đầu bằng...',
        keyTakeaway: 'Nên tập trung vào kinh nghiệm liên quan nhất.',
        skipped: false,
        isFallback: false,
        segments: [
          {
            id: 's1',
            startIndex: 0,
            endIndex: 20,
            segmentText: 'Tôi là một lập trình viên',
            annotation: 'Giới thiệu rõ ràng',
            highlightLevel: 'good',
          }
        ]
      }
    ]
  },
}

export default meta
type Story = StoryObj<typeof AnnotatedTranscript>

export const Default: Story = {}

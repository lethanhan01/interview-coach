import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SessionMetadataCard from '@/components/report/overview/SessionMetadataCard'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'
import type { Session } from '@/types'

const mockSession: Session = {
  id: 'session-123',
  userId: 'user-1',
  sessionType: 'technical',
  contextPackId: 'VN',
  numQuestions: 5,
  jobTitle: 'Frontend Developer',
  jobDescription:
    'Tên công ty: Tech Corp\nVị trí tuyển dụng: Frontend\nTech Stack: React, TypeScript\nYêu cầu:\n- 2 năm kinh nghiệm\nNội dung công việc:\n- Code UI',
  status: 'completed',
  createdAt: '2023-10-01T10:00:00Z',
  durationMin: 30,
}

const meta: Meta<typeof SessionMetadataCard> = {
  title: 'Feature/Report/SessionMetadataCard',
  component: SessionMetadataCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      seedCatalogQuery(queryClient)
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
  args: {
    session: mockSession,
  },
}

export default meta
type Story = StoryObj<typeof SessionMetadataCard>

export const Default: Story = {}

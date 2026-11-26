import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ScoringMethodCard from '@/components/report/overview/ScoringMethodCard'
import { seedCatalogQuery } from '@/test-utils/fixtures/catalog.fixture'

const meta: Meta<typeof ScoringMethodCard> = {
  title: 'Feature/Report/ScoringMethodCard',
  component: ScoringMethodCard,
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
    contextPackId: 'VN',
    sessionType: 'hr',
  },
}

export default meta
type Story = StoryObj<typeof ScoringMethodCard>

export const Default: Story = {}

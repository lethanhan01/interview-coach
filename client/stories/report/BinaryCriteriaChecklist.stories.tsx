import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BinaryCriteriaChecklist } from '@/components/report/BinaryCriteriaChecklist'
import { mockUnifiedCriteriaQuestion1 } from '@/tests/fixtures/report.fixture'

const meta: Meta<typeof BinaryCriteriaChecklist> = {
  title: 'Feature/Report/BinaryCriteriaChecklist',
  component: BinaryCriteriaChecklist,
  tags: ['autodocs'],
  args: {
    criteria: mockUnifiedCriteriaQuestion1,
  },
}

export default meta
type Story = StoryObj<typeof BinaryCriteriaChecklist>

export const MixedResults: Story = {
  args: {
    criteria: mockUnifiedCriteriaQuestion1,
  },
}

export const AllPassed: Story = {
  args: {
    criteria: [
      {
        criteriaId: 'crit-arch-1',
        passed: true,
        evidence:
          'Ứng viên trình bày rành mạch mô hình Modular Monolith và ranh giới Bounded Context.',
        criteriaText: 'Hiểu rõ nguyên tắc phân rã module theo Domain-Driven Design',
        dimension: 'core',
      },
      {
        criteriaId: 'crit-arch-2',
        passed: true,
        evidence:
          'Ứng viên đưa ra giải pháp dùng Distributed Lock bằng Redis Redlock kết hợp Outbox Pattern.',
        criteriaText: 'Thiết kế cơ chế chống race condition và bảo toàn tính nhất quán dữ liệu',
        dimension: 'seniority',
      },
    ],
  },
}

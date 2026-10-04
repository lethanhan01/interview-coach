import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SkillsBreakdownCard } from '@/components/report/SkillsBreakdownCard'
import { mockUnifiedSkillsBreakdown } from '@/tests/fixtures/report.fixture'

const meta: Meta<typeof SkillsBreakdownCard> = {
  title: 'Feature/Report/SkillsBreakdownCard',
  component: SkillsBreakdownCard,
  tags: ['autodocs'],
  args: {
    skills: mockUnifiedSkillsBreakdown,
  },
}

export default meta
type Story = StoryObj<typeof SkillsBreakdownCard>

export const Default: Story = {
  args: {
    skills: mockUnifiedSkillsBreakdown,
  },
}

export const SingleSkillGap: Story = {
  args: {
    skills: [mockUnifiedSkillsBreakdown[1]],
  },
}

export const WithoutTechStack: Story = {
  args: {
    skills: [
      {
        skillCode: 'ETNG',
        skillName: 'Đạo đức & Tuân thủ Nghề nghiệp (Engineering Ethics)',
        techContext: [],
        targetLevel: 3,
        demonstratedLevel: 3,
        score: 85,
        status: 'passed',
        strengths: 'Có nhận thức cao về bảo mật thông tin và trách nhiệm công việc.',
        areasForImprovement: 'Rèn luyện thêm kỹ năng thương lượng trong môi trường đa văn hóa.',
      },
    ],
  },
}

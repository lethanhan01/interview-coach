import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SfiaCompetencyOverview } from '@/components/report/SfiaCompetencyOverview'
import { mockUnifiedSkillsBreakdown } from '@/tests/fixtures/report.fixture'

const meta: Meta<typeof SfiaCompetencyOverview> = {
  title: 'Feature/Report/SfiaCompetencyOverview',
  component: SfiaCompetencyOverview,
  tags: ['autodocs'],
  args: {
    skills: mockUnifiedSkillsBreakdown,
  },
}

export default meta
type Story = StoryObj<typeof SfiaCompetencyOverview>

export const Default: Story = {
  args: {
    skills: mockUnifiedSkillsBreakdown,
  },
}

export const AllPassed: Story = {
  args: {
    skills: [
      {
        skillCode: 'PROG',
        skillName: 'Phát triển Phần mềm (Software Development)',
        techContext: ['TypeScript', 'Node.js', 'PostgreSQL'],
        targetLevel: 4,
        demonstratedLevel: 5,
        score: 95,
        status: 'passed',
        strengths: 'Kiến trúc xuất sắc, làm chủ async programming.',
        areasForImprovement: 'Duy trì phong độ thiết kế hệ thống.',
      },
      {
        skillCode: 'ARCH',
        skillName: 'Thiết kế Kiến trúc Hệ thống (Solution Architecture)',
        techContext: ['Clean Architecture', 'Microservices', 'Docker'],
        targetLevel: 4,
        demonstratedLevel: 4,
        score: 88,
        status: 'passed',
        strengths: 'Hiểu sâu về bounded contexts và distributed design.',
        areasForImprovement: 'Tìm hiểu thêm về event sourcing.',
      },
    ],
  },
}

export const WithZeroLevelDemonstrated: Story = {
  args: {
    skills: [
      {
        skillCode: 'PROG',
        skillName: 'Phát triển Phần mềm (Software Development)',
        techContext: ['TypeScript'],
        targetLevel: 3,
        demonstratedLevel: 0,
        score: 0,
        status: 'gap',
        strengths: 'Chưa có dữ liệu đánh giá do câu hỏi bị bỏ qua.',
        areasForImprovement: 'Cần hoàn thành các câu hỏi phỏng vấn để đo lường năng lực.',
      },
      {
        skillCode: 'DBDS',
        skillName: 'Thiết kế Cơ sở Dữ liệu (Database Design)',
        techContext: ['PostgreSQL'],
        targetLevel: 3,
        demonstratedLevel: 3,
        score: 80,
        status: 'passed',
        strengths: 'Hiểu tốt về index và quan hệ bảng.',
        areasForImprovement: 'Củng cố kiến thức partitioning.',
      },
    ],
  },
}

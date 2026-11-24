import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { ActionPlanTimeline } from './ActionPlanTimeline'
import {
  mockUnifiedActionPlan,
  mockLegacyReport,
} from '@/test-utils/fixtures/report.fixture'

describe('ActionPlanTimeline', () => {
  it('renders null when actionPlan is empty or undefined', () => {
    const { rerender } = render(<ActionPlanTimeline />)
    expect(
      screen.queryByText('Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)')
    ).not.toBeInTheDocument()

    rerender(<ActionPlanTimeline actionPlan={{ items: [] }} />)
    expect(
      screen.queryByText('Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)')
    ).not.toBeInTheDocument()
  })

  it('renders structured action plan with priorities and topics', () => {
    render(
      <ActionPlanTimeline actionPlan={{ actionPlan: mockUnifiedActionPlan }} />
    )

    expect(
      screen.getByText('Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)')
    ).toBeInTheDocument()

    expect(screen.getByText(/~3 tuần/)).toBeInTheDocument()

    expect(screen.getByText('Ưu tiên cao')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên trung bình')).toBeInTheDocument()

    expect(screen.getByText('DBDS')).toBeInTheDocument()
    expect(screen.getByText('PROG')).toBeInTheDocument()

    expect(
      screen.getByText('Nâng cao kỹ thuật thiết kế CSDL phân tán và phân vùng')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tối ưu hóa hiệu năng bộ nhớ và I/O bất đồng bộ')
    ).toBeInTheDocument()

    expect(screen.getByText('Table Partitioning')).toBeInTheDocument()
    expect(screen.getByText('Node.js Streams & Pipelines')).toBeInTheDocument()
  })

  it('renders legacy action plan string items correctly', () => {
    render(<ActionPlanTimeline actionPlan={mockLegacyReport.actionPlan} />)

    expect(
      screen.getByText('Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Nâng cao kỹ năng giao tiếp và truyền đạt kỹ thuật')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tìm hiểu sâu hơn về kiến trúc đám mây AWS')
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ActionPlanTimeline actionPlan={{ actionPlan: mockUnifiedActionPlan }} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

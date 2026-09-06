import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActionPlanTimeline } from './ActionPlanTimeline'
import {
  mockUnifiedActionPlan,
  mockLegacyReport,
} from '@/tests/fixtures/report.fixture'

describe('ActionPlanTimeline', () => {
  it('renders null when actionPlan is empty or undefined', () => {
    const { container, rerender } = render(<ActionPlanTimeline />)
    expect(container.firstChild).toBeNull()

    rerender(<ActionPlanTimeline actionPlan={{ items: [] }} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders structured action plan with priorities and topics', () => {
    render(
      <ActionPlanTimeline
        actionPlan={{ actionPlan: mockUnifiedActionPlan }}
      />
    )

    expect(
      screen.getByText('Kế Hoạch Hành Động & Lộ Trình Ôn Tập (Action Plan)')
    ).toBeInTheDocument()

    // Total estimated weeks: 2 + 1 = 3 weeks
    expect(screen.getByText(/~3 tuần/)).toBeInTheDocument()

    // Priorities
    expect(screen.getByText('Ưu tiên cao')).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên trung bình')).toBeInTheDocument()

    // Skill Codes
    expect(screen.getByText('DBDS')).toBeInTheDocument()
    expect(screen.getByText('PROG')).toBeInTheDocument()

    // Titles
    expect(
      screen.getByText('Nâng cao kỹ thuật thiết kế CSDL phân tán và phân vùng')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tối ưu hóa hiệu năng bộ nhớ và I/O bất đồng bộ')
    ).toBeInTheDocument()

    // Topics
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
})

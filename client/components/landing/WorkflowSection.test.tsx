import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { WorkflowSection } from './WorkflowSection'

describe('WorkflowSection', () => {
  it('renders 3 workflow steps and platform highlights', () => {
    render(<WorkflowSection />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /từ job description đến báo cáo năng lực chi tiết/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Dán JD & chọn mục tiêu')).toBeInTheDocument()
    expect(screen.getByText('Phỏng vấn cùng AI Follow-up')).toBeInTheDocument()
    expect(screen.getByText('Nhận báo cáo STAR & SFIA 9')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<WorkflowSection />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

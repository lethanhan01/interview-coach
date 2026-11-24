import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import type { FeedbackProgress } from '@/types'
import FeedbackProgressPanel from './FeedbackProgressPanel'

describe('FeedbackProgressPanel', () => {
  it('renders initial checking state when progress is null', () => {
    render(<FeedbackProgressPanel progress={null} />)

    expect(
      screen.getByRole('heading', { name: 'Đang hoàn tất phiên phỏng vấn' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Đang kiểm tra tiến trình chấm điểm...').length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders active progress with completed and pending counts', () => {
    const mockProgress: FeedbackProgress = {
      sessionId: 'session-123',
      status: 'completed',
      totalQuestions: 4,
      answeredQuestions: 3,
      skippedQuestions: 1,
      feedbackRequired: 4,
      feedbackCompleted: 2,
      feedbackPending: 2,
      reportReady: false,
    }

    render(<FeedbackProgressPanel progress={mockProgress} />)

    expect(
      screen.getAllByText('Đã chấm 2/4 câu trả lời').length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Còn 2 câu đang xử lý')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders synthesizing step when all questions have been graded', () => {
    const mockProgress: FeedbackProgress = {
      sessionId: 'session-123',
      status: 'completed',
      totalQuestions: 3,
      answeredQuestions: 3,
      skippedQuestions: 0,
      feedbackRequired: 3,
      feedbackCompleted: 3,
      feedbackPending: 0,
      reportReady: true,
    }

    render(<FeedbackProgressPanel progress={mockProgress} />)

    expect(
      screen.getAllByText('Đã chấm 3/3 câu trả lời').length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Đang tổng hợp báo cáo...')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('renders timeout completing title when isTimeoutCompleting is true', () => {
    render(<FeedbackProgressPanel progress={null} isTimeoutCompleting={true} />)

    expect(
      screen.getByRole('heading', {
        name: 'Đã hết thời gian, đang hoàn tất phiên phỏng vấn',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Các câu chưa trả lời sẽ được đánh dấu bỏ qua trước khi tạo báo cáo.'
      )
    ).toBeInTheDocument()
  })

  it('renders optional back button when backHref is provided', () => {
    render(
      <FeedbackProgressPanel
        progress={null}
        backHref="/sessions"
        backLabel="Về danh sách"
      />
    )

    const backLink = screen.getByRole('link', { name: 'Về danh sách' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/sessions')
  })

  it('has no accessibility violations', async () => {
    const mockProgress: FeedbackProgress = {
      sessionId: 'session-123',
      status: 'completed',
      totalQuestions: 4,
      answeredQuestions: 3,
      skippedQuestions: 1,
      feedbackRequired: 4,
      feedbackCompleted: 2,
      feedbackPending: 2,
      reportReady: false,
    }

    const { container } = render(
      <FeedbackProgressPanel progress={mockProgress} backHref="/sessions" />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

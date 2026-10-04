import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import AnnotatedTranscript from './AnnotatedTranscript'
import {
  mockUnifiedReport,
  mockLegacyReport,
  mockSkippedTurnsReport,
} from '@/tests/fixtures/report.fixture'

describe('AnnotatedTranscript', () => {
  it('renders correctly with empty items', () => {
    const { container } = render(<AnnotatedTranscript items={[]} />)
    expect(container).toBeInTheDocument()
  })

  it('renders unified turns with BinaryCriteriaChecklist and badges', () => {
    render(<AnnotatedTranscript items={mockUnifiedReport.transcript} />)

    // Check headers, questions, scores
    expect(screen.getByText('Câu 1')).toBeInTheDocument()
    expect(screen.getByText('Câu 2')).toBeInTheDocument()
    expect(screen.getByText('75.0 / 100')).toBeInTheDocument()
    expect(screen.getByText('95.0 / 100')).toBeInTheDocument()

    // Check SFIA level badges
    expect(screen.getByText('SFIA Level 3')).toBeInTheDocument()
    expect(screen.getByText('SFIA Level 4')).toBeInTheDocument()

    // Check Pass Rate badges
    expect(screen.getByText('Đạt 50% tiêu chí')).toBeInTheDocument()
    expect(screen.getByText('Đạt 100% tiêu chí')).toBeInTheDocument()

    // Check binary criteria content rendered
    expect(screen.getAllByText('Tiêu chí thẩm định chuẩn hóa').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Hiểu và phân tích được execution plan và indexing.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Làm chủ xử lý bất đồng bộ và kiến trúc Event Loop.')
    ).toBeInTheDocument()
  })

  it('renders skipped question with standard warning banner and model answer', () => {
    render(<AnnotatedTranscript items={mockSkippedTurnsReport.transcript} />)

    // Check skipped alert banner
    expect(screen.getByText('Câu hỏi này đã bị bỏ qua')).toBeInTheDocument()
    expect(
      screen.getByText(/Ứng viên nhận 0 điểm và được đánh giá ở SFIA Level 1/i)
    ).toBeInTheDocument()

    // Question 2 should have score 0.0 / 100
    expect(screen.getByText('0.0 / 100')).toBeInTheDocument()

    // Model answer should be present in details
    expect(screen.getAllByText('Xem câu trả lời đề xuất ▸').length).toBeGreaterThan(0)
  })

  it('renders legacy turns with graceful fallback banner', () => {
    render(
      <AnnotatedTranscript
        items={mockLegacyReport.transcript}
      />
    )

    expect(
      screen.getAllByText(
        /Câu trả lời này thuộc phiên bản trước, không có dữ liệu thẩm định tiêu chí SFIA 9 & O\*NET chi tiết/i
      ).length
    ).toBeGreaterThan(0)
    expect(screen.getByText('Câu 1')).toBeInTheDocument()
  })
})

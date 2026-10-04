import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReportPage from './page'
import { sessionService } from '@/services'
import {
  mockUnifiedReport,
  mockLegacyReport,
  mockSkippedTurnsReport,
} from '@/tests/fixtures/report.fixture'
import type { Session } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useParams: () => ({ sessionId: 'test-session-123' }),
}))

vi.mock('@/services', () => ({
  sessionService: {
    getSession: vi.fn(),
    getReport: vi.fn(),
    getFeedbackProgress: vi.fn(),
    createEventSource: vi.fn(() => ({
      addEventListener: vi.fn(),
      close: vi.fn(),
      onerror: null,
    })),
  },
}))

const mockSession: Session = {
  id: 'test-session-123',
  userId: 'user-1',
  jobTitle: 'Senior Fullstack Engineer',
  sessionType: 'technical',
  contextPackId: 'VN',
  status: 'completed',
  numQuestions: 2,
  jobDescription:
    'Công ty: Tech Corp\nVị trí tuyển dụng: Senior Fullstack Engineer\nTech stack: Node.js, TypeScript',
  createdAt: '2026-09-06T10:00:00Z',
  completedAt: '2026-09-06T10:45:00Z',
}

describe('ReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sessionService.getSession).mockResolvedValue(mockSession)
    vi.mocked(sessionService.getFeedbackProgress).mockResolvedValue({
      sessionId: 'test-session-123',
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      skippedQuestions: 0,
      feedbackRequired: 2,
      feedbackCompleted: 2,
      feedbackPending: 0,
      reportReady: true,
    })
  })

  it('renders unified report with SFIA levels, recommendation badge, and skills breakdown', async () => {
    vi.mocked(sessionService.getReport).mockResolvedValue(mockUnifiedReport)

    render(<ReportPage />)

    await waitFor(() => {
      expect(screen.getByText('Báo cáo phỏng vấn')).toBeInTheDocument()
    })

    // Hero banner assertions
    expect(screen.getByText('85.0')).toBeInTheDocument()
    expect(screen.getByText('/ 100')).toBeInTheDocument()
    expect(screen.getAllByText(/SFIA Level 4/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Đạt Yêu Cầu Tuyển Dụng')).toBeInTheDocument()

    // Skills breakdown and overview assertions
    expect(screen.getAllByText(/Phát triển Phần mềm/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Thiết kế Cơ sở Dữ liệu/i).length).toBeGreaterThanOrEqual(1)

    // Action plan assertions
    expect(
      screen.getByText(/Kế Hoạch Hành Động & Lộ Trình Ôn Tập/i)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Nâng cao kỹ thuật thiết kế CSDL phân tán và phân vùng/i).length
    ).toBeGreaterThanOrEqual(2)

    // Transcript assertions
    expect(screen.getByText('Phân tích từng câu trả lời')).toBeInTheDocument()
  })

  it('renders legacy report with fallback alert and without crash', async () => {
    vi.mocked(sessionService.getReport).mockResolvedValue(mockLegacyReport)

    render(<ReportPage />)

    await waitFor(() => {
      expect(screen.getByText('Báo cáo phỏng vấn')).toBeInTheDocument()
    })

    // Score and legacy alert assertions
    expect(screen.getByText('74.0')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo phiên bản trước')).toBeInTheDocument()
    expect(
      screen.getByText(/Phiên phỏng vấn này được khởi tạo trước khi hệ thống nâng cấp khung năng lực SFIA 9 & O\*NET/i)
    ).toBeInTheDocument()
  })

  it('renders skipped report with partial banner and skipped warning', async () => {
    vi.mocked(sessionService.getReport).mockResolvedValue(mockSkippedTurnsReport)

    render(<ReportPage />)

    await waitFor(() => {
      expect(screen.getByText('Báo cáo phỏng vấn')).toBeInTheDocument()
    })

    // Partial warning
    expect(
      screen.getByText(/Một số câu trả lời không được AI chấm điểm tự động/i)
    ).toBeInTheDocument()

    // Score & recommendation
    expect(screen.getByText('48.0')).toBeInTheDocument()
    expect(screen.getByText('Chưa Đạt Chuẩn Kỳ Vọng')).toBeInTheDocument()

    // Skipped question warning inside transcript
    expect(screen.getByText('Câu hỏi này đã bị bỏ qua')).toBeInTheDocument()
  })
})

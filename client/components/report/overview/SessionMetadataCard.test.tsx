import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import SessionMetadataCard from './SessionMetadataCard'
import type { Session } from '@/types'

const mockSession: Session = {
  id: 'session-123',
  userId: 'user-1',
  sessionType: 'technical',
  contextPackId: 'VN',
  numQuestions: 5,
  jobTitle: 'Frontend Developer',
  jobDescription: '',
  status: 'completed',
  createdAt: '2023-10-01T10:00:00Z',
}

describe('SessionMetadataCard', () => {
  it('renders correctly', () => {
    const { container } = render(<SessionMetadataCard session={mockSession} />)
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
  })

  it('parses JD sections and tech stack case-insensitively', () => {
    const sessionWithJd: Session = {
      ...mockSession,
      jobDescription: [
        'Tên công ty: Acme Corp',
        'Vị trí tuyển dụng: Senior Fullstack Engineer',
        'Level yêu cầu: Senior',
        'Số lượng tuyển: 2',
        'Tech stack: React, Node.js, PostgreSQL',
        'Yêu cầu:',
        'Có ít nhất 4 năm kinh nghiệm.',
        'Nội dung công việc:',
        'Phát triển ứng dụng web hiện đại.',
      ].join('\n'),
    }

    render(<SessionMetadataCard session={sessionWithJd} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(
      screen.getByText('Có ít nhất 4 năm kinh nghiệm.')
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SessionMetadataCard session={mockSession} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

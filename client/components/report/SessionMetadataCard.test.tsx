import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import SessionMetadataCard from './SessionMetadataCard'
import type { Session } from '@/lib/types'

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

    const { getByText } = render(<SessionMetadataCard session={sessionWithJd} />)
    expect(getByText('Acme Corp')).toBeInTheDocument()
    expect(getByText('React')).toBeInTheDocument()
    expect(getByText('Node.js')).toBeInTheDocument()
    expect(getByText('PostgreSQL')).toBeInTheDocument()
    expect(getByText('Có ít nhất 4 năm kinh nghiệm.')).toBeInTheDocument()
  })
})

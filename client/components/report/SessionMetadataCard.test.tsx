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
})

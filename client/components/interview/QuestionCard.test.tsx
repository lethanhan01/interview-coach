import { fireEvent, render, screen, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mediaService } from '@/services/media.service'
import QuestionCard from './QuestionCard'

vi.mock('@/services/media.service', () => ({
  mediaService: {
    synthesizeSpeech: vi.fn(),
  },
}))

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders question text and order correctly', () => {
    render(
      <QuestionCard
        questionText="What are your strengths?"
        orderIndex={1}
        totalQuestions={4}
      />
    )

    expect(screen.getByText('What are your strengths?')).toBeInTheDocument()
    expect(screen.getByText('Câu 2 / 4')).toBeInTheDocument()
  })

  it('renders skill badge with formatted label when both skillName and skillCode provided', () => {
    render(
      <QuestionCard
        questionText="Explain polymorphism in OOP."
        orderIndex={0}
        totalQuestions={5}
        skillCode="PROG"
        skillName="Phát triển Phần mềm"
      />
    )

    expect(screen.getByText('Phát triển Phần mềm (PROG)')).toBeInTheDocument()
  })

  it('renders skill badge with skillName when only skillName provided', () => {
    render(
      <QuestionCard
        questionText="Tell me about a time you handled conflict."
        orderIndex={2}
        totalQuestions={5}
        skillName="Giao tiếp & Làm việc nhóm"
      />
    )

    expect(screen.getByText('Giao tiếp & Làm việc nhóm')).toBeInTheDocument()
  })

  it('renders skill badge with skillCode when only skillCode provided', () => {
    render(
      <QuestionCard
        questionText="How do you write unit tests?"
        orderIndex={3}
        totalQuestions={5}
        skillCode="TEST"
      />
    )

    expect(screen.getByText('TEST')).toBeInTheDocument()
  })

  it('does not render skill badge when neither skillName nor skillCode is provided', () => {
    render(
      <QuestionCard
        questionText="Introduce yourself."
        orderIndex={0}
        totalQuestions={3}
      />
    )

    expect(screen.queryByText(/PROG|TEST/)).not.toBeInTheDocument()
  })

  it('does not render tech context chips or rubric criteria (security constraint)', () => {
    render(
      <QuestionCard
        questionText="How do you optimize SQL queries?"
        orderIndex={1}
        totalQuestions={5}
        skillCode="DBDS"
        skillName="Thiết kế Cơ sở Dữ liệu"
        techContext={['PostgreSQL', 'Redis', 'Indexing']}
      />
    )

    // Security & minimalism: O*NET tech context tags and criteria MUST NOT be exposed in live room
    expect(screen.queryByText('PostgreSQL')).not.toBeInTheDocument()
    expect(screen.queryByText('Redis')).not.toBeInTheDocument()
    expect(screen.queryByText('Indexing')).not.toBeInTheDocument()
    expect(screen.queryByText(/SFIA Level/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tiêu chí/i)).not.toBeInTheDocument()
  })

  it('merges custom className correctly', () => {
    const { container } = render(
      <QuestionCard
        questionText="Custom class test"
        orderIndex={0}
        totalQuestions={1}
        className="my-custom-question-card"
      />
    )

    expect(
      container.querySelector('.my-custom-question-card')
    ).toBeInTheDocument()
  })

  it('synthesizes and plays question audio via mediaService mutation', async () => {
    const mockPlay = vi.fn().mockResolvedValue(undefined)
    const mockPause = vi.fn()
    const MockAudio = vi.fn(function (this: Record<string, unknown>) {
      this.play = mockPlay
      this.pause = mockPause
      this.onended = null
      this.onerror = null
    })
    vi.stubGlobal('Audio', MockAudio)
    vi.mocked(mediaService.synthesizeSpeech).mockResolvedValueOnce(
      'blob:tts-audio'
    )

    render(
      <QuestionCard
        questionText="Explain React Query."
        orderIndex={0}
        totalQuestions={3}
        language="en"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nghe đọc câu hỏi' }))

    await waitFor(() => {
      expect(mediaService.synthesizeSpeech).toHaveBeenCalledWith(
        'Explain React Query.',
        'en'
      )
      expect(mockPlay).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Dừng đọc câu hỏi' }))
    expect(mockPause).toHaveBeenCalledTimes(1)

    vi.unstubAllGlobals()
  })

  it('falls back to browser speechSynthesis when TTS mutation fails', async () => {
    const speak = vi.fn()
    const cancel = vi.fn()
    const MockUtterance = vi.fn(function (
      this: Record<string, unknown>,
      text: string
    ) {
      this.text = text
      this.lang = ''
      this.onend = null
      this.onerror = null
    })
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak, cancel },
      configurable: true,
      writable: true,
    })
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)
    vi.mocked(mediaService.synthesizeSpeech).mockRejectedValueOnce(
      new Error('TTS unavailable')
    )

    render(
      <QuestionCard
        questionText="Hãy giới thiệu bản thân."
        orderIndex={0}
        totalQuestions={3}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nghe đọc câu hỏi' }))

    await waitFor(() => {
      expect(speak).toHaveBeenCalledTimes(1)
    })

    vi.unstubAllGlobals()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <QuestionCard
        questionText="How do you handle microservices architecture?"
        orderIndex={0}
        totalQuestions={3}
        skillCode="ARCH"
        skillName="Kiến trúc hệ thống"
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

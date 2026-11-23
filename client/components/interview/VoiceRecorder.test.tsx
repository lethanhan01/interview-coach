import { render, screen, userEvent, waitFor } from '@test-utils'
import { expect, it, describe, vi, beforeEach } from 'vitest'
import VoiceRecorder from '../../components/interview/VoiceRecorder'
import { mediaService } from '@/services'

vi.mock('@/services', () => ({
  mediaService: {
    transcribeAudio: vi.fn(),
  },
}))

// Mock Web Speech API & Web Audio API
class MockSpeechRecognition {
  continuous = true
  interimResults = true
  lang = 'vi-VN'
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
  onstart = null
  onresult = null
  onerror = null
  onend = null
}

class MockAudioContext {
  state = 'running'
  createAnalyser() {
    return {
      fftSize: 64,
      frequencyBinCount: 32,
      getByteFrequencyData: vi.fn(),
    }
  }
  createMediaStreamSource() {
    return {
      connect: vi.fn(),
    }
  }
  close() {
    return Promise.resolve()
  }
}

const mockGetUserMedia = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  // Setup mediaDevices mock
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  })

  // Setup Web Speech API mock on window
  Object.defineProperty(window, 'SpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
  })

  // Setup AudioContext mock
  Object.defineProperty(window, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
  })
})

describe('VoiceRecorder', () => {
  it('renders initial state with start speaking button', () => {
    const mockSubmit = vi.fn()
    render(<VoiceRecorder onSubmit={mockSubmit} />)

    expect(
      screen.getByRole('button', { name: /Bắt đầu trả lời/i })
    ).toBeInTheDocument()
  })

  it('renders reviewing state directly when initialDraft is provided', () => {
    const mockSubmit = vi.fn()
    const draft = 'Đây là câu trả lời nháp từ trước hơn 10 ký tự.'
    render(<VoiceRecorder onSubmit={mockSubmit} initialDraft={draft} />)

    expect(screen.getByLabelText(/Transcript câu trả lời/i)).toHaveValue(draft)
    expect(
      screen.getByRole('button', { name: /Xác nhận & Gửi câu trả lời/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Nói lại từ đầu/i })
    ).toBeInTheDocument()
  })

  it('shows error if microphone access is denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError')
    )

    const mockSubmit = vi.fn()
    render(<VoiceRecorder onSubmit={mockSubmit} />)

    const startBtn = screen.getByRole('button', { name: /Bắt đầu trả lời/i })
    await userEvent.click(startBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Trình duyệt chưa cấp quyền microphone/i
      )
    })
  })

  it('submits transcript correctly when candidate confirms', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    const draft = 'Tôi có kinh nghiệm chuyên sâu với NestJS và React.'
    render(<VoiceRecorder onSubmit={mockSubmit} initialDraft={draft} />)

    const submitBtn = screen.getByRole('button', {
      name: /Xác nhận & Gửi câu trả lời/i,
    })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(draft, 1)
    })
  })

  it('resets draft when candidate clicks "Nói lại từ đầu"', async () => {
    const mockSubmit = vi.fn()
    const mockDraftChange = vi.fn()
    const draft = 'Câu trả lời muốn xóa để nói lại từ đầu.'
    render(
      <VoiceRecorder
        onSubmit={mockSubmit}
        initialDraft={draft}
        onDraftChange={mockDraftChange}
      />
    )

    const resetBtn = screen.getByRole('button', { name: /Nói lại từ đầu/i })
    await userEvent.click(resetBtn)

    expect(
      screen.getByRole('button', { name: /Bắt đầu trả lời/i })
    ).toBeInTheDocument()
    expect(mockDraftChange).toHaveBeenCalledWith('')
  })

  it('transcribes recorded audio via mediaService mutation and enters reviewing state', async () => {
    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true)
      mimeType = 'audio/webm;codecs=opus'
      state = 'inactive'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
        this.ondataavailable?.({
          data: new Blob(['audio-data'], { type: this.mimeType }),
        })
      }
      stop() {
        this.state = 'inactive'
        this.onstop?.()
      }
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: vi.fn() }],
    })
    vi.mocked(mediaService.transcribeAudio).mockResolvedValueOnce({
      text: 'Tôi sử dụng TanStack Query để đồng bộ server state hiệu quả.',
      language: 'vi',
      durationSeconds: 12,
      metrics: {
        wpm: 140,
        fillerWordCount: 0,
        fillerWords: [],
        pauseCount: 0,
        totalPauseDurationSeconds: 0,
        speechDurationSeconds: 12,
        confidenceScore: 0.95,
      },
    })

    render(<VoiceRecorder onSubmit={vi.fn()} language="vi" />)

    await userEvent.click(
      screen.getByRole('button', { name: /Bắt đầu trả lời/i })
    )
    await userEvent.click(
      await screen.findByRole('button', {
        name: /Dừng trả lời và xem lại transcript/i,
      })
    )

    await waitFor(() => {
      expect(mediaService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Blob),
        'vi'
      )
      expect(screen.getByLabelText(/Transcript câu trả lời/i)).toHaveValue(
        'Tôi sử dụng TanStack Query để đồng bộ server state hiệu quả.'
      )
      expect(screen.getByText('140 WPM')).toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it('shows error alert and resets to idle when transcription mutation fails without fallback', async () => {
    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true)
      mimeType = 'audio/webm;codecs=opus'
      state = 'inactive'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
      }
      stop() {
        this.state = 'inactive'
        this.onstop?.()
      }
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: vi.fn() }],
    })
    vi.mocked(mediaService.transcribeAudio).mockRejectedValueOnce(
      new Error('STT service offline')
    )

    render(<VoiceRecorder onSubmit={vi.fn()} />)

    await userEvent.click(
      screen.getByRole('button', { name: /Bắt đầu trả lời/i })
    )
    await userEvent.click(
      await screen.findByRole('button', {
        name: /Dừng trả lời và xem lại transcript/i,
      })
    )

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('STT service offline')
      expect(
        screen.getByRole('button', { name: /Bắt đầu trả lời/i })
      ).toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })
})

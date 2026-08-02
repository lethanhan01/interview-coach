import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, describe, vi, beforeEach } from 'vitest'
import VoiceRecorder from '../../components/interview/VoiceRecorder'

// Mock browser APIs
const mockGetUserMedia = vi.fn()
const mockMediaRecorder = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  
  // Setup mediaDevices mock
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true
  })
  
  // Setup MediaRecorder mock
  global.MediaRecorder = mockMediaRecorder as any
})

describe('VoiceRecorder', () => {
  it('renders initial state correctly', () => {
    const mockSubmit = vi.fn()
    const mockUpload = vi.fn()
    render(<VoiceRecorder onSubmit={mockSubmit} onUploadAudio={mockUpload} />)
    
    expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeInTheDocument()
  })

  it('shows error if microphone access is denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'))
    
    const mockSubmit = vi.fn()
    const mockUpload = vi.fn()
    render(<VoiceRecorder onSubmit={mockSubmit} onUploadAudio={mockUpload} />)
    
    const startBtn = screen.getByRole('button', { name: 'Bắt đầu ghi âm' })
    await userEvent.click(startBtn)
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Trình duyệt chưa cấp quyền microphone/i)
    })
  })

  // Full integration test involving media recorder is complex in JSDOM,
  // we mainly check UI transitions assuming the component functions work.
  // We can mock the component state to test the 'draft' view, but here we focus on the basic interaction.
})

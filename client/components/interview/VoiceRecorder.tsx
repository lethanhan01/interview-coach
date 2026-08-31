'use client'

import { useEffect, useRef, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import type { AudioUploadResult } from '@/lib/types'

interface VoiceRecorderProps {
  onSubmit: (
    audioUrl: string,
    durationSeconds: number,
    sizeBytes: number,
    transcript: string
  ) => Promise<void>
  onUploadAudio: (blob: Blob) => Promise<AudioUploadResult>
  sessionId?: string
  disabled?: boolean
}

type RecordState = 'idle' | 'recording' | 'transcribing' | 'submitting'

interface VoiceDraft {
  audioUrl: string
  durationSeconds: number

  sizeBytes: number
}

export default function VoiceRecorder({
  onSubmit,
  onUploadAudio,
  disabled,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  async function startRecording() {
    setError(null)
    setDraft(null)
    setTranscript('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()
      setState('recording')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(
          'Trình duyệt chưa cấp quyền microphone. Vui lòng cho phép và thử lại.'
        )
      } else {
        setError('Không thể khởi động microphone. Vui lòng kiểm tra thiết bị.')
      }
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    })

    setState('transcribing')
    const durationSeconds = Math.round(
      (Date.now() - startTimeRef.current) / 1000
    )
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

    try {
      const upload = await onUploadAudio(blob)
      setDraft({
        audioUrl: upload.audioFileUrl,
        durationSeconds:
          durationSeconds || upload.transcriptDurationSeconds || 0,
        sizeBytes: upload.audioSizeBytes,
      })
      setTranscript(upload.transcript)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setState('idle')
    }
  }

  async function submitTranscript() {
    if (!draft || state === 'submitting') return
    const finalTranscript = transcript.trim()
    if (finalTranscript.length < 10) {
      setError('Câu trả lời cần tối thiểu 10 ký tự.')
      return
    }

    setState('submitting')
    setError(null)
    try {
      await onSubmit(
        draft.audioUrl,
        draft.durationSeconds,
        draft.sizeBytes,
        finalTranscript
      )
      setDraft(null)
      setTranscript('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi câu trả lời')
    } finally {
      setState('idle')
    }
  }

  function resetDraft() {
    setDraft(null)
    setTranscript('')
    setError(null)
  }

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
      streamRef.current?.getTracks().forEach((t) => t.stop())
      mediaRecorderRef.current = null
      streamRef.current = null
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {draft ? (
        <div className="flex w-full flex-col gap-3">
          <label
            htmlFor="voice-transcript"
            className="text-ink text-sm font-medium"
          >
            Nội dung câu trả lời
          </label>
          <textarea
            id="voice-transcript"
            aria-label="Transcript câu trả lời"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value)
              setError(null)
            }}
            disabled={disabled || state === 'submitting'}
            rows={6}
            className="border-border text-ink placeholder:text-ink-faint focus:border-brand focus:ring-brand w-full resize-none rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetDraft}
              disabled={disabled || state === 'submitting'}
            >
              Ghi âm lại
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={submitTranscript}
              disabled={!transcript.trim() || disabled}
              loading={state === 'submitting'}
            >
              Gửi câu trả lời
            </Button>
          </div>
        </div>
      ) : (
        state === 'idle' && (
          <Button
            variant="destructive"
            size="lg"
            aria-label="Bắt đầu ghi âm"
            onClick={startRecording}
            disabled={disabled}
          >
            Bắt đầu ghi âm
          </Button>
        )
      )}
      {state === 'recording' && (
        <Button
          variant="primary"
          size="lg"
          aria-label="Dừng ghi âm"
          onClick={stopRecording}
        >
          <span
            aria-hidden="true"
            className="bg-destructive size-2 animate-pulse rounded-full"
          />
          Dừng ghi âm
        </Button>
      )}
      {state === 'transcribing' && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoadingSpinner size="sm" />
          Đang chuyển giọng nói thành văn bản...
        </div>
      )}
    </div>
  )
}

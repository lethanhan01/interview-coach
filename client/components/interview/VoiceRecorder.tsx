'use client'

import { useState, useRef } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'

interface VoiceRecorderProps {
  onSubmit: (audioUrl: string, durationSeconds: number, sizeBytes: number) => Promise<void>
  supabaseUrl: string
  accessToken: string
  disabled?: boolean
}

type RecordState = 'idle' | 'recording' | 'uploading'

export default function VoiceRecorder({ onSubmit, supabaseUrl, accessToken, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  async function startRecording() {
    setError(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start()
    mediaRecorderRef.current = recorder
    startTimeRef.current = Date.now()
    setState('recording')
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    })

    setState('uploading')
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000)
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

    try {
      const filename = `audio-${crypto.randomUUID()}.webm`
      const uploadUrl = `${supabaseUrl}/storage/v1/object/interview-audio/${filename}`
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'audio/webm' },
        body: blob,
      })
      if (!uploadRes.ok) throw new Error('Upload thất bại')
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/interview-audio/${filename}`
      await onSubmit(publicUrl, durationSeconds, blob.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setState('idle')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
      {state === 'idle' && (
        <button
          aria-label="Bắt đầu ghi âm"
          onClick={startRecording}
          disabled={disabled}
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Bắt đầu ghi âm
        </button>
      )}
      {state === 'recording' && (
        <button
          aria-label="Dừng ghi âm"
          onClick={stopRecording}
          className="flex items-center gap-2 rounded-full bg-gray-800 px-8 py-3 text-sm font-medium text-white hover:bg-black"
        >
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Dừng ghi âm
        </button>
      )}
      {state === 'uploading' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoadingSpinner size="sm" />
          Đang tải lên...
        </div>
      )}
    </div>
  )
}

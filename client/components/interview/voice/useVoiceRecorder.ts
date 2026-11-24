'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useInterval } from '@mantine/hooks'
import { useMutation } from '@tanstack/react-query'
import { mediaService } from '@/services/media.service'
import type { VoiceMetrics } from '@/types'

interface ISpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface ISpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: ISpeechRecognitionResult
  }
}

interface ISpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance

export type RecordState =
  'idle' | 'listening' | 'transcribing' | 'reviewing' | 'submitting'

export type WaveLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export const MAX_RECORDING_SECONDS = 180
export const MIN_TRANSCRIPT_LENGTH = 10

const DEFAULT_WAVE_LEVELS: WaveLevel[] = [2, 4, 6, 4, 2]

export function quantizeVolumeLevel(rawPercent: number): WaveLevel {
  const bucket = Math.round(rawPercent / 10)
  return Math.max(1, Math.min(10, bucket)) as WaveLevel
}

function checkMediaSupport(): boolean {
  if (typeof window === 'undefined') return true
  return Boolean(navigator?.mediaDevices?.getUserMedia)
}

function subscribeToFeatureSupport(): () => void {
  return () => {}
}

export interface UseVoiceRecorderOptions {
  onSubmit: (
    transcript: string,
    durationSeconds: number,
    metrics?: VoiceMetrics
  ) => Promise<void>
  onDraftChange?: (draft: string) => void
  onBusyChange?: (busy: boolean) => void
  initialDraft?: string
  language?: 'vi' | 'en'
}

export function useVoiceRecorder({
  onSubmit,
  onDraftChange,
  onBusyChange,
  initialDraft = '',
  language = 'vi',
}: UseVoiceRecorderOptions) {
  const isSupported = useSyncExternalStore(
    subscribeToFeatureSupport,
    checkMediaSupport,
    () => true
  )

  const [state, setState] = useState<RecordState>(
    initialDraft ? 'reviewing' : 'idle'
  )
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState(initialDraft)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetrics | null>(null)
  const [waveLevels, setWaveLevels] = useState<WaveLevel[]>(DEFAULT_WAVE_LEVELS)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null)
  const isListeningRef = useRef(false)
  const accumulatedTranscriptRef = useRef(initialDraft)
  const startTimeRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopListeningRef = useRef<() => void>(() => {})

  const { mutateAsync: transcribeAudio } = useMutation({
    mutationFn: ({ audioBlob, lang }: { audioBlob: Blob; lang: 'vi' | 'en' }) =>
      mediaService.transcribeAudio(audioBlob, lang),
  })

  const recordingTimer = useInterval(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setDurationSeconds(elapsed)
    if (elapsed >= MAX_RECORDING_SECONDS) {
      stopListeningRef.current()
    }
  }, 1000)

  const stopVolumeVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  const startVolumeVisualizer = useCallback((stream: MediaStream) => {
    try {
      const win = window as unknown as {
        AudioContext?: typeof AudioContext
        webkitAudioContext?: typeof AudioContext
      }
      const AudioCtx = win.AudioContext || win.webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = ctx

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVolume = () => {
        if (!isListeningRef.current) return
        analyser.getByteFrequencyData(dataArray)
        const step = Math.max(1, Math.floor(bufferLength / 5))
        const levels: WaveLevel[] = [
          quantizeVolumeLevel(Math.max(15, (dataArray[step * 0] / 255) * 100)),
          quantizeVolumeLevel(Math.max(20, (dataArray[step * 1] / 255) * 100)),
          quantizeVolumeLevel(Math.max(25, (dataArray[step * 2] / 255) * 100)),
          quantizeVolumeLevel(Math.max(20, (dataArray[step * 3] / 255) * 100)),
          quantizeVolumeLevel(Math.max(15, (dataArray[step * 4] / 255) * 100)),
        ]
        setWaveLevels(levels)
        animFrameRef.current = requestAnimationFrame(updateVolume)
      }
      updateVolume()
    } catch {
      // Fallback: keep default waveform levels
    }
  }, [])

  const processAudioTranscription = useCallback(
    async (audioBlob: Blob, elapsedSeconds: number) => {
      setState('transcribing')
      setError(null)
      try {
        const response = await transcribeAudio({ audioBlob, lang: language })
        const recognizedText = response.text?.trim() || ''
        if (!recognizedText && !accumulatedTranscriptRef.current.trim()) {
          setError(
            'Chưa ghi nhận được âm thanh hoặc giọng nói. Vui lòng thử nói to hơn hoặc kiểm tra microphone.'
          )
          setState('idle')
          return
        }
        const finalText =
          recognizedText || accumulatedTranscriptRef.current.trim()
        setTranscript(finalText)
        setVoiceMetrics(response.metrics || null)
        setDurationSeconds(response.durationSeconds || elapsedSeconds)
        onDraftChange?.(finalText)
        setState('reviewing')
      } catch (err) {
        const fallbackText = accumulatedTranscriptRef.current.trim()
        if (fallbackText) {
          setTranscript(fallbackText)
          onDraftChange?.(fallbackText)
          setState('reviewing')
          setError(
            'Không thể kết nối đến máy chủ nhận diện AI nâng cao. Đã chuyển sang văn bản nhận diện từ trình duyệt.'
          )
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể nhận diện âm thanh. Vui lòng thử lại.'
          )
          setState('idle')
        }
      }
    },
    [language, onDraftChange, transcribeAudio]
  )

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    recordingTimer.stop()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Already stopped
      }
    }
    stopVolumeVisualizer()

    const finalDuration = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    )
    setDurationSeconds(finalDuration)

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.onstop = () => {
        const mime = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mime })
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        void processAudioTranscription(audioBlob, finalDuration)
      }
      mediaRecorderRef.current.stop()
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      const finalResult = accumulatedTranscriptRef.current.trim()
      if (!finalResult) {
        setError(
          'Chưa ghi nhận được âm thanh hoặc giọng nói. Vui lòng thử nói to hơn hoặc kiểm tra microphone.'
        )
        setState('idle')
        return
      }
      setTranscript(finalResult)
      onDraftChange?.(finalResult)
      setState('reviewing')
    }
  }, [
    onDraftChange,
    processAudioTranscription,
    recordingTimer,
    stopVolumeVisualizer,
  ])

  useEffect(() => {
    stopListeningRef.current = stopListening
  }, [stopListening])

  useEffect(() => {
    onBusyChange?.(
      state === 'listening' ||
        state === 'transcribing' ||
        state === 'submitting'
    )
  }, [onBusyChange, state])

  const startListening = useCallback(async () => {
    setError(null)
    setTranscript('')
    setVoiceMetrics(null)
    accumulatedTranscriptRef.current = ''
    audioChunksRef.current = []
    onDraftChange?.('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      if (typeof MediaRecorder !== 'undefined') {
        let mimeType = 'audio/webm'
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        }
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start(250)
      }

      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor
        webkitSpeechRecognition?: SpeechRecognitionConstructor
      }
      const SpeechRecognitionClass =
        win.SpeechRecognition || win.webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = language === 'en' ? 'en-US' : 'vi-VN'
          recognition.onresult = (event) => {
            let finalSegment = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i]
              if (res.isFinal) {
                finalSegment += `${res[0].transcript} `
              }
            }
            if (finalSegment) {
              accumulatedTranscriptRef.current =
                `${accumulatedTranscriptRef.current} ${finalSegment}`.trim()
            }
          }
          recognition.onerror = (event) => {
            if (event.error === 'aborted' || event.error === 'no-speech') return
          }
          recognition.onend = () => {
            if (isListeningRef.current) {
              try {
                recognition.start()
              } catch {}
            }
          }
          recognitionRef.current = recognition
          recognition.start()
        } catch {
          // Non-critical fallback failure
        }
      }

      isListeningRef.current = true
      startVolumeVisualizer(stream)
      startTimeRef.current = Date.now()
      setDurationSeconds(0)
      recordingTimer.start()
      setState('listening')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(
          'Trình duyệt chưa cấp quyền microphone. Vui lòng kiểm tra quyền truy cập thiết bị.'
        )
      } else {
        setError(
          'Không thể khởi động microphone. Vui lòng kiểm tra thiết bị ghi âm.'
        )
      }
    }
  }, [language, onDraftChange, recordingTimer, startVolumeVisualizer])

  const submitTranscript = useCallback(async () => {
    if (state === 'submitting') return
    const finalTranscript = transcript.trim()
    if (finalTranscript.length < MIN_TRANSCRIPT_LENGTH) {
      setError(
        'Câu trả lời cần tối thiểu 10 ký tự để hệ thống có thể đánh giá.'
      )
      return
    }
    setState('submitting')
    setError(null)
    try {
      if (voiceMetrics) {
        await onSubmit(finalTranscript, durationSeconds || 1, voiceMetrics)
      } else {
        await onSubmit(finalTranscript, durationSeconds || 1)
      }
      setTranscript('')
      setVoiceMetrics(null)
      accumulatedTranscriptRef.current = ''
      onDraftChange?.('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi câu trả lời')
      setState('reviewing')
    }
  }, [
    durationSeconds,
    onDraftChange,
    onSubmit,
    state,
    transcript,
    voiceMetrics,
  ])

  const resetDraft = useCallback(() => {
    accumulatedTranscriptRef.current = ''
    audioChunksRef.current = []
    setTranscript('')
    setVoiceMetrics(null)
    setDurationSeconds(0)
    setError(null)
    onDraftChange?.('')
    setState('idle')
  }, [onDraftChange])

  const updateTranscript = useCallback(
    (next: string) => {
      setTranscript(next)
      onDraftChange?.(next)
      setError(null)
    },
    [onDraftChange]
  )

  const recordingTimerRef = useRef(recordingTimer)
  useEffect(() => {
    recordingTimerRef.current = recordingTimer
  }, [recordingTimer])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      recordingTimerRef.current.stop()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop()
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  return {
    isSupported,
    state,
    error,
    transcript,
    durationSeconds,
    voiceMetrics,
    waveLevels,
    startListening,
    stopListening,
    submitTranscript,
    resetDraft,
    updateTranscript,
  }
}

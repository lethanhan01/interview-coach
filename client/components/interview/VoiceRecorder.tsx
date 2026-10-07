'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'
import { Badge } from '../ui/Badge'
import {
  Mic,
  Square,
  RotateCcw,
  Send,
  AlertCircle,
  Volume2,
  Sparkles,
} from 'lucide-react'
import { mediaService } from '@/services/media.service'
import type { VoiceMetrics } from '@/lib/types'

// Browser Web Speech API type definitions for fallback
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

export interface VoiceRecorderProps {
  onSubmit: (
    transcript: string,
    durationSeconds: number,
    metrics?: VoiceMetrics
  ) => Promise<void>
  onDraftChange?: (draft: string) => void
  initialDraft?: string
  language?: 'vi' | 'en'
  disabled?: boolean
  sessionId?: string
}

type RecordState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'reviewing'
  | 'submitting'

const MAX_RECORDING_SECONDS = 180 // 3 minutes maximum per answer (STAR standard)

function checkMediaSupport(): boolean {
  if (typeof window === 'undefined') return true
  const hasMediaDevices = Boolean(
    navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  )
  return hasMediaDevices
}

function subscribeToFeatureSupport(): () => void {
  return () => {}
}

export default function VoiceRecorder({
  onSubmit,
  onDraftChange,
  initialDraft = '',
  language = 'vi',
  disabled,
}: VoiceRecorderProps) {
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
  const [volumeLevels, setVolumeLevels] = useState<number[]>([
    20, 35, 60, 40, 20,
  ])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null)
  const isListeningRef = useRef<boolean>(false)
  const accumulatedTranscriptRef = useRef<string>(initialDraft)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Audio waveform animation loop
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
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVolume = () => {
        if (!isListeningRef.current) return
        analyser.getByteFrequencyData(dataArray)

        // Sample 5 frequency bands for waveform animation
        const step = Math.floor(bufferLength / 5)
        const levels = [
          Math.max(15, (dataArray[step * 0] / 255) * 100),
          Math.max(20, (dataArray[step * 1] / 255) * 100),
          Math.max(25, (dataArray[step * 2] / 255) * 100),
          Math.max(20, (dataArray[step * 3] / 255) * 100),
          Math.max(15, (dataArray[step * 4] / 255) * 100),
        ]
        setVolumeLevels(levels)
        animFrameRef.current = requestAnimationFrame(updateVolume)
      }

      updateVolume()
    } catch {
      // Audio visualization fallback: keep default pulsing
    }
  }, [])

  const stopVolumeVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

  const processAudioTranscription = useCallback(
    async (audioBlob: Blob, elapsedSeconds: number) => {
      setState('transcribing')
      setError(null)

      try {
        const response = await mediaService.transcribeAudio(audioBlob, language)
        const recognizedText = response.text?.trim() || ''

        if (!recognizedText && !accumulatedTranscriptRef.current.trim()) {
          setError(
            'Chưa ghi nhận được âm thanh hoặc giọng nói. Vui lòng thử nói to hơn hoặc kiểm tra microphone.'
          )
          setState('idle')
          return
        }

        const finalText = recognizedText || accumulatedTranscriptRef.current.trim()
        setTranscript(finalText)
        setVoiceMetrics(response.metrics || null)
        setDurationSeconds(response.durationSeconds || elapsedSeconds)
        onDraftChange?.(finalText)
        setState('reviewing')
      } catch (err) {
        // Fallback to Web Speech transcript if available
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
    [language, onDraftChange]
  )

  const stopListening = useCallback(() => {
    isListeningRef.current = false

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Recognition might already be stopped
      }
    }

    stopVolumeVisualizer()

    const finalDuration = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    )
    setDurationSeconds(finalDuration)

    // Stop MediaRecorder and trigger processing
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

        processAudioTranscription(audioBlob, finalDuration)
      }

      mediaRecorderRef.current.stop()
    } else {
      // Direct fallback if MediaRecorder is not available (e.g. mock test environment)
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
  }, [stopVolumeVisualizer, processAudioTranscription, onDraftChange])

  // Start speech recording
  async function startListening() {
    setError(null)
    setTranscript('')
    setVoiceMetrics(null)
    accumulatedTranscriptRef.current = ''
    audioChunksRef.current = []
    onDraftChange?.('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Initialize MediaRecorder
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

      // Optional Web Speech API for real-time live transcript fallback
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

          recognition.onresult = (event: ISpeechRecognitionEvent) => {
            let finalSegment = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i]
              if (res.isFinal) {
                finalSegment += res[0].transcript + ' '
              }
            }
            if (finalSegment) {
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current +
                ' ' +
                finalSegment
              ).trim()
            }
          }

          recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
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
          // Non-critical if browser speech fails
        }
      }

      isListeningRef.current = true

      // Audio analysis & timer start
      startVolumeVisualizer(stream)
      startTimeRef.current = Date.now()
      setDurationSeconds(0)

      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        setDurationSeconds(elapsed)

        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopListening()
        }
      }, 1000)

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
  }

  async function submitTranscript() {
    if (state === 'submitting') return
    const finalTranscript = transcript.trim()
    if (finalTranscript.length < 10) {
      setError('Câu trả lời cần tối thiểu 10 ký tự để hệ thống có thể đánh giá.')
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
  }

  function resetDraft() {
    accumulatedTranscriptRef.current = ''
    audioChunksRef.current = []
    setTranscript('')
    setVoiceMetrics(null)
    setDurationSeconds(0)
    setError(null)
    onDraftChange?.('')
    setState('idle')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
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
      stopVolumeVisualizer()
    }
  }, [stopVolumeVisualizer])

  // Unsupported Browser Notice
  if (!isSupported) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-subtle p-6 text-center gap-3"
      >
        <AlertCircle className="size-8 text-warning-subtle-fg" aria-hidden="true" />
        <div className="space-y-1">
          <h4 className="font-semibold text-ink text-sm">
            Trình duyệt chưa hỗ trợ truy cập microphone
          </h4>
          <p className="text-ink-muted text-xs max-w-md">
            Để có trải nghiệm phỏng vấn trực tiếp bằng giọng nói, vui lòng sử
            dụng Google Chrome, Microsoft Edge hoặc Safari. Bạn cũng có thể
            chuyển sang tab <strong>Text</strong> để nhập câu trả lời.
          </p>
        </div>
      </div>
    )
  }

  const mm = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, '0')
  const ss = (durationSeconds % 60).toString().padStart(2, '0')
  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).filter(Boolean).length
    : 0
  const charCount = transcript.trim().length

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <div
          role="alert"
          className="w-full flex items-center gap-2 rounded-md bg-danger-subtle p-3 text-sm text-danger-subtle-fg"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Transcribing State: AI Pipeline Processing */}
      {state === 'transcribing' && (
        <div className="flex flex-col items-center justify-center p-8 gap-3 text-ink-muted text-sm">
          <LoadingSpinner size="md" />
          <div className="flex items-center gap-2 font-medium text-ink">
            <Sparkles className="size-4 text-brand-subtle-fg animate-pulse" />
            <span>Đang chuyển đổi giọng nói & phân tích chỉ số phát biểu...</span>
          </div>
          <span className="text-xs text-ink-muted">
            Mô hình Whisper & Silero VAD đang trích xuất WPM, ngập ngừng và từ đệm
          </span>
        </div>
      )}

      {/* Reviewing Script & Binding Confirmation State */}
      {state === 'reviewing' && (
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label
              htmlFor="voice-transcript"
              className="text-ink font-medium text-sm"
            >
              Nội dung câu trả lời (Xác nhận & Chỉnh sửa)
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tabular-nums text-xs">
                {wordCount} từ · {charCount} ký tự
              </Badge>
              {durationSeconds > 0 && (
                <Badge variant="secondary" className="tabular-nums text-xs">
                  {mm}:{ss} phát biểu
                </Badge>
              )}
              {voiceMetrics && (
                <>
                  <Badge
                    variant={
                      voiceMetrics.wpm >= 120 && voiceMetrics.wpm <= 165
                        ? 'success'
                        : 'warning'
                    }
                    className="tabular-nums text-xs"
                  >
                    {Math.round(voiceMetrics.wpm)} WPM
                  </Badge>
                  {voiceMetrics.pauseCount > 0 && (
                    <Badge variant="warning" className="tabular-nums text-xs">
                      {voiceMetrics.pauseCount} ngập ngừng (&gt;1.2s)
                    </Badge>
                  )}
                  {voiceMetrics.fillerWordCount > 0 && (
                    <Badge variant="warning" className="tabular-nums text-xs">
                      {voiceMetrics.fillerWordCount} từ đệm
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <Textarea
            id="voice-transcript"
            aria-label="Transcript câu trả lời bằng giọng nói"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value)
              onDraftChange?.(e.target.value)
              setError(null)
            }}
            disabled={disabled}
            placeholder="Nội dung đã chuyển đổi từ giọng nói của bạn..."
            rows={6}
            className="resize-none"
          />

          <p className="text-xs text-ink-muted">
            💡 <em>Mẹo:</em> Bạn có thể chỉnh sửa nhanh các thuật ngữ kỹ thuật
            nếu nhận diện chưa hoàn toàn chính xác trước khi gửi câu trả lời.
          </p>

          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetDraft}
              disabled={disabled}
            >
              <RotateCcw className="size-4 mr-1.5" aria-hidden="true" />
              Nói lại từ đầu
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={submitTranscript}
              disabled={charCount < 10 || disabled}
            >
              <Send className="size-4 mr-1.5" aria-hidden="true" />
              Xác nhận & Gửi câu trả lời
            </Button>
          </div>
        </div>
      )}

      {/* Submitting State */}
      {state === 'submitting' && (
        <div className="flex flex-col items-center justify-center p-8 gap-3 text-ink-muted text-sm">
          <LoadingSpinner size="md" />
          <span>Đang gửi câu trả lời và chuyển tiếp đến AI Coach...</span>
        </div>
      )}

      {/* Listening State with Live Waveform & Timer */}
      {state === 'listening' && (
        <div className="flex flex-col items-center gap-5 w-full py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-danger size-3 animate-ping rounded-full"
            />
            <span className="text-sm font-medium text-ink">
              Đang lắng nghe câu trả lời trực tiếp...
            </span>
          </div>

          {/* Real-time Waveform Visualizer */}
          <div
            className="flex items-center justify-center gap-1.5 h-14 px-6 rounded-xl bg-surface-subtle border border-border"
            aria-label="Biểu đồ sóng âm microphone"
          >
            <Volume2 className="size-5 text-waveform mr-2" aria-hidden="true" />
            {volumeLevels.map((lvl, idx) => (
              // Design Exception: Dynamic height for real-time audio visualizer waveform bars
              <span
                key={idx}
                style={{ height: `${Math.max(15, Math.min(100, lvl))}%` }}
                className="w-1.5 rounded-full bg-waveform transition-all duration-75"
              />
            ))}
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-2 text-ink-muted text-sm tabular-nums">
            <span>Thời gian:</span>
            <span className="font-semibold text-ink">
              {mm}:{ss}
            </span>
            <span className="text-ink-faint">/ 03:00</span>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="lg"
            aria-label="Dừng trả lời và xem lại transcript"
            onClick={stopListening}
          >
            <Square className="size-4 mr-2" aria-hidden="true" />
            Dừng trả lời & Xem transcript
          </Button>
        </div>
      )}

      {/* Idle State: Big Microphone CTA */}
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Button
            type="button"
            variant="primary"
            size="lg"
            aria-label="Bắt đầu trả lời bằng giọng nói"
            onClick={startListening}
            disabled={disabled}
            className="gap-2 shadow-sm"
          >
            <Mic className="size-5" aria-hidden="true" />
            Bắt đầu trả lời
          </Button>
          <span className="text-xs text-ink-muted">
            Nhấn để phát biểu trực tiếp qua microphone (Tối đa 3 phút)
          </span>
        </div>
      )}
    </div>
  )
}

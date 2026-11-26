import type { OutputLanguage } from './common.types'

export interface VoiceMetrics {
  wpm: number
  fillerWordCount: number
  fillerWords: string[]
  pauseCount: number
  totalPauseDurationSeconds: number
  speechDurationSeconds: number
  confidenceScore: number
}

export interface STTWordTimestamp {
  word: string
  start: number
  end: number
  probability: number
}

export interface TranscribeResponse {
  text: string
  language: string
  durationSeconds: number
  metrics: VoiceMetrics
  words?: STTWordTimestamp[]
}

export interface SynthesizeSpeechPayload {
  text: string
  language?: OutputLanguage
}

import { apiClient, API_BASE_URL } from '@/lib/api-client'
import type { TranscribeResponse } from '@/lib/types'

// Cache synthesized audio blob URLs by cache key to eliminate redundant network requests
const ttsAudioCache = new Map<string, string>()

export const mediaService = {
  /**
   * Transcribe recorded audio blob using backend STT pipeline and get speech metrics
   */
  async transcribeAudio(
    audioBlob: Blob,
    language?: 'vi' | 'en'
  ): Promise<TranscribeResponse> {
    const formData = new FormData()
    const mime = audioBlob.type || 'audio/webm'
    const ext = mime.includes('mp4') ? 'mp4' : 'webm'
    formData.append('file', audioBlob, `recorded-answer.${ext}`)

    if (language) {
      formData.append('language', language)
    }

    return apiClient.postForm<TranscribeResponse>('/media/transcribe', formData)
  },

  /**
   * Synthesize speech for question text via backend TTS pipeline.
   * Caches Blob URL in-memory by text+language.
   */
  async synthesizeSpeech(
    text: string,
    language?: 'vi' | 'en'
  ): Promise<string> {
    const cacheKey = `${language || 'vi'}:${text.trim()}`
    if (ttsAudioCache.has(cacheKey)) {
      return ttsAudioCache.get(cacheKey)!
    }

    const response = await fetch(`${API_BASE_URL}/media/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        text,
        language,
      }),
    })

    if (!response.ok) {
      throw new Error(`TTS synthesis failed with HTTP ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    ttsAudioCache.set(cacheKey, blobUrl)
    return blobUrl
  },
}

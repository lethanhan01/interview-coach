'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { mediaService } from '@/services'

export interface QuestionCardProps {
  questionText: string
  orderIndex: number
  totalQuestions: number
  skillCode?: string
  skillName?: string
  techContext?: string[]
  language?: 'vi' | 'en'
  className?: string
}

function getSkillLabel(skillName?: string, skillCode?: string): string | null {
  const trimmedName = skillName?.trim()
  const trimmedCode = skillCode?.trim()

  if (trimmedName && trimmedCode) {
    return `${trimmedName} (${trimmedCode})`
  }
  return trimmedName || trimmedCode || null
}

export default function QuestionCard({
  questionText,
  orderIndex,
  totalQuestions,
  skillCode,
  skillName,
  language = 'vi',
  className,
}: Readonly<QuestionCardProps>) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isStartingAudio, setIsStartingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { mutateAsync: synthesizeSpeech, isPending: isSynthesizing } =
    useMutation({
      mutationFn: ({ text, lang }: { text: string; lang: 'vi' | 'en' }) =>
        mediaService.synthesizeSpeech(text, lang),
    })

  const isLoading = isSynthesizing || isStartingAudio

  const skillLabel = getSkillLabel(skillName, skillCode)

  const fallbackSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(questionText)
      utterance.lang = language === 'en' ? 'en-US' : 'vi-VN'
      utterance.onend = () => {
        setIsPlaying(false)
        setIsStartingAudio(false)
      }
      utterance.onerror = () => {
        setIsPlaying(false)
        setIsStartingAudio(false)
      }
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      setIsStartingAudio(false)
    } else {
      setIsPlaying(false)
      setIsStartingAudio(false)
    }
  }

  const toggleAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsPlaying(false)
      setIsStartingAudio(false)
      return
    }

    if (isLoading) return

    setIsStartingAudio(true)
    try {
      const audioUrl = await synthesizeSpeech({
        text: questionText,
        lang: language,
      })
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        setIsStartingAudio(false)
      }
      audio.onerror = () => {
        fallbackSpeech()
      }

      await audio.play()
      setIsPlaying(true)
      setIsStartingAudio(false)
    } catch {
      fallbackSpeech()
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setIsPlaying(false)
      setIsStartingAudio(false)
    }
  }, [questionText])

  return (
    <div
      className={cn(
        'border-brand-subtle-border bg-brand-subtle shadow-card rounded-2xl border p-5',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <p className="text-brand-subtle-fg text-xs font-medium uppercase tracking-wide">
          Câu {orderIndex + 1} / {totalQuestions}
        </p>
        <div className="flex items-center gap-2">
          {skillLabel && (
            <Badge variant="brand" className="gap-1.5 font-normal">
              <Sparkles className="size-3" aria-hidden="true" />
              <span>{skillLabel}</span>
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={isPlaying ? 'Dừng đọc câu hỏi' : 'Nghe đọc câu hỏi'}
            onClick={toggleAudio}
            className="text-ink-muted hover:text-ink h-7 px-2"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <VolumeX className="text-brand size-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-3.5" aria-hidden="true" />
            )}
            <span className="ml-1 text-xs">
              {isLoading ? 'Đang tải...' : isPlaying ? 'Dừng' : 'Đọc'}
            </span>
          </Button>
        </div>
      </div>
      <p className="text-ink text-base leading-relaxed">{questionText}</p>
    </div>
  )
}

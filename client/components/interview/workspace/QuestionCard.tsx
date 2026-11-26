'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { IconSparkles, IconVolume, IconVolumeOff } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { SafeViewTransition } from '@/components/common/SafeViewTransition'
import { mediaService } from '@/services/media.service'

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
  const reduceMotion = useReducedMotion()
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
  const progressPercent =
    totalQuestions > 0
      ? Math.min(100, Math.round(((orderIndex + 1) / totalQuestions) * 100))
      : 0

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
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Progress
          value={progressPercent}
          color="brand"
          size="xs"
          radius="xl"
          transitionDuration={reduceMotion ? 0 : 200}
          aria-label="Tiến độ câu hỏi phỏng vấn"
        />

        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="xs" fw={600} c="brand" tt="uppercase">
            Câu {orderIndex + 1} / {totalQuestions}
          </Text>

          <Group gap="xs" align="center" wrap="wrap">
            {skillLabel ? (
              <Badge
                variant="light"
                color="brand"
                leftSection={
                  <IconSparkles size={12} stroke={1.5} aria-hidden="true" />
                }
              >
                {skillLabel}
              </Badge>
            ) : null}

            <Button
              type="button"
              variant="subtle"
              color={isPlaying ? 'brand' : 'neutral'}
              size="xs"
              aria-label={isPlaying ? 'Dừng đọc câu hỏi' : 'Nghe đọc câu hỏi'}
              onClick={() => void toggleAudio()}
              leftSection={
                isLoading ? (
                  <Loader size={12} aria-hidden="true" />
                ) : isPlaying ? (
                  <IconVolumeOff size={14} stroke={1.5} aria-hidden="true" />
                ) : (
                  <IconVolume size={14} stroke={1.5} aria-hidden="true" />
                )
              }
            >
              {isLoading ? 'Đang tải...' : isPlaying ? 'Dừng' : 'Đọc'}
            </Button>
          </Group>
        </Group>

        <SafeViewTransition default="none">
          <Title order={2} size="h4" fw={500} lh={1.6}>
            {questionText}
          </Title>
        </SafeViewTransition>
      </Stack>
    </Card>
  )
}

'use client'

import {
  Badge,
  Button,
  Group,
  Input,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core'
import { IconRotateClockwise, IconSend } from '@tabler/icons-react'
import type { VoiceMetrics } from '@/types'
import { MIN_TRANSCRIPT_LENGTH } from './useVoiceRecorder'

export interface VoiceTranscriptReviewProps {
  transcript: string
  durationSeconds: number
  voiceMetrics: VoiceMetrics | null
  disabled?: boolean
  onTranscriptChange: (next: string) => void
  onReset: () => void
  onSubmit: () => void
}

function formatDuration(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function VoiceTranscriptReview({
  transcript,
  durationSeconds,
  voiceMetrics,
  disabled,
  onTranscriptChange,
  onReset,
  onSubmit,
}: Readonly<VoiceTranscriptReviewProps>) {
  const trimmed = transcript.trim()
  const charCount = trimmed.length
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0

  return (
    <Stack gap="sm" w="100%">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Input.Label htmlFor="voice-transcript">
          Nội dung câu trả lời (Xác nhận &amp; Chỉnh sửa)
        </Input.Label>

        <Group gap="xs" wrap="wrap">
          <Badge variant="outline" color="neutral" size="sm">
            {wordCount} từ · {charCount} ký tự
          </Badge>

          {durationSeconds > 0 ? (
            <Badge variant="light" color="neutral" size="sm">
              {formatDuration(durationSeconds)} phát biểu
            </Badge>
          ) : null}

          {voiceMetrics ? (
            <>
              <Badge
                variant="light"
                color={
                  voiceMetrics.wpm >= 120 && voiceMetrics.wpm <= 165
                    ? 'success'
                    : 'warning'
                }
                size="sm"
              >
                {Math.round(voiceMetrics.wpm)} WPM
              </Badge>

              {voiceMetrics.pauseCount > 0 ? (
                <Tooltip
                  label={`Tổng thời gian ngập ngừng: ${voiceMetrics.totalPauseDurationSeconds.toFixed(1)}s`}
                  disabled={voiceMetrics.totalPauseDurationSeconds <= 0}
                  withArrow
                >
                  <Badge variant="light" color="warning" size="sm">
                    {voiceMetrics.pauseCount} ngập ngừng (&gt;1.2s)
                  </Badge>
                </Tooltip>
              ) : null}

              {voiceMetrics.fillerWordCount > 0 ? (
                <Tooltip
                  label={
                    voiceMetrics.fillerWords.length > 0
                      ? `Từ đệm: ${voiceMetrics.fillerWords.join(', ')}`
                      : 'Số lần dùng từ đệm'
                  }
                  withArrow
                >
                  <Badge variant="light" color="warning" size="sm">
                    {voiceMetrics.fillerWordCount} từ đệm
                  </Badge>
                </Tooltip>
              ) : null}
            </>
          ) : null}
        </Group>
      </Group>

      <Textarea
        id="voice-transcript"
        aria-label="Transcript câu trả lời bằng giọng nói"
        value={transcript}
        onChange={(e) => onTranscriptChange(e.currentTarget.value)}
        disabled={disabled}
        placeholder="Nội dung đã chuyển đổi từ giọng nói của bạn..."
        autosize
        minRows={5}
        maxRows={12}
      />

      <Text size="xs" c="dimmed">
        Mẹo: Bạn có thể chỉnh sửa nhanh các thuật ngữ kỹ thuật nếu nhận diện
        chưa hoàn toàn chính xác trước khi gửi câu trả lời.
      </Text>

      <Group justify="flex-end" gap="sm" wrap="wrap">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          leftSection={
            <IconRotateClockwise size={16} stroke={1.5} aria-hidden="true" />
          }
        >
          Nói lại từ đầu
        </Button>

        <Button
          type="button"
          color="brand"
          size="sm"
          onClick={onSubmit}
          disabled={charCount < MIN_TRANSCRIPT_LENGTH || disabled}
          leftSection={<IconSend size={16} stroke={1.5} aria-hidden="true" />}
        >
          Xác nhận &amp; Gửi câu trả lời
        </Button>
      </Group>
    </Stack>
  )
}

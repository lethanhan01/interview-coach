'use client'

import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconMicrophone,
  IconPlayerStop,
} from '@tabler/icons-react'
import type { VoiceMetrics } from '@/types'
import { MAX_RECORDING_SECONDS, useVoiceRecorder } from './useVoiceRecorder'
import VoiceTranscriptReview from './VoiceTranscriptReview'
import VoiceWaveform from './VoiceWaveform'

export interface VoiceRecorderProps {
  onSubmit: (
    transcript: string,
    durationSeconds: number,
    metrics?: VoiceMetrics
  ) => Promise<void>
  onDraftChange?: (draft: string) => void
  onBusyChange?: (busy: boolean) => void
  initialDraft?: string
  language?: 'vi' | 'en'
  disabled?: boolean
  sessionId?: string
}

function formatDuration(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function VoiceRecorder({
  onSubmit,
  onDraftChange,
  onBusyChange,
  initialDraft = '',
  language = 'vi',
  disabled = false,
}: Readonly<VoiceRecorderProps>) {
  const {
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
  } = useVoiceRecorder({
    onSubmit,
    onDraftChange,
    onBusyChange,
    initialDraft,
    language,
  })

  if (!isSupported) {
    return (
      <Paper withBorder radius="md" p="md">
        <Alert
          color="warning"
          variant="light"
          title="Không hỗ trợ microphone"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          Trình duyệt của bạn không hỗ trợ tính năng ghi âm hoặc chưa cấp quyền
          truy cập thiết bị âm thanh.
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md" align="center" w="100%">
        {error && state !== 'reviewing' && state !== 'submitting' ? (
          <Alert
            color="danger"
            variant="light"
            role="alert"
            w="100%"
            icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
          >
            {error}
          </Alert>
        ) : null}

        {state === 'idle' ? (
          <Stack align="center" gap="sm">
            <Button
              type="button"
              color="brand"
              size="md"
              onClick={startListening}
              disabled={disabled}
              leftSection={
                <IconMicrophone size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              Bắt đầu trả lời
            </Button>
            <Text size="xs" c="dimmed">
              Nhấn để bật micro và nói câu trả lời của bạn (tối đa{' '}
              {Math.floor(MAX_RECORDING_SECONDS / 60)} phút).
            </Text>
          </Stack>
        ) : null}

        {state === 'listening' ? (
          <Stack align="center" gap="md" w="100%">
            <VoiceWaveform levels={waveLevels} />

            <Group gap="xs" align="center">
              <Badge variant="light" color="neutral" size="lg">
                {formatDuration(durationSeconds)} / 03:00
              </Badge>
            </Group>

            <Button
              type="button"
              color="danger"
              variant="light"
              size="sm"
              onClick={stopListening}
              leftSection={
                <IconPlayerStop size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Dừng trả lời và xem lại transcript
            </Button>
          </Stack>
        ) : null}

        {state === 'transcribing' ? (
          <Stack align="center" gap="sm" py="md">
            <Loader color="brand" size="md" />
            <Text size="sm" c="dimmed">
              Đang chuyển đổi giọng nói thành văn bản...
            </Text>
          </Stack>
        ) : null}

        {state === 'reviewing' || state === 'submitting' ? (
          <VoiceTranscriptReview
            transcript={transcript}
            durationSeconds={durationSeconds}
            voiceMetrics={voiceMetrics}
            disabled={disabled || state === 'submitting'}
            onTranscriptChange={updateTranscript}
            onReset={resetDraft}
            onSubmit={submitTranscript}
          />
        ) : null}
      </Stack>
    </Paper>
  )
}

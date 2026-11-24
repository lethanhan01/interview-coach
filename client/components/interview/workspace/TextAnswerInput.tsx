'use client'

import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Input,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { IconAlertCircle, IconSend } from '@tabler/icons-react'

const MIN_ANSWER_LENGTH = 10

export interface TextAnswerInputProps {
  onSubmit: (text: string) => Promise<void>
  initialValue?: string
  onTextChange?: (text: string) => void
  disabled?: boolean
}

export default function TextAnswerInput({
  onSubmit,
  initialValue = '',
  onTextChange,
  disabled,
}: Readonly<TextAnswerInputProps>) {
  const [text, setText] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const charCount = trimmed.length
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
  const isTooShort = charCount < MIN_ANSWER_LENGTH

  async function handleSubmit() {
    if (isTooShort || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(trimmed)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi câu trả lời')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Input.Label htmlFor="answer-textarea">Câu trả lời của bạn</Input.Label>
        <Badge
          variant="outline"
          color={charCount >= MIN_ANSWER_LENGTH ? 'success' : 'neutral'}
          size="sm"
        >
          {wordCount} từ · {charCount} ký tự
        </Badge>
      </Group>

      <Textarea
        id="answer-textarea"
        value={text}
        onChange={(e) => {
          const next = e.currentTarget.value
          setText(next)
          onTextChange?.(next)
          setError(null)
        }}
        disabled={disabled || submitting}
        placeholder="Nhập câu trả lời của bạn (tối thiểu 10 ký tự)..."
        autosize
        minRows={6}
        maxRows={14}
      />

      {charCount > 0 && isTooShort ? (
        <Text size="xs" c="dimmed">
          Cần tối thiểu {MIN_ANSWER_LENGTH} ký tự để gửi câu trả lời (còn thiếu{' '}
          {MIN_ANSWER_LENGTH - charCount} ký tự).
        </Text>
      ) : null}

      {error ? (
        <Alert
          color="danger"
          variant="light"
          role="alert"
          icon={<IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />}
        >
          {error}
        </Alert>
      ) : null}

      <Group justify="flex-end">
        <Button
          type="button"
          color="brand"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={isTooShort || disabled || submitting}
          loading={submitting}
          leftSection={<IconSend size={16} stroke={1.5} aria-hidden="true" />}
        >
          Gửi câu trả lời
        </Button>
      </Group>
    </Stack>
  )
}

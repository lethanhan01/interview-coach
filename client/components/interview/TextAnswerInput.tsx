'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'

interface TextAnswerInputProps {
  onSubmit: (text: string) => Promise<void>
  disabled?: boolean
}

export default function TextAnswerInput({
  onSubmit,
  disabled,
}: TextAnswerInputProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(text.trim())
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi câu trả lời')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="answer-textarea" className="sr-only">
        Câu trả lời của bạn
      </Label>
      <Textarea
        id="answer-textarea"
        aria-label="Câu trả lời của bạn"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        disabled={disabled || submitting}
        placeholder="Nhập câu trả lời của bạn..."
        rows={6}
        className="resize-none"
      />
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled || submitting}
        loading={submitting}
        size="sm"
        className="self-end"
      >
        Gửi câu trả lời
      </Button>
    </div>
  )
}


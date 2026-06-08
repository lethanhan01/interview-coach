'use client'

import { useState } from 'react'
import Button from '../ui/Button'

interface TextAnswerInputProps {
  onSubmit: (text: string) => Promise<void>
  disabled?: boolean
}

export default function TextAnswerInput({ onSubmit, disabled }: TextAnswerInputProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="answer-textarea" className="sr-only">
        Câu trả lời của bạn
      </label>
      <textarea
        id="answer-textarea"
        aria-label="Câu trả lời của bạn"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled || submitting}
        placeholder="Nhập câu trả lời của bạn..."
        rows={6}
        className="w-full resize-none rounded-xl border border-border p-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none disabled:opacity-50"
      />
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

'use client'

import { useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'

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
        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-black focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled || submitting}
        className="flex items-center justify-center gap-2 self-end rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting && <LoadingSpinner size="sm" />}
        Gửi câu trả lời
      </button>
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'
import { z } from 'zod'

const draftMapSchema = z.record(z.string(), z.string())

function getStoredDrafts(sessionId: string): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(
      `interviewcoach_draft_${sessionId}`
    )
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    const result = draftMapSchema.safeParse(parsed)
    return result.success ? result.data : {}
  } catch {
    return {}
  }
}

function persistDrafts(
  sessionId: string,
  drafts: Record<string, string>
): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      `interviewcoach_draft_${sessionId}`,
      JSON.stringify(drafts)
    )
  } catch {}
}

export function useInterviewDraft(sessionId: string) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    getStoredDrafts(sessionId)
  )

  const getDraft = useCallback(
    (questionId?: string): string => {
      if (!questionId) return ''
      return drafts[questionId] ?? ''
    },
    [drafts]
  )

  const setDraft = useCallback(
    (questionId: string, value: string) => {
      setDrafts((prev) => {
        const next = { ...prev, [questionId]: value }
        persistDrafts(sessionId, next)
        return next
      })
    },
    [sessionId]
  )

  const clearQuestionDraft = useCallback(
    (questionId: string) => {
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[questionId]
        persistDrafts(sessionId, next)
        return next
      })
    },
    [sessionId]
  )

  const clearAllDrafts = useCallback(() => {
    setDrafts({})
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(`interviewcoach_draft_${sessionId}`)
      } catch {}
    }
  }, [sessionId])

  return {
    getDraft,
    setDraft,
    clearQuestionDraft,
    clearAllDrafts,
  }
}

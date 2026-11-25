'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  normalizeJdFormData,
  parseJdDraft,
} from '@/components/interview-setup/jd-step/jd-form.schema'
import { EMPTY_JD } from '@/lib/setup-helpers'
import type { JdFormData } from '@/types'

export const JD_DRAFT_KEY = 'intervia_jd_draft'

function readStoredDraft(): JdFormData {
  if (typeof window === 'undefined') return EMPTY_JD
  try {
    return parseJdDraft(window.localStorage.getItem(JD_DRAFT_KEY))
  } catch {
    return EMPTY_JD
  }
}

export function useSetupDraft() {
  const [jd, setJdState] = useState<JdFormData>(readStoredDraft)
  const [formVersion, setFormVersion] = useState(0)
  const shouldPersistRef = useRef(false)

  useEffect(() => {
    if (!shouldPersistRef.current) return
    try {
      window.localStorage.setItem(JD_DRAFT_KEY, JSON.stringify(jd))
    } catch {
      // Ignore storage quota/access errors
    }
  }, [jd])

  const updateJd = useCallback((next: JdFormData) => {
    shouldPersistRef.current = true
    setJdState(normalizeJdFormData(next))
  }, [])

  const replaceJd = useCallback((next: JdFormData) => {
    shouldPersistRef.current = true
    setJdState(normalizeJdFormData(next))
    setFormVersion((v) => v + 1)
  }, [])

  const clearDraft = useCallback(() => {
    shouldPersistRef.current = false
    setJdState(EMPTY_JD)
    setFormVersion((v) => v + 1)
    try {
      window.localStorage.removeItem(JD_DRAFT_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  return {
    jd,
    formVersion,
    updateJd,
    replaceJd,
    clearDraft,
  }
}

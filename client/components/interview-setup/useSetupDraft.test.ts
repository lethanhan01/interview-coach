import { act, renderHook, waitFor } from '@test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_JD } from '@/lib/setup-helpers'
import { JD_DRAFT_KEY, useSetupDraft } from './useSetupDraft'

describe('useSetupDraft', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts with empty JD when localStorage has no draft', () => {
    const { result } = renderHook(() => useSetupDraft())
    expect(result.current.jd).toEqual(EMPTY_JD)
  })

  it('normalizes legacy partial drafts without synchronous SFIA derivation', () => {
    window.localStorage.setItem(
      JD_DRAFT_KEY,
      JSON.stringify({
        company: 'FPT Software',
        level: 'senior',
        requirements: 'Yêu cầu test',
      })
    )

    const { result } = renderHook(() => useSetupDraft())

    expect(result.current.jd.company).toBe('FPT Software')
    expect(result.current.jd.website).toBe('')
    expect(result.current.jd.techStack).toEqual([])
    expect(result.current.jd.targetSfiaLevel).toBeUndefined()
  })

  it('preserves valid targetSfiaLevel from stored draft', () => {
    window.localStorage.setItem(
      JD_DRAFT_KEY,
      JSON.stringify({
        company: 'FPT Software',
        level: 'senior',
        targetSfiaLevel: 4,
      })
    )

    const { result } = renderHook(() => useSetupDraft())

    expect(result.current.jd.targetSfiaLevel).toBe(4)
  })

  it('falls back safely to EMPTY_JD when localStorage contains malformed JSON', () => {
    window.localStorage.setItem(JD_DRAFT_KEY, '{broken-json')
    const { result } = renderHook(() => useSetupDraft())
    expect(result.current.jd).toEqual(EMPTY_JD)
  })

  it('persists updates and clears draft from localStorage on clearDraft', async () => {
    const { result } = renderHook(() => useSetupDraft())

    act(() => {
      result.current.updateJd({ ...EMPTY_JD, company: 'VNG Corporation' })
    })

    await waitFor(() => {
      const saved = window.localStorage.getItem(JD_DRAFT_KEY)
      expect(saved).toContain('VNG Corporation')
    })

    act(() => {
      result.current.clearDraft()
    })

    expect(result.current.jd).toEqual(EMPTY_JD)
    expect(window.localStorage.getItem(JD_DRAFT_KEY)).toBeNull()
  })
})

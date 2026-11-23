import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SfiaCreateQuestionModal } from './SfiaCreateQuestionModal'
import { queryKeys } from '@/lib/query-client'
import { sfiaAdminService } from '@/services'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/services', () => ({
  sfiaAdminService: {
    createQuestion: vi.fn(),
  },
}))

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('SfiaCreateQuestionModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    skillCode: 'PROG',
    skillName: 'Programming/software development',
    minLevel: 2,
    maxLevel: 6,
    defaultLevel: 3,
    onQuestionCreated: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates minimum question length before triggering mutation', async () => {
    render(<SfiaCreateQuestionModal {...defaultProps} />)

    const textarea = screen.getByPlaceholderText(
      /Enter practical technical question scenario/i
    )
    fireEvent.change(textarea, { target: { value: 'Too short' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Question/i }))

    expect(
      await screen.findByText(
        'Interview question content must be at least 15 characters.'
      )
    ).toBeInTheDocument()
    expect(sfiaAdminService.createQuestion).not.toHaveBeenCalled()
  })

  it('creates question via mutation and selectively invalidates dynamic SFIA queries only', async () => {
    const queryClient = createTestClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const createdQuestion = {
      id: 'q-new-1',
      questionText: 'How do you design an idempotent retry queue in Node.js?',
      type: 'TECHNICAL' as const,
      difficulty: 'MEDIUM' as const,
      targetSfiaLevel: 3,
    }
    vi.mocked(sfiaAdminService.createQuestion).mockResolvedValueOnce(
      createdQuestion
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SfiaCreateQuestionModal {...defaultProps} />
      </QueryClientProvider>
    )

    const textarea = screen.getByPlaceholderText(
      /Enter practical technical question scenario/i
    )
    fireEvent.change(textarea, {
      target: { value: createdQuestion.questionText },
    })
    fireEvent.click(screen.getByRole('button', { name: /Create Question/i }))

    await waitFor(() => {
      expect(sfiaAdminService.createQuestion).toHaveBeenCalledWith('PROG', {
        questionText: createdQuestion.questionText,
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      })
      expect(defaultProps.onQuestionCreated).toHaveBeenCalledWith(
        createdQuestion
      )
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: queryKeys.sfiaAdmin.all,
        predicate: expect.any(Function),
      })
    )

    const invalidationArg = invalidateSpy.mock.calls[0]?.[0]
    const predicate = invalidationArg?.predicate as
      ((q: { queryKey: readonly unknown[] }) => boolean) | undefined
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.categories() })).toBe(
      false
    )
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.subcategories() })).toBe(
      false
    )
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.levels() })).toBe(false)
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.attributes() })).toBe(
      false
    )
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.skills() })).toBe(true)
    expect(
      predicate?.({ queryKey: queryKeys.sfiaAdmin.skillDetail('PROG') })
    ).toBe(true)
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.matrix() })).toBe(true)
    expect(predicate?.({ queryKey: queryKeys.sfiaAdmin.coverage() })).toBe(true)
  })

  it('displays inline error and keeps modal open when mutation fails', async () => {
    vi.mocked(sfiaAdminService.createQuestion).mockRejectedValueOnce(
      new Error('Duplicate question detected')
    )

    render(<SfiaCreateQuestionModal {...defaultProps} />)

    const textarea = screen.getByPlaceholderText(
      /Enter practical technical question scenario/i
    )
    fireEvent.change(textarea, {
      target: {
        value: 'Describe how to prevent race conditions in PostgreSQL.',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /Create Question/i }))

    expect(
      await screen.findByText('Duplicate question detected')
    ).toBeInTheDocument()
    expect(defaultProps.onQuestionCreated).not.toHaveBeenCalled()
    expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false)
  })
})

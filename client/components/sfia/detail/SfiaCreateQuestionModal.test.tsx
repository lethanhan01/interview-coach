import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent, waitFor } from '@test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'jest-axe'
import { notifications } from '@mantine/notifications'
import { SfiaCreateQuestionModal } from './SfiaCreateQuestionModal'
import { queryKeys } from '@/queries/keys'
import { sfiaAdminService } from '@/services/sfia-admin.service'

vi.mock('@/services/sfia-admin.service', () => ({
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
    const user = userEvent.setup()
    render(<SfiaCreateQuestionModal {...defaultProps} />)

    const textarea = screen.getByPlaceholderText(
      /Nhập nội dung câu hỏi phỏng vấn chi tiết/i
    )
    await user.type(textarea, 'Too short')
    await user.click(screen.getByRole('button', { name: /Tạo câu hỏi/i }))

    expect(
      await screen.findByText('Nội dung câu hỏi cần tối thiểu 15 ký tự.')
    ).toBeInTheDocument()
    expect(sfiaAdminService.createQuestion).not.toHaveBeenCalled()
  })

  it('creates question via mutation and selectively invalidates dynamic SFIA queries only', async () => {
    const user = userEvent.setup()
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

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SfiaCreateQuestionModal {...defaultProps} />
      </QueryClientProvider>
    )

    const textarea = screen.getByPlaceholderText(
      /Nhập nội dung câu hỏi phỏng vấn chi tiết/i
    )
    await user.type(textarea, createdQuestion.questionText)
    await user.click(screen.getByRole('button', { name: /Tạo câu hỏi/i }))

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

    notifications.clean()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('displays inline error and keeps modal open when mutation fails', async () => {
    const user = userEvent.setup()
    vi.mocked(sfiaAdminService.createQuestion).mockRejectedValueOnce(
      new Error('Duplicate question detected')
    )

    render(<SfiaCreateQuestionModal {...defaultProps} />)

    const textarea = screen.getByPlaceholderText(
      /Nhập nội dung câu hỏi phỏng vấn chi tiết/i
    )
    await user.type(
      textarea,
      'Describe how to prevent race conditions in PostgreSQL.'
    )
    await user.click(screen.getByRole('button', { name: /Tạo câu hỏi/i }))

    expect(
      await screen.findByText('Duplicate question detected')
    ).toBeInTheDocument()
    expect(defaultProps.onQuestionCreated).not.toHaveBeenCalled()
    expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('updates live character counter via form.watch as user types', async () => {
    const user = userEvent.setup()
    render(<SfiaCreateQuestionModal {...defaultProps} />)

    expect(screen.getByText('0 / 500')).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(
      /Nhập nội dung câu hỏi phỏng vấn chi tiết/i
    )
    await user.type(textarea, 'Explain ACID properties')

    expect(screen.getByText('23 / 500')).toBeInTheDocument()
  })
})

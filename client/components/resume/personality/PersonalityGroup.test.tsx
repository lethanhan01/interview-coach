import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import PersonalityGroup from './PersonalityGroup'

describe('PersonalityGroup', () => {
  it('renders empty state and existing personality label cleanly', async () => {
    const { container, rerender } = render(
      <PersonalityGroup data={{}} onSave={vi.fn()} />
    )
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    rerender(
      <PersonalityGroup data={{ personality: 'analytical' }} onSave={vi.fn()} />
    )
    expect(screen.getByText('Phân tích (Analytical)')).toBeInTheDocument()
  })

  it('allows selecting a single personality card and saving to API', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDirtyChange = vi.fn()

    const { container } = render(
      <PersonalityGroup
        data={{ personality: 'introvert' }}
        onSave={onSave}
        onDirtyChange={onDirtyChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByText('Lãnh đạo (Leader)'))
    expect(onDirtyChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ personality: 'leader' })
    })
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })
})

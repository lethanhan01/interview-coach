import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import PersonalityGroup from './PersonalityGroup'

describe('PersonalityGroup', () => {
  it('renders empty state and existing personality text cleanly', async () => {
    const { container, rerender } = render(
      <PersonalityGroup data={{}} onSave={vi.fn()} />
    )
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    rerender(
      <PersonalityGroup
        data={{ personality: 'Chủ động, thích phân tích hệ thống' }}
        onSave={vi.fn()}
      />
    )
    expect(
      screen.getByText('Chủ động, thích phân tích hệ thống')
    ).toBeInTheDocument()
  }, 15_000)

  it('allows editing free-text personality and saving to API', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDirtyChange = vi.fn()

    const { container } = render(
      <PersonalityGroup
        data={{ personality: 'Hướng nội' }}
        onSave={onSave}
        onDirtyChange={onDirtyChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(await axe(container)).toHaveNoViolations()

    const textarea = screen.getByLabelText(
      'Mô tả tính cách & phong cách làm việc'
    )
    await user.clear(textarea)
    await user.type(textarea, 'Chủ động và phối hợp nhóm tốt')
    expect(onDirtyChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        personality: 'Chủ động và phối hợp nhóm tốt',
      })
    })
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  }, 15_000)

  it('allows clearing personality text and saving null', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <PersonalityGroup data={{ personality: 'Phân tích' }} onSave={onSave} />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    await user.click(screen.getByRole('button', { name: 'Xóa nội dung' }))
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ personality: null })
    })
  })
})

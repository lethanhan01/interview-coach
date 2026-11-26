import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, userEvent, waitFor } from '@test-utils'
import { ApiClientError } from '@/lib/api-client'
import PersonalInfoGroup from './PersonalInfoGroup'

describe('PersonalInfoGroup', () => {
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders view mode, toggles edit mode, and passes a11y checks', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PersonalInfoGroup
        data={{ firstname: 'An', lastname: 'Nguyễn' }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Nguyễn An')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    expect(screen.getByLabelText(/Họ/i)).toHaveValue('Nguyễn')
    expect(screen.getByLabelText(/Tên/i)).toHaveValue('An')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('blocks whitespace-only input and resets cleanly on cancel', async () => {
    const user = userEvent.setup()
    render(
      <PersonalInfoGroup
        data={{ firstname: 'An', lastname: 'Nguyễn' }}
        onSave={mockOnSave}
      />
    )

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    const firstnameInput = screen.getByLabelText(/Tên/i)
    await user.clear(firstnameInput)
    await user.type(firstnameInput, '   ')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(
      await screen.findByText('Tên không được để trống')
    ).toBeInTheDocument()
    expect(mockOnSave).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByLabelText(/Tên/i)).not.toBeInTheDocument()
    expect(screen.getByText('Nguyễn An')).toBeInTheDocument()
  })

  it('trims values, calls onSave, and closes edit mode on success', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <PersonalInfoGroup
        data={{ firstname: 'An', lastname: 'Nguyễn' }}
        onSave={mockOnSave}
      />
    )

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    const lastnameInput = screen.getByLabelText(/Họ/i)
    const firstnameInput = screen.getByLabelText(/Tên/i)
    await user.clear(lastnameInput)
    await user.type(lastnameInput, '  Lê Thành  ')
    await user.clear(firstnameInput)
    await user.type(firstnameInput, '  An  ')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        lastname: 'Lê Thành',
        firstname: 'An',
      })
    })
    expect(screen.queryByLabelText(/Tên/i)).not.toBeInTheDocument()
  })

  it('displays server and field errors when onSave rejects', async () => {
    const user = userEvent.setup()
    mockOnSave.mockRejectedValueOnce(
      new ApiClientError('Không thể lưu hồ sơ', 400, 'VALIDATION_ERROR', {
        firstname: ['Tên không hợp lệ'],
      })
    )

    render(
      <PersonalInfoGroup
        data={{ firstname: 'An', lastname: 'Nguyễn' }}
        onSave={mockOnSave}
      />
    )

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa/i }))
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Không thể lưu hồ sơ')).toBeInTheDocument()
    expect(await screen.findByText('Tên không hợp lệ')).toBeInTheDocument()
  })
})

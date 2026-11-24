import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import EducationGroup from './EducationGroup'

describe('EducationGroup', () => {
  it('renders timeline view when education exists and passes jest-axe', async () => {
    const { container } = render(
      <EducationGroup
        data={{
          degree: 'engineer',
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Khoa học máy tính',
          gpa: '3.6 / 4.0',
          graduationYear: '2025',
        }}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('Đại học Bách Khoa Hà Nội')).toBeInTheDocument()
    expect(
      screen.getByText(/Đại học \(Kỹ sư\) · Khoa học máy tính/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Tốt nghiệp: 2025')).toBeInTheDocument()
    expect(screen.getByText('GPA: 3.6 / 4.0')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('validates graduationYear with Zod and saves valid education', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<EducationGroup data={null} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(await axe(container)).toHaveNoViolations()

    await user.type(screen.getByLabelText('Trường'), 'ĐH Công nghệ')
    await user.type(screen.getByLabelText('Năm tốt nghiệp'), '99')
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    expect(
      await screen.findByText(/Năm tốt nghiệp gồm 4 chữ số hợp lệ/i)
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    const yearInput = screen.getByLabelText('Năm tốt nghiệp')
    await user.clear(yearInput)
    await user.type(yearInput, '2026')
    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          school: 'ĐH Công nghệ',
          graduationYear: '2026',
        })
      )
    })
  })
})

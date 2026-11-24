import { render, screen, userEvent, waitFor, within } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import CertificationsGroup from './CertificationsGroup'

describe('CertificationsGroup', () => {
  it('renders 3 tabs for professional, language, and awards and passes jest-axe', async () => {
    const { container } = render(
      <CertificationsGroup
        data={{
          certifications: [
            {
              id: 'c1',
              type: 'professional',
              name: 'AWS SAA',
              issuer: 'Amazon',
              issueDate: '2025-02-10',
            },
            {
              id: 'c2',
              type: 'language',
              name: 'IELTS',
              issuer: 'British Council',
              issueDate: '2024-05-01',
              score: '7.5',
            },
          ],
          awards: [
            {
              id: 'a1',
              name: 'Best Capstone',
              organization: 'HUST',
              date: '2025-06-20',
              description: 'Giải xuất sắc',
            },
          ],
        }}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('AWS SAA')).toBeInTheDocument()
    expect(screen.getByText('10/02/2025')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /Ngoại ngữ \(1\)/i }))
    expect(screen.getByText('IELTS')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Giải thưởng \(1\)/i }))
    expect(screen.getByText('Best Capstone')).toBeInTheDocument()
    expect(screen.getByText('HUST · 20/06/2025')).toBeInTheDocument()
  })

  it('adds a certification via modal and confirms before deleting', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <CertificationsGroup
        data={{
          certifications: [
            {
              id: 'c1',
              type: 'professional',
              name: 'AWS SAA',
              issuer: 'Amazon',
              issueDate: '2025-02-10',
            },
          ],
          awards: [],
        }}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('button', { name: /Thêm chứng chỉ/i }))
    const dialog = await screen.findByRole('dialog')

    await user.type(
      within(dialog).getByLabelText(/Tên chứng chỉ/i),
      'CKA Kubernetes'
    )
    await user.type(within(dialog).getByLabelText(/Đơn vị cấp/i), 'CNCF')
    await user.click(
      within(dialog).getByRole('button', { name: 'Thêm chứng chỉ' })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          certifications: expect.arrayContaining([
            expect.objectContaining({
              name: 'CKA Kubernetes',
              issuer: 'CNCF',
              type: 'professional',
            }),
          ]),
        })
      )
    })

    await user.click(
      screen.getByRole('button', { name: 'Xóa chứng chỉ AWS SAA' })
    )
    const confirmDialog = await within(document.body).findByRole('dialog')
    await user.click(within(confirmDialog).getByRole('button', { name: 'Xóa' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenLastCalledWith({
        certifications: [],
        awards: [],
      })
    })
  })
})

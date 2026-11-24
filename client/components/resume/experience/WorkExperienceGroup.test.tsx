import { render, screen, userEvent, waitFor, within } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import type { WorkExperienceEntry } from '@/types'
import WorkExperienceGroup from './WorkExperienceGroup'

const SAMPLE_ENTRY: WorkExperienceEntry = {
  id: 'we-1',
  company: 'FPT Software',
  position: 'Frontend Developer',
  startDate: '2023-03-01',
  endDate: '2024-11',
  isCurrent: false,
  description: 'Xây dựng ứng dụng web bằng React và Mantine.',
  techStack: ['React', 'TypeScript'],
}

describe('WorkExperienceGroup', () => {
  it('renders timeline with formatted dates compatible with legacy YYYY-MM-DD and YYYY-MM', async () => {
    const { container } = render(
      <WorkExperienceGroup
        data={[SAMPLE_ENTRY]}
        availableTechs={[]}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('FPT Software')).toBeInTheDocument()
    expect(screen.getByText('03/2023 → 11/2024')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('edits an entry via modal and saves normalized YYYY-MM payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <WorkExperienceGroup
        data={[SAMPLE_ENTRY]}
        availableTechs={[
          { id: 't1', category: 'framework', name: 'Next.js', usagePeriod: 12 },
        ]}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Chỉnh sửa kinh nghiệm tại FPT Software',
      })
    )

    const dialog = await screen.findByRole('dialog')
    const positionInput = within(dialog).getByLabelText(/Vị trí/i)
    await user.clear(positionInput)
    await user.type(positionInput, 'Senior Frontend Developer')

    await user.click(
      within(dialog).getByRole('button', { name: 'Lưu thay đổi' })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'we-1',
          company: 'FPT Software',
          position: 'Senior Frontend Developer',
          startDate: '2023-03',
          endDate: '2024-11',
        }),
      ])
    })
  })

  it('asks confirmation via modals.openConfirmModal before deleting an entry', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <WorkExperienceGroup
        data={[SAMPLE_ENTRY]}
        availableTechs={[]}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Xóa kinh nghiệm tại FPT Software',
      })
    )

    const confirmDialog = await within(document.body).findByRole('dialog')
    expect(confirmDialog).toHaveTextContent('Xóa kinh nghiệm làm việc')

    await user.click(within(confirmDialog).getByRole('button', { name: 'Xóa' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([])
    })
  })
})

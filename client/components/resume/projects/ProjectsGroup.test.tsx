import { render, screen, userEvent, waitFor, within } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import type { ProjectEntry } from '@/types'
import ProjectsGroup from './ProjectsGroup'

const SAMPLE_PROJECT: ProjectEntry = {
  id: 'proj-1',
  name: 'InterviewCoach',
  description: 'Nền tảng luyện phỏng vấn AI.',
  techStack: ['Next.js', 'Mantine'],
  url: 'https://github.com/example/interview-coach',
  startDate: '2025-01',
  endDate: '',
  isCurrent: true,
}

describe('ProjectsGroup', () => {
  it('renders project cards with external anchor link and passes jest-axe', async () => {
    const { container } = render(
      <ProjectsGroup
        data={[SAMPLE_PROJECT]}
        availableTechs={[]}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('InterviewCoach')).toBeInTheDocument()
    expect(screen.getByText('01/2025 → Hiện tại')).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'https://github.com/example/interview-coach',
      })
    ).toHaveAttribute('href', 'https://github.com/example/interview-coach')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('validates invalid URL in modal and creates valid project', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(<ProjectsGroup data={[]} availableTechs={[]} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /Thêm dự án/i }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText(/Tên dự án/i), 'My AI App')
    await user.type(within(dialog).getByLabelText(/Link dự án/i), 'invalid-url')
    await user.click(within(dialog).getByRole('button', { name: 'Thêm dự án' }))

    expect(
      await within(dialog).findByText(
        'Link dự án cần bắt đầu bằng http:// hoặc https://'
      )
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    const urlInput = within(dialog).getByLabelText(/Link dự án/i)
    await user.clear(urlInput)
    await user.type(urlInput, 'https://my-ai.app')
    await user.click(within(dialog).getByRole('button', { name: 'Thêm dự án' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'My AI App',
          url: 'https://my-ai.app',
        }),
      ])
    })
  })
})

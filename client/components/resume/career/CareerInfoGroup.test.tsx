import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import CareerInfoGroup from './CareerInfoGroup'

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        description: 'Develop software',
      },
    ]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
  },
}))

describe('CareerInfoGroup (Resume)', () => {
  it('renders view mode with O*NET SOC and SFIA level badges and passes jest-axe', async () => {
    const { container } = render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Software Developers',
          targetLevel: 'senior',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
          targetSfiaLevel: 4,
        }}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('Định hướng nghề nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('SOC: 15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('SFIA Level 4')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('edits career info, tracks dirty state, and saves updated payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDirtyChange = vi.fn()

    const { container } = render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Software Developers',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
        }}
        onSave={onSave}
        onDirtyChange={onDirtyChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(screen.getByText('Mã O*NET SOC: 15-1252.00')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: 'Frontend Developer' }))
    expect(onDirtyChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          targetPosition: 'Frontend Developer',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
        })
      )
    })
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })
})

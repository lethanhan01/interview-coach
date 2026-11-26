import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TechnicalSkillsGroup from './TechnicalSkillsGroup'

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([]),
    getOccupationTech: vi.fn().mockResolvedValue([
      { example: 'Docker', isHotTechnology: true, inDemand: true },
      { example: 'Python', isHotTechnology: true, inDemand: true },
      { example: 'PostgreSQL', isHotTechnology: false, inDemand: true },
    ]),
    searchTechnologies: vi.fn().mockResolvedValue([
      { example: 'Docker', isHotTechnology: true, inDemand: true },
      { example: 'React', isHotTechnology: true, inDemand: true },
    ]),
  },
}))

describe('TechnicalSkillsGroup (Resume)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders flat skill tags in view mode and passes jest-axe', async () => {
    const { container } = render(
      <TechnicalSkillsGroup
        data={[
          {
            id: '1',
            category: 'language',
            name: 'TypeScript',
            usagePeriod: 24,
          },
          { id: '2', name: 'React', usagePeriod: 18 },
        ]}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('2 kỹ năng')).toBeInTheDocument()
    expect(screen.getByText('TypeScript · 24th')).toBeInTheDocument()
    expect(screen.getByText('React · 18th')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  }, 15_000)

  it('loads O*NET tech suggestions, adds flat skill tag, and saves', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDirtyChange = vi.fn()

    render(
      <TechnicalSkillsGroup
        data={[]}
        onetSocCode="15-1252.00"
        onSave={onSave}
        onDirtyChange={onDirtyChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))

    const dockerBtn = await screen.findByRole('button', { name: /Docker/i })
    await user.click(dockerBtn)

    await user.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.getByText('Docker · 12th')).toBeInTheDocument()
    expect(onDirtyChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Lưu kỹ năng' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        technicalSkills: [
          expect.objectContaining({
            name: 'Docker',
            usagePeriod: 12,
          }),
        ],
      })
    })
  })

  it('allows removing a skill tag in edit mode', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <TechnicalSkillsGroup
        data={[{ id: '1', name: 'Rust', usagePeriod: 6 }]}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    await user.click(screen.getByRole('button', { name: 'Xóa kỹ năng Rust' }))
    expect(screen.getByText('Chưa thêm kỹ năng nào')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Lưu kỹ năng' }))
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ technicalSkills: [] })
    })
  })
})

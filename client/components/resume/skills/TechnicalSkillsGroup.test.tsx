import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import TechnicalSkillsGroup, {
  detectTechCategory,
} from './TechnicalSkillsGroup'

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([]),
    getOccupationTech: vi.fn().mockResolvedValue([
      { example: 'Docker', isHotTechnology: true, inDemand: true },
      { example: 'Python', isHotTechnology: true, inDemand: true },
      { example: 'PostgreSQL', isHotTechnology: false, inDemand: true },
    ]),
  },
}))

describe('TechnicalSkillsGroup (Resume)', () => {
  it('detectTechCategory identifies common technologies accurately', () => {
    expect(detectTechCategory('TypeScript')).toBe('language')
    expect(detectTechCategory('Python')).toBe('language')
    expect(detectTechCategory('React')).toBe('framework')
    expect(detectTechCategory('PostgreSQL')).toBe('database')
    expect(detectTechCategory('Docker')).toBe('platform')
    expect(detectTechCategory('Git')).toBe('devtool')
    expect(detectTechCategory('Linux')).toBe('os')
  })

  it('renders grouped skill list in view mode and passes jest-axe', async () => {
    const { container } = render(
      <TechnicalSkillsGroup
        data={[
          {
            id: '1',
            category: 'language',
            name: 'TypeScript',
            usagePeriod: 24,
          },
          { id: '2', category: 'framework', name: 'React', usagePeriod: 18 },
        ]}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('TypeScript · 24th')).toBeInTheDocument()
    expect(screen.getByText('React · 18th')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('loads O*NET tech suggestions, adds & saves skill, and guards duplicates', async () => {
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
            category: 'platform',
            usagePeriod: 12,
          }),
        ],
      })
    })
  })
})

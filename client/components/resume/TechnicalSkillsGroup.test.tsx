import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import TechnicalSkillsGroup, { detectTechCategory } from './TechnicalSkillsGroup'

vi.mock('@/services', () => ({
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
  it('detectTechCategory correctly identifies common technologies', () => {
    expect(detectTechCategory('TypeScript')).toBe('language')
    expect(detectTechCategory('Python')).toBe('language')
    expect(detectTechCategory('React')).toBe('framework')
    expect(detectTechCategory('PostgreSQL')).toBe('database')
    expect(detectTechCategory('Docker')).toBe('platform')
    expect(detectTechCategory('Git')).toBe('devtool')
    expect(detectTechCategory('Linux')).toBe('os')
  })

  it('renders correctly with skill list in view mode', () => {
    render(
      <TechnicalSkillsGroup
        data={[
          { id: '1', category: 'language', name: 'TypeScript', usagePeriod: 24 },
          { id: '2', category: 'framework', name: 'React', usagePeriod: 24 },
        ]}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getAllByText('· 24th', { exact: false })).toHaveLength(2)
  })

  it('fetches and displays O*NET tech suggestions in edit mode when onetSocCode is provided', async () => {
    render(
      <TechnicalSkillsGroup
        data={[]}
        onetSocCode="15-1252.00"
        onSave={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa/i }))

    await waitFor(() => {
      expect(screen.getByText('Docker')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    })
  })
})

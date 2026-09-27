import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SfiaOnetMappingsTab } from './SfiaOnetMappingsTab'
import type { SfiaOnetMappingItem } from './types'

const mockMappings: SfiaOnetMappingItem[] = [
  {
    socCode: '15-1252.00',
    occupationTitle: 'Software Developers',
    targetLevel: 4,
    weight: 2.0,
    isCore: true,
  },
  {
    socCode: '15-1251.00',
    occupationTitle: 'Computer Programmers',
    targetLevel: 3,
    weight: 1.8,
    isCore: true,
  },
  {
    socCode: '15-1253.00',
    occupationTitle: 'Software Quality Assurance Analysts',
    targetLevel: 3,
    weight: 1.2,
    isCore: false,
  },
]

describe('SfiaOnetMappingsTab', () => {
  it('renders empty state when there are no onetMappings', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="UNMAPPED"
        skillName="Unmapped Skill"
        onetMappings={[]}
      />
    )

    expect(screen.getByText(/No mapped O\*NET occupations/i)).toBeInTheDocument()
    expect(screen.getByText(/UNMAPPED/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore O\*NET Browser/i })).toHaveAttribute(
      'href',
      '/admin/onet'
    )
  })

  it('renders table headers and mapped occupations properly', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    expect(screen.getByPlaceholderText(/Search by SOC code or occupation title/i)).toBeInTheDocument()
    // Due to Dual-Layout (Desktop Table + Mobile Cards), text exists in both views
    expect(screen.getAllByText('15-1252.00').length).toBe(2)
    expect(screen.getAllByText('Software Developers').length).toBe(2)
    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(screen.getAllByText('Software Quality Assurance Analysts').length).toBe(2)

    // Core badge and supplemental badge
    const coreBadges = screen.getAllByText('Core')
    expect(coreBadges.length).toBeGreaterThanOrEqual(2)

    const suppBadges = screen.getAllByText('Supplemental')
    expect(suppBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('filters occupations by search keyword', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Search by SOC code or occupation title/i)
    fireEvent.change(searchInput, { target: { value: 'Programmers' } })

    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(screen.queryByText('Software Developers')).not.toBeInTheDocument()
    expect(screen.queryByText('Software Quality Assurance Analysts')).not.toBeInTheDocument()
  })

  it('filters occupations by Core and Supplemental tabs', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    // Click 'Supplemental'
    const suppTab = screen.getByRole('button', { name: /Supplemental/i })
    fireEvent.click(suppTab)

    expect(screen.getAllByText('Software Quality Assurance Analysts').length).toBe(2)
    expect(screen.queryByText('Software Developers')).not.toBeInTheDocument()
    expect(screen.queryByText('Computer Programmers')).not.toBeInTheDocument()

    // Click 'Core'
    const coreTab = screen.getByRole('button', { name: /Core/i })
    fireEvent.click(coreTab)

    expect(screen.getAllByText('Software Developers').length).toBe(2)
    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(screen.queryByText('Software Quality Assurance Analysts')).not.toBeInTheDocument()
  })

  it('renders link pointing to /admin/onet?soc=...&detail=sfia with target="_blank"', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    const links = screen.getAllByRole('link', { name: /Details|View/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute(
      'href',
      '/admin/onet?soc=15-1252.00&detail=sfia'
    )
    expect(links[0]).toHaveAttribute('target', '_blank')
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

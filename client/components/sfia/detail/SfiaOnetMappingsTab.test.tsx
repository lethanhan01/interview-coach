import React from 'react'
import { render, screen, userEvent } from '@test-utils'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'jest-axe'
import { SfiaOnetMappingsTab } from './SfiaOnetMappingsTab'
import type { SfiaOnetMappingItem } from '@/types'

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

    expect(
      screen.getByText(/Chưa có ánh xạ nghề nghiệp O\*NET/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/UNMAPPED/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Khám phá O\*NET Browser/i })
    ).toHaveAttribute('href', '/admin/onet')
  })

  it('renders table headers and mapped occupations properly', () => {
    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    expect(
      screen.getByPlaceholderText(/Tìm theo mã SOC hoặc tên nghề nghiệp/i)
    ).toBeInTheDocument()
    // Due to Dual-Layout (Desktop Table + Mobile Cards), text exists in both views
    expect(screen.getAllByText('15-1252.00').length).toBe(2)
    expect(screen.getAllByText('Software Developers').length).toBe(2)
    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(
      screen.getAllByText('Software Quality Assurance Analysts').length
    ).toBe(2)

    // Core badge and supplemental badge
    const coreBadges = screen.getAllByText('Cốt lõi')
    expect(coreBadges.length).toBeGreaterThanOrEqual(2)

    const suppBadges = screen.getAllByText('Bổ trợ')
    expect(suppBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('filters occupations by search keyword', async () => {
    const user = userEvent.setup()

    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      /Tìm theo mã SOC hoặc tên nghề nghiệp/i
    )
    await user.type(searchInput, 'Programmers')

    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(screen.queryByText('Software Developers')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Software Quality Assurance Analysts')
    ).not.toBeInTheDocument()
  })

  it('filters occupations by Core and Supplemental tabs', async () => {
    const user = userEvent.setup()

    render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    // Click 'Bổ trợ'
    const suppTab = screen.getByRole('radio', { name: /Bổ trợ/i })
    await user.click(suppTab)

    expect(
      screen.getAllByText('Software Quality Assurance Analysts').length
    ).toBe(2)
    expect(screen.queryByText('Software Developers')).not.toBeInTheDocument()
    expect(screen.queryByText('Computer Programmers')).not.toBeInTheDocument()

    // Click 'Cốt lõi'
    const coreTab = screen.getByRole('radio', { name: /Cốt lõi/i })
    await user.click(coreTab)

    expect(screen.getAllByText('Software Developers').length).toBe(2)
    expect(screen.getAllByText('Computer Programmers').length).toBe(2)
    expect(
      screen.queryByText('Software Quality Assurance Analysts')
    ).not.toBeInTheDocument()
  })

  it('renders link pointing to /admin/onet?soc=...&detail=sfia with target="_blank" and passes accessibility', async () => {
    const { container } = render(
      <SfiaOnetMappingsTab
        skillCode="PROG"
        skillName="Programming"
        onetMappings={mockMappings}
      />
    )

    const links = screen.getAllByRole('link', { name: /Chi tiết|Xem/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute(
      'href',
      '/admin/onet?soc=15-1252.00&detail=sfia'
    )
    expect(links[0]).toHaveAttribute('target', '_blank')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders multiple levels for the same socCode (with ids) without duplicate key errors and sorts deterministically by targetLevel', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const multiLevelMappings: SfiaOnetMappingItem[] = [
        {
          id: 'map-dev-l4',
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 4,
          weight: 2.0,
          isCore: true,
        },
        {
          id: 'map-dev-l3',
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 2.0,
          isCore: true,
        },
        {
          id: 'map-qa-l5',
          socCode: '15-1253.00',
          occupationTitle: 'Software Quality Assurance Analysts',
          targetLevel: 5,
          weight: 1.5,
          isCore: false,
        },
        {
          id: 'map-qa-l3',
          socCode: '15-1253.00',
          occupationTitle: 'Software Quality Assurance Analysts',
          targetLevel: 3,
          weight: 1.5,
          isCore: false,
        },
      ]

      const { container } = render(
        <SfiaOnetMappingsTab
          skillCode="PROG"
          skillName="Programming"
          onetMappings={multiLevelMappings}
        />
      )

      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key'))
      )
      expect(duplicateKeyCalls).toHaveLength(0)

      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(4)
      expect(rows[0]).toHaveTextContent('15-1252.00')
      expect(rows[0]).toHaveTextContent('Cấp độ 3')
      expect(rows[1]).toHaveTextContent('15-1252.00')
      expect(rows[1]).toHaveTextContent('Cấp độ 4')
      expect(rows[2]).toHaveTextContent('15-1253.00')
      expect(rows[2]).toHaveTextContent('Cấp độ 3')
      expect(rows[3]).toHaveTextContent('15-1253.00')
      expect(rows[3]).toHaveTextContent('Cấp độ 5')

      expect(await axe(container)).toHaveNoViolations()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('renders multiple levels for the same socCode without ids and handles filtering without duplicate key errors', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const legacyMappings: SfiaOnetMappingItem[] = [
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 2,
          weight: 1.0,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 4,
          weight: 2.0,
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

      const { container } = render(
        <SfiaOnetMappingsTab
          skillCode="PROG"
          skillName="Programming"
          onetMappings={legacyMappings}
        />
      )

      const searchInput = screen.getByPlaceholderText(
        /Tìm theo mã SOC hoặc tên nghề nghiệp/i
      )
      await user.type(searchInput, '15-1252.00')

      expect(container.querySelectorAll('tbody tr')).toHaveLength(2)

      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key'))
      )
      expect(duplicateKeyCalls).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('prevents duplicate key warnings even with colliding socCode and targetLevel without id', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const collidingMappings: SfiaOnetMappingItem[] = [
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
        {
          socCode: '15-1252.00',
          occupationTitle: 'Software Developers',
          targetLevel: 3,
          weight: 1.5,
          isCore: true,
        },
      ]

      const { container } = render(
        <SfiaOnetMappingsTab
          skillCode="PROG"
          skillName="Programming"
          onetMappings={collidingMappings}
        />
      )

      expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
      const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter((args) =>
        args.some((arg) => typeof arg === 'string' && arg.includes('same key'))
      )
      expect(duplicateKeyCalls).toHaveLength(0)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})

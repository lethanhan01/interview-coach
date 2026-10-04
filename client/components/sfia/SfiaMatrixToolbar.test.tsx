import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SfiaMatrixToolbar } from './SfiaMatrixToolbar'
import type { SfiaCategory } from './types'

describe('SfiaMatrixToolbar', () => {
  const mockCategories: SfiaCategory[] = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      nameVi: 'Phát triển & Triển khai',
      description: 'Mô tả',
      displayOrder: 1,
      skillCount: 42,
    },
    {
      code: 'STRAT_ARCH',
      name: 'Strategy and architecture',
      nameVi: 'Chiến lược & Kiến trúc',
      description: 'Mô tả',
      displayOrder: 2,
      skillCount: 24,
    },
  ]

  const defaultProps = {
    categories: mockCategories,
    selectedCategory: '',
    onCategoryChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    displayMode: 'level' as const,
    onDisplayModeChange: vi.fn(),
    blindSpotsOnly: false,
    onBlindSpotsOnlyChange: vi.fn(),
    onExportCsv: vi.fn(),
    totalSkillsCount: 147,
    displayedSkillsCount: 147,
    blindSpotsCount: 5,
  }

  it('renders all toolbar elements correctly', () => {
    render(<SfiaMatrixToolbar {...defaultProps} />)

    expect(screen.getByPlaceholderText('Search code (PROG) or skill name...')).toBeInTheDocument()
    expect(screen.getByText('Export Matrix CSV')).toBeInTheDocument()
    expect(screen.getByText('Level')).toBeInTheDocument()
    expect(screen.getByText('Questions')).toBeInTheDocument()
    expect(screen.getByText('O*NET')).toBeInTheDocument()
    expect(screen.getByText('Blind spots only (0 questions)')).toBeInTheDocument()
    expect(screen.getByText('147')).toBeInTheDocument()
  })

  it('triggers onSearchChange when user types in search input', () => {
    const onSearchChange = vi.fn()
    render(<SfiaMatrixToolbar {...defaultProps} onSearchChange={onSearchChange} />)

    const input = screen.getByPlaceholderText('Search code (PROG) or skill name...')
    fireEvent.change(input, { target: { value: 'PROG' } })

    expect(onSearchChange).toHaveBeenCalledWith('PROG')
  })

  it('clears search when X button is clicked', () => {
    const onSearchChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        searchQuery="PROG"
        onSearchChange={onSearchChange}
      />
    )

    const clearBtn = screen.getByRole('button', { name: 'Clear search' })
    fireEvent.click(clearBtn)

    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('triggers onDisplayModeChange when user clicks display mode tabs', () => {
    const onDisplayModeChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onDisplayModeChange={onDisplayModeChange}
      />
    )

    fireEvent.click(screen.getByText('Questions'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('questions')

    fireEvent.click(screen.getByText('O*NET'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('onet')
  })

  it('triggers onBlindSpotsOnlyChange when switch is clicked', () => {
    const onBlindSpotsOnlyChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onBlindSpotsOnlyChange={onBlindSpotsOnlyChange}
      />
    )

    const switchEl = screen.getByRole('switch')
    fireEvent.click(switchEl)

    expect(onBlindSpotsOnlyChange).toHaveBeenCalledWith(true)
  })

  it('triggers onExportCsv when user clicks export button', () => {
    const onExportCsv = vi.fn()
    render(<SfiaMatrixToolbar {...defaultProps} onExportCsv={onExportCsv} />)

    const exportBtn = screen.getByRole('button', { name: /Export Matrix CSV/i })
    fireEvent.click(exportBtn)

    expect(onExportCsv).toHaveBeenCalled()
  })
})

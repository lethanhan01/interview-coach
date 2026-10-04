import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, describe, vi } from 'vitest'
import CareerInfoGroup from './CareerInfoGroup'

vi.mock('@/services', () => ({
  onetService: {
    searchOccupations: vi.fn().mockResolvedValue([
      { socCode: '15-1252.00', title: 'Software Developers', description: 'Develop software' },
    ]),
    getOccupationTech: vi.fn().mockResolvedValue([]),
  },
}))

describe('CareerInfoGroup (Resume)', () => {
  it('renders correctly with empty data', () => {
    const { container } = render(
      <CareerInfoGroup data={{}} onSave={vi.fn()} />
    )
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Định hướng nghề nghiệp')).toBeInTheDocument()
  })

  it('renders with O*NET SOC code and SFIA level badges in view mode', () => {
    render(
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

    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('SOC: 15-1252.00')).toBeInTheDocument()
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('SFIA Level 4')).toBeInTheDocument()
  })

  it('enters editing mode when clicking Chỉnh sửa', () => {
    render(
      <CareerInfoGroup
        data={{
          targetPosition: 'Software Developers',
          onetSocCode: '15-1252.00',
          onetOccupationTitle: 'Software Developers',
        }}
        onSave={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    expect(screen.getByText('Mã O*NET SOC: 15-1252.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lưu thay đổi/i })).toBeInTheDocument()
  })
})

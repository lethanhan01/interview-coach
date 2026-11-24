import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onetService } from '@/services/onet.service'
import OnetOccupationPicker from './OnetOccupationPicker'

vi.mock('@/services/onet.service', () => ({
  onetService: {
    searchOccupations: vi.fn(),
  },
}))

const MOCK_OCCUPATIONS = [
  {
    socCode: '15-1252.00',
    title: 'Software Developers',
    description: 'Research, design, and develop computer and network software.',
  },
  {
    socCode: '15-2051.00',
    title: 'Data Scientists',
    matchedTitle: 'ML Engineer',
    description: 'Develop and implement analytical models.',
  },
]

describe('OnetOccupationPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(onetService.searchOccupations).mockResolvedValue(MOCK_OCCUPATIONS)
  })

  it('searches O*NET occupations with debounce and selects an option', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const { container } = render(
      <OnetOccupationPicker
        label="Chức danh chuẩn O*NET"
        helperText="Khuyến nghị"
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    )

    const input = screen.getByRole('searchbox', {
      name: 'Tìm kiếm chức danh chuẩn O*NET',
    })
    await user.type(input, 'Software')

    await waitFor(() => {
      expect(onetService.searchOccupations).toHaveBeenCalledWith(
        'Software',
        8,
        expect.any(AbortSignal)
      )
    })

    const option = await screen.findByRole('option', {
      name: /Software Developers/i,
    })
    await user.click(option)

    expect(onSelect).toHaveBeenCalledWith(MOCK_OCCUPATIONS[0])
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows selected occupation card and clears when clicking clear button', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const { container } = render(
      <OnetOccupationPicker
        label="Chức danh chuẩn O*NET"
        socCode="15-1252.00"
        occupationTitle="Software Developers"
        codePrefix="Mã O*NET SOC"
        clearLabel="Đổi"
        onSelect={vi.fn()}
        onClear={onClear}
      />
    )

    expect(screen.getByText('Software Developers')).toBeInTheDocument()
    expect(screen.getByText('Mã O*NET SOC: 15-1252.00')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Bỏ chọn chức danh O*NET' })
    )
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows empty state when no occupation matches query', async () => {
    const user = userEvent.setup()
    vi.mocked(onetService.searchOccupations).mockResolvedValue([])
    render(
      <OnetOccupationPicker
        label="Chức danh chuẩn O*NET"
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    )

    const input = screen.getByRole('searchbox', {
      name: 'Tìm kiếm chức danh chuẩn O*NET',
    })
    await user.type(input, 'xyz-no-match')

    expect(
      await screen.findByText('Không tìm thấy chức danh O*NET phù hợp.')
    ).toBeInTheDocument()
  })
})

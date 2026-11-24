import { Box, Button } from '@mantine/core'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { SocGroupDistributionItem } from '@/types'
import { SocGroupDistributionChart } from './SocGroupDistributionChart'

vi.mock('./SocGroupBarChart', () => ({
  __esModule: true,
  default: function MockSocGroupBarChart({
    data,
    onSelectGroup,
  }: {
    data: Array<{ code: string; name: string }>
    onSelectGroup: (code: string) => void
  }) {
    return (
      <Box data-testid="mock-soc-group-bar-chart">
        {data.map((item) => (
          <Button
            key={item.code}
            data-testid={`bar-${item.code}`}
            onClick={() => onSelectGroup(item.code)}
          >
            {item.name}
          </Button>
        ))}
      </Box>
    )
  },
}))

const MOCK_DATA: SocGroupDistributionItem[] = [
  {
    code: '15',
    name: 'Máy tính & Toán học',
    englishName: 'Computer and Mathematical Occupations',
    isFocusGroup: true,
    totalOccupations: 45,
    mappedOccupations: 40,
    mappingCoveragePercent: 88.9,
  },
  {
    code: '17',
    name: 'Kiến trúc & Kỹ thuật',
    englishName: 'Architecture and Engineering Occupations',
    isFocusGroup: false,
    totalOccupations: 35,
    mappedOccupations: 10,
    mappingCoveragePercent: 28.6,
  },
]

describe('SocGroupDistributionChart', () => {
  it('renders title, controls and chart bars', async () => {
    const onSelectGroup = vi.fn()
    const { container } = render(
      <SocGroupDistributionChart
        data={MOCK_DATA}
        selectedGroup={null}
        onSelectGroup={onSelectGroup}
      />
    )

    expect(
      screen.getByRole('heading', { name: /Phân bổ 2 nhóm ngành SOC/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radiogroup', {
        name: 'Chế độ hiển thị biểu đồ nhóm ngành SOC',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {
        name: 'Lọc nhanh theo nhóm ngành SOC',
      })
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('handles group selection via bar click', async () => {
    const user = userEvent.setup()
    const onSelectGroup = vi.fn()
    render(
      <SocGroupDistributionChart
        data={MOCK_DATA}
        selectedGroup={null}
        onSelectGroup={onSelectGroup}
      />
    )

    const bar15 = await screen.findByTestId('bar-15')
    await user.click(bar15)

    expect(onSelectGroup).toHaveBeenCalledWith('15')
  })

  it('renders active filter badge and clears filter on click', async () => {
    const user = userEvent.setup()
    const onSelectGroup = vi.fn()
    render(
      <SocGroupDistributionChart
        data={MOCK_DATA}
        selectedGroup="15"
        onSelectGroup={onSelectGroup}
      />
    )

    expect(
      screen.getByText(/Đang lọc: 15 — Máy tính & Toán học/i)
    ).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', {
      name: 'Xóa lọc nhóm SOC',
    })
    await user.click(clearBtn)

    expect(onSelectGroup).toHaveBeenCalledWith(null)
  })

  it('switches metric mode seamlessly', async () => {
    const user = userEvent.setup()
    render(
      <SocGroupDistributionChart
        data={MOCK_DATA}
        selectedGroup={null}
        onSelectGroup={vi.fn()}
      />
    )

    const coverageRadio = screen.getByRole('radio', { name: 'Tỷ lệ %' })
    await user.click(coverageRadio)
    expect(coverageRadio).toBeChecked()
  })

  it('selects a SOC group via keyboard-accessible Select filter', async () => {
    const user = userEvent.setup()
    const onSelectGroup = vi.fn()

    render(
      <SocGroupDistributionChart
        data={MOCK_DATA}
        selectedGroup={null}
        onSelectGroup={onSelectGroup}
      />
    )

    const selectInput = screen.getByRole('combobox', {
      name: 'Lọc nhanh theo nhóm ngành SOC',
    })
    await user.click(selectInput)
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(onSelectGroup).toHaveBeenCalledWith('17')
  })
})

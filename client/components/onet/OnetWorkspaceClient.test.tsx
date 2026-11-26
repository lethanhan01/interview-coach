import { Box, Button } from '@mantine/core'
import { modals } from '@mantine/modals'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OnetDetailSubTab } from '@/types'
import { OnetWorkspaceClient } from './OnetWorkspaceClient'

const mockReplace = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin/onet',
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/components/onet/navigation/OnetSidebar', () => ({
  OnetSidebar: function MockOnetSidebar({
    selectedSoc,
    onSelectSoc,
  }: {
    selectedSoc: string
    onSelectSoc: (soc: string) => void
  }) {
    return (
      <Box data-testid="mock-onet-sidebar">
        <Box data-testid="sidebar-current-soc">{selectedSoc}</Box>
        <Button
          data-testid="sidebar-select-soc"
          onClick={() => onSelectSoc('15-2051.00')}
        >
          Select Data Scientists
        </Button>
      </Box>
    )
  },
}))

vi.mock('@/components/onet/navigation/OnetMobileDrawer', () => ({
  OnetMobileDrawer: function MockMobileDrawer() {
    return <Box data-testid="mock-mobile-drawer" />
  },
}))

vi.mock('@/components/onet/detail/OnetDetailShell', () => ({
  OnetDetailShell: function MockOnetDetailShell({
    socCode,
    activeDetailTab,
    onSelectDetailTab,
    onDirtyChange,
  }: {
    socCode: string
    activeDetailTab: string
    onSelectDetailTab: (tab: OnetDetailSubTab) => void
    onDirtyChange: (dirty: boolean) => void
  }) {
    return (
      <Box data-testid="mock-detail-shell">
        <Box data-testid="detail-soc">{socCode}</Box>
        <Box data-testid="detail-subtab">{activeDetailTab}</Box>
        <Button
          data-testid="detail-set-dirty"
          onClick={() => onDirtyChange(true)}
        >
          Mark Dirty
        </Button>
        <Button
          data-testid="detail-select-sfia-tab"
          onClick={() => onSelectDetailTab('sfia')}
        >
          Select SFIA Tab
        </Button>
      </Box>
    )
  },
}))

vi.mock('@/components/onet/analytics/OnetAnalyticsView', () => ({
  OnetAnalyticsView: function MockOnetAnalyticsView({
    onSwitchToExplorer,
    onSelectOccupation,
  }: {
    onSwitchToExplorer: () => void
    onSelectOccupation: (soc: string, subTab?: OnetDetailSubTab) => void
  }) {
    return (
      <Box data-testid="mock-analytics-view">
        <Button
          data-testid="analytics-switch-explorer"
          onClick={onSwitchToExplorer}
        >
          Back to Explorer
        </Button>
        <Button
          data-testid="analytics-select-occupation"
          onClick={() => onSelectOccupation('15-1252.00', 'sfia')}
        >
          Navigate to SFIA
        </Button>
      </Box>
    )
  },
}))

describe('OnetWorkspaceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  it('renders explorer workspace with sidebar and detail shell', async () => {
    const { container } = render(<OnetWorkspaceClient />)

    expect(
      screen.getByRole('heading', {
        name: /Trình duyệt Nghề nghiệp O\*NET 29.1/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radiogroup', { name: 'Chế độ làm việc O*NET' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('mock-onet-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-detail-shell')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('switches to analytics view and back to explorer', async () => {
    const user = userEvent.setup()
    render(<OnetWorkspaceClient />)

    const analyticsRadio = screen.getByRole('radio', {
      name: /Thống kê & Phân tích/i,
    })
    await user.click(analyticsRadio)

    expect(mockReplace).toHaveBeenCalledWith('/admin/onet?tab=analytics', {
      scroll: false,
    })
  })

  it('renders analytics view when tab=analytics is in searchParams', () => {
    mockSearchParams = new URLSearchParams('tab=analytics')
    render(<OnetWorkspaceClient />)

    expect(screen.getByTestId('mock-analytics-view')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-onet-sidebar')).not.toBeInTheDocument()
  })

  it('navigates atomically to occupation from analytics view', async () => {
    mockSearchParams = new URLSearchParams('tab=analytics')
    const user = userEvent.setup()
    render(<OnetWorkspaceClient />)

    const navBtn = screen.getByTestId('analytics-select-occupation')
    await user.click(navBtn)

    expect(mockReplace).toHaveBeenCalledWith(
      '/admin/onet?soc=15-1252.00&detail=sfia',
      { scroll: false }
    )
  })

  it('guards unsaved SFIA changes when navigating between occupations or tabs', async () => {
    const openConfirmSpy = vi.spyOn(modals, 'openConfirmModal')
    const user = userEvent.setup()
    render(<OnetWorkspaceClient />)

    // Mark dirty in detail shell
    await user.click(screen.getByTestId('detail-set-dirty'))

    // Attempt to select a new SOC via sidebar
    await user.click(screen.getByTestId('sidebar-select-soc'))

    // Confirm modal should be triggered
    expect(openConfirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Thay đổi chưa được lưu',
        labels: { confirm: 'Rời đi không lưu', cancel: 'Ở lại trang' },
      })
    )

    // Simulate modal confirm
    const modalProps = openConfirmSpy.mock.calls[0][0]
    modalProps.onConfirm?.()

    expect(mockReplace).toHaveBeenCalledWith('/admin/onet?soc=15-2051.00', {
      scroll: false,
    })
  })

  it('attaches beforeunload listener when dirty', async () => {
    const user = userEvent.setup()
    render(<OnetWorkspaceClient />)

    await user.click(screen.getByTestId('detail-set-dirty'))

    const event = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})

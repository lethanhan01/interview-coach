import { useState } from 'react'
import { Badge, Box, Button, Text } from '@mantine/core'
import { IconStack2 } from '@tabler/icons-react'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import { AdminMasterDetailLayout } from './AdminMasterDetailLayout'
import { AdminMobileSidebarDrawer } from './AdminMobileSidebarDrawer'
import { AdminWorkspaceHeader } from './AdminWorkspaceHeader'

function DrawerHarness() {
  const [opened, setOpened] = useState(false)

  return (
    <AdminMobileSidebarDrawer
      opened={opened}
      onClose={() => setOpened(false)}
      drawerTitle="Danh mục kiểm thử"
      closeAriaLabel="Đóng danh mục kiểm thử"
      drawerSize="85%"
      drawerPadding={0}
      triggerBar={
        <Button size="sm" onClick={() => setOpened(true)}>
          Mở danh mục
        </Button>
      }
    >
      <Text>Nội dung bên trong drawer</Text>
    </AdminMobileSidebarDrawer>
  )
}

describe('Admin shared workspace layout components', () => {
  it('renders AdminWorkspaceHeader with heading, badges, tabs, and passes jest-axe', async () => {
    const onTabChange = vi.fn()
    const user = userEvent.setup()

    const { container } = render(
      <AdminWorkspaceHeader
        icon={<IconStack2 size={20} stroke={1.5} aria-hidden="true" />}
        title="Khung Quản Trị"
        subtitle="Mô tả workspace quản trị"
        badges={
          <Badge color="brand" variant="light" size="sm">
            Quản trị
          </Badge>
        }
        tabs={[
          { value: 'explorer', label: 'Khám phá' },
          { value: 'analytics', label: 'Thống kê' },
        ]}
        activeTab="explorer"
        onTabChange={onTabChange}
        tabSwitcherAriaLabel="Chuyển chế độ làm việc"
      />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Khung Quản Trị' })
    ).toBeInTheDocument()
    expect(screen.getByText('Quản trị')).toBeInTheDocument()
    expect(
      screen.getByRole('radiogroup', { name: 'Chuyển chế độ làm việc' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Thống kê' }))
    expect(onTabChange).toHaveBeenCalledWith('analytics')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders AdminMasterDetailLayout in plain and bordered variants with landmarks and passes jest-axe', async () => {
    const { container, rerender } = render(
      <AdminMasterDetailLayout
        mobileDrawer={<Box data-testid="mobile-trigger" />}
        sidebar={<Text>Sidebar content</Text>}
        detail={<Text>Detail content</Text>}
        sidebarAriaLabel="Danh mục điều hướng"
        detailAriaLabel="Chi tiết mục chọn"
        panelVariant="plain"
      />
    )

    expect(screen.getByTestId('mobile-trigger')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Danh mục điều hướng' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Chi tiết mục chọn' })
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    rerender(
      <AdminMasterDetailLayout
        mobileDrawer={<Box data-testid="mobile-trigger" />}
        sidebar={<Text>Sidebar content</Text>}
        detail={<Text>Detail content</Text>}
        sidebarAriaLabel="Danh mục điều hướng"
        detailAriaLabel="Chi tiết mục chọn"
        panelVariant="bordered"
      />
    )

    expect(
      screen.getByRole('navigation', { name: 'Danh mục điều hướng' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Chi tiết mục chọn' })
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('opens and closes AdminMobileSidebarDrawer and passes jest-axe', async () => {
    const user = userEvent.setup()
    const { container } = render(<DrawerHarness />)

    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: 'Mở danh mục' }))
    expect(await screen.findByText('Nội dung bên trong drawer')).toBeVisible()

    const closeBtn = screen.getByRole('button', {
      name: 'Đóng danh mục kiểm thử',
    })
    await user.click(closeBtn)
  })
})

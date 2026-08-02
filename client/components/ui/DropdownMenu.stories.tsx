import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './DropdownMenu'
import { Button } from './Button'

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/Overlay/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj<typeof DropdownMenu>

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Mở Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Thông tin cá nhân</DropdownMenuItem>
        <DropdownMenuItem>Cài đặt</DropdownMenuItem>
        <DropdownMenuItem>Lịch sử thanh toán</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

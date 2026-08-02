import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from './Sheet'
import { Button } from './Button'

const meta: Meta<typeof Sheet> = {
  title: 'UI/Overlay/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj<typeof Sheet>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Mở Sheet Right</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa thông tin</SheetTitle>
          <SheetDescription>
            Thực hiện thay đổi vào hồ sơ của bạn ở đây.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          Nội dung chính của Sheet ở đây.
        </div>
        <SheetFooter>
          <Button variant="outline">Hủy</Button>
          <Button variant="primary">Lưu thay đổi</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Mở Sheet Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu Điều hướng</SheetTitle>
          <SheetDescription>
            Menu chính của ứng dụng.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Mở Sheet Top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Thông báo mới</SheetTitle>
          <SheetDescription>
            Bạn có thông báo từ hệ thống.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Mở Sheet Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Tùy chọn hiển thị</SheetTitle>
          <SheetDescription>
            Điều chỉnh cài đặt giao diện.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

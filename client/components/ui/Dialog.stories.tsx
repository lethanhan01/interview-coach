import type { Meta, StoryObj } from '@storybook/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog'
import { Button } from './Button'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Overlay/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Mở Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận hành động</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn thực hiện hành động này không? Dữ liệu không thể khôi phục.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Hủy</Button>
          <Button variant="primary">Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

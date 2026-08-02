import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDialog } from '@/components/patterns/DialogPatterns'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Patterns/Dialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
}

export default meta

export const ConfirmDialogExample = () => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Mở Dialog Xóa</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Xác nhận xóa tài liệu"
        description="Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác."
        variant="destructive"
        confirmText="Xóa"
        onConfirm={() => alert('Đã xóa')}
      />
    </div>
  )
}

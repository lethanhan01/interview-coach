import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './DialogPatterns'
import { vi } from 'vitest'

describe('DialogPatterns', () => {
  describe('ConfirmDialog', () => {
    it('renders correctly and handles confirm', async () => {
      const onConfirm = vi.fn()
      const onOpenChange = vi.fn()
      const user = userEvent.setup()

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Xác nhận xóa"
          description="Bạn có chắc không?"
          onConfirm={onConfirm}
        />
      )

      expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument()
      expect(screen.getByText('Bạn có chắc không?')).toBeInTheDocument()
      
      const confirmButton = screen.getByText('Xác nhận')
      await user.click(confirmButton)
      
      expect(onConfirm).toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormSection, SearchInput } from './FormPatterns'
import { vi } from 'vitest'

describe('FormPatterns', () => {
  describe('FormSection', () => {
    it('renders correctly', () => {
      render(
        <FormSection title="Section Title" description="Section Desc">
          <input data-testid="test-input" />
        </FormSection>
      )
      expect(screen.getByText('Section Title')).toBeInTheDocument()
      expect(screen.getByText('Section Desc')).toBeInTheDocument()
      expect(screen.getByTestId('test-input')).toBeInTheDocument()
    })
  })

  describe('SearchInput', () => {
    it('renders and calls onChange', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<SearchInput value="" onChange={onChange} placeholder="Search test" />)
      
      const input = screen.getByPlaceholderText('Search test')
      await user.type(input, 'a')
      expect(onChange).toHaveBeenCalledWith('a')
    })

    it('renders clear button when value is not empty', async () => {
      const onChange = vi.fn()
      const onClear = vi.fn()
      const user = userEvent.setup()
      
      render(<SearchInput value="test" onChange={onChange} onClear={onClear} />)
      const clearBtn = screen.getByRole('button', { name: /Xóa tìm kiếm/i })
      
      await user.click(clearBtn)
      expect(onChange).toHaveBeenCalledWith('')
      expect(onClear).toHaveBeenCalled()
    })
  })
})

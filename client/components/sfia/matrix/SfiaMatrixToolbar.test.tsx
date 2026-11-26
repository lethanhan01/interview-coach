import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, it, expect, vi } from 'vitest'
import { SfiaMatrixToolbar } from './SfiaMatrixToolbar'

describe('SfiaMatrixToolbar', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    displayMode: 'questions' as const,
    onDisplayModeChange: vi.fn(),
    onExportCsv: vi.fn(),
  }

  it('renders compact Vietnamese toolbar elements and passes accessibility', async () => {
    const { container } = render(<SfiaMatrixToolbar {...defaultProps} />)

    expect(
      screen.getByPlaceholderText('Tìm mã (PROG) hoặc tên kỹ năng...')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Xuất CSV/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi')).toBeInTheDocument()
    expect(screen.getByText('O*NET')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('triggers onSearchChange when user types in search input', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <SfiaMatrixToolbar {...defaultProps} onSearchChange={onSearchChange} />
    )

    const input = screen.getByPlaceholderText(
      'Tìm mã (PROG) hoặc tên kỹ năng...'
    )
    await user.type(input, 'P')

    expect(onSearchChange).toHaveBeenCalledWith('P')
  })

  it('clears search when close button is clicked', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        searchQuery="PROG"
        onSearchChange={onSearchChange}
      />
    )

    const clearBtn = screen.getByRole('button', {
      name: 'Xóa từ khóa tìm kiếm',
    })
    await user.click(clearBtn)

    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('triggers onDisplayModeChange when user clicks display mode options', async () => {
    const user = userEvent.setup()
    const onDisplayModeChange = vi.fn()
    render(
      <SfiaMatrixToolbar
        {...defaultProps}
        onDisplayModeChange={onDisplayModeChange}
      />
    )

    await user.click(screen.getByText('O*NET'))
    expect(onDisplayModeChange).toHaveBeenCalledWith('onet')
  })

  it('triggers onExportCsv when user clicks export button', async () => {
    const user = userEvent.setup()
    const onExportCsv = vi.fn()
    render(<SfiaMatrixToolbar {...defaultProps} onExportCsv={onExportCsv} />)

    const exportBtn = screen.getByRole('button', {
      name: /Xuất CSV/i,
    })
    await user.click(exportBtn)

    expect(onExportCsv).toHaveBeenCalled()
  })
})

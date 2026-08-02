import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar, FilterBar, Pagination, DataTable } from './DataPatterns'
import { vi } from 'vitest'

describe('DataPatterns', () => {
  describe('Toolbar', () => {
    it('renders children correctly', () => {
      render(<Toolbar><span>Toolbar Content</span></Toolbar>)
      expect(screen.getByText('Toolbar Content')).toBeInTheDocument()
    })
  })

  describe('FilterBar', () => {
    it('renders children correctly', () => {
      render(<FilterBar><span>Filter Content</span></FilterBar>)
      expect(screen.getByText('Filter Content')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('renders pagination buttons correctly', () => {
      const onPageChange = vi.fn()
      render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('calls onPageChange when clicking a page', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByText('3'))
      expect(onPageChange).toHaveBeenCalledWith(3)
    })
  })

  describe('DataTable', () => {
    const columns = [
      { key: 'id', title: 'ID' },
      { key: 'name', title: 'Name' }
    ]
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]

    it('renders data correctly', () => {
      render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('renders empty state when data is empty', () => {
      render(<DataTable columns={columns} data={[]} keyExtractor={(r) => r.id} emptyState="No items found" />)
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })
})

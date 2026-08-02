import * as React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './Table'
import { axe } from 'jest-axe'

describe('Table Component', () => {
  const TestTable = () => (
    <Table>
      <TableCaption>Test Caption</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Header 1</TableHead>
          <TableHead>Header 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Cell 1</TableCell>
          <TableCell>Cell 2</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Footer Content</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )

  it('renders table elements correctly', () => {
    render(<TestTable />)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Test Caption')).toBeInTheDocument()
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
    
    // Check roles
    expect(screen.getAllByRole('rowgroup')).toHaveLength(3) // Header, Body, Footer
    expect(screen.getAllByRole('row')).toHaveLength(3) // Header row, Body row, Footer row
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(screen.getAllByRole('cell')).toHaveLength(3) // 2 body cells, 1 footer cell
  })

  it('passes accessibility tests', async () => {
    const { container } = render(<TestTable />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

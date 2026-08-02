import type { Meta } from '@storybook/nextjs-vite'
import { Toolbar, FilterBar, Pagination, DataTable } from '@/components/patterns/DataPatterns'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

const meta: Meta = {
  title: 'Patterns/Data',
  tags: ['autodocs'],
}

export default meta

export const ToolbarExample = () => (
  <Toolbar>
    <div className="flex gap-2">
      <Button variant="outline">Action 1</Button>
      <Button variant="primary">Action 2</Button>
    </div>
  </Toolbar>
)

export const FilterBarExample = () => (
  <FilterBar>
    <Button variant="outline" size="sm">Active</Button>
    <Button variant="ghost" size="sm">Inactive</Button>
  </FilterBar>
)

export const PaginationExample = () => {
  const [page, setPage] = useState(1)
  return <Pagination currentPage={page} totalPages={10} onPageChange={setPage} />
}

export const DataTableExample = () => {
  const columns = [
    { key: 'id', title: 'ID', width: 'w-16' },
    { key: 'name', title: 'Tên' },
    { key: 'role', title: 'Vai trò' },
  ]
  const data = [
    { id: 1, name: 'Nguyễn Văn A', role: 'Admin' },
    { id: 2, name: 'Trần Thị B', role: 'User' },
  ]
  return <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />
}

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

// --- Toolbar ---
export interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}

// --- FilterBar ---
export interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  )
}

// --- Pagination ---
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const showMax = 5
    let start = Math.max(1, currentPage - Math.floor(showMax / 2))
    let end = Math.min(totalPages, start + showMax - 1)

    if (end - start + 1 < showMax) {
      start = Math.max(1, end - showMax + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return { pages, start, end }
  }

  const { pages, start, end } = getPageNumbers()

  return (
    <div className={cn('mt-4 flex items-center justify-end gap-1', className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {start > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? 'primary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {start > 2 && (
            <span className="text-ink-muted px-2">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'primary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-ink-muted px-2">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
          <Button
            variant={currentPage === totalPages ? 'primary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// --- DataTable ---
export interface ColumnDef<T> {
  key: string | keyof T
  title: ReactNode
  render?: (record: T, index: number) => ReactNode
  className?: string
  width?: string
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  keyExtractor: (record: T) => string | number
  emptyState?: ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn('border-border bg-surface rounded-md border', className)}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn(col.width, col.className)}
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="py-12">
          {emptyState || (
            <div className="text-ink-muted py-8 text-center text-sm">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('border-border bg-surface rounded-md border', className)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(col.width, col.className)}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, rowIndex) => (
            <TableRow key={keyExtractor(record)}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} className={col.className}>
                  {col.render
                    ? col.render(record, rowIndex)
                    : (record[col.key as keyof T] as ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

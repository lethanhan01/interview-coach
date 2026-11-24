'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Search,
  X,
  ArrowRight,
  Briefcase,
  Users,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import { EmptyState } from '@/components/common/patterns/FeedbackPatterns'
import { cn } from '@/lib/utils'
import type { OnetTopOccupationItem, OnetDetailSubTab } from '@/types'

export interface OnetTopOccupationsProps {
  data: OnetTopOccupationItem[]
  activeGroupFilter?: string | null
  onClearGroupFilter?: () => void
  onNavigateToExplorer: (socCode: string, subTab?: OnetDetailSubTab) => void
  className?: string
}

type SortField = 'mock_desc' | 'jd_desc' | 'mapping_desc' | 'title_asc'

export function OnetTopOccupations({
  data,
  activeGroupFilter,
  onClearGroupFilter,
  onNavigateToExplorer,
  className,
}: OnetTopOccupationsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('mock_desc')
  const [pageSize, setPageSize] = useState<number>(5)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const numberFormatter = new Intl.NumberFormat('vi-VN')

  // Lọc theo search query & group filter
  const filteredItems = useMemo(() => {
    let result = [...data]

    if (activeGroupFilter) {
      result = result.filter(
        (item) => item.majorGroupCode === activeGroupFilter
      )
    }

    if (searchQuery.trim()) {
      const clean = searchQuery.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.socCode.toLowerCase().includes(clean) ||
          item.title.toLowerCase().includes(clean) ||
          item.majorGroupName.toLowerCase().includes(clean)
      )
    }

    // Sắp xếp
    result.sort((a, b) => {
      switch (sortBy) {
        case 'mock_desc':
          return b.mockInterviewCount - a.mockInterviewCount
        case 'jd_desc':
          return b.jobDescriptionCount - a.jobDescriptionCount
        case 'mapping_desc':
          return b.mappingCount - a.mappingCount
        case 'title_asc':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return result
  }, [data, activeGroupFilter, searchQuery, sortBy])

  // Reset trang về 1 khi filter thay đổi
  const totalItems = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, safePage, pageSize])

  const startIndex = (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, totalItems)

  return (
    <Card
      className={cn(
        'flex shrink-0 flex-col justify-between space-y-2 p-2.5 sm:p-3',
        className
      )}
    >
      {/* Header Toolbar */}
      <div className="border-border/60 flex flex-col justify-between gap-2 border-b pb-2 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-md">
              <TrendingUp className="size-3.5" />
            </div>
            <h3 className="text-ink text-xs font-bold tracking-tight sm:text-sm">
              Top Nghề nghiệp Quan tâm & Luyện tập nhiều nhất
            </h3>
            {activeGroupFilter && (
              <Badge
                variant="brand"
                className="py-0.2 gap-1 px-2 text-[10px] font-medium"
              >
                <Filter className="size-2.5" />
                <span>Nhóm {activeGroupFilter}</span>
                {onClearGroupFilter && (
                  <button
                    type="button"
                    onClick={onClearGroupFilter}
                    className="hover:bg-brand/20 ml-0.5 inline-flex cursor-pointer items-center rounded p-0.5"
                    aria-label="Xóa lọc nhóm"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </Badge>
            )}
          </div>
          <p className="text-ink-muted mt-0.5 text-[11px]">
            Xếp hạng theo khối lượng phỏng vấn giả lập và nhu cầu tuyển dụng thị
            trường
          </p>
        </div>

        {/* Filters: Search & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-52">
            <Search className="text-ink-muted absolute left-2 top-1/2 size-3 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm mã SOC, tên nghề..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-surface-raised h-7 pl-7 pr-6 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-ink-muted hover:text-ink absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="w-full sm:w-44">
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortField)}
            >
              <SelectTrigger className="bg-surface-raised h-7 text-xs">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock_desc">
                  Lượt phỏng vấn (Cao nhất)
                </SelectItem>
                <SelectItem value="jd_desc">
                  Lượng JD gắn kết (Cao nhất)
                </SelectItem>
                <SelectItem value="mapping_desc">
                  Số mapping SFIA (Nhiều nhất)
                </SelectItem>
                <SelectItem value="title_asc">
                  Tên nghề nghiệp (A → Z)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="border-border/70 bg-card overflow-hidden rounded-xl border">
        {totalItems === 0 ? (
          <EmptyState
            icon={<Search className="text-ink-muted size-8" />}
            title="Không tìm thấy nghề nghiệp phù hợp"
            description={
              searchQuery
                ? `Không có nghề nào khớp với từ khóa "${searchQuery}".`
                : 'Không có nghề nào thuộc bộ lọc hiện tại.'
            }
            action={{
              label: 'Xóa bộ lọc',
              onClick: () => {
                setSearchQuery('')
                if (onClearGroupFilter) onClearGroupFilter()
              },
            }}
            minHeight="min-h-[180px]"
          />
        ) : (
          <Table>
            <TableHeader className="bg-surface-inset/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 w-12 shrink-0 px-2 text-center text-xs font-semibold">
                  Hạng
                </TableHead>
                <TableHead className="flex-2 h-8 min-w-[200px] px-2 text-xs font-semibold">
                  Mã SOC & Tên Nghề nghiệp
                </TableHead>
                <TableHead className="h-8 w-24 shrink-0 px-2 text-right text-xs font-semibold">
                  Lượt Luyện AI
                </TableHead>
                <TableHead className="h-8 w-20 shrink-0 px-2 text-right text-xs font-semibold">
                  Số JD Gắn
                </TableHead>
                <TableHead className="h-8 w-28 shrink-0 px-2 text-center text-xs font-semibold">
                  Ánh xạ SFIA
                </TableHead>
                <TableHead className="hidden h-8 w-32 shrink-0 px-2 text-xs font-semibold md:flex">
                  Kỹ năng Cốt lõi
                </TableHead>
                <TableHead className="h-8 w-28 shrink-0 px-2 text-right text-xs font-semibold">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item, idx) => {
                const rank = (safePage - 1) * pageSize + idx + 1
                const isTop1 = rank === 1
                const isTop2 = rank === 2
                const isTop3 = rank === 3

                return (
                  <TableRow
                    key={item.socCode}
                    className="hover:bg-surface-muted/40 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="w-12 shrink-0 justify-center px-2 py-1.5">
                      {isTop1 ? (
                        <span className="shadow-2xs flex size-5 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-600">
                          🥇
                        </span>
                      ) : isTop2 ? (
                        <span className="shadow-2xs flex size-5 items-center justify-center rounded-full bg-slate-400/15 text-[11px] font-bold text-slate-600">
                          🥈
                        </span>
                      ) : isTop3 ? (
                        <span className="shadow-2xs flex size-5 items-center justify-center rounded-full bg-orange-500/15 text-[11px] font-bold text-orange-600">
                          🥉
                        </span>
                      ) : (
                        <span className="text-ink-muted text-[11px] font-medium tabular-nums">
                          #{rank}
                        </span>
                      )}
                    </TableCell>

                    {/* SOC & Title */}
                    <TableCell className="flex-2 min-w-[200px] px-2 py-1.5">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-brand font-mono text-[11px] font-bold">
                            {item.socCode}
                          </span>
                          <span className="bg-surface-inset text-ink-muted py-0.2 rounded px-1 text-[9px]">
                            Nhóm {item.majorGroupCode}
                          </span>
                        </div>
                        <span className="text-ink truncate text-xs font-semibold">
                          {item.title}
                        </span>
                      </div>
                    </TableCell>

                    {/* Mock Interviews */}
                    <TableCell className="w-24 shrink-0 justify-end px-2 py-1.5">
                      <div className="text-ink flex items-center gap-1 text-xs font-bold tabular-nums">
                        <Users className="text-ink-muted size-3" />
                        <span>
                          {numberFormatter.format(item.mockInterviewCount)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Job Descriptions */}
                    <TableCell className="w-20 shrink-0 justify-end px-2 py-1.5">
                      <div className="text-ink-muted flex items-center gap-1 text-xs font-medium tabular-nums">
                        <Briefcase className="text-ink-muted size-3" />
                        <span>
                          {numberFormatter.format(item.jobDescriptionCount)}
                        </span>
                      </div>
                    </TableCell>

                    {/* SFIA Status Badge (Click opens sfia tab) */}
                    <TableCell className="w-28 shrink-0 justify-center px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToExplorer(item.socCode, 'sfia')
                        }
                        className="group inline-flex cursor-pointer items-center gap-1 transition-transform hover:scale-105"
                        title="Nhấp để xem và chỉnh sửa SFIA Mappings trong Explorer"
                      >
                        {item.isMapped ? (
                          <Badge
                            variant="brand"
                            className="py-0.2 group-hover:bg-brand/90 gap-1 px-1.5 text-[10px]"
                          >
                            <Layers className="size-2.5" />
                            <span>{item.mappingCount} SFIA</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="py-0.2 gap-1 px-1.5 text-[10px]"
                          >
                            <span>Chưa mapping</span>
                          </Badge>
                        )}
                      </button>
                    </TableCell>

                    {/* Core Skills Chips */}
                    <TableCell className="hidden w-32 shrink-0 px-2 py-1.5 md:flex">
                      <div className="flex flex-wrap items-center gap-1">
                        {item.coreSkillCodes &&
                        item.coreSkillCodes.length > 0 ? (
                          Array.from(new Set(item.coreSkillCodes)).map(
                            (code, idx) => (
                              <span
                                key={`${item.socCode}-core-${code}-${idx}`}
                                className="bg-surface-inset text-ink py-0.2 border-border/50 rounded border px-1 font-mono text-[9px] font-semibold"
                              >
                                {code}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-ink-muted text-[9px] italic">
                            Chưa gán
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Action Button (Click opens overview tab) */}
                    <TableCell className="w-28 shrink-0 justify-end px-2 py-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onNavigateToExplorer(item.socCode, 'overview')
                        }
                        className="hover:border-brand hover:text-brand h-6 gap-1 px-2 text-[11px] font-semibold"
                      >
                        <span>Explorer</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="text-ink-muted flex flex-col items-center justify-between gap-1.5 pt-0.5 text-xs sm:flex-row">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>
              Hiển thị <strong>{startIndex}</strong>–<strong>{endIndex}</strong>{' '}
              / <strong>{totalItems}</strong> nghề
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Rows per page selector */}
            <div className="flex items-center gap-1 text-[11px]">
              <span>Hàng:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-surface-raised border-border/80 text-ink rounded border px-1 py-0.5 text-[11px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-6 px-1.5 text-xs"
              >
                <ChevronLeft className="size-3" />
                <span className="sr-only">Trang trước</span>
              </Button>
              <span className="text-ink px-1.5 text-[11px] font-medium tabular-nums">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="h-6 px-1.5 text-xs"
              >
                <ChevronRight className="size-3" />
                <span className="sr-only">Trang sau</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

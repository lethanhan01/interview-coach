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
import { EmptyState } from '@/components/patterns/FeedbackPatterns'
import { cn } from '@/lib/utils'
import type { OnetTopOccupationItem, OnetDetailSubTab } from './types'

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
      result = result.filter((item) => item.majorGroupCode === activeGroupFilter)
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
    <Card className={cn('p-2.5 sm:p-3 space-y-2 flex flex-col justify-between shrink-0', className)}>
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-md">
              <TrendingUp className="size-3.5" />
            </div>
            <h3 className="text-ink text-xs sm:text-sm font-bold tracking-tight">
              Top Nghề nghiệp Quan tâm & Luyện tập nhiều nhất
            </h3>
            {activeGroupFilter && (
              <Badge variant="brand" className="gap-1 text-[10px] py-0.2 px-2 font-medium">
                <Filter className="size-2.5" />
                <span>Nhóm {activeGroupFilter}</span>
                {onClearGroupFilter && (
                  <button
                    type="button"
                    onClick={onClearGroupFilter}
                    className="hover:bg-brand/20 rounded p-0.5 ml-0.5 inline-flex items-center cursor-pointer"
                    aria-label="Xóa lọc nhóm"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </Badge>
            )}
          </div>
          <p className="text-ink-muted text-[11px] mt-0.5">
            Xếp hạng theo khối lượng phỏng vấn giả lập và nhu cầu tuyển dụng thị trường
          </p>
        </div>

        {/* Filters: Search & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-ink-muted" />
            <Input
              type="text"
              placeholder="Tìm mã SOC, tên nghề..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-7 pr-6 h-7 text-xs bg-surface-raised"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer"
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
              <SelectTrigger className="h-7 text-xs bg-surface-raised">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock_desc">Lượt phỏng vấn (Cao nhất)</SelectItem>
                <SelectItem value="jd_desc">Lượng JD gắn kết (Cao nhất)</SelectItem>
                <SelectItem value="mapping_desc">Số mapping SFIA (Nhiều nhất)</SelectItem>
                <SelectItem value="title_asc">Tên nghề nghiệp (A → Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="rounded-xl border border-border/70 overflow-hidden bg-card">
        {totalItems === 0 ? (
          <EmptyState
            icon={<Search className="size-8 text-ink-muted" />}
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
                <TableHead className="w-12 text-center shrink-0 text-xs font-semibold h-8 px-2">
                  Hạng
                </TableHead>
                <TableHead className="min-w-[200px] flex-2 text-xs font-semibold h-8 px-2">
                  Mã SOC & Tên Nghề nghiệp
                </TableHead>
                <TableHead className="w-24 shrink-0 text-right text-xs font-semibold h-8 px-2">
                  Lượt Luyện AI
                </TableHead>
                <TableHead className="w-20 shrink-0 text-right text-xs font-semibold h-8 px-2">
                  Số JD Gắn
                </TableHead>
                <TableHead className="w-28 shrink-0 text-center text-xs font-semibold h-8 px-2">
                  Ánh xạ SFIA
                </TableHead>
                <TableHead className="w-32 shrink-0 text-xs font-semibold hidden md:flex h-8 px-2">
                  Kỹ năng Cốt lõi
                </TableHead>
                <TableHead className="w-28 shrink-0 text-right text-xs font-semibold h-8 px-2">
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
                    <TableCell className="w-12 justify-center shrink-0 py-1.5 px-2">
                      {isTop1 ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 font-bold text-[11px] shadow-2xs">
                          🥇
                        </span>
                      ) : isTop2 ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-slate-400/15 text-slate-600 font-bold text-[11px] shadow-2xs">
                          🥈
                        </span>
                      ) : isTop3 ? (
                        <span className="flex size-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 font-bold text-[11px] shadow-2xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-ink-muted tabular-nums">
                          #{rank}
                        </span>
                      )}
                    </TableCell>

                    {/* SOC & Title */}
                    <TableCell className="min-w-[200px] flex-2 py-1.5 px-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[11px] text-brand">
                            {item.socCode}
                          </span>
                          <span className="bg-surface-inset text-ink-muted text-[9px] px-1 py-0.2 rounded">
                            Nhóm {item.majorGroupCode}
                          </span>
                        </div>
                        <span className="text-ink font-semibold text-xs truncate">
                          {item.title}
                        </span>
                      </div>
                    </TableCell>

                    {/* Mock Interviews */}
                    <TableCell className="w-24 justify-end shrink-0 py-1.5 px-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-ink tabular-nums">
                        <Users className="size-3 text-ink-muted" />
                        <span>{numberFormatter.format(item.mockInterviewCount)}</span>
                      </div>
                    </TableCell>

                    {/* Job Descriptions */}
                    <TableCell className="w-20 justify-end shrink-0 py-1.5 px-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-ink-muted tabular-nums">
                        <Briefcase className="size-3 text-ink-muted" />
                        <span>{numberFormatter.format(item.jobDescriptionCount)}</span>
                      </div>
                    </TableCell>

                    {/* SFIA Status Badge (Click opens sfia tab) */}
                    <TableCell className="w-28 justify-center shrink-0 py-1.5 px-2">
                      <button
                        type="button"
                        onClick={() => onNavigateToExplorer(item.socCode, 'sfia')}
                        className="group inline-flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer"
                        title="Nhấp để xem và chỉnh sửa SFIA Mappings trong Explorer"
                      >
                        {item.isMapped ? (
                          <Badge
                            variant="brand"
                            className="text-[10px] py-0.2 px-1.5 gap-1 group-hover:bg-brand/90"
                          >
                            <Layers className="size-2.5" />
                            <span>{item.mappingCount} SFIA</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0.2 px-1.5 gap-1"
                          >
                            <span>Chưa mapping</span>
                          </Badge>
                        )}
                      </button>
                    </TableCell>

                    {/* Core Skills Chips */}
                    <TableCell className="w-32 shrink-0 hidden md:flex py-1.5 px-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.coreSkillCodes && item.coreSkillCodes.length > 0 ? (
                          Array.from(new Set(item.coreSkillCodes)).map((code, idx) => (
                            <span
                              key={`${item.socCode}-core-${code}-${idx}`}
                              className="bg-surface-inset text-ink font-mono font-semibold text-[9px] px-1 py-0.2 rounded border border-border/50"
                            >
                              {code}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink-muted text-[9px] italic">
                            Chưa gán
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Action Button (Click opens overview tab) */}
                    <TableCell className="w-28 justify-end shrink-0 py-1.5 px-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToExplorer(item.socCode, 'overview')}
                        className="h-6 text-[11px] px-2 gap-1 font-semibold hover:border-brand hover:text-brand"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-0.5 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>
              Hiển thị <strong>{startIndex}</strong>–<strong>{endIndex}</strong> /{' '}
              <strong>{totalItems}</strong> nghề
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
                className="bg-surface-raised border border-border/80 rounded px-1 py-0.5 text-[11px] text-ink"
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
              <span className="px-1.5 font-medium text-ink tabular-nums text-[11px]">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

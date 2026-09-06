'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  X,
  SearchX,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion'
import { onetMockService } from '@/services/onet.mock'
import type {
  SocMajorGroup,
  OnetOccupationSummary,
} from './types'

export interface OnetSidebarProps {
  selectedSoc: string
  onSelectSoc: (socCode: string) => void
  className?: string
}

export function OnetSidebar({
  selectedSoc,
  onSelectSoc,
  className,
}: OnetSidebarProps) {
  const [majorGroups, setMajorGroups] = useState<SocMajorGroup[]>([])
  const [occupations, setOccupations] = useState<OnetOccupationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [userExpandedGroups, setUserExpandedGroups] = useState<string[]>(['15'])
  const [prevSoc, setPrevSoc] = useState(selectedSoc)

  // Auto-expand group when user navigates/selects a different occupation
  if (prevSoc !== selectedSoc) {
    setPrevSoc(selectedSoc)
    const targetGroup = occupations.find((o) => o.socCode === selectedSoc)?.majorGroupCode
    if (targetGroup && !userExpandedGroups.includes(targetGroup)) {
      setUserExpandedGroups((prev) => [...prev, targetGroup])
    }
  }

  // Debounce search query 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // Load groups & occupations
  useEffect(() => {
    let isCancelled = false

    Promise.all([
      onetMockService.getMajorGroups(),
      onetMockService.getAllOccupations(),
    ])
      .then(([groups, occs]) => {
        if (isCancelled) return
        setMajorGroups(groups)
        setOccupations(occs)
        const initialOcc = occs.find((o) => o.socCode === selectedSoc)
        if (initialOcc) {
          setUserExpandedGroups((prev) =>
            prev.includes(initialOcc.majorGroupCode)
              ? prev
              : [...prev, initialOcc.majorGroupCode]
          )
        }
      })
      .catch((err) => {
        if (isCancelled) return
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh mục nghề nghiệp O*NET'
        )
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedSoc])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      onetMockService.getMajorGroups(),
      onetMockService.getAllOccupations(),
    ])
      .then(([groups, occs]) => {
        setMajorGroups(groups)
        setOccupations(occs)
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh mục nghề nghiệp O*NET'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Filter occupations & major groups based on debounced search
  const { filteredOccupations, visibleGroups, groupOccupationMap } =
    useMemo(() => {
      let filtered = occupations
      if (debouncedQuery) {
        filtered = occupations.filter(
          (o) =>
            o.socCode.toLowerCase().includes(debouncedQuery) ||
            o.title.toLowerCase().includes(debouncedQuery)
        )
      }

      // Group occupations by majorGroupCode
      const map = new Map<string, OnetOccupationSummary[]>()
      filtered.forEach((occ) => {
        const list = map.get(occ.majorGroupCode) || []
        list.push(occ)
        map.set(occ.majorGroupCode, list)
      })

      // When searching, only show groups that have at least 1 match
      const visible = debouncedQuery
        ? majorGroups.filter((g) => (map.get(g.code) || []).length > 0)
        : majorGroups

      return {
        filteredOccupations: filtered,
        visibleGroups: visible,
        groupOccupationMap: map,
      }
    }, [occupations, debouncedQuery, majorGroups])

  // Effective expanded groups:
  // - When searching: expand all groups with search matches
  // - When not searching: user-controlled state (freely collapsible and expandable)
  const effectiveExpandedGroups = useMemo(() => {
    if (debouncedQuery) {
      return visibleGroups.map((g) => g.code)
    }
    return userExpandedGroups
  }, [debouncedQuery, visibleGroups, userExpandedGroups])

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden bg-card text-card-foreground',
        className
      )}
    >
      {/* Sidebar Header & Search */}
      <div className="border-border/60 bg-surface-raised flex shrink-0 flex-col gap-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-ink text-sm font-bold tracking-tight">
              Phân loại Nghề nghiệp
            </span>
            <Badge variant="outline" className="text-[11px] font-semibold">
              1.016 SOC
            </Badge>
          </div>
          <span className="text-ink-muted text-xs">
            {filteredOccupations.length} nghề
          </span>
        </div>

        {/* Search Input with Debounce */}
        <div className="relative">
          <Search className="text-ink-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã SOC hoặc tên nghề..."
            className="bg-card pl-9 pr-8 text-xs"
            aria-label="Tìm kiếm nghề nghiệp O*NET"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-ink-muted hover:text-ink focus-visible:ring-ring absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 focus-visible:outline-none focus-visible:ring-1"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Accordion List (Independently Scrollable) */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Loading State: Skeletons */}
        {loading && (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-inset flex h-11 animate-pulse items-center justify-between rounded-lg px-3"
              >
                <div className="bg-border h-4 w-40 rounded" />
                <div className="bg-border h-4 w-8 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="text-destructive mb-2 size-8" />
            <p className="text-ink text-sm font-medium">Lỗi tải dữ liệu</p>
            <p className="text-ink-muted mt-1 text-xs">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-3 gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Thử lại</span>
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOccupations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-surface-inset text-ink-muted flex size-12 items-center justify-center rounded-full">
              <SearchX className="size-6" />
            </div>
            <p className="text-ink mt-3 text-sm font-semibold">
              Không tìm thấy nghề nghiệp
            </p>
            <p className="text-ink-muted mt-1 text-xs leading-relaxed">
              Không có mã nghề hoặc chức danh nào khớp với từ khóa &ldquo;
              {debouncedQuery}&rdquo;
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="mt-3 text-xs"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {/* Success Content: Accordion 23 Major Groups */}
        {!loading && !error && filteredOccupations.length > 0 && (
          <Accordion
            type="multiple"
            value={effectiveExpandedGroups}
            onValueChange={setUserExpandedGroups}
            className="w-full space-y-1"
          >
            {visibleGroups.map((group) => {
              const groupOccs = groupOccupationMap.get(group.code) || []
              const hasMatches = groupOccs.length > 0
              if (!hasMatches && debouncedQuery) return null

              return (
                <AccordionItem
                  key={group.code}
                  value={group.code}
                  className="border-border/50 overflow-hidden rounded-lg border"
                >
                  <AccordionTrigger className="hover:bg-surface-inset/60 px-3 py-2.5 text-xs font-semibold hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-2">
                      <div className="flex items-center gap-2 text-left">
                        <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 font-mono text-[10px] font-bold">
                          {group.code}
                        </span>
                        <span className="text-ink line-clamp-1 max-w-[170px] text-xs">
                          {group.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] font-normal"
                        >
                          {groupOccs.length}
                        </Badge>
                        {group.mappedCount > 0 && (
                          <span
                            title={`${group.mappedCount} nghề đã gán SFIA`}
                            className="bg-success/15 text-success inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-medium"
                          >
                            <Sparkles className="size-2.5" />
                            {group.mappedCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-1 pt-0">
                    <div className="divide-border/40 flex flex-col divide-y">
                      {groupOccs.map((occ) => {
                        const isSelected = occ.socCode === selectedSoc
                        return (
                          <button
                            key={occ.socCode}
                            type="button"
                            onClick={() => onSelectSoc(occ.socCode)}
                            className={cn(
                              'flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand',
                              isSelected
                                ? 'bg-brand/10 text-brand font-medium border-l-2 border-brand'
                                : 'hover:bg-surface-inset text-ink'
                            )}
                          >
                            <div className="flex flex-1 flex-col gap-0.5 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'font-mono text-[10px]',
                                    isSelected
                                      ? 'text-brand font-semibold'
                                      : 'text-ink-muted'
                                  )}
                                >
                                  {occ.socCode}
                                </span>
                              </div>
                              <span className="line-clamp-2 text-xs leading-snug">
                                {occ.title}
                              </span>
                            </div>

                            {/* SFIA Mapped status indicator */}
                            <div className="shrink-0">
                              {occ.isMapped ? (
                                <span
                                  title={`Đã ánh xạ ${occ.mappingCount} kỹ năng SFIA`}
                                  className="bg-success size-2 rounded-full inline-block ring-2 ring-success/20"
                                />
                              ) : (
                                <span
                                  title="Chưa có ánh xạ SFIA"
                                  className="bg-border size-2 rounded-full inline-block"
                                />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}

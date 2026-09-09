'use client'

import * as React from 'react'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Search,
  X,
  SearchX,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Loader2,
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
import { onetAdminService } from '@/services/onet-admin.service'
import type {
  SocMajorGroup,
  OnetOccupationSummary,
} from './types'

export interface OnetSidebarProps {
  selectedSoc: string
  onSelectSoc: (socCode: string) => void
  refreshTrigger?: number
  className?: string
}

export function OnetSidebar({
  selectedSoc,
  onSelectSoc,
  refreshTrigger = 0,
  className,
}: OnetSidebarProps) {
  const [majorGroups, setMajorGroups] = useState<SocMajorGroup[]>([])
  const [groupOccupationsCache, setGroupOccupationsCache] = useState<
    Record<string, OnetOccupationSummary[]>
  >({})
  const [loadingGroups, setLoadingGroups] = useState<Record<string, boolean>>({})
  const [searchResults, setSearchResults] = useState<OnetOccupationSummary[]>([])
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  // Group code of selected SOC (e.g. "15" from "15-1252.00")
  const selectedGroupCode = useMemo(() => {
    return selectedSoc?.split('-')[0] || '15'
  }, [selectedSoc])

  const [userExpandedGroups, setUserExpandedGroups] = useState<string[]>([selectedGroupCode])
  const [prevSoc, setPrevSoc] = useState(selectedSoc)
  const fetchedGroupRef = useRef<Set<string>>(new Set())
  const searchSeqRef = useRef(0)

  // Adjust state during render when selectedSoc changes
  if (prevSoc !== selectedSoc) {
    setPrevSoc(selectedSoc)
    if (selectedGroupCode && !userExpandedGroups.includes(selectedGroupCode)) {
      setUserExpandedGroups((prev) => [...prev, selectedGroupCode])
    }
  }

  // Function to load occupations for a specific group
  const loadGroupOccupations = useCallback(
    async (groupCode: string) => {
      if (fetchedGroupRef.current.has(groupCode)) return

      fetchedGroupRef.current.add(groupCode)
      setLoadingGroups((prev) => ({ ...prev, [groupCode]: true }))

      try {
        const occs = await onetAdminService.searchOccupations({
          groupCode,
          limit: 100,
        })
        setGroupOccupationsCache((prev) => ({
          ...prev,
          [groupCode]: occs,
        }))
      } catch {
        fetchedGroupRef.current.delete(groupCode)
        setGroupOccupationsCache((prev) => ({
          ...prev,
          [groupCode]: prev[groupCode] || [],
        }))
      } finally {
        setLoadingGroups((prev) => ({ ...prev, [groupCode]: false }))
      }
    },
    []
  )

  // Load Major Groups and initial group on mount
  useEffect(() => {
    let isCancelled = false

    Promise.all([
      onetAdminService.getMajorGroups(),
      onetAdminService.searchOccupations({ groupCode: selectedGroupCode, limit: 100 }),
    ])
      .then(([groups, initialOccs]) => {
        if (isCancelled) return
        fetchedGroupRef.current.add(selectedGroupCode)
        setMajorGroups(groups)
        setGroupOccupationsCache((prev) => ({
          ...prev,
          [selectedGroupCode]: initialOccs,
        }))
      })
      .catch((err) => {
        if (isCancelled) return
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh mục 23 nhóm nghề O*NET'
        )
      })
      .finally(() => {
        if (!isCancelled) {
          setInitialLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedGroupCode])

  // Reactive Background Refresh when SFIA Mappings are mutated
  useEffect(() => {
    if (refreshTrigger <= 0) return

    onetAdminService.getMajorGroups().then((groups) => {
      setMajorGroups(groups)
    }).catch(() => {})

    // Re-fetch opened groups to update badges & mapped dots
    const openGroups = Array.from(fetchedGroupRef.current)
    openGroups.forEach((groupCode) => {
      onetAdminService.searchOccupations({ groupCode, limit: 100 }).then((occs) => {
        setGroupOccupationsCache((prev) => ({
          ...prev,
          [groupCode]: occs,
        }))
      }).catch(() => {})
    })
  }, [refreshTrigger])

  // Debounce search query 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Perform server-side search when debounced query is non-empty (with sequence ID race condition guard)
  useEffect(() => {
    if (!debouncedQuery) return

    const currentSeq = ++searchSeqRef.current

    onetAdminService
      .searchOccupations({
        search: debouncedQuery,
        limit: 60,
      })
      .then((results) => {
        if (searchSeqRef.current === currentSeq) {
          setSearchResults(results)
          setLastSearchQuery(debouncedQuery)
        }
      })
      .catch(() => {
        if (searchSeqRef.current === currentSeq) {
          setSearchResults([])
          setLastSearchQuery(debouncedQuery)
        }
      })
  }, [debouncedQuery])

  // Handle expanding / collapsing accordion items
  const handleAccordionChange = (newExpanded: string[]) => {
    setUserExpandedGroups(newExpanded)
    // Fetch newly opened groups
    newExpanded.forEach((code) => {
      if (!fetchedGroupRef.current.has(code)) {
        loadGroupOccupations(code)
      }
    })
  }

  const handleRetry = () => {
    setInitialLoading(true)
    setError(null)
    fetchedGroupRef.current.clear()
    Promise.all([
      onetAdminService.getMajorGroups(),
      onetAdminService.searchOccupations({ groupCode: selectedGroupCode, limit: 100 }),
    ])
      .then(([groups, initialOccs]) => {
        fetchedGroupRef.current.add(selectedGroupCode)
        setMajorGroups(groups)
        setGroupOccupationsCache((prev) => ({
          ...prev,
          [selectedGroupCode]: initialOccs,
        }))
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh mục nghề nghiệp O*NET'
        )
      })
      .finally(() => {
        setInitialLoading(false)
      })
  }

  const hasSearch = Boolean(debouncedQuery)
  const isSearching = hasSearch && lastSearchQuery !== debouncedQuery

  // Calculate search grouped map
  const searchGroupMap = useMemo(() => {
    if (!hasSearch) return null
    const map = new Map<string, OnetOccupationSummary[]>()
    searchResults.forEach((occ) => {
      const list = map.get(occ.majorGroupCode) || []
      list.push(occ)
      map.set(occ.majorGroupCode, list)
    })
    return map
  }, [hasSearch, searchResults])

  const searchVisibleGroups = useMemo(() => {
    if (!searchGroupMap) return majorGroups
    return majorGroups.filter((g) => (searchGroupMap.get(g.code) || []).length > 0)
  }, [majorGroups, searchGroupMap])

  const effectiveExpandedGroups = useMemo(() => {
    if (hasSearch && searchVisibleGroups.length > 0) {
      return searchVisibleGroups.map((g) => g.code)
    }
    return userExpandedGroups
  }, [hasSearch, searchVisibleGroups, userExpandedGroups])

  const totalOccupationsCount = useMemo(() => {
    return majorGroups.reduce((acc, g) => acc + (g.totalOccupations || 0), 0)
  }, [majorGroups])

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
              {totalOccupationsCount > 0 ? `${totalOccupationsCount} SOC` : 'O*NET SOC'}
            </Badge>
          </div>
          <span className="text-ink-muted text-xs">
            {hasSearch ? `${searchResults.length} kết quả` : `${majorGroups.length} nhóm`}
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
        {initialLoading && (
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
        {!initialLoading && error && (
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

        {/* Searching Indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-6 gap-2 text-ink-muted text-xs">
            <Loader2 className="size-4 animate-spin text-brand" />
            <span>Đang tìm kiếm trong database...</span>
          </div>
        )}

        {/* Empty Search Results State */}
        {!initialLoading && !error && !isSearching && hasSearch && searchResults.length === 0 && (
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

        {/* Success Content: Accordion Groups */}
        {!initialLoading && !error && !isSearching && (!hasSearch || searchResults.length > 0) && (
          <Accordion
            type="multiple"
            value={effectiveExpandedGroups}
            onValueChange={handleAccordionChange}
            className="w-full space-y-1"
          >
            {(hasSearch ? searchVisibleGroups : majorGroups).map((group) => {
              const isGroupLoading = Boolean(loadingGroups[group.code])
              const groupOccs = hasSearch && searchGroupMap
                ? searchGroupMap.get(group.code) || []
                : groupOccupationsCache[group.code] || []

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
                        {isGroupLoading ? (
                          <Loader2 className="size-3 animate-spin text-ink-muted" />
                        ) : (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] font-normal"
                          >
                            {hasSearch ? groupOccs.length : group.totalOccupations}
                          </Badge>
                        )}
                        {group.mappedCount > 0 && !hasSearch && (
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
                    {isGroupLoading && groupOccs.length === 0 ? (
                      <div className="flex items-center justify-center py-4 text-xs text-ink-muted gap-1.5">
                        <Loader2 className="size-3.5 animate-spin text-brand" />
                        <span>Đang tải danh sách nghề...</span>
                      </div>
                    ) : groupOccs.length === 0 ? (
                      <div className="py-3 px-4 text-center text-xs text-ink-muted italic">
                        Chưa có dữ liệu nghề cho nhóm này
                      </div>
                    ) : (
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
                    )}
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

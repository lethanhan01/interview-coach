'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { prepService } from '@/services'
import type { SavedJobDescription } from '@/lib/types'
import { formatVietnamRelativeDate } from '@/lib/date-time'
import { Building2, MapPin, Clock, Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageContainer, PageHeader } from '@/components/patterns/LayoutPatterns'
import { LoadingState, ErrorState, EmptyState } from '@/components/patterns/FeedbackPatterns'

const MAX_TECH_SHOWN = 5

export default function JdLibraryPage() {
  const router = useRouter()
  const [items, setItems] = useState<SavedJobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    prepService
      .getSavedJobDescriptions()
      .then(setItems)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách')
      )
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(item: SavedJobDescription) {
    router.push(`/setup?jdId=${item.id}`)
  }

  function handleNew() {
    router.push('/setup?new=1')
  }

  if (loading) {
    return <LoadingState text="Đang tải danh sách Job Descriptions..." minHeight="min-h-[50vh]" />
  }

  if (error) {
    return (
      <PageContainer maxWidth="md" className="py-10">
        <ErrorState description={error} />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="md">
      {/* Header */}
      <PageHeader
        title="Job Descriptions"
        description={
          items.length > 0
            ? `${items.length} JD đã lưu — chọn để bắt đầu phỏng vấn`
            : 'Chưa có JD nào được lưu'
        }
        actions={
          <Button onClick={handleNew} size="md">
            <Plus className="size-4" aria-hidden="true" />
            Tạo phiên mới
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có Job Description nào"
          description="Tạo phiên phỏng vấn đầu tiên để bắt đầu lưu JD"
          icon={<Building2 className="size-12 text-brand" aria-hidden="true" />}
          action={{
            label: 'Tạo phiên mới',
            onClick: handleNew,
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const displayDate = item.lastUsedAt
              ? `Dùng lần cuối ${formatVietnamRelativeDate(item.lastUsedAt)}`
              : `Tạo ${formatVietnamRelativeDate(item.createdAt)}`
            const shownTechs = item.techStack.slice(0, MAX_TECH_SHOWN)
            const extraCount = item.techStack.length - MAX_TECH_SHOWN

            return (
              <Card
                key={item.id}
                hover
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(item)
                  }
                }}
                className="group w-full p-5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Company + position */}
                    <div className="flex items-center gap-2.5">
                      <div className="bg-brand-subtle text-brand-subtle-fg flex size-9 shrink-0 items-center justify-center rounded-xl">
                        <Building2 className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink truncate font-semibold">
                          {item.companyName}
                        </p>
                        <p className="text-ink-muted truncate text-sm">
                          {item.jobTitle}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {item.location && (
                        <span className="text-ink-faint flex items-center gap-1 text-xs">
                          <MapPin className="size-3" aria-hidden="true" />
                          {item.location}
                        </span>
                      )}
                      <span className="text-ink-faint flex items-center gap-1 text-xs">
                        <Clock className="size-3" aria-hidden="true" />
                        {displayDate}
                      </span>
                      {item.salary && (
                        <span className="text-success text-xs font-medium">
                          {item.salary}
                        </span>
                      )}
                    </div>

                    {/* Tech stack */}
                    {item.techStack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {shownTechs.map((tech) => (
                          <Badge
                            key={tech}
                            variant="brand"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {extraCount > 0 && (
                          <Badge variant="default" className="text-xs">
                            +{extraCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="text-ink-faint group-hover:text-brand mt-1 size-5 shrink-0 transition-all duration-150 group-hover:translate-x-0.5" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}

'use client'

import {
  Sparkles,
  GraduationCap,
  Wrench,
  Briefcase,
  FolderGit2,
  Award,
  UserCheck,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import type { GetProfileResponse } from '@/lib/types'

interface ResumeHeaderProps {
  data: GetProfileResponse | null
}

const SECTIONS = [
  { id: 'career', label: 'Định hướng', icon: Target },
  { id: 'personality', label: 'Giới thiệu', icon: UserCheck },
  { id: 'education', label: 'Học vấn', icon: GraduationCap },
  { id: 'skills', label: 'Kỹ năng', icon: Wrench },
  { id: 'experience', label: 'Kinh nghiệm', icon: Briefcase },
  { id: 'projects', label: 'Dự án', icon: FolderGit2 },
  { id: 'certifications', label: 'Chứng chỉ & Giải thưởng', icon: Award },
]

export function calculateCompleteness(data: GetProfileResponse | null): number {
  if (!data?.profile) return 0
  const profile = data.profile
  let score = 0

  if (profile.personality?.trim()) score += 15
  if (
    profile.education &&
    (profile.education.school || profile.education.major)
  )
    score += 15
  if (
    Array.isArray(profile.technicalSkills) &&
    profile.technicalSkills.length > 0
  )
    score += 20
  if (Array.isArray(profile.workExperience) && profile.workExperience.length > 0)
    score += 25
  if (Array.isArray(profile.projects) && profile.projects.length > 0) score += 15
  if (
    (Array.isArray(profile.certifications) &&
      profile.certifications.length > 0) ||
    (Array.isArray(profile.awards) && profile.awards.length > 0)
  )
    score += 10

  return Math.min(100, score)
}

export default function ResumeHeader({ data }: ResumeHeaderProps) {
  const completeness = calculateCompleteness(data)

  const getStatusBadge = () => {
    if (completeness >= 80) {
      return (
        <Badge variant="success">
          Hồ sơ hoàn hảo ({completeness}%)
        </Badge>
      )
    }
    if (completeness >= 50) {
      return (
        <Badge variant="brand">
          Đang hoàn thiện ({completeness}%)
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        Cần bổ sung thêm ({completeness}%)
      </Badge>
    )
  }

  const getProgressVariant = () => {
    if (completeness >= 80) return 'success'
    if (completeness >= 50) return 'brand'
    return 'default'
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-brand-subtle text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-ink text-base font-semibold">
              Độ hoàn thiện hồ sơ CV
            </h2>
            <p className="text-ink-muted text-xs">
              Hồ sơ càng chi tiết, hệ thống phỏng vấn AI càng đánh giá và phản hồi chính xác.
            </p>
          </div>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Progress bar using UI Progress component */}
      <div className="space-y-1.5">
        <Progress
          value={completeness}
          variant={getProgressVariant()}
          size="md"
          aria-label="Độ hoàn thiện hồ sơ"
        />
      </div>

      {/* Quick Jump Navigation */}
      <div className="border-t border-border/60 pt-3">
        <span className="text-ink-muted mb-2 block text-xs font-medium uppercase tracking-wider">
          Chuyển nhanh đến mục:
        </span>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollTo(id)}
              className="h-8 gap-1.5 px-2.5 text-xs text-ink-muted hover:text-brand"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}

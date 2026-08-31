'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, ArrowRight } from 'lucide-react'
import { profileService } from '@/services'

import type {
  GetProfileResponse,
  EducationEntry,
  WorkExperienceEntry,
  ProjectEntry,
  TechnicalSkillEntry,
  CertificationEntry,
  AwardEntry,
} from '@/lib/types'
import ResumeHeader from '@/components/resume/ResumeHeader'
import CareerInfoGroup from '@/components/resume/CareerInfoGroup'
import PersonalityGroup from '@/components/resume/PersonalityGroup'
import TechnicalSkillsGroup from '@/components/resume/TechnicalSkillsGroup'
import EducationGroup from '@/components/resume/EducationGroup'
import WorkExperienceGroup from '@/components/resume/WorkExperienceGroup'
import ProjectsGroup from '@/components/resume/ProjectsGroup'
import CertificationsGroup from '@/components/resume/CertificationsGroup'
import { Button } from '@/components/ui/Button'

export default function ResumePage() {
  const [data, setData] = useState<GetProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profileService
      .getProfile()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ CV')
      )
      .finally(() => setLoading(false))
  }, [])

  async function patchProfile<T extends object>(patch: T) {
    const updated = await profileService.updateProfile(patch)
    setData(updated)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-brand size-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <p className="text-danger text-sm">{error}</p>
      </div>
    )
  }

  const profile = data?.profile ?? null

  /** Đảm bảo mọi entry có `id` vì dữ liệu JSON cũ có thể thiếu id. */
  function normalizeWithId<T extends { id?: string }>(arr: unknown): T[] {
    if (!Array.isArray(arr)) return []
    return arr.map((e) => ({
      ...(e as T),
      id: (e as T).id || crypto.randomUUID(),
    }))
  }

  const technicalSkills = Array.isArray(profile?.technicalSkills)
    ? (profile.technicalSkills as TechnicalSkillEntry[])
    : []
  const workExperience = normalizeWithId<WorkExperienceEntry>(
    profile?.workExperience
  )
  const projects = normalizeWithId<ProjectEntry>(profile?.projects)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-ink text-2xl font-bold">Hồ sơ CV & Kinh nghiệm</h1>
          <p className="text-ink-muted text-sm mt-1">
            Quản lý thông tin học vấn, kỹ năng, kinh nghiệm và dự án để AI cá nhân hóa câu hỏi phỏng vấn.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto gap-1.5 shrink-0">
          <Link href="/profile">
            <User className="h-4 w-4 text-brand" />
            <span>Cài đặt tài khoản</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Completeness score & quick navigation anchor links */}
      <ResumeHeader data={data} />

      {/* Sections */}
      <div className="flex flex-col gap-6">
        <CareerInfoGroup
          data={{
            targetPosition: profile?.targetPosition ?? undefined,
            targetLevel: profile?.targetLevel ?? undefined,
          }}
          onSave={(career) => patchProfile(career)}
        />

        <PersonalityGroup
          data={{ personality: profile?.personality }}
          onSave={(patch) => patchProfile(patch)}
        />

        <EducationGroup
          data={profile?.education}
          onSave={(edu: EducationEntry) => patchProfile({ education: edu })}
        />

        <TechnicalSkillsGroup
          data={technicalSkills}
          onSave={(patch) => patchProfile(patch)}
        />

        <WorkExperienceGroup
          data={workExperience}
          availableTechs={technicalSkills}
          onSave={(we: WorkExperienceEntry[]) =>
            patchProfile({ workExperience: we })
          }
        />

        <ProjectsGroup
          data={projects}
          availableTechs={technicalSkills}
          onSave={(proj: ProjectEntry[]) => patchProfile({ projects: proj })}
        />

        <CertificationsGroup
          data={{
            certifications:
              (profile?.certifications as CertificationEntry[] | undefined) ??
              [],
            awards: (profile?.awards as AwardEntry[] | undefined) ?? [],
          }}
          onSave={(patch) => patchProfile(patch)}
        />
      </div>
    </div>
  )
}

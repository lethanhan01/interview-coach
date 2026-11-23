'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { User, ArrowRight } from 'lucide-react'
import {
  candidateProfileQueries,
  queryKeys,
  useOptionalQueryClient,
} from '@/lib/query-client'
import { candidateProfileService } from '@/services'

import type {
  EducationEntry,
  WorkExperienceEntry,
  ProjectEntry,
  TechnicalSkillEntry,
  CertificationEntry,
  AwardEntry,
} from '@/types'
import ResumeHeader from '@/components/resume/ResumeHeader'
import CareerInfoGroup from '@/components/resume/CareerInfoGroup'
import PersonalityGroup from '@/components/resume/PersonalityGroup'
import TechnicalSkillsGroup from '@/components/resume/TechnicalSkillsGroup'
import EducationGroup from '@/components/resume/EducationGroup'
import WorkExperienceGroup from '@/components/resume/WorkExperienceGroup'
import ProjectsGroup from '@/components/resume/ProjectsGroup'
import CertificationsGroup from '@/components/resume/CertificationsGroup'
import { Button } from '@/components/ui/Button'
import { PageContainer, PageHeader } from '@/components/patterns/LayoutPatterns'
import {
  LoadingState,
  ErrorState,
} from '@/components/patterns/FeedbackPatterns'

export default function ResumePage() {
  const queryClient = useOptionalQueryClient()
  const {
    data = null,
    isLoading: loading,
    error: queryError,
  } = useQuery(candidateProfileQueries.detail())

  const updateProfileMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      candidateProfileService.updateProfile(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.candidateProfile.detail(), updated)
    },
  })

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Không thể tải hồ sơ CV'
        : null

  async function patchProfile<T extends object>(patch: T) {
    await updateProfileMutation.mutateAsync(patch as Record<string, unknown>)
  }

  if (loading) {
    return <LoadingState text="Đang tải hồ sơ CV..." minHeight="min-h-[50vh]" />
  }

  if (error) {
    return (
      <PageContainer maxWidth="md" className="py-10">
        <ErrorState description={error} />
      </PageContainer>
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
    <PageContainer maxWidth="md" className="space-y-6">
      {/* Top Header info using PageHeader */}
      <PageHeader
        title="Hồ sơ CV & Kinh nghiệm"
        description="Quản lý thông tin học vấn, kỹ năng, kinh nghiệm và dự án để AI cá nhân hóa câu hỏi phỏng vấn."
        actions={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="shrink-0 gap-1.5"
          >
            <Link href="/profile">
              <User className="text-brand h-4 w-4" />
              <span>Cài đặt tài khoản</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      {/* Completeness score & quick navigation anchor links */}
      <ResumeHeader data={data} />

      {/* Sections */}
      <div className="flex flex-col gap-6">
        <CareerInfoGroup
          data={{
            targetPosition: profile?.targetPosition ?? undefined,
            targetLevel: profile?.targetLevel ?? undefined,
            onetSocCode: profile?.onetSocCode ?? undefined,
            onetOccupationTitle: profile?.onetOccupationTitle ?? undefined,
            targetSfiaLevel: profile?.targetSfiaLevel ?? undefined,
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
          onetSocCode={profile?.onetSocCode}
          targetPosition={profile?.targetPosition}
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
    </PageContainer>
  )
}

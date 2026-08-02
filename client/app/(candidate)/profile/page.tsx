'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type {
  GetProfileResponse,
  EducationEntry,
  WorkExperienceEntry,
  ProjectEntry,
  TechnicalSkillEntry,
  CertificationEntry,
  AwardEntry,
} from '@/lib/types'
import PersonalInfoGroup from '@/components/profile/PersonalInfoGroup'
import PersonalityGroup from '@/components/profile/PersonalityGroup'
import TechnicalSkillsGroup from '@/components/profile/TechnicalSkillsGroup'
import EducationGroup from '@/components/profile/EducationGroup'
import WorkExperienceGroup from '@/components/profile/WorkExperienceGroup'
import ProjectsGroup from '@/components/profile/ProjectsGroup'
import CertificationsGroup from '@/components/profile/CertificationsGroup'

export default function ProfilePage() {
  const [data, setData] = useState<GetProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<GetProfileResponse>('/profile')
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ')
      )
      .finally(() => setLoading(false))
  }, [])

  async function patchProfile<T extends object>(patch: T) {
    const updated = await apiClient.patch<GetProfileResponse>('/profile', patch)
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-ink mb-6 text-2xl font-bold">Hồ sơ</h1>

      {/* Email header */}
      <div className="border-border bg-surface shadow-card mb-4 flex items-center gap-4 rounded-2xl border p-4">
        <div className="bg-brand-100 flex size-10 items-center justify-center rounded-full">
          <span className="text-brand text-base font-bold">
            {(data?.email?.[0] ?? 'U').toUpperCase()}
          </span>
        </div>
        <p className="text-ink text-sm font-medium">{data?.email}</p>
      </div>

      <div className="flex flex-col gap-4">
        <PersonalInfoGroup
          data={{ fullName: profile?.fullName }}
          onSave={(patch) => patchProfile(patch)}
        />

        <EducationGroup
          data={profile?.education}
          onSave={(edu: EducationEntry) => patchProfile({ education: edu })}
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

        <TechnicalSkillsGroup
          data={technicalSkills}
          onSave={(patch) => patchProfile(patch)}
        />

        <ProjectsGroup
          data={projects}
          availableTechs={technicalSkills}
          onSave={(proj: ProjectEntry[]) => patchProfile({ projects: proj })}
        />

        <WorkExperienceGroup
          data={workExperience}
          availableTechs={technicalSkills}
          onSave={(we: WorkExperienceEntry[]) =>
            patchProfile({ workExperience: we })
          }
        />

        <PersonalityGroup
          data={{ personality: profile?.personality }}
          onSave={(patch) => patchProfile(patch)}
        />
      </div>
    </div>
  )
}

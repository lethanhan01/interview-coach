'use client'

import { useMemo } from 'react'
import {
  Container,
  Grid,
  Group,
  Skeleton,
  Stack,
  VisuallyHidden,
} from '@mantine/core'
import CareerInfoGroup from '@/components/resume/CareerInfoGroup'
import CertificationsGroup from '@/components/resume/CertificationsGroup'
import EducationGroup from '@/components/resume/EducationGroup'
import PersonalityGroup from '@/components/resume/PersonalityGroup'
import ProjectsGroup from '@/components/resume/ProjectsGroup'
import type { ResumeSectionId } from '@/components/resume/resume-schemas'
import TechnicalSkillsGroup from '@/components/resume/TechnicalSkillsGroup'
import WorkExperienceGroup from '@/components/resume/WorkExperienceGroup'
import type {
  AwardEntry,
  CandidateProfileData,
  CertificationEntry,
  EducationEntry,
  ProjectEntry,
  TechnicalSkillEntry,
  WorkExperienceEntry,
} from '@/types'

function normalizeWithId<T extends { id?: string }>(arr: unknown): T[] {
  if (!Array.isArray(arr)) return []
  return arr.map((item, index) => {
    const entry = item as T
    return {
      ...entry,
      id: entry.id || `legacy-${index}-${crypto.randomUUID()}`,
    }
  })
}

export function ResumeSkeleton() {
  return (
    <Container size="lg" px={0}>
      <Stack gap="lg" aria-busy="true">
        <VisuallyHidden role="status">Đang tải hồ sơ CV...</VisuallyHidden>
        <Group justify="space-between" align="flex-end">
          <Stack gap={6}>
            <Skeleton height={30} width={240} radius="sm" />
            <Skeleton height={16} width={380} radius="sm" />
          </Stack>
          <Skeleton height={34} width={160} radius="sm" />
        </Group>
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={360} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Skeleton height={320} radius="md" />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}

export interface ResumeSectionContentProps {
  activeSection: ResumeSectionId
  profile: CandidateProfileData | null
  onPatchProfile: <T extends object>(patch: T) => Promise<void>
  onDirtyChange: (dirty: boolean) => void
}

export default function ResumeSectionContent({
  activeSection,
  profile,
  onPatchProfile,
  onDirtyChange,
}: Readonly<ResumeSectionContentProps>) {
  const { technicalSkills, workExperience, projects, certifications, awards } =
    useMemo(
      () => ({
        technicalSkills: Array.isArray(profile?.technicalSkills)
          ? (profile.technicalSkills as TechnicalSkillEntry[])
          : [],
        workExperience: normalizeWithId<WorkExperienceEntry>(
          profile?.workExperience
        ),
        projects: normalizeWithId<ProjectEntry>(profile?.projects),
        certifications: normalizeWithId<CertificationEntry>(
          profile?.certifications
        ),
        awards: normalizeWithId<AwardEntry>(profile?.awards),
      }),
      [profile]
    )

  switch (activeSection) {
    case 'career':
      return (
        <CareerInfoGroup
          data={{
            targetPosition: profile?.targetPosition ?? undefined,
            targetLevel: profile?.targetLevel ?? undefined,
            onetSocCode: profile?.onetSocCode ?? undefined,
            onetOccupationTitle: profile?.onetOccupationTitle ?? undefined,
            targetSfiaLevel: profile?.targetSfiaLevel ?? undefined,
          }}
          onSave={(career) => onPatchProfile(career)}
          onDirtyChange={onDirtyChange}
        />
      )
    case 'personality':
      return (
        <PersonalityGroup
          data={{ personality: profile?.personality }}
          onSave={(patch) => onPatchProfile(patch)}
          onDirtyChange={onDirtyChange}
        />
      )
    case 'education':
      return (
        <EducationGroup
          data={profile?.education}
          onSave={(edu: EducationEntry) => onPatchProfile({ education: edu })}
          onDirtyChange={onDirtyChange}
        />
      )
    case 'skills':
      return (
        <TechnicalSkillsGroup
          data={technicalSkills}
          onetSocCode={profile?.onetSocCode}
          targetPosition={profile?.targetPosition}
          onSave={(patch) => onPatchProfile(patch)}
          onDirtyChange={onDirtyChange}
        />
      )
    case 'experience':
      return (
        <WorkExperienceGroup
          data={workExperience}
          availableTechs={technicalSkills}
          onSave={(we: WorkExperienceEntry[]) =>
            onPatchProfile({ workExperience: we })
          }
        />
      )
    case 'projects':
      return (
        <ProjectsGroup
          data={projects}
          availableTechs={technicalSkills}
          onSave={(proj: ProjectEntry[]) => onPatchProfile({ projects: proj })}
        />
      )
    case 'certifications':
      return (
        <CertificationsGroup
          data={{ certifications, awards }}
          onSave={(patch) => onPatchProfile(patch)}
        />
      )
  }
}

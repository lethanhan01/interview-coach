'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Group,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconAlertCircle, IconArrowRight, IconUser } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isValidResumeSection, type ResumeSectionId } from './resume-schemas'
import ResumeHeader, { RESUME_SECTION_ITEMS } from './ResumeHeader'
import { getErrorMessage } from '@/lib/form-errors'
import { candidateProfileQueries } from '@/queries/candidate-profile.queries'
import { queryKeys } from '@/queries/keys'
import { candidateProfileService } from '@/services/candidate-profile.service'
import surfaces from '@/styles/surfaces.module.css'
import ResumeSectionContent, { ResumeSkeleton } from './ResumeSectionContent'

export default function ResumeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const sectionParam = searchParams.get('section')
  const [selectedSection, setSelectedSection] =
    useState<ResumeSectionId | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const activeSection: ResumeSectionId =
    selectedSection ??
    (isValidResumeSection(sectionParam) ? sectionParam : 'career')

  const {
    data = null,
    isPending,
    error: queryError,
    refetch,
  } = useQuery(candidateProfileQueries.detail())

  const updateProfileMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      candidateProfileService.updateProfile(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.candidateProfile.detail(), updated)
    },
  })

  async function patchProfile<T extends object>(patch: T) {
    await updateProfileMutation.mutateAsync(patch as Record<string, unknown>)
  }

  function switchSection(next: ResumeSectionId) {
    setSelectedSection(next)
    router.replace(`/resume?section=${next}`, { scroll: false })
  }

  function handleSelectSection(next: ResumeSectionId) {
    if (next === activeSection) return
    if (hasUnsavedChanges) {
      modals.openConfirmModal({
        title: 'Thay đổi chưa được lưu',
        children: (
          <Text size="sm">
            Bạn đang có thông tin chưa lưu ở mục hiện tại. Rời mục này sẽ hủy
            các thay đổi chưa lưu.
          </Text>
        ),
        labels: {
          confirm: 'Hủy thay đổi & chuyển mục',
          cancel: 'Tiếp tục chỉnh sửa',
        },
        confirmProps: { color: 'danger' },
        onConfirm: () => {
          setHasUnsavedChanges(false)
          switchSection(next)
        },
      })
      return
    }
    switchSection(next)
  }

  if (isPending) {
    return <ResumeSkeleton />
  }

  if (queryError) {
    return (
      <Container size="lg" px={0} py="md">
        <Alert
          color="danger"
          variant="light"
          role="alert"
          title="Không thể tải hồ sơ CV"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          <Stack gap="sm" align="flex-start">
            <Text size="sm">
              {getErrorMessage(queryError, 'Không thể tải hồ sơ CV')}
            </Text>
            <Button
              type="button"
              variant="light"
              color="danger"
              size="xs"
              onClick={() => void refetch()}
            >
              Thử lại
            </Button>
          </Stack>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg" px={0}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Title order={1} size="h2">
              Hồ sơ CV & Kinh nghiệm
            </Title>
            <Text size="sm" c="dimmed">
              Quản lý thông tin học vấn, kỹ năng, kinh nghiệm và dự án để AI cá
              nhân hóa câu hỏi phỏng vấn.
            </Text>
          </Stack>

          <Button
            component={Link}
            href="/profile"
            variant="light"
            color="brand"
            size="sm"
            leftSection={<IconUser size={16} stroke={1.5} aria-hidden="true" />}
            rightSection={
              <IconArrowRight size={14} stroke={1.5} aria-hidden="true" />
            }
          >
            Cài đặt tài khoản
          </Button>
        </Group>

        <Stack gap="sm" hiddenFrom="md">
          <ResumeHeader
            compact
            data={data}
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />
          <ScrollArea type="auto" offsetScrollbars>
            <Tabs
              value={activeSection}
              onChange={(val) => {
                if (isValidResumeSection(val)) handleSelectSection(val)
              }}
            >
              <Tabs.List>
                {RESUME_SECTION_ITEMS.map(({ id, label, icon: Icon }) => (
                  <Tabs.Tab
                    key={id}
                    value={id}
                    leftSection={
                      <Icon size={15} stroke={1.5} aria-hidden="true" />
                    }
                  >
                    {label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </ScrollArea>
        </Stack>

        <Grid gap="lg" align="flex-start">
          <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
            <Box className={surfaces.stickyPanel}>
              <ResumeHeader
                data={data}
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
              />
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <ResumeSectionContent
              activeSection={activeSection}
              profile={data?.profile ?? null}
              onPatchProfile={patchProfile}
              onDirtyChange={setHasUnsavedChanges}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}

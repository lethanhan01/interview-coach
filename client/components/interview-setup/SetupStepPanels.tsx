'use client'

import {
  Box,
  Button,
  Container,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import ConfigForm from '@/components/interview-setup/config-step/ConfigForm'
import ConfirmStep from '@/components/interview-setup/confirm-step/ConfirmStep'
import JdForm from '@/components/interview-setup/jd-step/JdForm'
import SavedJdPicker from '@/components/interview-setup/jd-step/SavedJdPicker'
import { isJdValid } from '@/lib/setup-helpers'
import type {
  ContextPack,
  InterviewDuration,
  JdFormData,
  SavedJobDescription,
  SessionType,
} from '@/types'

export type SetupStep = 0 | 1 | 2 | 3

export function SetupWizardSkeleton() {
  return (
    <Container size="md" px={0}>
      <Stack gap="lg" aria-busy="true">
        <VisuallyHidden role="status">
          Đang tải dữ liệu cấu hình...
        </VisuallyHidden>
        <Skeleton height={32} width={220} radius="sm" />
        <Skeleton height={56} radius="md" />
        <Skeleton height={240} radius="md" />
      </Stack>
    </Container>
  )
}

export interface SetupStepPanelsProps {
  step: SetupStep
  jd: JdFormData
  jdFormKey: string
  jdHasContent: boolean
  savedJobDescriptions: SavedJobDescription[]
  selectedSavedId: string
  sessionType: SessionType
  contextPack: ContextPack
  duration: InterviewDuration
  error: string | null
  submitting: boolean
  onSelectSaved: (item: SavedJobDescription) => void
  onNewFromPicker: () => void
  onJdChange: (next: JdFormData) => void
  onResetDraft: () => void
  onSetSessionType: (val: SessionType) => void
  onSetContextPack: (val: ContextPack) => void
  onSetDuration: (val: InterviewDuration) => void
  onGoToStep: (next: SetupStep) => void
  onSubmit: () => void
}

export default function SetupStepPanels({
  step,
  jd,
  jdFormKey,
  jdHasContent,
  savedJobDescriptions,
  selectedSavedId,
  sessionType,
  contextPack,
  duration,
  error,
  submitting,
  onSelectSaved,
  onNewFromPicker,
  onJdChange,
  onResetDraft,
  onSetSessionType,
  onSetContextPack,
  onSetDuration,
  onGoToStep,
  onSubmit,
}: Readonly<SetupStepPanelsProps>) {
  if (step === 0) {
    return (
      <SavedJdPicker
        items={savedJobDescriptions}
        selectedId={selectedSavedId}
        onSelect={onSelectSaved}
        onNew={onNewFromPicker}
      />
    )
  }

  if (step === 1) {
    return (
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h2">
            Thông tin Job Description
          </Title>
          <Text size="sm" c="dimmed">
            Điền thông tin JD để AI tạo câu hỏi phỏng vấn phù hợp nhất.
          </Text>
        </Stack>

        <JdForm key={jdFormKey} value={jd} onChange={onJdChange} />

        <Group justify="space-between">
          {savedJobDescriptions.length > 0 ? (
            <Button
              type="button"
              variant="subtle"
              color="neutral"
              onClick={() => onGoToStep(0)}
            >
              Quay lại
            </Button>
          ) : jdHasContent ? (
            <Button
              type="button"
              variant="subtle"
              color="neutral"
              onClick={onResetDraft}
            >
              Đặt lại
            </Button>
          ) : (
            <Box />
          )}

          <Button
            type="button"
            color="brand"
            disabled={!isJdValid(jd)}
            onClick={() => onGoToStep(2)}
          >
            Tiếp theo
          </Button>
        </Group>
      </Stack>
    )
  }

  if (step === 2) {
    return (
      <Stack gap="lg">
        <Title order={1} size="h2">
          Cấu hình phiên phỏng vấn
        </Title>
        <ConfigForm
          sessionType={sessionType}
          setSessionType={onSetSessionType}
          contextPack={contextPack}
          setContextPack={onSetContextPack}
          duration={duration}
          setDuration={onSetDuration}
        />
        <Group justify="space-between">
          <Button
            type="button"
            variant="subtle"
            color="neutral"
            onClick={() => onGoToStep(1)}
          >
            Quay lại
          </Button>
          <Button type="button" color="brand" onClick={() => onGoToStep(3)}>
            Tiếp theo
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1} size="h2">
          Xác nhận
        </Title>
        <Text size="sm" c="dimmed">
          Kiểm tra lại trước khi bắt đầu phiên phỏng vấn.
        </Text>
      </Stack>

      <ConfirmStep
        jd={jd}
        sessionType={sessionType}
        contextPack={contextPack}
        duration={duration}
        error={error}
        onChange={onJdChange}
      />

      <Group justify="space-between">
        <Button
          type="button"
          variant="subtle"
          color="neutral"
          disabled={submitting}
          onClick={() => onGoToStep(2)}
        >
          Quay lại
        </Button>
        <Button
          type="button"
          color="brand"
          loading={submitting}
          disabled={submitting}
          onClick={onSubmit}
        >
          Bắt đầu phỏng vấn
        </Button>
      </Group>
    </Stack>
  )
}

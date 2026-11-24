'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Button, Container, Stack, Stepper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DIRECTIONAL_VIEW_TRANSITION_ENTER,
  DIRECTIONAL_VIEW_TRANSITION_EXIT,
  SafeViewTransition,
  startTypedTransition,
} from '@/components/common/SafeViewTransition'
import { getErrorMessage } from '@/lib/form-errors'
import { normalizeJdLevel } from '@/lib/interview-options'
import { prepQueries } from '@/queries/prep.queries'
import { queryKeys } from '@/queries/keys'
import { sessionQueries } from '@/queries/session.queries'
import { DURATION_OPTIONS, EMPTY_JD } from '@/lib/setup-helpers'
import { prepService } from '@/services/prep.service'
import { sessionService } from '@/services/session.service'
import type {
  ContextPack,
  InterviewDuration,
  JdFormData,
  SavedJobDescription,
  SessionType,
} from '@/types'
import {
  buildCreateSessionPayload,
  hasJdContent,
  hydrateSavedJobDescriptionLevels,
  savedJobDescriptionToForm,
  toSavedJobDescriptionPayload,
} from './setup-mappers'
import SetupStepPanels, {
  SetupWizardSkeleton,
  type SetupStep,
} from './SetupStepPanels'
import { useSetupDraft } from './useSetupDraft'

export default function SetupWizardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const {
    jd: draftJd,
    formVersion,
    updateJd,
    replaceJd,
    clearDraft,
  } = useSetupDraft()
  const [userStep, setUserStep] = useState<SetupStep | null>(null)
  const [hasCustomJd, setHasCustomJd] = useState(false)
  const [selectedSavedId, setSelectedSavedId] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [duration, setDuration] = useState<InterviewDuration>(30)
  const [error, setError] = useState<string | null>(null)

  const jdIdParam = searchParams.get('jdId')
  const isNewParam = searchParams.get('new') === '1'
  const savedJdsQuery = useQuery(prepQueries.savedJds())
  const needsLevelHydration =
    savedJdsQuery.isSuccess &&
    savedJdsQuery.data.some((item) => !normalizeJdLevel(item.level))
  const sessionsQuery = useQuery({
    ...sessionQueries.list(),
    enabled: needsLevelHydration,
  })

  const savedJobDescriptions = useMemo(() => {
    const items = savedJdsQuery.data ?? []
    if (!needsLevelHydration || !sessionsQuery.data) return items
    return hydrateSavedJobDescriptionLevels(items, sessionsQuery.data)
  }, [needsLevelHydration, savedJdsQuery.data, sessionsQuery.data])

  const prefilledFromParam = useMemo(() => {
    if (!jdIdParam) return null
    const match = savedJobDescriptions.find((item) => item.id === jdIdParam)
    if (!match) return null
    return {
      id: match.id,
      form: savedJobDescriptionToForm(match, sessionsQuery.data ?? []),
    }
  }, [jdIdParam, savedJobDescriptions, sessionsQuery.data])

  const isLoadingInitial =
    savedJdsQuery.isPending || (needsLevelHydration && sessionsQuery.isPending)

  const derivedStep: SetupStep =
    savedJdsQuery.isError ||
    Boolean(jdIdParam) ||
    isNewParam ||
    savedJobDescriptions.length === 0
      ? 1
      : 0

  const step = userStep ?? derivedStep
  const activeJd: JdFormData =
    !hasCustomJd && prefilledFromParam ? prefilledFromParam.form : draftJd
  const activeSelectedId =
    selectedSavedId || (!hasCustomJd ? (prefilledFromParam?.id ?? '') : '')
  const jdFormKey = `${formVersion}-${!hasCustomJd && prefilledFromParam ? prefilledFromParam.id : 'draft'}`

  function goToStep(next: SetupStep) {
    if (next === step) return
    startTypedTransition(next > step ? 'nav-forward' : 'nav-back', () =>
      setUserStep(next)
    )
  }

  function handlePickerSelect(item: SavedJobDescription) {
    setHasCustomJd(true)
    replaceJd(savedJobDescriptionToForm(item, sessionsQuery.data ?? []))
    setSelectedSavedId(item.id)
    goToStep(1)
  }

  function handlePickerNew() {
    setHasCustomJd(true)
    replaceJd(EMPTY_JD)
    setSelectedSavedId('')
    goToStep(1)
  }

  const numQuestions = DURATION_OPTIONS.find(
    (d) => d.value === duration
  )!.numQuestions
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const savedJd = await prepService.saveJobDescription(
        toSavedJobDescriptionPayload(activeJd)
      )
      void queryClient.invalidateQueries({
        queryKey: queryKeys.prep.savedJds(),
      })
      return sessionService.createSession(
        buildCreateSessionPayload({
          jd: activeJd,
          sessionType,
          contextPack,
          numQuestions,
          savedJobDescriptionId: savedJd.id,
        })
      )
    },
    onSuccess: (created) => {
      setHasCustomJd(true)
      clearDraft()
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all })
      router.push(`/sessions/${created.id}`)
    },
    onError: (err) => {
      const message = getErrorMessage(err, 'Không thể tạo phiên phỏng vấn')
      setError(message)
      notifications.show({
        title: 'Không thể tạo phiên phỏng vấn',
        message,
        color: 'danger',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
    },
  })
  const submitting =
    createSessionMutation.isPending || createSessionMutation.isSuccess
  if (isLoadingInitial) return <SetupWizardSkeleton />

  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        {step >= 1 ? (
          <>
            <Box>
              <Button
                component={Link}
                href="/jd-library"
                transitionTypes={['nav-back']}
                variant="subtle"
                color="neutral"
                size="xs"
                leftSection={
                  <IconArrowLeft size={15} stroke={1.5} aria-hidden="true" />
                }
              >
                Thư viện JD
              </Button>
            </Box>
            <Stepper
              active={step - 1}
              color="brand"
              allowNextStepsSelect={false}
              onStepClick={(index) => goToStep((index + 1) as SetupStep)}
            >
              <Stepper.Step label="Job Description" />
              <Stepper.Step label="Cấu hình" />
              <Stepper.Step label="Xác nhận" />
            </Stepper>
          </>
        ) : null}

        <SafeViewTransition
          key={step}
          default="none"
          enter={DIRECTIONAL_VIEW_TRANSITION_ENTER}
          exit={DIRECTIONAL_VIEW_TRANSITION_EXIT}
        >
          <Box>
            <SetupStepPanels
              step={step}
              jd={activeJd}
              jdFormKey={jdFormKey}
              jdHasContent={hasJdContent(activeJd)}
              savedJobDescriptions={savedJobDescriptions}
              selectedSavedId={activeSelectedId}
              sessionType={sessionType}
              contextPack={contextPack}
              duration={duration}
              error={error}
              submitting={submitting}
              onSelectSaved={handlePickerSelect}
              onNewFromPicker={handlePickerNew}
              onJdChange={(next) => {
                setHasCustomJd(true)
                updateJd(next)
                setSelectedSavedId('')
              }}
              onResetDraft={() => {
                setHasCustomJd(true)
                clearDraft()
                setSelectedSavedId('')
              }}
              onSetSessionType={setSessionType}
              onSetContextPack={setContextPack}
              onSetDuration={setDuration}
              onGoToStep={goToStep}
              onSubmit={() => {
                if (submitting) return
                setError(null)
                createSessionMutation.mutate()
              }}
            />
          </Box>
        </SafeViewTransition>
      </Stack>
    </Container>
  )
}
